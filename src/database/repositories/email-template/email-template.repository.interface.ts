import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  EmailTemplate,
  EmailTemplateWithLanguage,
} from '../../entities/email-template.entity';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  CreateEmailTemplateForAllLanguagesDto,
} from '../../../modules/admin-modules/email-templates/dto/email-template.dto';

export interface IEmailTemplateRepository extends IRepository<EmailTemplate> {
  /**
   * Find email template by language for frontend (public endpoint)
   * @param languageId Language ID to find email template for
   * @returns Promise<EmailTemplateWithLanguage | null>
   */
  findByLanguageId(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null>;

  /**
   * Find email template by language with language populated (admin endpoint)
   * @param languageId Language ID to find email template for
   * @returns Promise<EmailTemplateWithLanguage | null>
   */
  findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null>;

  /**
   * Find email template by public ID with language populated
   * @param publicId Email template public ID
   * @returns Promise<EmailTemplateWithLanguage | null>
   */
  findByPublicIdWithLanguage(
    publicId: string
  ): Promise<EmailTemplateWithLanguage | null>;

  /**
   * Find email template by task and language
   * @param task Email template task (e.g., "welcome_email", "password_reset")
   * @param languageId Language ID
   * @returns Promise<EmailTemplate | null>
   */
  findByTaskAndLanguage(
    task: string,
    languageId: string
  ): Promise<EmailTemplate | null>;

  /**
   * Create or update email template for a specific language
   * @param createDto Email template data
   * @returns Promise<EmailTemplate>
   */
  createOrUpdateByLanguageId(
    createDto: CreateEmailTemplateDto
  ): Promise<EmailTemplate>;

  /**
   * Update email template by public ID
   * @param publicId Email template public ID
   * @param updateDto Data to update
   * @returns Promise<EmailTemplate>
   */
  updateByPublicId(
    publicId: string,
    updateDto: UpdateEmailTemplateDto
  ): Promise<EmailTemplate>;

  /**
   * Delete email template by public ID
   * @param publicId Email template public ID
   * @returns Promise<boolean>
   */
  deleteByPublicId(publicId: string): Promise<boolean>;

  /**
   * Delete all email templates by task across all languages
   * @param task Email template task (e.g., "welcome_email", "password_reset")
   * @returns Promise<number> Number of deleted templates
   */
  deleteByTask(task: string): Promise<number>;

  /**
   * Find email templates with pagination by language code
   * @param languageCode Language code (e.g., 'en', 'es')
   * @param page Page number
   * @param limit Items per page
   * @returns Promise with pagination data
   */
  findWithPaginationAndLanguage(
    languageCode: string,
    page: number,
    limit: number
  ): Promise<{
    data: EmailTemplate[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find email templates with pagination and search functionality
   * @param searchTerm Search term to look for in task, subject, and senderName
   * @param filter Additional filters
   * @param options Pagination options
   * @returns Promise with paginated search results
   */
  findWithPaginationAndSearch(
    searchTerm: string,
    filter: Partial<EmailTemplate>,
    options: {
      page: number;
      limit: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<{
    items: EmailTemplate[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;

  /**
   * Create email templates for all active languages
   * @param createDto Email template data (without languageId)
   * @returns Promise<EmailTemplate[]>
   */
  createForAllActiveLanguages(
    createDto: CreateEmailTemplateForAllLanguagesDto
  ): Promise<EmailTemplate[]>;

  /**
   * Bulk update email template status by public IDs
   * @param publicIds Array of email template public IDs
   * @param status New status value
   * @returns Promise<number> Number of affected records
   */
  bulkUpdateStatus(publicIds: string[], status: boolean): Promise<number>;

  /**
   * Bulk update email template status by task across all languages
   * @param task Email template task (e.g., "welcome_email", "password_reset")
   * @param status New status value
   * @returns Promise<number> Number of affected records
   */
  bulkUpdateStatusByTask(task: string, status: boolean): Promise<number>;

  /**
   * Get all active language IDs
   * @returns Promise<string[]>
   */
  getAllActiveLanguageIds(): Promise<string[]>;

  /**
   * Get default language ID
   * @returns Promise<string>
   */
  getDefaultLanguageId(): Promise<string>;

  /**
   * Get language details by code (iso2)
   * @param languageCode Language code (e.g., 'en', 'es')
   * @returns Promise<{id: string, folder: string} | null>
   */
  getLanguageByCode(
    languageCode: string
  ): Promise<{ id: string; folder: string } | null>;

  /**
   * Check if email template exists for language
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  existsByLanguageId(languageId: string): Promise<boolean>;

  /**
   * Check if email template exists for specific task and language
   * @param task Email template task
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  existsByTaskAndLanguage(task: string, languageId: string): Promise<boolean>;

  /**
   * Delete email template by language ID
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  deleteByLanguageId(languageId: string): Promise<boolean>;

  /**
   * Find all email templates by status with language populated
   * @param status Template status (true for active, false for inactive)
   * @param languageId Optional language ID filter
   * @returns Promise<EmailTemplateWithLanguage[]>
   */
  findByStatusWithLanguage(
    status: boolean,
    languageId?: string
  ): Promise<EmailTemplateWithLanguage[]>;

  /**
   * Find all email templates with pagination (admin endpoint)
   * @param page Page number
   * @param limit Items per page
   * @param includeInactive Whether to include inactive templates
   * @param languageId Optional language ID filter (resolved primary key)
   * @returns Promise with pagination data matching dropdown pattern
   */
  findAllWithPagination(
    page: number,
    limit: number,
    includeInactive: boolean,
    languageId?: string
  ): Promise<{
    data: EmailTemplateWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;
}

export const EMAIL_TEMPLATE_REPOSITORY = 'EMAIL_TEMPLATE_REPOSITORY';
