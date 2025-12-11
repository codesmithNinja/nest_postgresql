import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../base/base.repository';
import { Language } from '../../entities/language.entity';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  ILanguagesRepository,
  MongoQuery,
} from './languages.repository.interface';
import {
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class LanguagesMongodbRepository
  extends BaseRepository<Language>
  implements ILanguagesRepository
{
  constructor(
    @InjectModel(LanguageSchema.name)
    private readonly languageModel: Model<LanguageDocument>
  ) {
    super();
  }

  private toEntity(doc: LanguageDocument): Language {
    return {
      id: (doc._id as { toString(): string }).toString(),
      publicId: doc.publicId,
      name: doc.name,
      folder: doc.folder,
      code: doc.folder, // code maps to folder field
      iso2: doc.iso2,
      iso3: doc.iso3,
      direction: doc.direction,
      flagImage: doc.flagImage,
      isDefault: doc.isDefault,
      status: doc.status,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  private toDocument(entity: Partial<Language>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.name !== undefined) doc.name = entity.name;
    if (entity.folder !== undefined) doc.folder = entity.folder;
    if (entity.code !== undefined) doc.folder = entity.code; // code maps to folder
    if (entity.iso2 !== undefined) doc.iso2 = entity.iso2;
    if (entity.iso3 !== undefined) doc.iso3 = entity.iso3;
    if (entity.direction !== undefined) doc.direction = entity.direction;
    if (entity.flagImage !== undefined) doc.flagImage = entity.flagImage;
    if (entity.isDefault !== undefined) doc.isDefault = entity.isDefault;
    if (entity.status !== undefined) doc.status = entity.status;
    if (entity.publicId !== undefined) doc.publicId = entity.publicId;

    return doc;
  }

  async getAll(
    filter?: Partial<Language>,
    options?: QueryOptions
  ): Promise<Language[]> {
    const mongoFilter = filter ? this.toDocument(filter) : {};
    const query = this.languageModel.find(mongoFilter);
    const result = await this.applyQueryOptions(query, options).exec();
    return result.map((doc) => this.toEntity(doc));
  }

  async getDetailById(id: string): Promise<Language | null> {
    const language = await this.languageModel.findById(id).exec();
    return language ? this.toEntity(language) : null;
  }

  async getDetail(filter: Partial<Language>): Promise<Language | null> {
    const mongoFilter = this.toDocument(filter);
    const language = await this.languageModel.findOne(mongoFilter).exec();
    return language ? this.toEntity(language) : null;
  }

  async insert(data: Partial<Language>): Promise<Language> {
    const mongoData = this.toDocument(data);
    const language = new this.languageModel(mongoData);
    const saved = await language.save();
    return this.toEntity(saved);
  }

  async updateById(id: string, data: Partial<Language>): Promise<Language> {
    const mongoData = this.toDocument(data);
    const updated = await this.languageModel
      .findByIdAndUpdate(id, mongoData, { new: true })
      .exec();
    if (!updated) {
      throw new Error('Language not found');
    }
    return this.toEntity(updated);
  }

  async updateMany(
    filter: Partial<Language>,
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }> {
    const mongoFilter = this.toDocument(filter);
    const mongoData = this.toDocument(data);
    const result = await this.languageModel
      .updateMany(mongoFilter, mongoData)
      .exec();
    const updated = await this.languageModel.find(mongoFilter).exec();
    return {
      count: result.modifiedCount,
      updated: updated.map((doc) => this.toEntity(doc)),
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.languageModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(
    filter: Partial<Language>
  ): Promise<{ count: number; deleted: Language[] }> {
    const mongoFilter = this.toDocument(filter);
    const deleted = await this.languageModel.find(mongoFilter).exec();
    const result = await this.languageModel.deleteMany(mongoFilter).exec();
    return {
      count: result.deletedCount,
      deleted: deleted.map((doc) => this.toEntity(doc)),
    };
  }

  async count(filter?: Partial<Language>): Promise<number> {
    const mongoFilter = filter ? this.toDocument(filter) : {};
    return this.languageModel.countDocuments(mongoFilter).exec();
  }

  // Implementation of interface methods
  async findById(id: string): Promise<Language | null> {
    return this.getDetailById(id);
  }

  async findMany(
    filter?: MongoQuery<Language>,
    options?: QueryOptions
  ): Promise<Language[]> {
    return this.getAll(filter as Partial<Language>, options);
  }

  async update(id: string, data: Partial<Language>): Promise<Language> {
    return this.updateById(id, data);
  }

  async findByPublicId(publicId: string): Promise<Language | null> {
    const language = await this.languageModel.findOne({ publicId }).exec();
    return language ? this.toEntity(language) : null;
  }

  async findByName(name: string): Promise<Language | null> {
    const language = await this.languageModel.findOne({ name }).exec();
    return language ? this.toEntity(language) : null;
  }

  async findByFolder(folder: string): Promise<Language | null> {
    const language = await this.languageModel.findOne({ folder }).exec();
    return language ? this.toEntity(language) : null;
  }

  async findByIso2(iso2: string): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ iso2: iso2.toUpperCase() })
      .exec();
    return language ? this.toEntity(language) : null;
  }

  async findByIso3(iso3: string): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ iso3: iso3.toUpperCase() })
      .exec();
    return language ? this.toEntity(language) : null;
  }

  async findDefault(): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ isDefault: 'YES' })
      .exec();
    return language ? this.toEntity(language) : null;
  }

  async setAllNonDefault(): Promise<void> {
    await this.languageModel.updateMany({}, { isDefault: 'NO' }).exec();
  }

  async findWithPagination(
    filter?: MongoQuery<Language>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Language>> {
    return super.findWithPagination(filter as Partial<Language>, options);
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>> {
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
    const query = this.languageModel.find(mongoFilter);

    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.languageModel.countDocuments(mongoFilter).exec(),
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }> {
    const mongoData = this.toDocument(data);
    const result = await this.languageModel
      .updateMany({ publicId: { $in: publicIds } }, mongoData)
      .exec();
    const updated = await this.languageModel
      .find({ publicId: { $in: publicIds } })
      .exec();
    return {
      count: result.modifiedCount,
      updated: updated.map((doc) => this.toEntity(doc)),
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Language[] }> {
    const deleted = await this.languageModel
      .find({ publicId: { $in: publicIds } })
      .exec();
    const result = await this.languageModel
      .deleteMany({ publicId: { $in: publicIds } })
      .exec();
    return {
      count: result.deletedCount,
      deleted: deleted.map((doc) => this.toEntity(doc)),
    };
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<Language>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (
        key !== 'name' &&
        key !== 'folder' &&
        key !== 'iso2' &&
        key !== 'iso3'
      ) {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          mongoFilter[key] = value;
        }
      }
    });

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
  }
}
