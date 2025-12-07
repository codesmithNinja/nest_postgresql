import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailTemplatesService } from './email-templates.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateResponseDto,
  EmailTemplateErrorResponseDto,
  BulkUpdateEmailTemplateDto,
  CreateEmailTemplateForAllLanguagesDto,
  PublicIdParamDto,
  EmailTemplateAdminQueryDto,
  EmailTemplatePaginatedResponseDto,
} from './dto/email-template.dto';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import {
  EmailTemplateNotFoundException,
  EmailTemplateLanguageException,
  EmailTemplateValidationException,
  EmailTemplateTaskException,
  EmailTemplateTaskAlreadyExistsException,
} from './exceptions/email-template.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Email Templates Management')
@Controller('email-templates')
@UseGuards(AdminJwtUserGuard)
@UseInterceptors(I18nResponseInterceptor)
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Get()
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @UseInterceptors(I18nResponseInterceptor)
  @ApiOperation({
    summary: 'Get all email templates for admin with pagination',
    description:
      'Admin endpoint to retrieve all email templates with pagination. Returns all templates (active and inactive) unless filtered. Based on dropdown pattern.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email templates retrieved successfully',
    type: EmailTemplatePaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid pagination parameters or language ID',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
    type: EmailTemplateErrorResponseDto,
  })
  async getAllEmailTemplatesForAdmin(
    @Query(ValidationPipe) query: EmailTemplateAdminQueryDto
  ) {
    try {
      const { page, limit, includeInactive, languageId } = query;

      const result =
        await this.emailTemplatesService.getAllEmailTemplatesForAdmin(
          page,
          limit,
          includeInactive,
          languageId
        );

      return this.i18nResponse.translateAndRespond(
        'email_templates.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      if (error instanceof EmailTemplateLanguageException) {
        return this.i18nResponse.translateError(
          'email_templates.invalid_language',
          HttpStatus.BAD_REQUEST
        );
      }

      if (error instanceof EmailTemplateValidationException) {
        return this.i18nResponse.translateError(
          'email_templates.validation_error',
          HttpStatus.BAD_REQUEST
        );
      }

      throw error;
    }
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get email template by public ID (Admin)',
    description:
      'Admin endpoint to retrieve a specific email template by its public ID with language information.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the email template to retrieve',
    type: 'string',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email template retrieved successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email template not found',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  async getEmailTemplateByPublicId(@Param() params: PublicIdParamDto) {
    try {
      const result =
        await this.emailTemplatesService.getEmailTemplateByPublicId(
          params.publicId
        );

      return this.i18nResponse.translateAndRespond(
        'email_templates.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      if (error instanceof EmailTemplateNotFoundException) {
        return this.i18nResponse.translateError(
          'email_templates.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create email template (Admin)',
    description: `Admin endpoint to create email templates with intelligent language handling.

    **Smart Language Behavior:**
    - If languageId is provided: Creates template for that specific language only
    - If languageId is NOT provided: Creates templates for ALL active languages
    - This provides both specific language targeting and multi-language convenience

    **Validation Rules:**
    - Email format validation for sender and reply emails
    - Task field is required and immutable after creation
    - Subject length: 1-500 characters
    - Sender name length: 1-200 characters
    - Message content is required
    - Template uniqueness enforced per language

    **Task Requirements:**
    - Must be unique per language
    - Alphanumeric characters, underscores, and hyphens only
    - Cannot be changed after creation`,
  })
  @ApiBody({
    type: CreateEmailTemplateDto,
    description:
      'Email template data - omit languageId to create for all languages',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Email template(s) created successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email template data or validation error',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email template already exists for this language or task',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async createEmailTemplate(
    @Body(ValidationPipe) createEmailTemplateDto: CreateEmailTemplateDto
  ) {
    try {
      // Smart language handling: if languageId is provided, create for specific language
      // If languageId is not provided, create for all active languages
      if (createEmailTemplateDto.languageId) {
        // Create for specific language
        const result = await this.emailTemplatesService.createEmailTemplate(
          createEmailTemplateDto
        );

        return this.i18nResponse.translateAndRespond(
          'email_templates.created_successfully',
          HttpStatus.CREATED,
          result
        );
      } else {
        // Create for all active languages

        // Convert to CreateEmailTemplateForAllLanguagesDto format
        const createForAllDto: CreateEmailTemplateForAllLanguagesDto = {
          task: createEmailTemplateDto.task,
          senderEmail: createEmailTemplateDto.senderEmail,
          replyEmail: createEmailTemplateDto.replyEmail,
          senderName: createEmailTemplateDto.senderName,
          subject: createEmailTemplateDto.subject,
          message: createEmailTemplateDto.message,
          status: createEmailTemplateDto.status,
        };

        const result =
          await this.emailTemplatesService.createEmailTemplatesForAllLanguages(
            createForAllDto
          );

        return this.i18nResponse.translateAndRespond(
          'email_templates.created_successfully_all_languages',
          HttpStatus.CREATED,
          result
        );
      }
    } catch (error) {
      if (error instanceof EmailTemplateTaskAlreadyExistsException) {
        return this.i18nResponse.translateError(
          'email_templates.task_already_exists',
          HttpStatus.CONFLICT
        );
      }

      if (error instanceof EmailTemplateValidationException) {
        return this.i18nResponse.translateError(
          'email_templates.validation_error',
          HttpStatus.BAD_REQUEST
        );
      }

      if (error instanceof EmailTemplateLanguageException) {
        return this.i18nResponse.translateError(
          'email_templates.invalid_language',
          HttpStatus.BAD_REQUEST
        );
      }

      throw error;
    }
  }

  @Patch('bulk-update')
  @ApiOperation({
    summary:
      'Bulk update email template status - ALL language variants (Admin)',
    description:
      'Admin endpoint to update the status (active/inactive) of ALL language variants for the tasks represented by the provided email template public IDs. ' +
      'This endpoint finds the tasks associated with the provided publicIds and updates ALL language versions (English, Spanish, French, Arabic) of those tasks.',
  })
  @ApiBody({
    type: BulkUpdateEmailTemplateDto,
    description:
      'Bulk update data with email template public IDs and new status. The system will find the tasks associated with these templates and update ALL language variants of those tasks.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Email templates updated successfully across all language variants',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email templates updated successfully',
        },
        updatedCount: {
          type: 'number',
          example: 12,
          description:
            'Total number of email templates updated across all languages (e.g., 3 tasks × 4 languages = 12)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid public IDs or validation error',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async bulkUpdateEmailTemplateStatus(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateEmailTemplateDto
  ) {
    const updatedCount =
      await this.emailTemplatesService.bulkUpdateStatus(bulkUpdateDto);

    return this.i18nResponse.translateAndRespond(
      'email_templates.bulk_updated_successfully',
      HttpStatus.OK,
      { updatedCount }
    );
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update email template (Admin)',
    description: `Admin endpoint to update a specific email template.

    **Important Notes:**
    - Task field cannot be updated (immutable after creation)
    - Language ID cannot be changed
    - Only content fields can be updated
    - Email format validation applies to sender and reply emails

    **Update Behavior:**
    - Updates only the specific language version
    - Clears related cache entries
    - Validates all provided fields`,
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the email template to update',
    type: 'string',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiBody({
    type: UpdateEmailTemplateDto,
    description:
      'Email template update data (task and languageId are immutable)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email template updated successfully',
    type: EmailTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email template not found',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or validation error',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  async updateEmailTemplate(
    @Param() params: PublicIdParamDto,
    @Body(ValidationPipe) updateEmailTemplateDto: UpdateEmailTemplateDto
  ) {
    try {
      const result = await this.emailTemplatesService.updateEmailTemplate(
        params.publicId,
        updateEmailTemplateDto
      );

      return this.i18nResponse.translateAndRespond(
        'email_templates.updated_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      if (error instanceof EmailTemplateNotFoundException) {
        return this.i18nResponse.translateError(
          'email_templates.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof EmailTemplateValidationException) {
        return this.i18nResponse.translateError(
          'email_templates.validation_error',
          HttpStatus.BAD_REQUEST
        );
      }

      if (error instanceof EmailTemplateTaskException) {
        return this.i18nResponse.translateError(
          'email_templates.task_immutable',
          HttpStatus.BAD_REQUEST
        );
      }

      throw error;
    }
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete email template and all task variants (Admin)',
    description:
      'Admin endpoint to delete ALL email templates with the same task across ALL languages by providing any template public ID. This action cannot be undone.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the email template to delete',
    type: 'string',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email template(s) deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email templates deleted successfully',
        },
        deletedCount: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email template not found',
    type: EmailTemplateErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async deleteEmailTemplate(@Param() params: PublicIdParamDto) {
    try {
      const deletedCount = await this.emailTemplatesService.deleteEmailTemplate(
        params.publicId
      );

      return this.i18nResponse.translateAndRespond(
        'email_templates.deleted_successfully',
        HttpStatus.OK,
        { deletedCount }
      );
    } catch (error) {
      if (error instanceof EmailTemplateNotFoundException) {
        return this.i18nResponse.translateError(
          'email_templates.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Get('admin/cache/stats')
  @ApiOperation({
    summary: 'Get email template cache statistics (Admin)',
    description: 'Admin endpoint to retrieve cache performance statistics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        keys: { type: 'number', example: 25 },
        hits: { type: 'number', example: 150 },
        misses: { type: 'number', example: 30 },
        size: { type: 'number', example: 25 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  getCacheStats() {
    const stats = this.emailTemplatesService.getCacheStats();

    return this.i18nResponse.translateAndRespond(
      'email_templates.cache_stats_retrieved',
      HttpStatus.OK,
      stats
    );
  }

  @Delete('admin/cache/clear')
  @ApiOperation({
    summary: 'Clear all email template cache (Admin)',
    description: 'Admin endpoint to clear all cache entries.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All cache cleared successfully' },
        cleared: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  clearAllCache() {
    const cleared = this.emailTemplatesService.clearCache();

    return this.i18nResponse.translateAndRespond(
      'email_templates.cache_cleared_successfully',
      HttpStatus.OK,
      { cleared }
    );
  }

  @Delete('admin/cache/clear/:pattern')
  @ApiOperation({
    summary: 'Clear specific email template cache pattern (Admin)',
    description:
      'Admin endpoint to clear cache entries matching a specific pattern.',
  })
  @ApiParam({
    name: 'pattern',
    description: 'Cache key pattern to clear specific entries',
    required: true,
    type: 'string',
    example: 'lang_en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pattern-specific cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Pattern cache cleared successfully',
        },
        cleared: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin authentication required',
    type: EmailTemplateErrorResponseDto,
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  clearCacheByPattern(@Param('pattern') pattern: string) {
    const cleared = this.emailTemplatesService.clearCache(pattern);

    return this.i18nResponse.translateAndRespond(
      'email_templates.cache_cleared_successfully',
      HttpStatus.OK,
      { cleared }
    );
  }
}
