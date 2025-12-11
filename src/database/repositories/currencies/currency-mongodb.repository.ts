import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { Currency, CreateCurrencyDto } from '../../entities/currency.entity';
import {
  Currency as CurrencySchema,
  CurrencyDocument,
} from '../../schemas/currency.schema';
import {
  ICurrencyRepository,
  MongoQuery,
} from './currency.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CurrencyMongoRepository
  extends MongoRepository<CurrencyDocument, Currency>
  implements ICurrencyRepository
{
  constructor(
    @InjectModel(CurrencySchema.name) currencyModel: Model<CurrencyDocument>
  ) {
    super(currencyModel);
  }

  protected toEntity(document: CurrencyDocument): Currency {
    const entity: Currency = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: document.id ?? document._id?.toString() ?? '',
      publicId: document.publicId,
      name: document.name,
      code: document.code,
      symbol: document.symbol,
      status: document.status,
      useCount: document.useCount,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    };
    return entity;
  }

  protected toDocument(entity: Partial<Currency>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    if (entity.name !== undefined) doc.name = entity.name;
    if (entity.code !== undefined) doc.code = entity.code.toUpperCase();
    if (entity.symbol !== undefined) doc.symbol = entity.symbol;
    if (entity.status !== undefined) doc.status = entity.status;
    if (entity.useCount !== undefined) doc.useCount = entity.useCount;

    return doc;
  }

  async insert(createDto: CreateCurrencyDto): Promise<Currency> {
    const currencyData = {
      publicId: uuidv4(),
      ...createDto,
      code: createDto.code.toUpperCase(),
    };

    const document = new this.model(currencyData);
    const savedDocument = await document.save();
    return this.toEntity(savedDocument);
  }

  async findForPublic(): Promise<Currency[]> {
    const documents = await this.model
      .find({ status: true })
      .sort({ name: 1 })
      .exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async findCurrenciesWithPagination(
    page: number,
    limit: number,
    includeInactive = false
  ): Promise<{
    data: Currency[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (!includeInactive) {
      filter.status = true;
    }

    const [documents, total] = await Promise.all([
      this.model
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data: documents.map((doc) => this.toEntity(doc)),
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Currency>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Currency>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build search conditions using the provided search fields
    const searchConditions = {
      $or: searchFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    };

    // Build additional filters
    const additionalFilters = this.buildAdditionalFilters(filter);
    const mongoFilter = additionalFilters
      ? { $and: [searchConditions, additionalFilters] }
      : searchConditions;

    // Build query
    const query = this.model.find(mongoFilter);

    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    const items = documents.map((doc) => this.toEntity(doc));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findByPublicId(publicId: string): Promise<Currency | null> {
    const document = await this.model.findOne({ publicId }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByCode(code: string): Promise<Currency | null> {
    const document = await this.model
      .findOne({ code: code.toUpperCase() })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async findByName(name: string): Promise<Currency | null> {
    const document = await this.model
      .findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async updateByPublicId(
    publicId: string,
    updateDto: Partial<Currency>
  ): Promise<Currency> {
    const updateData = this.toDocument(updateDto);

    const document = await this.model
      .findOneAndUpdate({ publicId }, updateData, { new: true })
      .exec();

    if (!document) {
      throw new Error(`Currency with publicId ${publicId} not found`);
    }

    return this.toEntity(document);
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      // First check if currency is in use
      const currency = await this.findByPublicId(publicId);
      if (!currency) {
        return false;
      }

      if (currency.useCount > 0) {
        throw new Error(
          `Cannot delete currency with useCount: ${currency.useCount}`
        );
      }

      const result = await this.model.deleteOne({ publicId }).exec();
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    await this.model.updateOne({ publicId }, { $inc: { useCount: 1 } }).exec();
  }

  async decrementUseCount(publicId: string): Promise<void> {
    await this.model.updateOne({ publicId }, { $inc: { useCount: -1 } }).exec();
  }

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Currency>
  ): Promise<{ count: number; updated: Currency[] }> {
    const updateData = this.toDocument(data);

    const result = await this.model
      .updateMany({ publicId: { $in: publicIds } }, updateData)
      .exec();

    const updatedDocuments = await this.model
      .find({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: result.modifiedCount || 0,
      updated: updatedDocuments.map((doc) => this.toEntity(doc)),
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Currency[] }> {
    // First get currencies to be deleted for return value
    const currenciesToDelete = await this.model
      .find({ publicId: { $in: publicIds } })
      .exec();

    // Check if any currency is in use
    for (const currency of currenciesToDelete) {
      if (currency.useCount > 0) {
        throw new Error(
          `Cannot delete currency ${currency.publicId} with useCount: ${currency.useCount}`
        );
      }
    }

    const deleteResult = await this.model
      .deleteMany({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: deleteResult.deletedCount || 0,
      deleted: currenciesToDelete.map((doc) => this.toEntity(doc)),
    };
  }

  async isInUse(publicId: string): Promise<boolean> {
    const document = await this.model
      .findOne({ publicId })
      .select('useCount')
      .exec();
    return document ? document.useCount > 0 : false;
  }

  // Base interface implementations
  async getDetail(filter: Partial<Currency>): Promise<Currency | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) {
      mongoFilter.publicId = filter.publicId;
    }
    if (filter.id) {
      mongoFilter._id = filter.id;
    }
    if (filter.name) {
      mongoFilter.name = filter.name;
    }
    if (filter.code) {
      mongoFilter.code = filter.code;
    }

    const document = await this.model.findOne(mongoFilter).exec();
    return document ? this.toEntity(document) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<Currency>
  ): Promise<Currency> {
    const updateData = this.toDocument(updateDto);

    const document = await this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!document) {
      throw new Error(`Currency with id ${id} not found`);
    }

    return this.toEntity(document);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id).exec();
      return result !== null;
    } catch {
      return false;
    }
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<Currency>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'code' && key !== 'symbol') {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          mongoFilter[key] = value;
        }
      }
    });

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
  }

  protected convertFilterToMongo(
    filter: Partial<Currency>
  ): Record<string, unknown> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.name) {
      mongoFilter.name = { $regex: filter.name, $options: 'i' };
    }
    if (filter.code) {
      mongoFilter.code = filter.code;
    }
    if (filter.symbol) {
      mongoFilter.symbol = { $regex: filter.symbol, $options: 'i' };
    }
    if (filter.status !== undefined) {
      mongoFilter.status = filter.status;
    }

    return mongoFilter;
  }
}
