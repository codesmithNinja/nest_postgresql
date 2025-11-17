import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MetaSettingsService } from './meta-settings.service';
import {
  CreateMetaSettingDto,
  UpdateMetaSettingDto,
  MetaSettingResponseDto,
  MetaSettingListResponseDto,
  MetaSettingErrorResponseDto,
} from './dto/meta-setting.dto';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { UploadSingleFile } from '../../../common/decorators/upload-files.decorator';
import {
  MetaSettingNotFoundException,
  MetaSettingLanguageException,
} from './exceptions/meta-setting.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Meta Settings Management')
@Controller('meta-settings')
@UseGuards(AdminJwtUserGuard)
@UseInterceptors(I18nResponseInterceptor)
@ApiBearerAuth()
export class MetaSettingsController {
  private readonly logger = new Logger(MetaSettingsController.name);

  constructor(
    private readonly metaSettingsService: MetaSettingsService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Get('front')
  @Public()
  @ApiOperation({
    summary: 'Get meta settings for frontend (Public)',
    description:
      'Retrieve meta settings for public/frontend use without authentication. Returns meta settings for the specified language or default language.',
    tags: ['Public APIs'],
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
    examples: {
      publicId: {
        summary: 'Language Public ID',
        description: 'Get meta settings using language public ID',
        value: 'clm1234567890',
      },
      objectId: {
        summary: 'Language Object ID',
        description: 'Get meta settings using language _id',
        value: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meta settings retrieved successfully',
    type: MetaSettingListResponseDto,
    examples: {
      success: {
        summary: 'Successful Response',
        value: {
          metaSetting: {
            id: 'clm1234567890',
            publicId: 'clm1234567890',
            languageId: 'clm1234567890',
            siteName: 'EquityCrowd - Investment Platform',
            metaTitle:
              'EquityCrowd - Discover Investment Opportunities | Crowdfunding Platform',
            metaDescription:
              'Join thousands of investors and entrepreneurs on EquityCrowd. Discover innovative startups, invest in promising ventures, or raise capital for your business.',
            metaKeyword:
              'equity crowdfunding, startup investment, venture capital, fundraising, investment platform',
            ogTitle: 'EquityCrowd - The Future of Startup Investment',
            ogDescription:
              'Discover the next unicorn startup or raise capital for your innovative business. EquityCrowd connects visionary entrepreneurs with smart investors.',
            ogImage:
              'https://example.com/uploads/meta-settings/og-image-en.jpg',
            isAIGeneratedImage: 'NO',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
          language: 'en',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meta settings not found for the specified language',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid language code',
    type: MetaSettingErrorResponseDto,
  })
  async getMetaSettingsForPublic(@Query('languageId') languageId?: string) {
    try {
      this.logger.log(
        `Fetching meta settings for public with languageId: ${languageId || 'default'}`
      );

      const result =
        await this.metaSettingsService.getMetaSettingForPublic(languageId);

      return this.i18nResponse.translateAndRespond(
        'meta_settings.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta settings for public with languageId ${languageId}:`,
        (error as Error).stack
      );

      if (error instanceof MetaSettingNotFoundException) {
        return this.i18nResponse.translateError(
          'meta_settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof MetaSettingLanguageException) {
        return this.i18nResponse.translateError(
          'meta_settings.invalid_language',
          HttpStatus.BAD_REQUEST
        );
      }

      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get meta settings for admin (Admin)',
    description:
      'Admin endpoint to retrieve meta settings for the specified language with administrative access. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
    examples: {
      publicId: {
        summary: 'Language Public ID',
        description: 'Get meta settings using language public ID',
        value: 'clm1234567890',
      },
      objectId: {
        summary: 'Language Object ID',
        description: 'Get meta settings using language _id',
        value: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meta settings retrieved successfully',
    type: MetaSettingListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meta settings not found for the specified language',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid language code',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: MetaSettingErrorResponseDto,
  })
  async getMetaSettingsForAdmin(@Query('languageId') languageId?: string) {
    try {
      this.logger.log(
        `Fetching meta settings for admin with languageId: ${languageId || 'default'}`
      );

      const result =
        await this.metaSettingsService.getMetaSettingForAdmin(languageId);

      return this.i18nResponse.translateAndRespond(
        'meta_settings.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta settings for admin with languageId ${languageId}:`,
        (error as Error).stack
      );

      if (error instanceof MetaSettingNotFoundException) {
        return this.i18nResponse.translateError(
          'meta_settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof MetaSettingLanguageException) {
        return this.i18nResponse.translateError(
          'meta_settings.invalid_language',
          HttpStatus.BAD_REQUEST
        );
      }

      throw error;
    }
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get meta setting by public ID (Admin)',
    description:
      'Admin endpoint to retrieve a specific meta setting by its public ID.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the meta setting to retrieve',
    type: 'string',
    example: 'clm1234567890',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
    examples: {
      publicId: {
        summary: 'Language Public ID',
        description: 'Get meta settings using language public ID',
        value: 'clm1234567890',
      },
      objectId: {
        summary: 'Language Object ID',
        description: 'Get meta settings using language _id',
        value: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meta setting retrieved successfully',
    type: MetaSettingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meta setting not found',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: MetaSettingErrorResponseDto,
  })
  async getMetaSettingByPublicId(
    @Param('publicId') publicId: string,
    @Query('languageId') languageId?: string
  ) {
    try {
      this.logger.log(
        `Fetching meta setting by public ID: ${publicId} with languageId: ${languageId || 'default'}`
      );

      const result = await this.metaSettingsService.getMetaSettingByPublicId(
        publicId,
        languageId
      );

      return this.i18nResponse.translateAndRespond(
        'meta_settings.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta setting by public ID: ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof MetaSettingNotFoundException) {
        return this.i18nResponse.translateError(
          'meta_settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create meta settings for all languages (Admin)',
    description: `Admin endpoint to create meta settings with OpenGraph image upload for all active languages.

    **File Upload Requirements:**
    - Field name: ogImage
    - Maximum file size: 5MB
    - Allowed formats: JPEG, PNG, WebP, SVG
    - Creates language-specific image variants

    **Multi-language Behavior:**
    - Creates meta setting entries for ALL active languages
    - Uses the same content across all languages
    - Uploads separate OG images for each language variant
    - Skips languages that already have meta settings`,
  })
  @ApiConsumes('multipart/form-data')
  @UploadSingleFile('ogImage', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ],
  })
  @ApiBody({
    type: CreateMetaSettingDto,
    description: 'Meta setting data with OpenGraph image file upload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meta settings created successfully for all languages',
    type: MetaSettingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid meta setting data or file upload error',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Meta settings already exist for some languages',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: MetaSettingErrorResponseDto,
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async createMetaSettings(
    @Body(ValidationPipe) createMetaSettingDto: CreateMetaSettingDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      this.logger.log(
        'Creating meta settings for all languages with OG image upload'
      );

      // Extract OG image file from files array
      const ogImage = files && files.length > 0 ? files[0] : undefined;

      const result = await this.metaSettingsService.createMetaSettings(
        createMetaSettingDto,
        ogImage
      );

      return this.i18nResponse.translateAndRespond(
        'meta_settings.created_successfully',
        HttpStatus.CREATED,
        result
      );
    } catch (error) {
      this.logger.error(
        'Failed to create meta settings',
        (error as Error).stack
      );
      throw error;
    }
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update meta setting (Admin)',
    description: `Admin endpoint to update a specific meta setting with optional OpenGraph image upload.

    **File Upload (Optional):**
    - Field name: ogImage
    - Maximum file size: 5MB
    - Allowed formats: JPEG, PNG, WebP, SVG
    - If provided, replaces existing OG image for the specific language

    **Update Behavior:**
    - Updates only the specific language version
    - Maintains language-specific image handling
    - Validates SEO field lengths and requirements`,
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the meta setting to update',
    type: 'string',
    example: 'clm1234567890',
  })
  @ApiConsumes('multipart/form-data')
  @UploadSingleFile('ogImage', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ],
  })
  @ApiBody({
    type: UpdateMetaSettingDto,
    description:
      'Meta setting update data with optional OpenGraph image file upload',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meta setting updated successfully',
    type: MetaSettingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meta setting not found',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or file upload error',
    type: MetaSettingErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: MetaSettingErrorResponseDto,
  })
  async updateMetaSetting(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateMetaSettingDto: UpdateMetaSettingDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      this.logger.log(`Updating meta setting: ${publicId}`);

      // Extract OG image file from files array (optional for update)
      const ogImage = files && files.length > 0 ? files[0] : undefined;

      const result = await this.metaSettingsService.updateMetaSetting(
        publicId,
        updateMetaSettingDto,
        ogImage
      );

      return this.i18nResponse.translateAndRespond(
        'meta_settings.updated_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to update meta setting: ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof MetaSettingNotFoundException) {
        return this.i18nResponse.translateError(
          'meta_settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }
}
