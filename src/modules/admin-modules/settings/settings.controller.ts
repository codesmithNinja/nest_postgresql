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
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import * as multer from 'multer';
import { SettingsService } from './settings.service';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseHandler } from '../../../common/utils/response.handler';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';
import { I18nService } from 'nestjs-i18n';
import {
  SettingsResponseDto,
  SettingsListResponseDto,
  GroupTypeParamDto,
  SettingsErrorResponseDto,
} from './dto/settings.dto';
import {
  SettingsRequest,
  CreateSettingsRequest,
} from './interfaces/settings-request.interface';
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
    private readonly i18n: I18nService
  ) {}

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
    example: 'site_config',
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

      const response = {
        settings,
        groupType: params.groupType,
        count: settings.length,
      };

      return ResponseHandler.success(
        await this.i18n.translate('settings.retrieved_successfully'),
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch public settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return ResponseHandler.error(error.message, HttpStatus.NOT_FOUND);
      }

      return ResponseHandler.error(
        await this.i18n.translate('settings.fetch_failed'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':groupType/admin')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get settings by group type (Admin)',
    description:
      'Retrieve all settings for a specific group type with admin authentication.',
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type',
    example: 'site_config',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: SettingsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
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

      const response = {
        settings,
        groupType: params.groupType,
        count: settings.length,
      };

      return ResponseHandler.success(
        await this.i18n.translate('settings.retrieved_successfully'),
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch admin settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return ResponseHandler.error(error.message, HttpStatus.NOT_FOUND);
      }

      return ResponseHandler.error(
        await this.i18n.translate('settings.fetch_failed'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':groupType/admin')
  @UseGuards(AdminJwtUserGuard)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 20, // Maximum 20 files
      },
    })
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create or update settings (Admin)',
    description: `Create or update settings for a specific group type.

    **Form Data Structure:**
    - Text settings: Send as regular form fields (key: value)
    - File settings: Send files with field names as keys

    **Example form data:**
    - siteName: "My Website"
    - primaryColor: "#000000"
    - siteLogo: [file]

    **Behavior:**
    - If setting exists: Updates the existing setting
    - If setting doesn't exist: Creates new setting
    - Files automatically get recordType: FILE
    - Text values get recordType: STRING
    - Old files are automatically deleted when updated`,
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type',
    example: 'site_config',
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
          settings: [
            {
              id: 'clxxxxxxxxxxxxxxx',
              groupType: 'site_config',
              recordType: 'STRING',
              key: 'siteName',
              value: 'My Website',
              createdAt: '2023-12-01T10:00:00Z',
              updatedAt: '2023-12-01T10:00:00Z',
            },
          ],
          count: 1,
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
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    try {
      this.logger.log(
        `Creating/updating settings for group type: ${params.groupType}`
      );
      this.logger.debug(`Body keys: ${Object.keys(body || {}).join(', ')}`);
      this.logger.debug(`Files count: ${files?.length || 0}`);

      // Validate that we have some data to process
      const hasBodyData = body && Object.keys(body).length > 0;
      const hasFiles = files && files.length > 0;

      if (!hasBodyData && !hasFiles) {
        throw new BadRequestException(
          'No data provided. Please provide form data or files.'
        );
      }

      // Combine body data and files into a single form data object
      const formData: Record<string, string | Express.Multer.File> = {};

      // Add text data from body
      if (hasBodyData) {
        Object.entries(body).forEach(([key, value]) => {
          if (typeof value === 'string') {
            formData[key] = value;
          }
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

      const response = {
        settings,
        count: settings.length,
        groupType: params.groupType,
      };

      return ResponseHandler.success(
        await this.i18n.translate('settings.created_successfully'),
        HttpStatus.CREATED,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to create/update settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsValidationException) {
        return ResponseHandler.error(error.message, HttpStatus.BAD_REQUEST);
      }

      if (error instanceof FileUploadSettingsException) {
        return ResponseHandler.error(error.message, HttpStatus.BAD_REQUEST);
      }

      if (error instanceof BadRequestException) {
        return ResponseHandler.error(error.message, HttpStatus.BAD_REQUEST);
      }

      return ResponseHandler.error(
        await this.i18n.translate('settings.creation_failed'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':groupType/admin')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete all settings by group type (Admin)',
    description:
      'Delete all settings for a specific group type. This will also delete associated files.',
  })
  @ApiParam({
    name: 'groupType',
    description: 'Settings group type to delete',
    example: 'site_config',
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
          groupType: 'site_config',
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

      return ResponseHandler.success(
        await this.i18n.translate('settings.deleted_successfully'),
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete settings for group type: ${params.groupType}`,
        (error as Error).stack
      );

      if (error instanceof SettingsNotFoundException) {
        return ResponseHandler.error(error.message, HttpStatus.NOT_FOUND);
      }

      return ResponseHandler.error(
        await this.i18n.translate('settings.deletion_failed'),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('admin/cache/stats')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async getCacheStats() {
    try {
      const stats = await this.settingsService.getCacheStats();
      return ResponseHandler.success(
        'Cache stats retrieved successfully',
        HttpStatus.OK,
        stats
      );
    } catch (error) {
      this.logger.error('Failed to get cache stats', (error as Error).stack);
      return ResponseHandler.error(
        'Failed to get cache stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('admin/cache/clear/:groupType')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async clearCacheByGroup(@Param('groupType') groupType: string) {
    try {
      await this.settingsService.clearCache(groupType);
      const message = `Cache cleared for group type: ${groupType}`;
      return ResponseHandler.success(
        this.i18n.t('settings.cache_cleared'),
        HttpStatus.OK,
        { message }
      );
    } catch (error) {
      return ResponseHandler.error(
        'Failed to clear cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('admin/cache/clear')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async clearAllCache() {
    try {
      await this.settingsService.clearCache();
      const message = 'All cache cleared';
      return ResponseHandler.success(
        this.i18n.t('settings.cache_cleared'),
        HttpStatus.OK,
        { message }
      );
    } catch (error) {
      this.logger.error('Failed to clear cache', (error as Error).stack);
      return ResponseHandler.error(
        'Failed to clear cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
