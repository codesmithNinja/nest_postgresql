import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  Currency,
  CreateCurrencyDto,
  BulkCurrencyOperationDto,
} from '../../entities/currency.entity';

export interface ICurrencyRepository extends IRepository<Currency> {
  /**
   * Find currencies for public display (active only)
   */
  findForPublic(): Promise<Currency[]>;

  /**
   * Find currencies with pagination for admin
   */
  findCurrenciesWithPagination(
    page: number,
    limit: number,
    includeInactive?: boolean
  ): Promise<{
    data: Currency[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find currency by public ID
   */
  findByPublicId(publicId: string): Promise<Currency | null>;

  /**
   * Find currency by code
   */
  findByCode(code: string): Promise<Currency | null>;

  /**
   * Find currency by name
   */
  findByName(name: string): Promise<Currency | null>;

  /**
   * Create a new currency
   */
  insert(createDto: CreateCurrencyDto): Promise<Currency>;

  /**
   * Update currency by public ID
   */
  updateByPublicId(
    publicId: string,
    updateDto: Partial<Currency>
  ): Promise<Currency>;

  /**
   * Delete currency by public ID (only if useCount is 0)
   */
  deleteByPublicId(publicId: string): Promise<boolean>;

  /**
   * Increment use count for a currency
   */
  incrementUseCount(publicId: string): Promise<void>;

  /**
   * Decrement use count for a currency
   */
  decrementUseCount(publicId: string): Promise<void>;

  /**
   * Bulk operations on currencies
   */
  bulkOperation(bulkDto: BulkCurrencyOperationDto): Promise<number>;

  /**
   * Check if currency is in use (useCount > 0)
   */
  isInUse(publicId: string): Promise<boolean>;
}
