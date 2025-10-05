import { memoryStorage } from 'multer';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CountriesService } from './countries.service';
import { JwtAdminGuard } from '../../../common/guards/jwt-admin.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import {
  ICountriesRepository,
  COUNTRIES_REPOSITORY,
} from '../../../database/repositories/countries/countries.repository.interface';

import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryFilterDto,
  BulkUpdateCountryDto,
  BulkDeleteCountryDto,
  CountryResponseDto,
  CountryPaginationResponseDto,
  BulkOperationResponseDto,
} from './dto/countries.dto';

@ApiTags('Countries')
@Controller('countries')
@UseGuards(JwtAdminGuard)
export class CountriesController {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly i18nResponse: I18nResponseService,
    @Inject(COUNTRIES_REPOSITORY)
    private readonly countriesRepository: ICountriesRepository
  ) {}

  @Public()
  @Get('front')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all countries for frontend',
    description: 'Public endpoint to retrieve all countries for frontend usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
    type: [CountryResponseDto],
  })
  async getFrontCountries() {
    return this.countriesService.getFrontCountries();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all countries with pagination',
    description:
      'Admin endpoint to retrieve all countries with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
    type: CountryPaginationResponseDto,
  })
  async getAllCountries(@Query(ValidationPipe) filterDto: CountryFilterDto) {
    return this.countriesService.getAllCountries(filterDto);
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get single country by public ID',
    description:
      'Admin endpoint to retrieve a specific country by its public ID',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the country',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Country retrieved successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getCountryByPublicId(@Param('publicId') publicId: string) {
    return this.countriesService.getCountryByPublicId(publicId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new country',
    description: 'Admin endpoint to create a new country with flag upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateCountryDto,
    description: 'Country data with flag file upload',
  })
  @ApiResponse({
    status: 201,
    description: 'Country created successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid country data or file upload error',
  })
  @ApiResponse({
    status: 409,
    description: 'Country already exists (name, ISO2, or ISO3 conflict)',
  })
  @UseInterceptors(FileInterceptor('flag', { storage: memoryStorage() }))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createCountry(
    @Body(ValidationPipe) createCountryDto: CreateCountryDto,
    @UploadedFile() flag: Express.Multer.File
  ) {
    // Only upload file AFTER validation passes
    if (flag) {
      const flagPath = await this.countriesService.handleFlagUpload(
        null,
        flag,
        false
      );
      createCountryDto.flag = flagPath;
    }

    return this.countriesService.createCountry(createCountryDto);
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update country',
    description: 'Admin endpoint to update a country with optional flag upload',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the country to update',
    type: 'string',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateCountryDto,
    description: 'Country update data with optional flag file upload',
  })
  @ApiResponse({
    status: 200,
    description: 'Country updated successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid country data or file upload error',
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Country data conflict (name, ISO2, or ISO3 already exists)',
  })
  @UseInterceptors(FileInterceptor('flag', { storage: memoryStorage() }))
  async updateCountry(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateCountryDto: UpdateCountryDto,
    @UploadedFile() flag: Express.Multer.File
  ) {
    if (flag) {
      // Get existing country for flag handling
      const existingCountry =
        await this.countriesRepository.findByPublicId(publicId);

      const flagPath = await this.countriesService.handleFlagUpload(
        existingCountry,
        flag,
        true
      );
      updateCountryDto.flag = flagPath;
    }

    return this.countriesService.updateCountry(publicId, updateCountryDto);
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete country',
    description: 'Admin endpoint to delete a country (only if useCount is 0)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the country to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Country deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Country cannot be deleted (useCount > 0)',
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async deleteCountry(@Param('publicId') publicId: string) {
    await this.countriesService.deleteCountry(publicId);
    return this.i18nResponse.success('countries.deleted');
  }

  @Patch('bulk-update')
  @ApiOperation({
    summary: 'Bulk update countries',
    description: 'Admin endpoint to update multiple countries at once',
  })
  @ApiBody({
    type: BulkUpdateCountryDto,
    description: 'Bulk update data with array of country public IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Countries updated successfully',
    type: BulkOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk update data',
  })
  async bulkUpdateCountries(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateCountryDto
  ) {
    return this.countriesService.bulkUpdateCountries(bulkUpdateDto);
  }

  @Patch('bulk-delete')
  @ApiOperation({
    summary: 'Bulk delete countries',
    description:
      'Admin endpoint to delete multiple countries at once (only if useCount is 0 for each)',
  })
  @ApiBody({
    type: BulkDeleteCountryDto,
    description: 'Bulk delete data with array of country public IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Countries deleted successfully',
    type: BulkOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk delete data',
  })
  async bulkDeleteCountries(
    @Body(ValidationPipe) bulkDeleteDto: BulkDeleteCountryDto
  ) {
    return this.countriesService.bulkDeleteCountries(bulkDeleteDto);
  }
}
