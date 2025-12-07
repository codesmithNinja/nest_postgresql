import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import NodeCache from 'node-cache';
import {
  IEmailTemplateRepository,
  EMAIL_TEMPLATE_REPOSITORY,
} from '../../../database/repositories/email-template/email-template.repository.interface';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';
import {
  EmailTemplate,
  EmailTemplateWithLanguage,
} from '../../../database/entities/email-template.entity';
import {
  EmailTemplateResponseDto,
  EmailTemplateListResponseDto,
  EmailTemplatePaginationResponseDto,
  AdminEmailTemplateQueryDto,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  CreateEmailTemplateForAllLanguagesDto,
  BulkUpdateEmailTemplateDto,
} from './dto/email-template.dto';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import {
  EmailTemplateNotFoundException,
  EmailTemplateLanguageException,
  EmailTemplateTaskValidationException,
  EmailTemplateTaskAlreadyExistsException,
  EmailTemplateCreationException,
  EmailTemplateUpdateException,
  EmailTemplateDeletionException,
  EmailTemplateDefaultLanguageException,
  InvalidEmailTemplateDataException,
  EmailTemplateEmailValidationException,
  EmailTemplateSubjectException,
  EmailTemplateContentException,
  EmailTemplateCacheException,
} from './exceptions/email-template.exceptions';

interface CacheKey {
  languageId?: string;
  task?: string;
  publicId?: string;
  isPublic?: boolean;
}

interface EmailTemplateServiceOptions {
  useCache?: boolean;
}

