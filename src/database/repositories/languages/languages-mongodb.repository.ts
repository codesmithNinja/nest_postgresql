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

  async getAll(
    filter?: Partial<Language>,
    options?: QueryOptions
  ): Promise<Language[]> {
    const query = this.languageModel.find(filter || {});
    const result = await this.applyQueryOptions(query, options).exec();
    return result as Language[];
  }

  async getDetailById(id: string): Promise<Language | null> {
    const language = await this.languageModel.findById(id).exec();
    return language as Language | null;
  }

  async getDetail(filter: Partial<Language>): Promise<Language | null> {
    const language = await this.languageModel.findOne(filter).exec();
    return language as Language | null;
  }

  async insert(data: Partial<Language>): Promise<Language> {
    const language = new this.languageModel(data);
    const saved = await language.save();
    return saved as Language;
  }

  async updateById(id: string, data: Partial<Language>): Promise<Language> {
    const updated = await this.languageModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) {
      throw new Error('Language not found');
    }
    return updated as Language;
  }

  async updateMany(
    filter: Partial<Language>,
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }> {
    const result = await this.languageModel.updateMany(filter, data).exec();
    const updated = await this.languageModel.find(filter).exec();
    return {
      count: result.modifiedCount,
      updated: updated as Language[],
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.languageModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(
    filter: Partial<Language>
  ): Promise<{ count: number; deleted: Language[] }> {
    const deleted = await this.languageModel.find(filter).exec();
    const result = await this.languageModel.deleteMany(filter).exec();
    return {
      count: result.deletedCount,
      deleted: deleted as Language[],
    };
  }

  async count(filter?: Partial<Language>): Promise<number> {
    return this.languageModel.countDocuments(filter || {}).exec();
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
    return language as Language | null;
  }

  async findByName(name: string): Promise<Language | null> {
    const language = await this.languageModel.findOne({ name }).exec();
    return language as Language | null;
  }

  async findByFolder(folder: string): Promise<Language | null> {
    const language = await this.languageModel.findOne({ folder }).exec();
    return language as Language | null;
  }

  async findByIso2(iso2: string): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ iso2: iso2.toUpperCase() })
      .exec();
    return language as Language | null;
  }

  async findByIso3(iso3: string): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ iso3: iso3.toUpperCase() })
      .exec();
    return language as Language | null;
  }

  async findDefault(): Promise<Language | null> {
    const language = await this.languageModel
      .findOne({ isDefault: 'YES' })
      .exec();
    return language as Language | null;
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }> {
    const result = await this.languageModel
      .updateMany({ publicId: { $in: publicIds } }, data)
      .exec();
    const updated = await this.languageModel
      .find({ publicId: { $in: publicIds } })
      .exec();
    return {
      count: result.modifiedCount,
      updated: updated as Language[],
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
      deleted: deleted as Language[],
    };
  }
}
