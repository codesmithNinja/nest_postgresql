import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  Language,
  CreateLanguageDto,
  UpdateLanguageDto,
} from '../../entities/language.entity';
import { ILanguageRepository } from './language.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LanguageMongodbRepository
  extends MongoRepository<LanguageDocument, Language>
  implements ILanguageRepository
{
  constructor(
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(languageModel);
  }

  protected toEntity(doc: LanguageDocument): Language {
    return {
      id: (doc._id as any).toString(),
      publicId: doc.publicId,
      name: doc.name,
      code: doc.code,
      direction: doc.direction,
      flagImage: doc.flagImage,
      isDefault: doc.isDefault,
      status: doc.status,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  protected toDocument(entity: Partial<Language>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.name !== undefined) doc.name = entity.name;
    if (entity.code !== undefined) doc.code = entity.code;
    if (entity.direction !== undefined) doc.direction = entity.direction;
    if (entity.flagImage !== undefined) doc.flagImage = entity.flagImage;
    if (entity.isDefault !== undefined) doc.isDefault = entity.isDefault;
    if (entity.status !== undefined) doc.status = entity.status;
    if (entity.publicId !== undefined) doc.publicId = entity.publicId;

    return doc;
  }

  async insert(createDto: CreateLanguageDto): Promise<Language> {
    const languageDoc = new this.languageModel({
      publicId: uuidv4(),
      ...createDto,
    });
    const savedLanguage = await languageDoc.save();
    return this.toEntity(savedLanguage);
  }

  async findByCode(code: string): Promise<Language | null> {
    const doc = await this.languageModel.findOne({ code: code.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async findByIsDefault(isDefault: string): Promise<Language | null> {
    const doc = await this.languageModel.findOne({ isDefault });
    return doc ? this.toEntity(doc) : null;
  }

  async findAllActive(): Promise<Language[]> {
    const docs = await this.languageModel
      .find({ status: true })
      .sort({ name: 1 });
    return docs.map((doc) => this.toEntity(doc));
  }

  async setAsDefault(id: string): Promise<Language> {
    // First, unset all other defaults
    await this.unsetAllDefaults();

    // Then set this language as default
    const doc = await this.languageModel.findByIdAndUpdate(
      id,
      { isDefault: 'YES' },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Language with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async unsetAllDefaults(): Promise<void> {
    await this.languageModel.updateMany(
      { isDefault: 'YES' },
      { isDefault: 'NO' }
    );
  }

  async findWithDropdowns(id: string): Promise<Language | null> {
    const doc = await this.languageModel
      .findById(id)
      .populate('manageDropdowns');
    return doc ? this.toEntity(doc) : null;
  }

  async findActiveLanguages(): Promise<Language[]> {
    return this.findAllActive();
  }

  async bulkUpdateStatus(ids: string[], status: boolean): Promise<number> {
    const result = await this.languageModel.updateMany(
      { _id: { $in: ids } },
      { status }
    );
    return result.modifiedCount;
  }

  async getDetail(filter: Partial<Language>): Promise<Language | null> {
    const mongoFilter: any = {};

    if (filter.publicId) {
      mongoFilter.publicId = filter.publicId;
    }
    if (filter.id) {
      mongoFilter._id = filter.id;
    }
    if (filter.code) {
      mongoFilter.code = filter.code;
    }
    if (filter.name) {
      mongoFilter.name = filter.name;
    }

    const doc = await this.languageModel.findOne(mongoFilter);
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<Language>
  ): Promise<Language> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.languageModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!doc) {
      throw new Error(`Language with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.languageModel.findByIdAndUpdate(
        id,
        { status: false },
        { new: true }
      );
      return !!result;
    } catch (error) {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: any = {};
    if (filter) {
      if (filter.name) {
        mongoFilter.name = { $regex: filter.name, $options: 'i' };
      }
      if (filter.code) {
        mongoFilter.code = filter.code;
      }
      if (filter.status !== undefined) {
        mongoFilter.status = filter.status;
      }
      if (filter.isDefault) {
        mongoFilter.isDefault = filter.isDefault;
      }
    }

    const [docs, total] = await Promise.all([
      this.languageModel
        .find(mongoFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.languageModel.countDocuments(mongoFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
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
}
