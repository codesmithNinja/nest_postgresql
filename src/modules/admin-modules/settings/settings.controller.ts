import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Logger,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { UploadFiles } from '../../../common/decorators/upload-files.decorator';
import { SettingsService } from './settings.service';
import { JwtAdminGuard } from '../../../common/guards/jwt-admin.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';
import {
  SettingsListResponseDto,
  GroupTypeParamDto,
  SettingsErrorResponseDto,
} from './dto/settings.dto';
import {
  SettingsNotFoundException,
  SettingsValidationException,
  FileUploadSettingsException,
} from './exceptions/settings.exceptions';

@ApiTags('Admin Settings')
@Controller('settings')
@UseInterceptors(I18nResponseInterceptor)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Get(':groupType')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get settings by group type (Admin)',
    description:
      'Retrieve all settings for a specific group type with admin authentication.',
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type',
    example: 'site_setting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: SettingsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid group type',
    type: SettingsErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settings not found',
    type: SettingsErrorResponseDto,
  })
  async getAdminSettingsByGroupType(@Param() params: GroupTypeParamDto) {
    try {
      this.logger.log(
        `Fetching admin settings for group type: ${params.groupType}`
      );

      const settings = await this.settingsService.getSettingsByGroupType(
        params.groupType
      );

      const transformedSettings =
        this.settingsService.transformSettingsToKeyValue(settings);
      const response = {
        settings: transformedSettings,
        groupType: params.groupType,
        count: settings.length,
      };

      return this.i18nResponse.translateAndRespond(
        'settings.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch admin settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return this.i18nResponse.translateError(
          'settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'settings.fetch_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':groupType/front')
  @Public()
  @ApiOperation({
    summary: 'Get settings by group type (Public)',
    description:
      'Retrieve all settings for a specific group type without authentication. Used for front-end applications.',
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type',
    example: 'site_setting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: SettingsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid group type',
    type: SettingsErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settings not found',
    type: SettingsErrorResponseDto,
  })
  async getPublicSettingsByGroupType(@Param() params: GroupTypeParamDto) {
    try {
      this.logger.log(
        `Fetching public settings for group type: ${params.groupType}`
      );

      const settings = await this.settingsService.getPublicSettingsByGroupType(
        params.groupType
      );

      const transformedSettings =
        this.settingsService.transformSettingsToKeyValue(settings);
      const response = {
        settings: transformedSettings,
        groupType: params.groupType,
        count: settings.length,
      };

      return this.i18nResponse.translateAndRespond(
        'settings.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch public settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return this.i18nResponse.translateError(
          'settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'settings.fetch_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':groupType')
  @UseGuards(JwtAdminGuard)
  @UploadFiles({
    maxFiles: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/x-icon', // For favicon
      'application/pdf',
    ],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update dynamic settings (Admin)',
    description: `🚀 **FULLY DYNAMIC SETTINGS API** - Accepts ANY groupType with ANY field names!

    **✨ Dynamic GroupType Support:**
    - site_setting: siteName, sitePrimaryColor, enableWebNotification, etc.
    - amount_setting: minimumInvestment, maximumInvestment, defaultCurrency, etc.
    - revenue_setting: revenueSharePercentage, payoutFrequency, etc.
    - email_setting: smtpHost, smtpPort, smtpUsername, etc.
    - api_setting: stripePublicKey, awsAccessKey, etc.
    - **ANY_CUSTOM_GROUPTYPE**: Your own custom group names!

    **💡 Dynamic Field Support:**
    - NO predefined schema - send ANY field names you want
    - NO validation restrictions - accepts everything
    - Edge cases: undefined → empty string, null → empty string

    **📤 Upload Format Support:**

    **1. Postman Multipart/form-data:**
    \`\`\`
    Content-Type: multipart/form-data

    siteName: "My Platform"
    customColor: "#FF5722"
    newField123: "any value"
    siteLogo: [file]
    customImage: [file]
    \`\`\`

    **2. React Binary Upload:**
    \`\`\`
    Content-Type: application/octet-stream
    X-Filename: logo.png
    Field-Name: siteLogo
    [binary data]
    \`\`\`

    **📝 Example Requests:**

    **site_setting:**
    - siteName, siteLogo, enableNotifications, customTheme

    **amount_setting:**
    - minAmount, maxAmount, currency, feePercentage

    **revenue_setting:**
    - sharePercent, payoutCycle, minimumThreshold

    **🎯 Smart Behavior:**
    - Undefined/null values → stored as empty strings
    - Mixed text + files in single request
    - Auto file type detection (STRING vs FILE)
    - Max 20 files, 10MB each
    - Supports: images, SVG, favicon, PDF`,
  })
  @ApiParam({
    name: 'groupType',
    description:
      'Any custom group type - no restrictions! Examples: site_setting, amount_setting, revenue_setting, my_custom_group, API_CONFIG_v2',
    examples: {
      site_setting: {
        value: 'site_setting',
        description: 'Site configuration settings',
      },
      amount_setting: {
        value: 'amount_setting',
        description: 'Amount/investment configuration',
      },
      revenue_setting: {
        value: 'revenue_setting',
        description: 'Revenue sharing configuration',
      },
      custom_group: {
        value: 'my_custom_group_123',
        description: 'Any custom group name you want',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Settings created/updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Settings created/updated successfully',
        statusCode: 201,
        data: {
          settings: {
            siteName: 'My Website',
            maxUsers: 1000,
            enableFeatures: true,
            primaryColor: '#FF5722',
          },
          count: 4,
          groupType: 'site_setting',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or file upload error',
    type: SettingsErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async createOrUpdateSettings(
    @Param() params: GroupTypeParamDto,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    try {
      this.logger.log(
        `Creating/updating settings for group type: ${params.groupType}`
      );
      this.logger.debug(`Body keys: ${Object.keys(body || {}).join(', ')}`);
      this.logger.debug(`Files count: ${files?.length || 0}`);

      // Log upload method for debugging
      if (files && files.length > 0) {
        this.logger.debug(
          `File upload detected - files processed by universal interceptor`
        );
        files.forEach((file, index) => {
          this.logger.debug(
            `File ${index + 1}: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`
          );
        });
      }

      // Validate that we have some data to process
      const hasBodyData = body && Object.keys(body).length > 0;
      const hasFiles = files && files.length > 0;

      if (!hasBodyData && !hasFiles) {
        throw new BadRequestException(
          'No data provided. Please provide form data or files.'
        );
      }

      // Combine body data and files into a single form data object
      const formData: Record<
        string,
        string | number | boolean | Express.Multer.File
      > = {};

      // Add text data from body - preserve original types, only convert undefined to empty string
      if (hasBodyData) {
        Object.entries(body).forEach(([key, value]) => {
          // Preserve original types: boolean → boolean, number → number, string → string
          // Only convert undefined → empty string
          let finalValue: string | number | boolean;

          if (value === undefined || value === null) {
            // Convert undefined/null to empty string as requested
            finalValue = '';
            this.logger.debug(
              `Converting undefined/null value for key "${key}" to empty string`
            );
          } else if (typeof value === 'string') {
            // Handle edge case where literal "undefined" string is passed
            finalValue = value === 'undefined' ? '' : value;
            if (value === 'undefined') {
              this.logger.debug(
                `Converting literal "undefined" string for key "${key}" to empty string`
              );
            }
          } else if (typeof value === 'boolean') {
            // Preserve boolean type for MongoDB Mixed field
            finalValue = value;
            this.logger.debug(
              `Preserving boolean value for key "${key}": ${finalValue}`
            );
          } else if (typeof value === 'number') {
            // Preserve number type for MongoDB Mixed field
            finalValue = value;
            this.logger.debug(
              `Preserving number value for key "${key}": ${finalValue}`
            );
          } else {
            // Convert other types to JSON strings for storage
            finalValue = JSON.stringify(value);
            this.logger.debug(
              `Converting complex value for key "${key}" to JSON string: ${finalValue}`
            );
          }

          formData[key] = finalValue;
        });
      }

      // Add files using their field names as keys
      if (hasFiles) {
        files.forEach((file) => {
          if (file.fieldname) {
            formData[file.fieldname] = file;
          }
        });
      }

      this.logger.debug(`Form data keys: ${Object.keys(formData).join(', ')}`);

      const settings = await this.settingsService.createOrUpdateSettings(
        params.groupType,
        formData
      );

      const transformedSettings =
        this.settingsService.transformSettingsToKeyValue(settings);
      const response = {
        settings: transformedSettings,
        count: settings.length,
        groupType: params.groupType,
      };

      return this.i18nResponse.translateAndRespond(
        'settings.created_successfully',
        HttpStatus.CREATED,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to create/update settings for group type: ${params.groupType}`,
        error
      );

      // Log more details about the error
      this.logger.error(`Error name: ${(error as Error).name}`);
      this.logger.error(`Error message: ${(error as Error).message}`);
      this.logger.error(`Error stack: ${(error as Error).stack}`);

      if (error instanceof SettingsValidationException) {
        return this.i18nResponse.translateError(
          'settings.validation_error',
          HttpStatus.BAD_REQUEST,
          error.message
        );
      }

      if (error instanceof FileUploadSettingsException) {
        return this.i18nResponse.translateError(
          'settings.file_upload_error',
          HttpStatus.BAD_REQUEST,
          error.message
        );
      }

      if (error instanceof BadRequestException) {
        return this.i18nResponse.translateError(
          'settings.bad_request',
          HttpStatus.BAD_REQUEST,
          error.message
        );
      }

      return this.i18nResponse.translateError(
        'settings.creation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':groupType')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete all settings by group type (Admin)',
    description:
      'Delete all settings for a specific group type. This will also delete associated files.',
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type to delete',
    example: 'site_setting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Settings deleted successfully',
        statusCode: 200,
        data: {
          deletedCount: 5,
          groupType: 'site_setting',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settings not found',
    type: SettingsErrorResponseDto,
  })
  async deleteSettingsByGroupType(@Param() params: GroupTypeParamDto) {
    try {
      this.logger.log(
        `Deleting all settings for group type: ${params.groupType}`
      );

      const deletedCount = await this.settingsService.deleteGroupType(
        params.groupType
      );

      if (deletedCount === 0) {
        throw new SettingsNotFoundException(params.groupType);
      }

      const response = {
        deletedCount,
        groupType: params.groupType,
      };

      return this.i18nResponse.translateAndRespond(
        'settings.deleted_successfully',
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return this.i18nResponse.translateError(
          'settings.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'settings.deletion_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('admin/cache/stats')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  getCacheStats() {
    try {
      const stats = this.settingsService.getCacheStats();
      return this.i18nResponse.translateAndRespond(
        'settings.cache_stats_retrieved',
        HttpStatus.OK,
        stats
      );
    } catch (error) {
      this.logger.error('Failed to get cache stats', (error as Error).stack);
      return this.i18nResponse.translateError(
        'settings.cache_stats_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('admin/cache/clear/:groupType')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  clearCacheByGroup(@Param('groupType') groupType: string) {
    try {
      this.settingsService.clearCache(groupType);
      const message = `Cache cleared for group type: ${groupType}`;
      return this.i18nResponse.translateAndRespond(
        'settings.cache_cleared',
        HttpStatus.OK,
        { message }
      );
    } catch (error) {
      this.logger.error(
        'Failed to clear cache by group',
        (error as Error).stack
      );
      return this.i18nResponse.translateError(
        'settings.cache_clear_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('admin/cache/clear')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  clearAllCache() {
    try {
      this.settingsService.clearCache();
      const message = 'All cache cleared';
      return this.i18nResponse.translateAndRespond(
        'settings.cache_cleared',
        HttpStatus.OK,
        { message }
      );
    } catch (error) {
      this.logger.error('Failed to clear cache', (error as Error).stack);
      return this.i18nResponse.translateError(
        'settings.cache_clear_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
