import { Injectable, Inject, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { IPaymentGatewayRepository } from '../../../database/repositories/payment-gateway/payment-gateway.repository.interface';
import { PaymentGateway } from '../../../database/entities/payment-gateway.entity';
import {
  CreatePaymentGatewayDto,
  UpdatePaymentGatewayDto,
} from './dto/payment-gateway.dto';
import {
  PaymentGatewayNotFoundException,
  PaymentGatewayAlreadyExistsException,
  PaymentGatewayOperationFailedException,
  PaymentGatewayConfigurationException,
  InvalidPaymentSlugException,
} from './exceptions/payment-gateway.exceptions';

export const PAYMENT_GATEWAY_REPOSITORY = 'PAYMENT_GATEWAY_REPOSITORY';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly cachePrefix = 'payment_gateway';
  private readonly cacheTTL = 300; // 5 minutes
  private cache: NodeCache;

  constructor(
    @Inject(PAYMENT_GATEWAY_REPOSITORY)
    private readonly paymentGatewayRepository: IPaymentGatewayRepository
  ) {
    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      maxKeys: 1000,
      useClones: false,
      checkperiod: 60,
    });
  }

  /**
   * Get payment gateway by slug for public use (active only)
   */
  async getPublicPaymentGateway(paymentSlug: string): Promise<PaymentGateway> {
    const cacheKey = `${this.cachePrefix}:public:${paymentSlug}`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<PaymentGateway>(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for public payment gateway: ${paymentSlug}`);
        return cached;
      }

      this.logger.log(
        `Fetching public payment gateway from database: ${paymentSlug}`
      );
      const paymentGateway =
        await this.paymentGatewayRepository.findActiveByPaymentSlug(
          paymentSlug
        );

      if (!paymentGateway) {
        throw new PaymentGatewayNotFoundException(paymentSlug);
      }

      // Remove sensitive data for public response
      const publicPaymentGateway = this.sanitizeForPublic(paymentGateway);

      // Cache the result
      this.cache.set(cacheKey, publicPaymentGateway);
      this.logger.log(`Cached public payment gateway: ${paymentSlug}`);

      return publicPaymentGateway;
    } catch (error) {
      this.logger.error(
        `Failed to get public payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      if (error instanceof PaymentGatewayNotFoundException) {
        throw error;
      }
      throw new PaymentGatewayOperationFailedException(
        'fetch',
        (error as Error).message
      );
    }
  }

  /**
   * Get payment gateway by slug for admin use (includes inactive)
   */
  async getAdminPaymentGateway(paymentSlug: string): Promise<PaymentGateway> {
    const cacheKey = `${this.cachePrefix}:admin:${paymentSlug}`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<PaymentGateway>(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for admin payment gateway: ${paymentSlug}`);
        return cached;
      }

      this.logger.log(
        `Fetching admin payment gateway from database: ${paymentSlug}`
      );
      const paymentGateway =
        await this.paymentGatewayRepository.findByPaymentSlugForAdmin(
          paymentSlug
        );

      if (!paymentGateway) {
        throw new PaymentGatewayNotFoundException(paymentSlug);
      }

      // Cache the result
      this.cache.set(cacheKey, paymentGateway);
      this.logger.log(`Cached admin payment gateway: ${paymentSlug}`);

      return paymentGateway;
    } catch (error) {
      this.logger.error(
        `Failed to get admin payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      if (error instanceof PaymentGatewayNotFoundException) {
        throw error;
      }
      throw new PaymentGatewayOperationFailedException(
        'fetch',
        (error as Error).message
      );
    }
  }

  /**
   * Create a new payment gateway
   */
  async createPaymentGateway(
    paymentSlug: string,
    createDto: CreatePaymentGatewayDto
  ): Promise<PaymentGateway> {
    try {
      this.logger.log(`Creating payment gateway: ${paymentSlug}`);

      // Validate payment slug format
      this.validatePaymentSlug(paymentSlug);

      // Check if payment gateway already exists
      const existingGateway =
        await this.paymentGatewayRepository.existsByPaymentSlug(paymentSlug);
      if (existingGateway) {
        throw new PaymentGatewayAlreadyExistsException(paymentSlug);
      }

      // Validate configuration data
      this.validateConfiguration(createDto.sandboxDetails, 'sandbox');
      this.validateConfiguration(createDto.liveDetails, 'live');

      // Create the payment gateway
      const paymentGateway =
        await this.paymentGatewayRepository.createPaymentGateway(
          paymentSlug,
          createDto
        );

      // Clear cache
      this.clearCacheForPaymentSlug(paymentSlug);

      this.logger.log(`Successfully created payment gateway: ${paymentSlug}`);
      return paymentGateway;
    } catch (error) {
      this.logger.error(
        `Failed to create payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      if (
        error instanceof PaymentGatewayAlreadyExistsException ||
        error instanceof InvalidPaymentSlugException ||
        error instanceof PaymentGatewayConfigurationException
      ) {
        throw error;
      }
      throw new PaymentGatewayOperationFailedException(
        'create',
        (error as Error).message
      );
    }
  }

  /**
   * Update payment gateway by slug
   */
  async updatePaymentGateway(
    paymentSlug: string,
    updateDto: UpdatePaymentGatewayDto
  ): Promise<PaymentGateway> {
    try {
      this.logger.log(`Updating payment gateway: ${paymentSlug}`);

      // Check if payment gateway exists
      const existingGateway =
        await this.paymentGatewayRepository.findByPaymentSlugForAdmin(
          paymentSlug
        );
      if (!existingGateway) {
        throw new PaymentGatewayNotFoundException(paymentSlug);
      }

      // Validate configuration data if provided
      if (updateDto.sandboxDetails) {
        this.validateConfiguration(updateDto.sandboxDetails, 'sandbox');
      }
      if (updateDto.liveDetails) {
        this.validateConfiguration(updateDto.liveDetails, 'live');
      }

      // Update the payment gateway
      const updatedPaymentGateway =
        await this.paymentGatewayRepository.updateByPaymentSlug(
          paymentSlug,
          updateDto
        );

      // Clear cache
      this.clearCacheForPaymentSlug(paymentSlug);

      this.logger.log(`Successfully updated payment gateway: ${paymentSlug}`);
      return updatedPaymentGateway;
    } catch (error) {
      this.logger.error(
        `Failed to update payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      if (
        error instanceof PaymentGatewayNotFoundException ||
        error instanceof PaymentGatewayConfigurationException
      ) {
        throw error;
      }
      throw new PaymentGatewayOperationFailedException(
        'update',
        (error as Error).message
      );
    }
  }

  /**
   * Delete payment gateway by payment slug and public ID
   */
  async deletePaymentGateway(
    paymentSlug: string,
    publicId: string
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Deleting payment gateway: ${paymentSlug} with publicId: ${publicId}`
      );

      // Check if payment gateway exists
      const existingGateway =
        await this.paymentGatewayRepository.findByPaymentSlugForAdmin(
          paymentSlug
        );
      if (!existingGateway) {
        throw new PaymentGatewayNotFoundException(paymentSlug);
      }

      // Verify publicId matches
      if (existingGateway.publicId !== publicId) {
        throw new PaymentGatewayNotFoundException(`${paymentSlug}:${publicId}`);
      }

      // Delete the payment gateway
      const deleted =
        await this.paymentGatewayRepository.deleteByPaymentSlugAndPublicId(
          paymentSlug,
          publicId
        );

      if (!deleted) {
        throw new PaymentGatewayOperationFailedException(
          'delete',
          'Failed to delete payment gateway'
        );
      }

      // Clear cache
      this.clearCacheForPaymentSlug(paymentSlug);

      this.logger.log(`Successfully deleted payment gateway: ${paymentSlug}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      if (error instanceof PaymentGatewayNotFoundException) {
        throw error;
      }
      throw new PaymentGatewayOperationFailedException(
        'delete',
        (error as Error).message
      );
    }
  }

  /**
   * Set default payment gateway
   */
  async setDefaultPaymentGateway(paymentSlug: string): Promise<PaymentGateway> {
    try {
      this.logger.log(`Setting default payment gateway: ${paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayRepository.setDefaultGateway(paymentSlug);

      // Clear all cache since default status changed
      this.clearAllCache();

      this.logger.log(
        `Successfully set default payment gateway: ${paymentSlug}`
      );
      return paymentGateway;
    } catch (error) {
      this.logger.error(
        `Failed to set default payment gateway: ${paymentSlug}`,
        (error as Error).stack
      );
      throw new PaymentGatewayOperationFailedException(
        'set default',
        (error as Error).message
      );
    }
  }

  /**
   * Get default payment gateway
   */
  async getDefaultPaymentGateway(): Promise<PaymentGateway | null> {
    const cacheKey = `${this.cachePrefix}:default`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<PaymentGateway | null>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      const paymentGateway =
        await this.paymentGatewayRepository.getDefaultGateway();

      // Cache the result (even if null)
      this.cache.set(cacheKey, paymentGateway);

      return paymentGateway;
    } catch (error) {
      this.logger.error(
        'Failed to get default payment gateway',
        (error as Error).stack
      );
      throw new PaymentGatewayOperationFailedException(
        'get default',
        (error as Error).message
      );
    }
  }

  /**
   * Clear cache for specific payment slug
   */
  private clearCacheForPaymentSlug(paymentSlug: string): void {
    const keys = [
      `${this.cachePrefix}:public:${paymentSlug}`,
      `${this.cachePrefix}:admin:${paymentSlug}`,
      `${this.cachePrefix}:default`,
    ];

    keys.forEach((key) => this.cache.del(key));
    this.logger.log(`Cleared cache for payment gateway: ${paymentSlug}`);
  }

  /**
   * Clear all cache
   */
  private clearAllCache(): void {
    this.cache.flushAll();
    this.logger.log('Cleared all payment gateway cache');
  }

  /**
   * Sanitize payment gateway data for public response
   */
  private sanitizeForPublic(paymentGateway: PaymentGateway): PaymentGateway {
    return {
      ...paymentGateway,
      sandboxDetails: this.sanitizeConfigDetails(paymentGateway.sandboxDetails),
      liveDetails: this.sanitizeConfigDetails(paymentGateway.liveDetails),
    };
  }

  /**
   * Sanitize configuration details by hiding sensitive data
   */
  private sanitizeConfigDetails(
    details: Record<string, unknown>
  ): Record<string, unknown> {
    const sensitiveFields = [
      'secretKey',
      'secret',
      'privateKey',
      'private',
      'password',
      'token',
      'apiSecret',
      'clientSecret',
      'webhookSecret',
    ];

    const sanitized = { ...details };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '***hidden***';
      }
    });

    return sanitized;
  }

  /**
   * Validate payment slug format
   */
  private validatePaymentSlug(paymentSlug: string): void {
    const slugPattern = /^[a-z0-9_-]+$/;
    if (!slugPattern.test(paymentSlug)) {
      throw new InvalidPaymentSlugException(paymentSlug);
    }
  }

  /**
   * Validate configuration details
   */
  private validateConfiguration(
    details: Record<string, unknown>,
    mode: string
  ): void {
    if (!details || typeof details !== 'object') {
      throw new PaymentGatewayConfigurationException(
        mode,
        'Configuration must be a valid object'
      );
    }

    // Check if configuration is empty
    if (Object.keys(details).length === 0) {
      throw new PaymentGatewayConfigurationException(
        mode,
        'Configuration cannot be empty'
      );
    }

    // Basic validation for common required fields based on mode
    if (mode === 'sandbox') {
      // Add specific sandbox validation if needed
    } else if (mode === 'live') {
      // Add specific live validation if needed
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
    };
  }

  /**
   * Clear cache manually (for admin use)
   */
  clearCache(): void {
    this.clearAllCache();
  }
}