@Injectable()
export class EmailTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplatesService.name);
  private cache: NodeCache;
  private readonly cacheTTL = 300; // 5 minutes default TTL
  private readonly maxCacheSize = 1000;

  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly emailTemplateRepository: IEmailTemplateRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languagesRepository: ILanguagesRepository,
    private readonly i18nResponse: I18nResponseService
  ) {
    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      maxKeys: this.maxCacheSize,
      useClones: false,
      checkperiod: 60, // Check for expired keys every 60 seconds
    });
  }

  onModuleInit(): void {
    // Set up cache event listeners
    this.cache.on('set', () => {});

    this.cache.on('del', () => {});

    this.cache.on('expired', () => {});
  }

  /**
   * Get email templates for public/frontend use (active templates only)
   */
  async getEmailTemplatesForPublic(
    languageCode?: string,
    publicId?: string,
    options: EmailTemplateServiceOptions = { useCache: true }
  ): Promise<EmailTemplateListResponseDto[]> {
    try {
      const { useCache = true } = options;
      const cacheKey = this.generateCacheKey({
        languageId: languageCode || publicId,
        isPublic: true,
      });

      // Try to get from cache first
      if (useCache) {
        const cached =
          this.getFromCache<EmailTemplateListResponseDto[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Resolve language based on provided parameters
      let language;
      if (publicId) {
        // Get language by publicId
        language = await this.getLanguageByPublicId(publicId);
      } else if (languageCode) {
        // Get language by code (existing behavior)
        language = await this.getLanguageByCode(languageCode);
      } else {
        // Get default language (existing behavior)
        language = await this.getDefaultLanguage();
      }

      if (!language) {
        throw new EmailTemplateLanguageException(
          publicId || languageCode || 'default'
        );
      }

      // Get active email templates for the language
      const emailTemplates =
        await this.emailTemplateRepository.findByStatusWithLanguage(
          true, // status = active
          language.id
        );

      // Transform to response format
      const result = emailTemplates.map((template) => ({
        emailTemplate: this.transformToResponseDto(template),
        language:
          template.language?.folder || language.folder || languageCode || 'en',
      }));

      // Cache the result
      if (useCache && result.length > 0) {
        this.setToCache(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch public email templates for ${
          publicId
            ? `publicId: ${publicId}`
            : languageCode
              ? `languageCode: ${languageCode}`
              : 'default language'
        }:`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get email templates for admin with pagination and filtering
   */
  async getEmailTemplatesForAdmin(
    queryDto: AdminEmailTemplateQueryDto
  ): Promise<EmailTemplatePaginationResponseDto> {
    try {
      // Convert publicId to languageId if provided, otherwise use default language fallback
      let resolvedLanguageId = queryDto.languageId;

      if (queryDto.publicId) {
        const language = await this.getLanguageByPublicId(queryDto.publicId);
        if (!language) {
          throw new EmailTemplateLanguageException(queryDto.publicId);
        }
        resolvedLanguageId = language.id;
      } else if (!queryDto.languageId) {
        // If neither languageId nor publicId is provided, use default language with fallback
        const defaultLanguage = await this.languagesRepository.findDefault();
        if (defaultLanguage) {
          resolvedLanguageId = defaultLanguage.id;

          // Check if default language has any templates
          const defaultLanguageHasTemplates =
            await this.emailTemplateRepository.exists({
              languageId: defaultLanguage.id,
            });

          if (!defaultLanguageHasTemplates) {
            // Find first language that has templates
            const allActiveLanguages = await this.languagesRepository.findMany({
              status: true,
            });

            for (const language of allActiveLanguages) {
              const hasTemplates = await this.emailTemplateRepository.exists({
                languageId: language.id,
              });

              if (hasTemplates) {
                resolvedLanguageId = language.id;
                break;
              }
            }
          }
        } else {
          this.logger.warn('No default language found');
        }
      }

      // Debug logging for troubleshooting empty array issue

      // Build filter for repository
      const filter = {
        task: queryDto.task,
        senderEmail: queryDto.senderEmail,
        senderName: queryDto.senderName,
        subject: queryDto.subject,
        // Only filter by languageId if user explicitly provided one
        ...(queryDto.languageId || queryDto.publicId
          ? { languageId: resolvedLanguageId }
          : {}),
        status: queryDto.status,
      };

      // Check if we need to use search functionality
      let result;
      if (queryDto.search && queryDto.search.trim()) {
        // Use search functionality when search term is provided
        const searchTerm = queryDto.search.trim();
        result = await this.emailTemplateRepository.findWithPaginationAndSearch(
          searchTerm,
          {
            senderEmail: queryDto.senderEmail,
            // Only filter by languageId if user explicitly provided one
            ...(queryDto.languageId || queryDto.publicId
              ? { languageId: resolvedLanguageId }
              : {}),
            status: queryDto.status,
          },
          {
            page: queryDto.page || 1,
            limit: queryDto.limit || 10,
            sort: {
              [queryDto.sortBy || 'createdAt']:
                queryDto.sortOrder === 'asc' ? 1 : -1,
            },
          }
        );
      } else {
        // Use regular pagination when no search term
        result = await this.emailTemplateRepository.findWithPagination(filter, {
          page: queryDto.page || 1,
          limit: queryDto.limit || 10,
          sort: {
            [queryDto.sortBy || 'createdAt']:
              queryDto.sortOrder === 'asc' ? 1 : -1,
          },
        });
      }

      // Transform results
      const transformedData = result.items.map((template: EmailTemplate) =>
        this.transformToResponseDto(template)
      );

      return {
        emailTemplates: transformedData,
        total: result.pagination.totalCount,
        page: result.pagination.currentPage,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to fetch admin email templates:', error);
      throw error;
    }
  }

  /**
   * Get email template by public ID with language
   */
  async getEmailTemplateByPublicId(
    publicId: string,
    options: EmailTemplateServiceOptions = { useCache: true }
  ): Promise<EmailTemplateResponseDto> {
    try {
      const { useCache = true } = options;
      const cacheKey = this.generateCacheKey({ publicId });

      // Try to get from cache first
      if (useCache) {
        const cached = this.getFromCache<EmailTemplateResponseDto>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const emailTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(publicId);
      if (!emailTemplate) {
        throw new EmailTemplateNotFoundException(publicId, 'publicId');
      }

      const result = this.transformToResponseDto(emailTemplate);

      // Cache the result
      if (useCache) {
        this.setToCache(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch email template by public ID ${publicId}:`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get email template by task and language
   */
  async getEmailTemplateByTaskAndLanguage(
    task: string,
    languageId?: string,
    options: EmailTemplateServiceOptions = { useCache: true }
  ): Promise<EmailTemplateResponseDto | null> {
    try {
      const { useCache = true } = options;
      const resolvedLanguageId = await this.resolveLanguageId(languageId);
      const cacheKey = this.generateCacheKey({
        task,
        languageId: resolvedLanguageId,
      });

      // Try to get from cache first
      if (useCache) {
        const cached = this.getFromCache<EmailTemplateResponseDto>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const emailTemplate =
        await this.emailTemplateRepository.findByTaskAndLanguage(
          task,
          resolvedLanguageId
        );

      if (!emailTemplate) {
        return null;
      }

      // Get the populated version for full response
      const populatedTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(
          emailTemplate.publicId
        );

      if (!populatedTemplate) {
        return null;
      }

      const result = this.transformToResponseDto(populatedTemplate);

      // Cache the result
      if (useCache) {
        this.setToCache(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch email template by task ${task} and language ${languageId}:`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Create email template
   */
  async createEmailTemplate(
    createDto: CreateEmailTemplateDto
  ): Promise<EmailTemplateResponseDto> {
    try {
      // Validate email template data
      this.validateEmailTemplateData(createDto);

      // Validate task format
      this.validateTaskField(createDto.task);

      // Resolve and validate language
      const resolvedLanguageId = await this.resolveLanguageId(
        createDto.languageId
      );

      // Check if task already exists for this language
      const taskExists =
        await this.emailTemplateRepository.existsByTaskAndLanguage(
          createDto.task,
          resolvedLanguageId
        );
      if (taskExists) {
        throw new EmailTemplateTaskAlreadyExistsException(
          createDto.task,
          resolvedLanguageId
        );
      }

      // Create email template
      const createData = {
        ...createDto,
        languageId: resolvedLanguageId,
      };

      const created = await this.emailTemplateRepository.insert(createData);

      // Clear cache
      this.clearRelatedCache(resolvedLanguageId, createDto.task);

      // Get the populated version for response
      const populatedTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(
          created.publicId
        );
      if (!populatedTemplate) {
        throw new EmailTemplateCreationException(
          'Failed to retrieve created email template'
        );
      }

      return this.transformToResponseDto(populatedTemplate);
    } catch (error) {
      this.logger.error('Failed to create email template:', error);
      throw error;
    }
  }

  /**
   * Create email templates for all active languages
   */
  async createEmailTemplatesForAllLanguages(
    createDto: CreateEmailTemplateForAllLanguagesDto
  ): Promise<EmailTemplateResponseDto> {
    try {
      // Validate email template data
      this.validateEmailTemplateData(createDto);

      // Validate task format
      this.validateTaskField(createDto.task);

      // Get all active languages
      const allLanguages =
        await this.emailTemplateRepository.getAllActiveLanguageIds();
      if (!allLanguages || allLanguages.length === 0) {
        throw new EmailTemplateDefaultLanguageException();
      }

      // Create email templates for all languages
      const createdTemplates =
        await this.emailTemplateRepository.createForAllActiveLanguages(
          createDto
        );

      if (createdTemplates.length === 0) {
        throw new EmailTemplateCreationException(
          'No email templates were created. All languages may already have templates with this task.'
        );
      }

      // Clear cache for all languages
      this.clearAllCache();

      // Return the template for the default language
      const defaultLanguageId =
        await this.emailTemplateRepository.getDefaultLanguageId();
      const defaultTemplate =
        createdTemplates.find(
          (template) => template.languageId === defaultLanguageId
        ) || createdTemplates[0];

      // Get the populated version for response
      const populatedTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(
          defaultTemplate.publicId
        );
      if (!populatedTemplate) {
        throw new EmailTemplateCreationException(
          'Failed to retrieve created email template'
        );
      }

      return this.transformToResponseDto(populatedTemplate);
    } catch (error) {
      this.logger.error(
        'Failed to create email templates for all languages:',
        error
      );
      throw error;
    }
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    publicId: string,
    updateDto: UpdateEmailTemplateDto
  ): Promise<EmailTemplateResponseDto> {
    try {
      // Find existing email template
      const existingTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(publicId);
      if (!existingTemplate) {
        throw new EmailTemplateNotFoundException(publicId, 'publicId');
      }

      // Validate update data
      this.validateEmailTemplateData(updateDto);

      // Note: task and languageId are immutable and excluded from UpdateEmailTemplateDto

      // Update email template
      await this.emailTemplateRepository.updateByPublicId(publicId, updateDto);

      // Clear related cache
      const languageId =
        typeof existingTemplate.languageId === 'string'
          ? existingTemplate.languageId
          : typeof existingTemplate.languageId === 'object' &&
              existingTemplate.languageId &&
              'publicId' in existingTemplate.languageId
            ? (existingTemplate.languageId as { publicId: string }).publicId
            : String(existingTemplate.languageId);
      this.clearRelatedCache(languageId, existingTemplate.task, publicId);

      // Get the updated template with language info
      const populatedTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(publicId);
      if (!populatedTemplate) {
        throw new EmailTemplateUpdateException(
          publicId,
          'Failed to retrieve updated email template'
        );
      }

      return this.transformToResponseDto(populatedTemplate);
    } catch (error) {
      this.logger.error(`Failed to update email template ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Delete email template and all variants with same task across all languages
   */
  async deleteEmailTemplate(publicId: string): Promise<number> {
    try {
      // Get template info for task identification
      const existingTemplate =
        await this.emailTemplateRepository.findByPublicIdWithLanguage(publicId);
      if (!existingTemplate) {
        throw new EmailTemplateNotFoundException(publicId, 'publicId');
      }

      const task = existingTemplate.task;

      // Delete all email templates with the same task across all languages
      const deletedCount =
        await this.emailTemplateRepository.deleteByTask(task);

      if (deletedCount === 0) {
        throw new EmailTemplateDeletionException(
          publicId,
          'Failed to delete email templates'
        );
      }

      // Clear all cache since we deleted templates across multiple languages
      this.clearAllCache();

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete email template ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update email template status for ALL language variants
   * This method finds templates by publicIds, extracts their tasks,
   * and updates ALL language variants of those tasks
   */
  async bulkUpdateStatus(
    bulkUpdateDto: BulkUpdateEmailTemplateDto
  ): Promise<number> {
    try {
      // Step 1: Get email templates by publicIds to extract task names
      const templates = [];
      for (const publicId of bulkUpdateDto.publicIds) {
        const template = await this.emailTemplateRepository.getDetail({
          publicId,
        });
        if (template) {
          templates.push(template);
        } else {
          this.logger.warn(
            `Email template with publicId ${publicId} not found, skipping`
          );
        }
      }

      if (templates.length === 0) {
        this.logger.warn(
          'No valid email templates found for provided publicIds'
        );
        return 0;
      }

      // Step 2: Extract unique task names
      const uniqueTasks = [
        ...new Set(templates.map((template) => template.task)),
      ];

      // Step 3: Update ALL language variants for each task
      let totalUpdatedCount = 0;
      for (const task of uniqueTasks) {
        const updatedCount =
          await this.emailTemplateRepository.bulkUpdateStatusByTask(
            task,
            bulkUpdateDto.status
          );
        totalUpdatedCount += updatedCount;
      }

      // Clear all cache since we updated templates across multiple languages
      this.clearAllCache();

      return totalUpdatedCount;
    } catch (error) {
      this.logger.error('Failed to bulk update email template status:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    size: number;
  } {
    try {
      const stats = this.cache.getStats();
      return {
        keys: this.cache.keys().length,
        hits: stats.hits,
        misses: stats.misses,
        size: stats.ksize,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      throw new EmailTemplateCacheException(
        'get stats',
        (error as Error).message
      );
    }
  }

  /**
   * Clear cache by pattern
   */
  clearCache(pattern?: string): boolean {
    try {
      if (pattern) {
        const keys = this.cache.keys().filter((key) => key.includes(pattern));
        this.cache.del(keys);
        return keys.length > 0;
      } else {
        this.cache.flushAll();
        return true;
      }
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw new EmailTemplateCacheException(
        'clear cache',
        (error as Error).message
      );
    }
  }

  // Private helper methods

  /**
   * Resolve language ID to primary key
   */
  private async resolveLanguageId(languageId?: string): Promise<string> {
    if (!languageId) {
      const defaultLanguage = await this.languagesRepository.findDefault();
      if (!defaultLanguage) {
        throw new BadRequestException('No default language found');
      }
      return defaultLanguage.id;
    }

    // Try to find by publicId first
    const languageByPublicId =
      await this.languagesRepository.findByPublicId(languageId);
    if (languageByPublicId && languageByPublicId.status) {
      return languageByPublicId.id;
    }

    // Try to find by primary key
    const languageById = await this.languagesRepository.findById(languageId);
    if (languageById && languageById.status) {
      return languageById.id;
    }

    throw new BadRequestException(
      `Invalid languageId: ${languageId}. Language not found or inactive.`
    );
  }

  /**
   * Get language by code
   */
  private async getLanguageByCode(
    languageCode: string
  ): Promise<{ id: string; folder: string } | null> {
    return this.emailTemplateRepository.getLanguageByCode(languageCode);
  }

  /**
   * Get language by publicId
   */
  private async getLanguageByPublicId(
    publicId: string
  ): Promise<{ id: string; folder: string } | null> {
    const language = await this.languagesRepository.findByPublicId(publicId);
    if (!language) {
      return null;
    }
    return {
      id: language.id,
      folder: language.folder,
    };
  }

  /**
   * Get default language
   */
  private async getDefaultLanguage(): Promise<{ id: string; folder: string }> {
    const defaultLanguageId =
      await this.emailTemplateRepository.getDefaultLanguageId();
    return { id: defaultLanguageId, folder: 'en' };
  }

  /**
   * Validate email template data
   */
  private validateEmailTemplateData(
    data:
      | CreateEmailTemplateDto
      | UpdateEmailTemplateDto
      | CreateEmailTemplateForAllLanguagesDto
  ): void {
    // Validate sender email
    if (data.senderEmail && !this.isValidEmail(data.senderEmail)) {
      throw new EmailTemplateEmailValidationException(
        'senderEmail',
        data.senderEmail
      );
    }

    // Validate reply email
    if (data.replyEmail && !this.isValidEmail(data.replyEmail)) {
      throw new EmailTemplateEmailValidationException(
        'replyEmail',
        data.replyEmail
      );
    }

    // Validate sender name
    if (
      data.senderName &&
      (data.senderName.length < 1 || data.senderName.length > 200)
    ) {
      throw new InvalidEmailTemplateDataException(
        'senderName',
        data.senderName,
        'Must be between 1 and 200 characters'
      );
    }

    // Validate subject
    if (data.subject) {
      if (data.subject.length < 1 || data.subject.length > 500) {
        throw new EmailTemplateSubjectException(
          data.subject,
          'Must be between 1 and 500 characters'
        );
      }
    }

    // Validate message
    if (data.message && data.message.length < 1) {
      throw new EmailTemplateContentException(
        'message',
        data.message,
        'Message cannot be empty'
      );
    }
  }

  /**
   * Validate task field
   */
  private validateTaskField(task: string): void {
    if (!task || task.length < 1 || task.length > 100) {
      throw new EmailTemplateTaskValidationException(
        task,
        'Task must be between 1 and 100 characters'
      );
    }

    // Task should be alphanumeric with underscores and hyphens only
    const taskPattern = /^[a-zA-Z0-9_-]+$/;
    if (!taskPattern.test(task)) {
      throw new EmailTemplateTaskValidationException(
        task,
        'Task must contain only alphanumeric characters, underscores, and hyphens'
      );
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Transform entity to response DTO
   */
  private transformToResponseDto(
    emailTemplate: EmailTemplateWithLanguage | EmailTemplate
  ): EmailTemplateResponseDto {
    return {
      id: emailTemplate.id,
      publicId: emailTemplate.publicId,
      languageId: emailTemplate.languageId,
      language:
        'language' in emailTemplate && emailTemplate.language
          ? {
              publicId: emailTemplate.language.publicId,
              name: emailTemplate.language.name,
              folder: emailTemplate.language.folder,
              iso2: emailTemplate.language.iso2,
              iso3: emailTemplate.language.iso3,
              direction: emailTemplate.language.direction,
              flagImage: emailTemplate.language.flagImage,
            }
          : undefined,
      task: emailTemplate.task,
      senderEmail: emailTemplate.senderEmail,
      replyEmail: emailTemplate.replyEmail,
      senderName: emailTemplate.senderName,
      subject: emailTemplate.subject,
      message: emailTemplate.message,
      status: emailTemplate.status,
      createdAt: emailTemplate.createdAt,
      updatedAt: emailTemplate.updatedAt,
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(params: CacheKey): string {
    const parts = ['email_template'];

    if (params.languageId) parts.push(`lang_${params.languageId}`);
    if (params.task) parts.push(`task_${params.task}`);
    if (params.publicId) parts.push(`id_${params.publicId}`);
    if (params.isPublic !== undefined) parts.push(`public_${params.isPublic}`);

    return parts.join(':');
  }

  /**
   * Get item from cache
   */
  private getFromCache<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      this.logger.error(`Failed to get from cache: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Set item to cache
   */
  private setToCache<T>(key: string, value: T, ttl?: number): boolean {
    try {
      return this.cache.set(key, value, ttl || 300); // 5 minutes default
    } catch (error) {
      this.logger.error(`Failed to set cache: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear related cache entries
   */
  private clearRelatedCache(
    languageId: string,
    task?: string,
    publicId?: string
  ): void {
    try {
      const keys = this.cache.keys();
      const keysToDelete = keys.filter((key) => {
        return (
          key.includes(`lang_${languageId}`) ||
          (task && key.includes(`task_${task}`)) ||
          (publicId && key.includes(`id_${publicId}`))
        );
      });

      if (keysToDelete.length > 0) {
        this.cache.del(keysToDelete);
      }
    } catch (error) {
      this.logger.error('Failed to clear related cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  private clearAllCache(): void {
    try {
      this.cache.flushAll();
    } catch (error) {
      this.logger.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Get all email templates for admin with pagination
   */
  async getAllEmailTemplatesForAdmin(
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = true,
    languageId?: string
  ) {
    try {
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Resolve languageId to primary key - use default if none provided
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      const result = await this.emailTemplateRepository.findAllWithPagination(
        page,
        limit,
        includeInactive,
        resolvedLanguageId
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch email templates for admin:', error);
      throw error;
    }
  }
}
