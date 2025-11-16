import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  RevenueSubscription,
  RevenueSubscriptionLanguage,
  RevenueSubscriptionWithLanguage,
  CreateRevenueSubscriptionDto,
} from '../../entities/revenue-subscription.entity';

export interface IRevenueSubscriptionRepository
  extends IRepository<RevenueSubscription> {
  /**
   * Find revenue subscriptions for public display (active only) with language content
   * @param languageId Language ID to filter content
   * @returns Promise<RevenueSubscriptionWithLanguage[]>
   */
  findForPublic(languageId: string): Promise<RevenueSubscriptionWithLanguage[]>;

  /**
   * Find revenue subscriptions with pagination and language content for admin
   * @param page Page number
   * @param limit Items per page
   * @param languageId Language ID for content
   * @param subscriptionType Filter by subscription type
   * @param includeInactive Whether to include inactive subscriptions
   * @returns Promise with paginated data
   */
  findWithPaginationAndLanguage(
    page: number,
    limit: number,
    languageId: string,
    subscriptionType?: 'INVESTOR' | 'SPONSOR',
    includeInactive?: boolean
  ): Promise<{
    data: RevenueSubscriptionWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find revenue subscription by public ID with language content
   * @param publicId Revenue subscription public ID
   * @param languageId Language ID for content
   * @returns Promise<RevenueSubscriptionWithLanguage | null>
   */
  findByPublicIdWithLanguage(
    publicId: string,
    languageId: string
  ): Promise<RevenueSubscriptionWithLanguage | null>;

  /**
   * Create revenue subscription with multi-language content
   * @param createDto Revenue subscription data
   * @param languageIds Array of language IDs to create content in
   * @returns Promise<RevenueSubscription>
   */
  createWithMultiLanguageContent(
    createDto: CreateRevenueSubscriptionDto,
    languageIds: string[]
  ): Promise<RevenueSubscription>;

  /**
   * Update revenue subscription by public ID
   * @param publicId Revenue subscription public ID
   * @param updateDto Data to update
   * @param languageId Language ID for content updates (optional)
   * @returns Promise<RevenueSubscription>
   */
  updateByPublicIdWithLanguage(
    publicId: string,
    updateDto: Partial<RevenueSubscription>,
    languageContents?: Array<{
      languageId: string;
      title: string;
      description: string;
    }>
  ): Promise<RevenueSubscription>;

  /**
   * Delete revenue subscription by public ID (only if useCount is 0)
   * @param publicId Revenue subscription public ID
   * @returns Promise<boolean>
   */
  deleteByPublicId(publicId: string): Promise<boolean>;

  /**
   * Increment use count for a revenue subscription
   * @param publicId Revenue subscription public ID
   * @returns Promise<void>
   */
  incrementUseCount(publicId: string): Promise<void>;

  /**
   * Decrement use count for a revenue subscription
   * @param publicId Revenue subscription public ID
   * @returns Promise<void>
   */
  decrementUseCount(publicId: string): Promise<void>;

  /**
   * Bulk update revenue subscriptions by public IDs
   * @param publicIds Array of public IDs
   * @param data Partial data to update
   * @returns Promise with count and updated items
   */
  bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<RevenueSubscription>
  ): Promise<{ count: number; updated: RevenueSubscription[] }>;

  /**
   * Bulk delete revenue subscriptions by public IDs (only if useCount is 0)
   * @param publicIds Array of public IDs
   * @returns Promise with count and deleted items
   */
  bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: RevenueSubscription[] }>;

  /**
   * Check if revenue subscription is in use (useCount > 0)
   * @param publicId Revenue subscription public ID
   * @returns Promise<boolean>
   */
  isInUse(publicId: string): Promise<boolean>;

  /**
   * Get default language ID
   * @returns Promise<string>
   */
  getDefaultLanguageId(): Promise<string>;

  /**
   * Get all active language IDs
   * @returns Promise<string[]>
   */
  getAllActiveLanguageIds(): Promise<string[]>;

  /**
   * Validate conditional fields based on subscription type
   * @param subscriptionType The subscription type
   * @param data The data to validate
   * @returns boolean
   */
  validateConditionalFields(
    subscriptionType: 'INVESTOR' | 'SPONSOR',
    data: Partial<CreateRevenueSubscriptionDto>
  ): boolean;
}

export interface IRevenueSubscriptionLanguageRepository
  extends IRepository<RevenueSubscriptionLanguage> {
  /**
   * Find language content by main subscription ID and language ID
   * @param mainSubscriptionId Main subscription ID
   * @param languageId Language ID
   * @returns Promise<RevenueSubscriptionLanguage | null>
   */
  findByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<RevenueSubscriptionLanguage | null>;

  /**
   * Find all language content for a main subscription
   * @param mainSubscriptionId Main subscription ID
   * @returns Promise<RevenueSubscriptionLanguage[]>
   */
  findByMainSubscriptionId(
    mainSubscriptionId: string
  ): Promise<RevenueSubscriptionLanguage[]>;

  /**
   * Create language content for multiple languages
   * @param mainSubscriptionId Main subscription ID
   * @param languageContents Array of language content
   * @returns Promise<RevenueSubscriptionLanguage[]>
   */
  createMultiLanguageContent(
    mainSubscriptionId: string,
    languageContents: Array<{
      languageId: string;
      title: string;
      description: string;
    }>
  ): Promise<RevenueSubscriptionLanguage[]>;

  /**
   * Update language content by main subscription ID and language ID
   * @param mainSubscriptionId Main subscription ID
   * @param languageId Language ID
   * @param updateDto Data to update
   * @returns Promise<RevenueSubscriptionLanguage>
   */
  updateByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string,
    updateDto: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage>;

  /**
   * Delete all language content for a main subscription
   * @param mainSubscriptionId Main subscription ID
   * @returns Promise<number> Number of deleted records
   */
  deleteByMainSubscriptionId(mainSubscriptionId: string): Promise<number>;

  /**
   * Delete language content by main subscription and language
   * @param mainSubscriptionId Main subscription ID
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  deleteByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<boolean>;
}

export const REVENUE_SUBSCRIPTION_REPOSITORY =
  'REVENUE_SUBSCRIPTION_REPOSITORY';
export const REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY =
  'REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY';
