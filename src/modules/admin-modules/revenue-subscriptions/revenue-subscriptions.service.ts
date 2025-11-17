import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { IRevenueSubscriptionRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription.repository.interface';
import { IRevenueSubscriptionLanguageRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription.repository.interface';
import { ILanguagesRepository } from '../../../database/repositories/languages/languages.repository.interface';
import {
  REVENUE_SUBSCRIPTION_REPOSITORY,
  REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY,
} from '../../../database/repositories/revenue-subscription/revenue-subscription.repository.interface';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { RevenueSubscriptionWithLanguage } from '../../../database/entities/revenue-subscription.entity';
import {
  CreateRevenueSubscriptionDto,
  UpdateRevenueSubscriptionDto,
  RevenueSubscriptionQueryDto,
  BulkUpdateRevenueSubscriptionDto,
  BulkDeleteRevenueSubscriptionDto,
} from './dto/revenue-subscription.dto';
import {
  RevenueSubscriptionNotFoundException,
  RevenueSubscriptionInUseException,
  InvalidSubscriptionTypeException,
  RevenueSubscriptionAlreadyExistsException,
  RevenueSubscriptionOperationFailedException,
  BulkRevenueSubscriptionOperationException,
  InvalidAmountException,
  InvalidRefundDaysException,
  InvalidCancelDaysException,
  RevenueSubscriptionValidationException,
} from './exceptions/revenue-subscription.exceptions';

@Injectable()
export class RevenueSubscriptionsService {
  constructor(
    @Inject(REVENUE_SUBSCRIPTION_REPOSITORY)
    private readonly revenueSubscriptionRepository: IRevenueSubscriptionRepository,
    @Inject(REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY)
    private readonly revenueSubscriptionLanguageRepository: IRevenueSubscriptionLanguageRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languageRepository: ILanguagesRepository,
    private readonly i18nResponse: I18nResponseService
  ) {}

  // Public endpoint - Get active revenue subscriptions for frontend
  async getActiveRevenueSubscriptions(
    languageId?: string
  ): Promise<RevenueSubscriptionWithLanguage[]> {
    try {
      // Resolve the language ID from code/publicId to ObjectId
      const resolvedLanguageId = await this.resolveLanguageId(languageId);
      return await this.revenueSubscriptionRepository.findForPublic(
        resolvedLanguageId
      );
    } catch (error) {
      if (error instanceof RevenueSubscriptionValidationException) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'retrieval',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Get all revenue subscriptions with pagination
  async getAllRevenueSubscriptions(
    queryDto: RevenueSubscriptionQueryDto,
    languageId?: string
  ): Promise<{
    data: RevenueSubscriptionWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10, subscriptionType } = queryDto;

      // Extract status for includeInactive flag
      const includeInactive = queryDto.includeInactive || false;

      // Resolve the language ID from publicId to ObjectId
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      const { data, total } =
        await this.revenueSubscriptionRepository.findWithPaginationAndLanguage(
          page,
          limit,
          resolvedLanguageId,
          subscriptionType,
          includeInactive
        );

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof RevenueSubscriptionValidationException) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'retrieval',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Get single revenue subscription
  async getRevenueSubscriptionById(
    publicId: string,
    languageId?: string
  ): Promise<RevenueSubscriptionWithLanguage> {
    // Use common response builder function
    return await this.buildRevenueSubscriptionResponse(publicId, languageId);
  }

  // Admin endpoint - Create new revenue subscription
  async createRevenueSubscription(
    createDto: CreateRevenueSubscriptionDto
  ): Promise<RevenueSubscriptionWithLanguage> {
    try {
      // Validate subscription type
      if (!['INVESTOR', 'SPONSOR'].includes(createDto.subscriptionType)) {
        throw new InvalidSubscriptionTypeException(createDto.subscriptionType);
      }

      // Validate conditional fields
      this.validateConditionalFields(createDto);

      // Validate amounts
      if (createDto.amount <= 0) {
        throw new InvalidAmountException(createDto.amount);
      }

      // Validate refund days if allowRefund is true
      if (
        createDto.allowRefund &&
        (!createDto.allowRefundDays || createDto.allowRefundDays <= 0)
      ) {
        throw new InvalidRefundDaysException(createDto.allowRefundDays);
      }

      // Validate cancel days if allowCancel is true
      if (
        createDto.allowCancel &&
        (!createDto.allowCancelDays || createDto.allowCancelDays <= 0)
      ) {
        throw new InvalidCancelDaysException(createDto.allowCancelDays);
      }

      // Note: Unique constraints will handle duplicate title checking

      // Get ALL active language IDs for content creation
      const allActiveLanguages = await this.languageRepository.findMany({
        status: true,
      });
      const allActiveLanguageIds = allActiveLanguages.map((lang) => lang.id);

      if (allActiveLanguageIds.length === 0) {
        throw new RevenueSubscriptionValidationException(
          'No active languages found in the system'
        );
      }

      // Create main subscription with content for ALL active languages
      const createdSubscription =
        await this.revenueSubscriptionRepository.createWithMultiLanguageContent(
          createDto,
          allActiveLanguageIds
        );

      // Use common response builder function to get the created subscription with language content
      return await this.buildRevenueSubscriptionResponse(
        createdSubscription.publicId,
        createDto.languageId
      );
    } catch (error) {
      if (
        error instanceof InvalidSubscriptionTypeException ||
        error instanceof RevenueSubscriptionAlreadyExistsException ||
        error instanceof InvalidAmountException ||
        error instanceof InvalidRefundDaysException ||
        error instanceof InvalidCancelDaysException ||
        error instanceof RevenueSubscriptionValidationException
      ) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'creation',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Update revenue subscription
  async updateRevenueSubscription(
    publicId: string,
    updateDto: UpdateRevenueSubscriptionDto,
    _languageContents?: Array<{
      languageId: string;
      title: string;
      description: string;
    }>,
    languageId?: string
  ): Promise<RevenueSubscriptionWithLanguage> {
    try {
      // Check if subscription exists
      const existing = await this.revenueSubscriptionRepository.getDetail({
        publicId,
      });
      if (!existing) {
        throw new RevenueSubscriptionNotFoundException(publicId);
      }

      // Validate subscription type if provided
      if (
        updateDto.subscriptionType &&
        !['INVESTOR', 'SPONSOR'].includes(updateDto.subscriptionType)
      ) {
        throw new InvalidSubscriptionTypeException(updateDto.subscriptionType);
      }

      // Validate conditional fields for update
      this.validateConditionalFieldsForUpdate(updateDto);

      // Validate amounts
      if (updateDto.amount !== undefined && updateDto.amount <= 0) {
        throw new InvalidAmountException(updateDto.amount);
      }

      // Validate refund days
      const finalAllowRefund =
        updateDto.allowRefund !== undefined
          ? updateDto.allowRefund
          : existing.allowRefund;
      const finalRefundDays =
        updateDto.allowRefundDays !== undefined
          ? updateDto.allowRefundDays
          : existing.allowRefundDays;
      if (finalAllowRefund && (!finalRefundDays || finalRefundDays <= 0)) {
        throw new InvalidRefundDaysException(finalRefundDays);
      }

      // Validate cancel days
      const finalAllowCancel =
        updateDto.allowCancel !== undefined
          ? updateDto.allowCancel
          : existing.allowCancel;
      const finalCancelDays =
        updateDto.allowCancelDays !== undefined
          ? updateDto.allowCancelDays
          : existing.allowCancelDays;
      if (finalAllowCancel && (!finalCancelDays || finalCancelDays <= 0)) {
        throw new InvalidCancelDaysException(finalCancelDays);
      }

      // Resolve the language ID from publicId to ObjectId for response
      const targetLanguageId = await this.resolveLanguageId(
        updateDto.languageId || languageId
      );

      // Prepare language contents for repository if title/description provided
      const languageContentsForUpdate =
        updateDto.title || updateDto.description
          ? [
              {
                languageId: targetLanguageId,
                title: updateDto.title || '',
                description: updateDto.description || '',
              },
            ]
          : undefined;

      // Update subscription
      await this.revenueSubscriptionRepository.updateByPublicIdWithLanguage(
        publicId,
        updateDto,
        languageContentsForUpdate
      );

      // Use common response builder function to get updated subscription
      return await this.buildRevenueSubscriptionResponse(
        publicId,
        updateDto.languageId || languageId
      );
    } catch (error) {
      if (
        error instanceof RevenueSubscriptionNotFoundException ||
        error instanceof InvalidSubscriptionTypeException ||
        error instanceof RevenueSubscriptionAlreadyExistsException ||
        error instanceof InvalidAmountException ||
        error instanceof InvalidRefundDaysException ||
        error instanceof InvalidCancelDaysException ||
        error instanceof RevenueSubscriptionValidationException
      ) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'update',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Delete revenue subscription
  async deleteRevenueSubscription(publicId: string): Promise<void> {
    try {
      const subscription = await this.revenueSubscriptionRepository.getDetail({
        publicId,
      });
      if (!subscription) {
        throw new RevenueSubscriptionNotFoundException(publicId);
      }

      if (subscription.useCount > 0) {
        throw new RevenueSubscriptionInUseException(
          publicId,
          subscription.useCount
        );
      }

      await this.revenueSubscriptionRepository.deleteByPublicId(publicId);
    } catch (error) {
      if (
        error instanceof RevenueSubscriptionNotFoundException ||
        error instanceof RevenueSubscriptionInUseException
      ) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'deletion',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Bulk update revenue subscriptions
  async bulkUpdateRevenueSubscriptions(
    bulkUpdateDto: BulkUpdateRevenueSubscriptionDto
  ): Promise<{ updated: number; failed: string[] }> {
    try {
      const { publicIds, status } = bulkUpdateDto;
      const results =
        await this.revenueSubscriptionRepository.bulkUpdateByPublicIds(
          publicIds,
          { status }
        );

      return {
        updated: results.count,
        failed: [],
      };
    } catch (error) {
      throw new BulkRevenueSubscriptionOperationException(
        'update',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Admin endpoint - Bulk delete revenue subscriptions
  async bulkDeleteRevenueSubscriptions(
    bulkDeleteDto: BulkDeleteRevenueSubscriptionDto
  ): Promise<{ deleted: number; failed: string[] }> {
    try {
      const { publicIds } = bulkDeleteDto;

      // Check use count for all subscriptions
      const subscriptions: { publicId: string; useCount: number }[] = [];
      for (const publicId of publicIds) {
        const isInUse =
          await this.revenueSubscriptionRepository.isInUse(publicId);
        if (isInUse) {
          subscriptions.push({ publicId, useCount: 1 });
        }
      }
      const inUse = subscriptions.filter(
        (sub: { useCount: number }) => sub.useCount > 0
      );

      if (inUse.length > 0) {
        const inUseIds = inUse.map((sub: { publicId: string }) => sub.publicId);
        throw new BulkRevenueSubscriptionOperationException(
          'delete',
          `Cannot delete subscriptions in use: ${inUseIds.join(', ')}`
        );
      }

      const results =
        await this.revenueSubscriptionRepository.bulkDeleteByPublicIds(
          publicIds
        );

      return {
        deleted: results.count,
        failed: [],
      };
    } catch (error) {
      if (error instanceof BulkRevenueSubscriptionOperationException) {
        throw error;
      }
      throw new BulkRevenueSubscriptionOperationException(
        'delete',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Helper method to validate conditional fields
  private validateConditionalFields(
    createDto: CreateRevenueSubscriptionDto
  ): void {
    // Validate basic amount
    if (createDto.amount !== undefined && createDto.amount <= 0) {
      throw new InvalidAmountException(createDto.amount);
    }

    // Validate refund days if refund is enabled
    if (
      createDto.allowRefund === true &&
      createDto.allowRefundDays !== undefined &&
      createDto.allowRefundDays <= 0
    ) {
      throw new InvalidRefundDaysException(createDto.allowRefundDays);
    }

    // Validate cancel days if cancel is enabled
    if (
      createDto.allowCancel === true &&
      createDto.allowCancelDays !== undefined &&
      createDto.allowCancelDays <= 0
    ) {
      throw new InvalidCancelDaysException(createDto.allowCancelDays);
    }

    // Validate optional investment limits if provided
    if (
      createDto.maxInvestmentAllowed !== undefined &&
      createDto.maxInvestmentAllowed <= 0
    ) {
      throw new InvalidAmountException(createDto.maxInvestmentAllowed);
    }

    if (
      createDto.maxProjectAllowed !== undefined &&
      createDto.maxProjectAllowed <= 0
    ) {
      throw new InvalidAmountException(createDto.maxProjectAllowed);
    }

    if (
      createDto.maxProjectGoalLimit !== undefined &&
      createDto.maxProjectGoalLimit <= 0
    ) {
      throw new InvalidAmountException(createDto.maxProjectGoalLimit);
    }
  }

  // Helper method to validate conditional fields for update
  private validateConditionalFieldsForUpdate(
    updateDto: UpdateRevenueSubscriptionDto
  ): void {
    // Validate basic amount if being updated
    if (updateDto.amount !== undefined && updateDto.amount <= 0) {
      throw new InvalidAmountException(updateDto.amount);
    }

    // Validate refund days if being updated
    if (
      updateDto.allowRefundDays !== undefined &&
      updateDto.allowRefundDays <= 0
    ) {
      throw new InvalidRefundDaysException(updateDto.allowRefundDays);
    }

    // Validate cancel days if being updated
    if (
      updateDto.allowCancelDays !== undefined &&
      updateDto.allowCancelDays <= 0
    ) {
      throw new InvalidCancelDaysException(updateDto.allowCancelDays);
    }

    // Validate optional investment limits if being updated
    if (
      updateDto.maxInvestmentAllowed !== undefined &&
      updateDto.maxInvestmentAllowed <= 0
    ) {
      throw new InvalidAmountException(updateDto.maxInvestmentAllowed);
    }

    if (
      updateDto.maxProjectAllowed !== undefined &&
      updateDto.maxProjectAllowed <= 0
    ) {
      throw new InvalidAmountException(updateDto.maxProjectAllowed);
    }

    if (
      updateDto.maxProjectGoalLimit !== undefined &&
      updateDto.maxProjectGoalLimit <= 0
    ) {
      throw new InvalidAmountException(updateDto.maxProjectGoalLimit);
    }
  }

  /**
   * Common response builder function to get revenue subscription with language content
   * Connects revenue_subscriptions, revenue_subscription_languages, and language modules
   * Handles language fallback to default language if requested language not found
   *
   * @param publicId - Revenue subscription public ID
   * @param languageId - Optional language identifier (code, publicId, or primary key)
   * @returns Promise<RevenueSubscriptionWithLanguage> The subscription with language content
   * @throws RevenueSubscriptionNotFoundException if subscription not found
   * @throws RevenueSubscriptionValidationException if language is invalid
   */
  async buildRevenueSubscriptionResponse(
    publicId: string,
    languageId?: string
  ): Promise<RevenueSubscriptionWithLanguage> {
    try {
      // Resolve the language ID from code/publicId to ObjectId
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get subscription with language content (with automatic fallback to default language)
      const subscriptionWithLanguage =
        await this.revenueSubscriptionRepository.findByPublicIdWithLanguage(
          publicId,
          resolvedLanguageId
        );

      if (!subscriptionWithLanguage) {
        throw new RevenueSubscriptionNotFoundException(publicId);
      }

      return subscriptionWithLanguage;
    } catch (error) {
      if (
        error instanceof RevenueSubscriptionNotFoundException ||
        error instanceof RevenueSubscriptionValidationException
      ) {
        throw error;
      }
      throw new RevenueSubscriptionOperationFailedException(
        'retrieval',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Common response builder function for multiple revenue subscriptions
   * Gets multiple subscriptions with language content using the same logic
   *
   * @param publicIds - Array of revenue subscription public IDs
   * @param languageId - Optional language identifier
   * @returns Promise<RevenueSubscriptionWithLanguage[]> Array of subscriptions with language content
   */
  async buildMultipleRevenueSubscriptionResponse(
    publicIds: string[],
    languageId?: string
  ): Promise<RevenueSubscriptionWithLanguage[]> {
    const subscriptions: RevenueSubscriptionWithLanguage[] = [];

    for (const publicId of publicIds) {
      try {
        const subscription = await this.buildRevenueSubscriptionResponse(
          publicId,
          languageId
        );
        subscriptions.push(subscription);
      } catch {
        // Skip subscriptions that can't be found or have errors
        // This allows partial success for bulk operations
        continue;
      }
    }

    return subscriptions;
  }

  /**
   * Resolve language ID to primary key
   * Priority order:
   * 1. No languageId provided -> default language
   * 2. Language publicId provided -> converts to primary key
   * 3. Language primary key provided -> validates and returns if valid
   * @param languageId - Optional language identifier (publicId or primary key)
   * @returns Promise<string> The language primary key (id/_id)
   * @throws BadRequestException if languageId is invalid
   */
  private async resolveLanguageId(languageId?: string): Promise<string> {
    if (!languageId) {
      // No languageId provided, use default language
      const defaultLanguage = await this.languageRepository.findDefault();
      if (!defaultLanguage) {
        throw new BadRequestException('No default language found');
      }
      return defaultLanguage.id;
    }

    // First, try to find by publicId (most common case)
    const languageByPublicId =
      await this.languageRepository.findByPublicId(languageId);
    if (languageByPublicId && languageByPublicId.status) {
      return languageByPublicId.id;
    }

    // If not found by publicId, try to find by primary key (backward compatibility)
    const languageById = await this.languageRepository.findById(languageId);
    if (languageById && languageById.status) {
      return languageById.id;
    }

    // If neither works, throw an error
    throw new BadRequestException(
      `Invalid languageId: ${languageId}. Language not found or inactive.`
    );
  }
}
