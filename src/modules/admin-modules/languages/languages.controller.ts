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

import { LanguagesService } from './languages.service';
import { JwtAdminGuard } from '../../../common/guards/jwt-admin.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';

import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageFilterDto,
  BulkUpdateLanguageDto,
  BulkDeleteLanguageDto,
  LanguageResponseDto,
  LanguagePaginationResponseDto,
} from './dto/languages.dto';
import { BulkOperationResponseDto } from '../../../common/dto/bulk-operation.dto';

@ApiTags('Languages')
@Controller('languages')
@UseGuards(JwtAdminGuard)
export class LanguagesController {
  constructor(
    private readonly languagesService: LanguagesService,
    private readonly i18nResponse: I18nResponseService,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languagesRepository: ILanguagesRepository
  ) {}

  @Public()
  @Get('front')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all languages for frontend',
    description:
      'Public endpoint to retrieve all active languages for frontend usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages retrieved successfully',
    type: [LanguageResponseDto],
  })
  async getFrontLanguages() {
    return this.languagesService.getFrontLanguages();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all languages with pagination',
    description:
      'Admin endpoint to retrieve all languages with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages retrieved successfully',
    type: LanguagePaginationResponseDto,
  })
  async getAllLanguages(@Query(ValidationPipe) filterDto: LanguageFilterDto) {
    return this.languagesService.getAllLanguages(filterDto);
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get single language by public ID',
    description:
      'Admin endpoint to retrieve a specific language by its public ID',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the language',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Language retrieved successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async getLanguageByPublicId(@Param('publicId') publicId: string) {
    return this.languagesService.getLanguageByPublicId(publicId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new language',
    description:
      'Admin endpoint to create a new language with flag image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateLanguageDto,
    description: 'Language data with flag image file upload',
  })
  @ApiResponse({
    status: 201,
    description: 'Language created successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid language data or file upload error',
  })
  @ApiResponse({
    status: 409,
    description:
      'Language already exists (name, folder, ISO2, or ISO3 conflict)',
  })
  @UseInterceptors(FileInterceptor('flagImage', { storage: memoryStorage() }))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createLanguage(
    @Body(ValidationPipe) createLanguageDto: CreateLanguageDto,
    @UploadedFile() flagImage: Express.Multer.File
  ) {
    // Only upload file AFTER validation passes
    if (flagImage) {
      const flagImagePath = await this.languagesService.handleFlagImageUpload(
        null,
        flagImage,
        false
      );
      createLanguageDto.flagImage = flagImagePath;
    }

    return this.languagesService.createLanguage(createLanguageDto);
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update language',
    description:
      'Admin endpoint to update a language with optional flag image upload',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the language to update',
    type: 'string',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateLanguageDto,
    description: 'Language update data with optional flag image file upload',
  })
  @ApiResponse({
    status: 200,
    description: 'Language updated successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid language data or file upload error',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Language data conflict (name, folder, ISO2, or ISO3 already exists)',
  })
  @UseInterceptors(FileInterceptor('flagImage', { storage: memoryStorage() }))
  async updateLanguage(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateLanguageDto: UpdateLanguageDto,
    @UploadedFile() flagImage: Express.Multer.File
  ) {
    if (flagImage) {
      // Get existing language for flag handling
      const existingLanguage =
        await this.languagesRepository.findByPublicId(publicId);

      const flagImagePath = await this.languagesService.handleFlagImageUpload(
        existingLanguage,
        flagImage,
        true
      );
      updateLanguageDto.flagImage = flagImagePath;
    }

    return this.languagesService.updateLanguage(publicId, updateLanguageDto);
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete language',
    description:
      'Admin endpoint to delete a language (only if isDefault is NO)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the language to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Language deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Language cannot be deleted (isDefault is YES)',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found',
  })
  async deleteLanguage(@Param('publicId') publicId: string) {
    await this.languagesService.deleteLanguage(publicId);
    return this.i18nResponse.success('languages.deleted');
  }

  @Patch('bulk-update')
  @ApiOperation({
    summary: 'Bulk update languages',
    description: 'Admin endpoint to update multiple languages at once',
  })
  @ApiBody({
    type: BulkUpdateLanguageDto,
    description: 'Bulk update data with array of language public IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages updated successfully',
    type: BulkOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk update data',
  })
  async bulkUpdateLanguages(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateLanguageDto
  ) {
    return this.languagesService.bulkUpdateLanguages(bulkUpdateDto);
  }

  @Patch('bulk-delete')
  @ApiOperation({
    summary: 'Bulk delete languages',
    description:
      'Admin endpoint to delete multiple languages at once (only if isDefault is NO for each)',
  })
  @ApiBody({
    type: BulkDeleteLanguageDto,
    description: 'Bulk delete data with array of language public IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages deleted successfully',
    type: BulkOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk delete data',
  })
  async bulkDeleteLanguages(
    @Body(ValidationPipe) bulkDeleteDto: BulkDeleteLanguageDto
  ) {
    return this.languagesService.bulkDeleteLanguages(bulkDeleteDto);
  }
}
