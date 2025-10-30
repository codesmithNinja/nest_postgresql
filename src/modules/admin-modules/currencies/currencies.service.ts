import { Injectable, Inject, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { ICurrencyRepository } from '../../../database/repositories/currencies/currency.repository.interface';
import { Currency } from '../../../database/entities/currency.entity';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  BulkUpdateCurrencyDto,
  BulkDeleteCurrencyDto,
} from './dto/currencies.dto';
import {
  CurrencyNotFoundException,
  CurrencyAlreadyExistsException,
  CurrencyInUseException,
  CurrencyOperationFailedException,
} from './exceptions/currencies.exceptions';

export const CURRENCY_REPOSITORY = 'CURRENCY_REPOSITORY';

@Injectable()
export class CurrenciesService {
  private readonly logger = new Logger(CurrenciesService.name);
  private readonly cachePrefix = 'currencies';
  private readonly cacheTTL = 300; // 5 minutes
  private cache: NodeCache;

  constructor(
    @Inject(CURRENCY_REPOSITORY)
    private readonly currencyRepository: ICurrencyRepository
  ) {
    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      maxKeys: 1000,
      useClones: false,
      checkperiod: 60,
    });
  }

  /**
   * Get all active currencies for public use
   */
  async getPublicCurrencies(): Promise<Currency[]> {
    const cacheKey = `${this.cachePrefix}:public`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<Currency[]>(cacheKey);
      if (cached) {
        this.logger.debug('Retrieved currencies from cache');
        return cached;
      }

      // Get from database
      const currencies = await this.currencyRepository.findForPublic();

      // Cache the result
      this.cache.set(cacheKey, currencies, this.cacheTTL);

      this.logger.log(`Retrieved ${currencies.length} public currencies`);
      return currencies;
    } catch (error) {
      this.logger.error(
        'Error retrieving public currencies',
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'retrieval',
        (error as Error).message
      );
    }
  }

  /**
   * Get currencies with pagination for admin
   */
  async getCurrenciesForAdmin(
    page: number,
    limit: number,
    includeInactive = true
  ): Promise<{
    data: Currency[];
    total: number;
    page: number;
    limit: number;
  }> {
    const cacheKey = `${this.cachePrefix}:admin:${page}:${limit}:${includeInactive}`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<{
        data: Currency[];
        total: number;
        page: number;
        limit: number;
      }>(cacheKey);

      if (cached) {
        this.logger.debug('Retrieved admin currencies from cache');
        return cached;
      }

      // Get from database
      const result = await this.currencyRepository.findCurrenciesWithPagination(
        page,
        limit,
        includeInactive
      );

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL);

      this.logger.log(
        `Retrieved ${result.data.length} admin currencies (page ${page})`
      );
      return result;
    } catch (error) {
      this.logger.error(
        'Error retrieving admin currencies',
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'retrieval',
        (error as Error).message
      );
    }
  }

  /**
   * Get single currency by public ID
   */
  async getCurrencyByPublicId(publicId: string): Promise<Currency> {
    const cacheKey = `${this.cachePrefix}:single:${publicId}`;

    try {
      // Try to get from cache first
      const cached = this.cache.get<Currency>(cacheKey);
      if (cached) {
        this.logger.debug(`Retrieved currency ${publicId} from cache`);
        return cached;
      }

      // Get from database
      const currency = await this.currencyRepository.findByPublicId(publicId);
      if (!currency) {
        throw new CurrencyNotFoundException(publicId);
      }

      // Cache the result
      this.cache.set(cacheKey, currency, this.cacheTTL);

      this.logger.log(
        `Retrieved currency: ${currency.name} (${currency.code})`
      );
      return currency;
    } catch (error) {
      if (error instanceof CurrencyNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving currency ${publicId}`,
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'retrieval',
        (error as Error).message
      );
    }
  }

  /**
   * Create a new currency
   */
  async createCurrency(createDto: CreateCurrencyDto): Promise<Currency> {
    try {
      // Check if currency with same name already exists
      const existingByName = await this.currencyRepository.findByName(
        createDto.name
      );
      if (existingByName) {
        throw new CurrencyAlreadyExistsException('name', createDto.name);
      }

      // Check if currency with same code already exists
      const existingByCode = await this.currencyRepository.findByCode(
        createDto.code.toUpperCase()
      );
      if (existingByCode) {
        throw new CurrencyAlreadyExistsException(
          'code',
          createDto.code.toUpperCase()
        );
      }

      // Create the currency
      const currency = await this.currencyRepository.insert(createDto);

      // Clear relevant caches
      this.clearCurrencyCaches();

      this.logger.log(`Created currency: ${currency.name} (${currency.code})`);
      return currency;
    } catch (error) {
      if (error instanceof CurrencyAlreadyExistsException) {
        throw error;
      }
      this.logger.error('Error creating currency', (error as Error).stack);
      throw new CurrencyOperationFailedException(
        'creation',
        (error as Error).message
      );
    }
  }

  /**
   * Update a currency by public ID
   */
  async updateCurrency(
    publicId: string,
    updateDto: UpdateCurrencyDto
  ): Promise<Currency> {
    try {
      // Check if currency exists
      const existingCurrency =
        await this.currencyRepository.findByPublicId(publicId);
      if (!existingCurrency) {
        throw new CurrencyNotFoundException(publicId);
      }

      // Check for conflicts with name if provided
      if (updateDto.name && updateDto.name !== existingCurrency.name) {
        const existingByName = await this.currencyRepository.findByName(
          updateDto.name
        );
        if (existingByName && existingByName.publicId !== publicId) {
          throw new CurrencyAlreadyExistsException('name', updateDto.name);
        }
      }

      // Check for conflicts with code if provided
      if (
        updateDto.code &&
        updateDto.code.toUpperCase() !== existingCurrency.code
      ) {
        const existingByCode = await this.currencyRepository.findByCode(
          updateDto.code.toUpperCase()
        );
        if (existingByCode && existingByCode.publicId !== publicId) {
          throw new CurrencyAlreadyExistsException(
            'code',
            updateDto.code.toUpperCase()
          );
        }
      }

      // Update the currency
      const updatedCurrency = await this.currencyRepository.updateByPublicId(
        publicId,
        updateDto
      );

      // Clear relevant caches
      this.clearCurrencyCaches();
      this.cache.del(`${this.cachePrefix}:single:${publicId}`);

      this.logger.log(
        `Updated currency: ${updatedCurrency.name} (${updatedCurrency.code})`
      );
      return updatedCurrency;
    } catch (error) {
      if (
        error instanceof CurrencyNotFoundException ||
        error instanceof CurrencyAlreadyExistsException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating currency ${publicId}`,
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'update',
        (error as Error).message
      );
    }
  }

  /**
   * Delete a currency by public ID
   */
  async deleteCurrency(publicId: string): Promise<boolean> {
    try {
      // Check if currency exists
      const currency = await this.currencyRepository.findByPublicId(publicId);
      if (!currency) {
        throw new CurrencyNotFoundException(publicId);
      }

      // Check if currency is in use
      if (currency.useCount > 0) {
        throw new CurrencyInUseException(currency.name, currency.useCount);
      }

      // Delete the currency
      const success = await this.currencyRepository.deleteByPublicId(publicId);
      if (!success) {
        throw new CurrencyOperationFailedException(
          'deletion',
          'Failed to delete currency'
        );
      }

      // Clear relevant caches
      this.clearCurrencyCaches();
      this.cache.del(`${this.cachePrefix}:single:${publicId}`);

      this.logger.log(`Deleted currency: ${currency.name} (${currency.code})`);
      return true;
    } catch (error) {
      if (
        error instanceof CurrencyNotFoundException ||
        error instanceof CurrencyInUseException ||
        error instanceof CurrencyOperationFailedException
      ) {
        throw error;
      }
      this.logger.error(
        `Error deleting currency ${publicId}`,
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'deletion',
        (error as Error).message
      );
    }
  }

  /**
   * Bulk update currencies status
   */
  async bulkUpdateCurrencies(
    bulkUpdateDto: BulkUpdateCurrencyDto
  ): Promise<{ count: number; message: string }> {
    try {
      this.logger.log(
        `Bulk updating ${bulkUpdateDto.publicIds.length} currencies`
      );

      const updateData: Partial<Currency> = {
        status: bulkUpdateDto.status,
      };

      const result = await this.currencyRepository.bulkUpdateByPublicIds(
        bulkUpdateDto.publicIds,
        updateData
      );

      // Clear relevant caches
      this.clearCurrencyCaches();

      // Clear individual currency caches
      for (const publicId of bulkUpdateDto.publicIds) {
        this.cache.del(`${this.cachePrefix}:single:${publicId}`);
      }

      this.logger.log(
        `Bulk update completed: ${result.count} currencies updated`
      );
      return {
        count: result.count,
        message: `${result.count} currencies updated successfully`,
      };
    } catch (error) {
      this.logger.error(
        'Error in bulk update operation',
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'bulk-update',
        (error as Error).message
      );
    }
  }

  /**
   * Bulk delete currencies
   */
  async bulkDeleteCurrencies(
    bulkDeleteDto: BulkDeleteCurrencyDto
  ): Promise<{ count: number; message: string }> {
    try {
      this.logger.log(
        `Bulk deleting ${bulkDeleteDto.publicIds.length} currencies`
      );

      // Get all currencies to be deleted
      const currenciesToDelete = await Promise.all(
        bulkDeleteDto.publicIds.map((id) =>
          this.currencyRepository.findByPublicId(id)
        )
      );

      // Filter out null results and check eligibility
      const eligibleCurrencies = currenciesToDelete.filter((currency) => {
        if (!currency) return false;
        if (currency.useCount > 0) {
          this.logger.warn(
            `Skipping deletion of currency '${currency.name}' due to useCount: ${currency.useCount}`
          );
          return false;
        }
        return true;
      }) as Currency[];

      // Delete eligible currencies
      const eligiblePublicIds = eligibleCurrencies.map(
        (currency) => currency.publicId
      );
      const result =
        await this.currencyRepository.bulkDeleteByPublicIds(eligiblePublicIds);

      // Clear relevant caches
      this.clearCurrencyCaches();

      // Clear individual currency caches
      for (const publicId of eligiblePublicIds) {
        this.cache.del(`${this.cachePrefix}:single:${publicId}`);
      }

      this.logger.log(
        `Bulk deletion completed: ${result.count} currencies deleted`
      );
      return {
        count: result.count,
        message: `${result.count} currencies deleted successfully`,
      };
    } catch (error) {
      this.logger.error(
        'Error in bulk delete operation',
        (error as Error).stack
      );
      throw new CurrencyOperationFailedException(
        'bulk-delete',
        (error as Error).message
      );
    }
  }

  /**
   * Increment use count for a currency
   */
  async incrementUseCount(publicId: string): Promise<void> {
    try {
      await this.currencyRepository.incrementUseCount(publicId);
      this.cache.del(`${this.cachePrefix}:single:${publicId}`);
      this.logger.debug(`Incremented use count for currency ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Error incrementing use count for currency ${publicId}`,
        (error as Error).stack
      );
    }
  }

  /**
   * Decrement use count for a currency
   */
  async decrementUseCount(publicId: string): Promise<void> {
    try {
      await this.currencyRepository.decrementUseCount(publicId);
      this.cache.del(`${this.cachePrefix}:single:${publicId}`);
      this.logger.debug(`Decremented use count for currency ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Error decrementing use count for currency ${publicId}`,
        (error as Error).stack
      );
    }
  }

  /**
   * Clear all currency-related caches
   */
  private clearCurrencyCaches(): void {
    try {
      const keys = this.cache.keys();
      const currencyKeys = keys.filter((key) =>
        key.startsWith(this.cachePrefix)
      );

      if (currencyKeys.length > 0) {
        currencyKeys.forEach((key) => this.cache.del(key));
        this.logger.debug(
          `Cleared ${currencyKeys.length} currency cache entries`
        );
      }
    } catch (error) {
      this.logger.warn(
        'Error clearing currency caches',
        (error as Error).stack
      );
    }
  }
}
