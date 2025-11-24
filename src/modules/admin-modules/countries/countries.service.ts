import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Country } from '../../../database/entities/country.entity';
import {
  ICountriesRepository,
  COUNTRIES_REPOSITORY,
} from '../../../database/repositories/countries/countries.repository.interface';
import {
  FileUploadUtil,
  getBucketName,
} from '../../../common/utils/file-upload.util';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

import {
  CountryFilterDto,
  CountryResponseDto,
  CreateCountryDto,
  UpdateCountryDto,
  BulkUpdateCountryDto,
  BulkDeleteCountryDto,
} from './dto/countries.dto';
import {
  CountryAlreadyExistsException,
  CountryNotFoundException,
  CountryInUseException,
  CountryIsoCodeConflictException,
  InvalidCountryDataException,
  DefaultCountryDeletionException,
} from './exceptions/countries.exceptions';

@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);

  constructor(
    @Inject(COUNTRIES_REPOSITORY)
    private countriesRepository: ICountriesRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getAllCountries(filterDto: CountryFilterDto) {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const options = {
      skip,
      limit,
      sort: { createdAt: -1 as -1 },
    };

    const result = await this.countriesRepository.findWithPagination(
      filters,
      options
    );

    return this.i18nResponse.success('countries.retrieved_successfully', {
      countries: result.items.map((country) =>
        this.transformToResponseDto(country)
      ),
      total: result.pagination.totalCount,
      page: result.pagination.currentPage,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
    });
  }

  async getCountryByPublicId(publicId: string) {
    const country = await this.countriesRepository.findByPublicId(publicId);
    if (!country) {
      throw new CountryNotFoundException(publicId);
    }

    return this.i18nResponse.success(
      'countries.retrieved_successfully',
      this.transformToResponseDto(country)
    );
  }

  async getFrontCountries() {
    const countries = await this.countriesRepository.findMany(
      { status: true },
      {
        sort: { name: 1 },
      }
    );

    return this.i18nResponse.success(
      'countries.retrieved_successfully',
      countries.map((country) => this.transformToResponseDto(country))
    );
  }

  async createCountry(createCountryDto: CreateCountryDto) {
    // Validate business logic FIRST (before file upload)
    await this.validateCountryCreation(createCountryDto);

    const publicId = uuidv4();
    const countryData = {
      ...createCountryDto,
      publicId,
      iso2: createCountryDto.iso2.toUpperCase(),
      iso3: createCountryDto.iso3.toUpperCase(),
      useCount: 0,
    };

    // Handle isDefault logic
    if (createCountryDto.isDefault === 'YES') {
      await this.countriesRepository.setAllNonDefault();
    }

    const country = await this.countriesRepository.insert(countryData);

    return this.i18nResponse.created(
      'countries.created_successfully',
      this.transformToResponseDto(country)
    );
  }

  async updateCountry(publicId: string, updateCountryDto: UpdateCountryDto) {
    const country = await this.countriesRepository.findByPublicId(publicId);
    if (!country) {
      throw new CountryNotFoundException(publicId);
    }

    // Validate updates
    await this.validateCountryUpdate(country, updateCountryDto);

    const updateData = { ...updateCountryDto };

    // Convert ISO codes to uppercase
    if (updateData.iso2) {
      updateData.iso2 = updateData.iso2.toUpperCase();
    }
    if (updateData.iso3) {
      updateData.iso3 = updateData.iso3.toUpperCase();
    }

    // Handle isDefault logic
    if (updateCountryDto.isDefault === 'YES') {
      await this.countriesRepository.setAllNonDefault();
    }

    const updatedCountry = await this.countriesRepository.update(
      country.id,
      updateData
    );

    return this.i18nResponse.success(
      'countries.updated_successfully',
      this.transformToResponseDto(updatedCountry)
    );
  }

  async deleteCountry(publicId: string): Promise<void> {
    const country = await this.countriesRepository.findByPublicId(publicId);
    if (!country) {
      throw new CountryNotFoundException(publicId);
    }

    // Check if country is eligible for deletion (useCount must be 0)
    if (country.useCount > 0) {
      throw new CountryInUseException(country.name, country.useCount);
    }

    // Check if country is set as default
    if (country.isDefault === 'YES') {
      throw new DefaultCountryDeletionException(country.name);
    }

    // Clean up country flag if exists
    if (country.flag) {
      try {
        await FileUploadUtil.deleteFile(country.flag);
      } catch (error) {
        this.logger.warn(
          `Failed to delete country flag: ${country.flag}`,
          error
        );
      }
    }

    await this.countriesRepository.deleteById(country.id);
  }

  async bulkUpdateCountries(bulkUpdateDto: BulkUpdateCountryDto) {
    const updateData: Partial<Country> = {
      status: bulkUpdateDto.status,
    };

    const result = await this.countriesRepository.bulkUpdateByPublicIds(
      bulkUpdateDto.publicIds,
      updateData
    );

    return this.i18nResponse.success('countries.bulk_updated_successfully', {
      count: result.count,
      message: `${result.count} countries updated successfully`,
    });
  }

  async bulkDeleteCountries(bulkDeleteDto: BulkDeleteCountryDto) {
    // Get all countries to be deleted
    const countriesToDelete = await Promise.all(
      bulkDeleteDto.publicIds.map((id) =>
        this.countriesRepository.findByPublicId(id)
      )
    );

    // Filter out null results and check eligibility
    const eligibleCountries = countriesToDelete.filter((country) => {
      if (!country) return false;
      if (country.useCount > 0) {
        this.logger.warn(
          `Skipping deletion of country '${country.name}' due to useCount: ${country.useCount}`
        );
        return false;
      }
      if (country.isDefault === 'YES') {
        this.logger.warn(
          `Skipping deletion of country '${country.name}' as it is set as default`
        );
        return false;
      }
      return true;
    }) as Country[];

    // Delete flag files for eligible countries
    const flagDeletionPromises = eligibleCountries
      .filter((country) => country.flag)
      .map(async (country) => {
        try {
          await FileUploadUtil.deleteFile(country.flag);
        } catch (error) {
          this.logger.warn(
            `Failed to delete country flag: ${country.flag}`,
            error
          );
        }
      });

    await Promise.all(flagDeletionPromises);

    // Delete eligible countries
    const eligiblePublicIds = eligibleCountries.map(
      (country) => country.publicId
    );
    const result =
      await this.countriesRepository.bulkDeleteByPublicIds(eligiblePublicIds);

    return this.i18nResponse.success('countries.bulk_deleted_successfully', {
      count: result.count,
      message: `${result.count} countries deleted successfully`,
    });
  }

  private async validateCountryCreation(
    createCountryDto: CreateCountryDto
  ): Promise<void> {
    // Check for duplicate name
    const existingNameCountry = await this.countriesRepository.getDetail({
      name: createCountryDto.name,
    });
    if (existingNameCountry) {
      throw new CountryAlreadyExistsException('name', createCountryDto.name);
    }

    // Check for duplicate ISO2 code
    const existingIso2Country = await this.countriesRepository.findByIso2(
      createCountryDto.iso2
    );
    if (existingIso2Country) {
      throw new CountryIsoCodeConflictException(
        createCountryDto.iso2.toUpperCase(),
        'ISO2'
      );
    }

    // Check for duplicate ISO3 code
    const existingIso3Country = await this.countriesRepository.findByIso3(
      createCountryDto.iso3
    );
    if (existingIso3Country) {
      throw new CountryIsoCodeConflictException(
        createCountryDto.iso3.toUpperCase(),
        'ISO3'
      );
    }

    // Validate flag is provided
    if (!createCountryDto.flag) {
      throw new InvalidCountryDataException('Country flag is required');
    }
  }

  private async validateCountryUpdate(
    existingCountry: Country,
    updateCountryDto: UpdateCountryDto
  ): Promise<void> {
    // Check for duplicate name (if changing)
    if (
      updateCountryDto.name &&
      updateCountryDto.name !== existingCountry.name
    ) {
      const existingNameCountry = await this.countriesRepository.getDetail({
        name: updateCountryDto.name,
      });
      if (
        existingNameCountry &&
        existingNameCountry.id !== existingCountry.id
      ) {
        throw new CountryAlreadyExistsException('name', updateCountryDto.name);
      }
    }

    // Check for duplicate ISO2 code (if changing)
    if (
      updateCountryDto.iso2 &&
      updateCountryDto.iso2.toUpperCase() !== existingCountry.iso2
    ) {
      const existingIso2Country = await this.countriesRepository.findByIso2(
        updateCountryDto.iso2
      );
      if (
        existingIso2Country &&
        existingIso2Country.id !== existingCountry.id
      ) {
        throw new CountryIsoCodeConflictException(
          updateCountryDto.iso2.toUpperCase(),
          'ISO2'
        );
      }
    }

    // Check for duplicate ISO3 code (if changing)
    if (
      updateCountryDto.iso3 &&
      updateCountryDto.iso3.toUpperCase() !== existingCountry.iso3
    ) {
      const existingIso3Country = await this.countriesRepository.findByIso3(
        updateCountryDto.iso3
      );
      if (
        existingIso3Country &&
        existingIso3Country.id !== existingCountry.id
      ) {
        throw new CountryIsoCodeConflictException(
          updateCountryDto.iso3.toUpperCase(),
          'ISO3'
        );
      }
    }
  }

  async handleFlagUpload(
    country: Country | null,
    flag: Express.Multer.File,
    isUpdate: boolean = false
  ): Promise<string> {
    // Delete old flag if updating
    if (isUpdate && country?.flag) {
      try {
        await FileUploadUtil.deleteFile(country.flag);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old country flag: ${country.flag}`,
          error
        );
      }
    }

    // Upload new flag
    const uploadResult = await FileUploadUtil.uploadFile(flag, {
      bucketName: getBucketName('COUNTRIES'),
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
      ],
      maxSizeInMB: 2,
      fieldName: 'flag',
    });

    return uploadResult.filePath;
  }

  private transformToResponseDto(country: Country): CountryResponseDto {
    return {
      id: country.id,
      publicId: country.publicId,
      name: country.name,
      iso2: country.iso2,
      iso3: country.iso3,
      flag: country.flag,
      isDefault: country.isDefault,
      status: country.status,
      useCount: country.useCount,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
    };
  }
}
