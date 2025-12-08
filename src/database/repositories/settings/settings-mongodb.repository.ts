import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { ISettingsRepository } from './settings.repository.interface';
import {
  Settings,
  CreateSettingsData,
  UpdateSettingsData,
} from '../../entities/settings.entity';
import {
  Settings as SettingsSchema,
  SettingsDocument,
} from '../../schemas/settings.schema';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class SettingsMongoRepository
  extends MongoRepository<SettingsDocument, Settings>
  implements ISettingsRepository
{
  protected readonly logger = new Logger(SettingsMongoRepository.name);

  constructor(
    @InjectModel(SettingsSchema.name) settingsModel: Model<SettingsDocument>
  ) {
    super(settingsModel);
  }

  protected toEntity(doc: SettingsDocument): Settings {
    const entity: Settings = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: doc.id ?? doc._id?.toString() ?? '',
      groupType: doc.groupType,
      recordType: doc.recordType,
      key: doc.key,
      value: doc.value,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
    return entity;
  }

  protected toDocument(entity: Partial<Settings>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.groupType !== undefined) doc.groupType = entity.groupType;
    if (entity.recordType !== undefined) doc.recordType = entity.recordType;
    if (entity.key !== undefined) doc.key = entity.key;
    if (entity.value !== undefined) doc.value = entity.value;
    if (entity.createdAt !== undefined) doc.createdAt = entity.createdAt;
    if (entity.updatedAt !== undefined) doc.updatedAt = entity.updatedAt;

    return doc;
  }

  async getAll(
    filter?: Partial<Settings>,
    options?: QueryOptions
  ): Promise<Settings[]> {
    const query = this.model.find(filter || {});
    const appliedQuery = this.applyQueryOptions(query, options);
    const results = await appliedQuery.lean().exec();
    return this.transformDocuments(results as SettingsDocument[]);
  }

  async getDetailById(
    id: string,
    options?: QueryOptions
  ): Promise<Settings | null> {
    const query = this.model.findById(id);
    const appliedQuery = this.applyQueryOptions(query, options);
    const result = await appliedQuery.lean().exec();
    return result ? this.transformDocument(result as SettingsDocument) : null;
  }

  async getDetail(
    filter: Partial<Settings>,
    options?: QueryOptions
  ): Promise<Settings | null> {
    const query = this.model.findOne(filter);
    const appliedQuery = this.applyQueryOptions(query, options);
    const result = await appliedQuery.lean().exec();
    return result ? this.transformDocument(result as SettingsDocument) : null;
  }

  async insert(data: Partial<Settings>): Promise<Settings> {
    const created = new this.model(data);
    const saved = await created.save();
    return this.transformDocument(saved.toObject() as SettingsDocument);
  }

  async updateById(id: string, data: Partial<Settings>): Promise<Settings> {
    const updated = await this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) {
      throw new Error(`Settings with id ${id} not found`);
    }

    return this.transformDocument(updated as SettingsDocument);
  }

  async updateMany(
    filter: Partial<Settings>,
    data: Partial<Settings>
  ): Promise<{ count: number; updated: Settings[] }> {
    // Perform the update
    const updateResult = await this.model
      .updateMany(filter, data, { runValidators: true })
      .exec();

    // Get updated items
    const updatedItems = await this.model.find(filter).lean().exec();

    return {
      count: updateResult.modifiedCount,
      updated: this.transformDocuments(updatedItems as SettingsDocument[]),
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(
    filter: Partial<Settings>
  ): Promise<{ count: number; deleted: Settings[] }> {
    // Get items that will be deleted
    const itemsToDelete = await this.model.find(filter).lean().exec();

    // Perform the deletion
    const deleteResult = await this.model.deleteMany(filter).exec();

    return {
      count: deleteResult.deletedCount,
      deleted: this.transformDocuments(itemsToDelete as SettingsDocument[]),
    };
  }

  async count(filter?: Partial<Settings>): Promise<number> {
    return await this.model.countDocuments(filter || {}).exec();
  }

  async exists(filter: Partial<Settings>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async findWithPagination(
    filter?: Partial<Settings>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Settings>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.model.find(filter || {});
    const appliedQuery = this.applyQueryOptions(query, {
      ...options,
      skip,
      limit,
    });

    const [items, totalCount] = await Promise.all([
      appliedQuery.lean().exec(),
      this.model.countDocuments(filter || {}).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: this.transformDocuments(items as SettingsDocument[]),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findByGroupType(groupType: string): Promise<Settings[]> {
    const results = await this.model
      .find({ groupType })
      .sort({ key: 1 })
      .lean()
      .exec();
    return this.transformDocuments(results as SettingsDocument[]);
  }

  async findByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<Settings | null> {
    const result = await this.model.findOne({ groupType, key }).lean().exec();
    return result ? this.transformDocument(result as SettingsDocument) : null;
  }

  async upsertByGroupTypeAndKey(
    groupType: string,
    key: string,
    data: CreateSettingsData | UpdateSettingsData
  ): Promise<Settings> {
    const upsertData = {
      ...data,
      groupType,
      key,
    };

    const result = await this.model
      .findOneAndUpdate({ groupType, key }, upsertData, {
        new: true,
        upsert: true,
        runValidators: true,
      })
      .lean()
      .exec();

    return this.transformDocument(result as SettingsDocument);
  }

  async deleteByGroupType(groupType: string): Promise<number> {
    const deleteResult = await this.model.deleteMany({ groupType }).exec();
    return deleteResult.deletedCount;
  }

  async deleteByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ groupType, key }).exec();
    return !!result;
  }

  async bulkUpsert(settings: CreateSettingsData[]): Promise<Settings[]> {
    const results: Settings[] = [];

    for (const setting of settings) {
      const result = await this.upsertByGroupTypeAndKey(
        setting.groupType,
        setting.key,
        setting
      );
      results.push(result);
    }

    return results;
  }

  private transformDocument(doc: SettingsDocument): Settings {
    return this.toEntity(doc);
  }

  private transformDocuments(docs: SettingsDocument[]): Settings[] {
    return docs.map((doc) => this.transformDocument(doc));
  }
}
