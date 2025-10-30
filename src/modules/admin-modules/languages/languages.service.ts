import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Language } from '../../../database/entities/language.entity';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';
import {
  FileUploadUtil,
  getBucketName,
} from '../../../common/utils/file-upload.util';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

import {
  LanguageFilterDto,
  LanguageResponseDto,
  CreateLanguageDto,
  UpdateLanguageDto,
  BulkUpdateLanguageDto,
  BulkDeleteLanguageDto,
} from './dto/languages.dto';
import {
  LanguageAlreadyExistsException,
  LanguageNotFoundException,
  LanguageIsoCodeConflictException,
  LanguageFolderConflictException,
  InvalidLanguageDataException,
  DefaultLanguageDeletionException,
} from './exceptions/languages.exceptions';

@Injectable()
export class LanguagesService {
  private readonly logger = new Logger(LanguagesService.name);

  constructor(
    @Inject(LANGUAGES_REPOSITORY)
    private languagesRepository: ILanguagesRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getAllLanguages(filterDto: LanguageFilterDto) {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const options = {
      skip,
      limit,
      sort: { createdAt: -1 as -1 },
    };

    const result = await this.languagesRepository.findWithPagination(
      filters,
      options
    );

    return this.i18nResponse.success('languages.retrieved', {
      languages: result.items.map((language) =>
        this.transformToResponseDto(language)
      ),
      total: result.pagination.totalCount,
      page: result.pagination.currentPage,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
    });
  }

  async getLanguageByPublicId(publicId: string) {
    const language = await this.languagesRepository.findByPublicId(publicId);
    if (!language) {
      throw new LanguageNotFoundException(publicId);
    }

    return this.i18nResponse.success(
      'languages.retrieved',
      this.transformToResponseDto(language)
    );
  }

  async getFrontLanguages() {
    this.logger.log('Retrieving active languages for frontend');

    const languages = await this.languagesRepository.findMany(
      { status: true },
      {
        sort: { name: 1 },
      }
    );

    return this.i18nResponse.success(
      'languages.retrieved',
      languages.map((language) => this.transformToResponseDto(language))
    );
  }

  async createLanguage(createLanguageDto: CreateLanguageDto) {
    this.logger.log(`Creating language: ${createLanguageDto.name}`);
    this.logger.log(
      `Status value received: ${createLanguageDto.status} (type: ${typeof createLanguageDto.status})`
    );

    // Validate business logic FIRST (before file upload)
    await this.validateLanguageCreation(createLanguageDto);

    const publicId = uuidv4();
    const languageData = {
      ...createLanguageDto,
      publicId,
      iso2: createLanguageDto.iso2.toUpperCase(),
      iso3: createLanguageDto.iso3.toUpperCase(),
    };

    // Handle isDefault logic
    if (createLanguageDto.isDefault === 'YES') {
      await this.languagesRepository.setAllNonDefault();
    }

    const language = await this.languagesRepository.insert(languageData);

    this.logger.log(`Language created successfully with ID: ${language.id}`);
    return this.i18nResponse.created(
      'languages.created',
      this.transformToResponseDto(language)
    );
  }

  async updateLanguage(publicId: string, updateLanguageDto: UpdateLanguageDto) {
    const language = await this.languagesRepository.findByPublicId(publicId);
    if (!language) {
      throw new LanguageNotFoundException(publicId);
    }

    // Validate updates
    await this.validateLanguageUpdate(language, updateLanguageDto);

    const updateData = { ...updateLanguageDto };

    // Convert ISO codes to uppercase
    if (updateData.iso2) {
      updateData.iso2 = updateData.iso2.toUpperCase();
    }
    if (updateData.iso3) {
      updateData.iso3 = updateData.iso3.toUpperCase();
    }

    // Handle isDefault logic
    if (updateLanguageDto.isDefault === 'YES') {
      await this.languagesRepository.setAllNonDefault();
    }

    const updatedLanguage = await this.languagesRepository.update(
      language.id,
      updateData
    );

    this.logger.log(`Language updated successfully: ${language.id}`);
    return this.i18nResponse.success(
      'languages.updated',
      this.transformToResponseDto(updatedLanguage)
    );
  }

  async deleteLanguage(publicId: string): Promise<void> {
    const language = await this.languagesRepository.findByPublicId(publicId);
    if (!language) {
      throw new LanguageNotFoundException(publicId);
    }

    // Check if language is set as default
    if (language.isDefault === 'YES') {
      throw new DefaultLanguageDeletionException(language.name);
    }

    // Clean up language flag if exists
    if (language.flagImage) {
      try {
        await FileUploadUtil.deleteFile(language.flagImage);
        this.logger.log(`Language flag deleted: ${language.flagImage}`);
      } catch (error) {
        this.logger.warn(
          `Failed to delete language flag: ${language.flagImage}`,
          error
        );
      }
    }

    await this.languagesRepository.deleteById(language.id);
    this.logger.log(`Language deleted successfully: ${language.id}`);
  }

  async bulkUpdateLanguages(bulkUpdateDto: BulkUpdateLanguageDto) {
    this.logger.log(
      `Bulk updating ${bulkUpdateDto.publicIds.length} languages`
    );

    const updateData: Partial<Language> = {
      status: bulkUpdateDto.status,
    };

    const result = await this.languagesRepository.bulkUpdateByPublicIds(
      bulkUpdateDto.publicIds,
      updateData
    );

    this.logger.log(`Bulk update completed: ${result.count} languages updated`);
    return this.i18nResponse.success('languages.bulk_updated', {
      count: result.count,
      message: `${result.count} languages updated successfully`,
    });
  }

  async bulkDeleteLanguages(bulkDeleteDto: BulkDeleteLanguageDto) {
    this.logger.log(
      `Bulk deleting ${bulkDeleteDto.publicIds.length} languages`
    );

    // Get all languages to be deleted
    const languagesToDelete = await Promise.all(
      bulkDeleteDto.publicIds.map((id) =>
        this.languagesRepository.findByPublicId(id)
      )
    );

    // Filter out null results and check eligibility
    const eligibleLanguages = languagesToDelete.filter((language) => {
      if (!language) return false;
      if (language.isDefault === 'YES') {
        this.logger.warn(
          `Skipping deletion of language '${language.name}' as it is set as default`
        );
        return false;
      }
      return true;
    }) as Language[];

    // Delete flag files for eligible languages
    const flagDeletionPromises = eligibleLanguages
      .filter((language) => language.flagImage)
      .map(async (language) => {
        try {
          await FileUploadUtil.deleteFile(language.flagImage);
          this.logger.log(`Language flag deleted: ${language.flagImage}`);
        } catch (error) {
          this.logger.warn(
            `Failed to delete language flag: ${language.flagImage}`,
            error
          );
        }
      });

    await Promise.all(flagDeletionPromises);

    // Delete eligible languages
    const eligiblePublicIds = eligibleLanguages.map(
      (language) => language.publicId
    );
    const result =
      await this.languagesRepository.bulkDeleteByPublicIds(eligiblePublicIds);

    this.logger.log(
      `Bulk deletion completed: ${result.count} languages deleted`
    );
    return this.i18nResponse.success('languages.bulk_deleted', {
      count: result.count,
      message: `${result.count} languages deleted successfully`,
    });
  }

  private async validateLanguageCreation(
    createLanguageDto: CreateLanguageDto
  ): Promise<void> {
    this.logger.log(`Validating language creation: ${createLanguageDto.name}`);

    // Check for duplicate name
    const existingNameLanguage = await this.languagesRepository.getDetail({
      name: createLanguageDto.name,
    });
    if (existingNameLanguage) {
      throw new LanguageAlreadyExistsException('name', createLanguageDto.name);
    }

    // Check for duplicate folder
    const existingFolderLanguage = await this.languagesRepository.findByFolder(
      createLanguageDto.folder
    );
    if (existingFolderLanguage) {
      throw new LanguageFolderConflictException(createLanguageDto.folder);
    }

    // Check for duplicate ISO2 code
    const existingIso2Language = await this.languagesRepository.findByIso2(
      createLanguageDto.iso2
    );
    if (existingIso2Language) {
      throw new LanguageIsoCodeConflictException(
        createLanguageDto.iso2.toUpperCase(),
        'ISO2'
      );
    }

    // Check for duplicate ISO3 code
    const existingIso3Language = await this.languagesRepository.findByIso3(
      createLanguageDto.iso3
    );
    if (existingIso3Language) {
      throw new LanguageIsoCodeConflictException(
        createLanguageDto.iso3.toUpperCase(),
        'ISO3'
      );
    }

    // Validate flagImage is provided
    if (!createLanguageDto.flagImage) {
      throw new InvalidLanguageDataException('Language flag image is required');
    }
  }

  private async validateLanguageUpdate(
    existingLanguage: Language,
    updateLanguageDto: UpdateLanguageDto
  ): Promise<void> {
    this.logger.log(`Validating language update: ${existingLanguage.name}`);

    // Check for duplicate name (if changing)
    if (
      updateLanguageDto.name &&
      updateLanguageDto.name !== existingLanguage.name
    ) {
      const existingNameLanguage = await this.languagesRepository.getDetail({
        name: updateLanguageDto.name,
      });
      if (
        existingNameLanguage &&
        existingNameLanguage.id !== existingLanguage.id
      ) {
        throw new LanguageAlreadyExistsException(
          'name',
          updateLanguageDto.name
        );
      }
    }

    // Check for duplicate folder (if changing)
    if (
      updateLanguageDto.folder &&
      updateLanguageDto.folder !== existingLanguage.folder
    ) {
      const existingFolderLanguage =
        await this.languagesRepository.findByFolder(updateLanguageDto.folder);
      if (
        existingFolderLanguage &&
        existingFolderLanguage.id !== existingLanguage.id
      ) {
        throw new LanguageFolderConflictException(updateLanguageDto.folder);
      }
    }

    // Check for duplicate ISO2 code (if changing)
    if (
      updateLanguageDto.iso2 &&
      updateLanguageDto.iso2.toUpperCase() !== existingLanguage.iso2
    ) {
      const existingIso2Language = await this.languagesRepository.findByIso2(
        updateLanguageDto.iso2
      );
      if (
        existingIso2Language &&
        existingIso2Language.id !== existingLanguage.id
      ) {
        throw new LanguageIsoCodeConflictException(
          updateLanguageDto.iso2.toUpperCase(),
          'ISO2'
        );
      }
    }

    // Check for duplicate ISO3 code (if changing)
    if (
      updateLanguageDto.iso3 &&
      updateLanguageDto.iso3.toUpperCase() !== existingLanguage.iso3
    ) {
      const existingIso3Language = await this.languagesRepository.findByIso3(
        updateLanguageDto.iso3
      );
      if (
        existingIso3Language &&
        existingIso3Language.id !== existingLanguage.id
      ) {
        throw new LanguageIsoCodeConflictException(
          updateLanguageDto.iso3.toUpperCase(),
          'ISO3'
        );
      }
    }
  }

  async handleFlagImageUpload(
    language: Language | null,
    flagImage: Express.Multer.File,
    isUpdate: boolean = false
  ): Promise<string> {
    // Delete old flagImage if updating
    if (isUpdate && language?.flagImage) {
      try {
        await FileUploadUtil.deleteFile(language.flagImage);
        this.logger.log(`Old language flag deleted: ${language.flagImage}`);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old language flag: ${language.flagImage}`,
          error
        );
      }
    }

    // Upload new flagImage
    const uploadResult = await FileUploadUtil.uploadFile(flagImage, {
      bucketName: getBucketName('LANGUAGES'),
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
      ],
      maxSizeInMB: 2,
      fieldName: 'flagImage',
    });

    return uploadResult.filePath;
  }

  private transformToResponseDto(language: Language): LanguageResponseDto {
    return {
      id: language.id,
      publicId: language.publicId,
      name: language.name,
      folder: language.folder,
      iso2: language.iso2,
      iso3: language.iso3,
      flagImage: language.flagImage,
      direction: language.direction,
      status: language.status,
      isDefault: language.isDefault,
      createdAt: language.createdAt,
      updatedAt: language.updatedAt,
    };
  }
}
