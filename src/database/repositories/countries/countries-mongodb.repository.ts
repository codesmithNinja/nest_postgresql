import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../base/base.repository';
import { Country } from '../../entities/country.entity';
import {
  Country as CountrySchema,
  CountryDocument,
} from '../../schemas/country.schema';
import {
  ICountriesRepository,
  MongoQuery,
} from './countries.repository.interface';
import {
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class CountriesMongodbRepository
  extends BaseRepository<Country>
  implements ICountriesRepository
{
  constructor(
    @InjectModel(CountrySchema.name)
    private readonly countryModel: Model<CountryDocument>
  ) {
    super();
  }

  async getAll(
    filter?: Partial<Country>,
    options?: QueryOptions
  ): Promise<Country[]> {
    const query = this.countryModel.find(filter || {});
    const result = await this.applyQueryOptions(query, options).exec();
    return result as Country[];
  }

  async getDetailById(id: string): Promise<Country | null> {
    const country = await this.countryModel.findById(id).exec();
    return country as Country | null;
  }

  async getDetail(filter: Partial<Country>): Promise<Country | null> {
    const country = await this.countryModel.findOne(filter).exec();
    return country as Country | null;
  }

  async insert(data: Partial<Country>): Promise<Country> {
    const country = new this.countryModel(data);
    const saved = await country.save();
    return saved as Country;
  }

  async updateById(id: string, data: Partial<Country>): Promise<Country> {
    const updated = await this.countryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) {
      throw new Error('Country not found');
    }
    return updated as Country;
  }

  async updateMany(
    filter: Partial<Country>,
    data: Partial<Country>
  ): Promise<{ count: number; updated: Country[] }> {
    const result = await this.countryModel.updateMany(filter, data).exec();
    const updated = await this.countryModel.find(filter).exec();
    return {
      count: result.modifiedCount,
      updated: updated as Country[],
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.countryModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(
    filter: Partial<Country>
  ): Promise<{ count: number; deleted: Country[] }> {
    const deleted = await this.countryModel.find(filter).exec();
    const result = await this.countryModel.deleteMany(filter).exec();
    return {
      count: result.deletedCount,
      deleted: deleted as Country[],
    };
  }

  async count(filter?: Partial<Country>): Promise<number> {
    return this.countryModel.countDocuments(filter || {}).exec();
  }

  // Implementation of interface methods
  async findById(id: string): Promise<Country | null> {
    return this.getDetailById(id);
  }

  async findMany(
    filter?: MongoQuery<Country>,
    options?: QueryOptions
  ): Promise<Country[]> {
    return this.getAll(filter as Partial<Country>, options);
  }

  async update(id: string, data: Partial<Country>): Promise<Country> {
    return this.updateById(id, data);
  }

  async findByPublicId(publicId: string): Promise<Country | null> {
    const country = await this.countryModel.findOne({ publicId }).exec();
    return country as Country | null;
  }

  async findByIso2(iso2: string): Promise<Country | null> {
    const country = await this.countryModel
      .findOne({ iso2: iso2.toUpperCase() })
      .exec();
    return country as Country | null;
  }

  async findByIso3(iso3: string): Promise<Country | null> {
    const country = await this.countryModel
      .findOne({ iso3: iso3.toUpperCase() })
      .exec();
    return country as Country | null;
  }

  async findDefault(): Promise<Country | null> {
    const country = await this.countryModel
      .findOne({ isDefault: 'YES' })
      .exec();
    return country as Country | null;
  }

  async setAllNonDefault(): Promise<void> {
    await this.countryModel.updateMany({}, { isDefault: 'NO' }).exec();
  }

  async findWithPagination(
    filter?: MongoQuery<Country>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Country>> {
    return super.findWithPagination(filter as Partial<Country>, options);
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Country>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Country>> {
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
    const query = this.countryModel.find(mongoFilter);

    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.countryModel.countDocuments(mongoFilter).exec(),
    ]);

    const items = documents as Country[];
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Country>
  ): Promise<{ count: number; updated: Country[] }> {
    const result = await this.countryModel
      .updateMany({ publicId: { $in: publicIds } }, data)
      .exec();
    const updated = await this.countryModel
      .find({ publicId: { $in: publicIds } })
      .exec();
    return {
      count: result.modifiedCount,
      updated: updated as Country[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Country[] }> {
    const deleted = await this.countryModel
      .find({ publicId: { $in: publicIds } })
      .exec();
    const result = await this.countryModel
      .deleteMany({ publicId: { $in: publicIds } })
      .exec();
    return {
      count: result.deletedCount,
      deleted: deleted as Country[],
    };
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<Country>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'iso2' && key !== 'iso3') {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          mongoFilter[key] = value;
        }
      }
    });

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
  }
}
