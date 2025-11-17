import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  MetaSetting as MetaSettingSchema,
  MetaSettingDocument,
} from '../../schemas/meta-setting.schema';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  MetaSetting,
  CreateMetaSettingDto,
  UpdateMetaSettingDto,
  MetaSettingWithLanguage,
  MinimalLanguage,
} from '../../entities/meta-setting.entity';
import { IMetaSettingRepository } from './meta-setting.repository.interface';
import { v4 as uuidv4 } from 'uuid';

// Helper type for populated language document
interface PopulatedLanguageDocument {
  _id: unknown;
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
  flagImage: string;
  direction: 'ltr' | 'rtl';
  status: boolean;
  isDefault: 'YES' | 'NO';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class MetaSettingMongodbRepository
  extends MongoRepository<MetaSettingDocument, MetaSetting>
  implements IMetaSettingRepository
{
  constructor(
    @InjectModel(MetaSettingSchema.name)
    private metaSettingModel: Model<MetaSettingDocument>,
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(metaSettingModel);
  }

  protected toEntity(doc: MetaSettingDocument): MetaSetting {
    return {
      id: (doc._id as { toString(): string }).toString(),
      publicId: doc.publicId,
      // languageId handling with population support
      languageId:
        typeof doc.languageId === 'object' &&
        doc.languageId &&
        'publicId' in doc.languageId
          ? ({
              publicId: (doc.languageId as PopulatedLanguageDocument).publicId,
              name: (doc.languageId as PopulatedLanguageDocument).name,
            } as MinimalLanguage)
          : typeof doc.languageId === 'object'
            ? (doc.languageId as { toString(): string }).toString()
            : doc.languageId,
      siteName: doc.siteName,
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription,
      metaKeyword: doc.metaKeyword,
      ogTitle: doc.ogTitle,
      ogDescription: doc.ogDescription,
      ogImage: doc.ogImage,
      isAIGeneratedImage: doc.isAIGeneratedImage || 'NO',
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  protected toDocument(entity: Partial<MetaSetting>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    // languageId must be the primary key (_id) of the language, not publicId
    if (entity.languageId !== undefined) {
      doc.languageId =
        typeof entity.languageId === 'string'
          ? new Types.ObjectId(entity.languageId)
          : entity.languageId;
    }
    if (entity.siteName !== undefined) doc.siteName = entity.siteName;
    if (entity.metaTitle !== undefined) doc.metaTitle = entity.metaTitle;
    if (entity.metaDescription !== undefined)
      doc.metaDescription = entity.metaDescription;
    if (entity.metaKeyword !== undefined) doc.metaKeyword = entity.metaKeyword;
    if (entity.ogTitle !== undefined) doc.ogTitle = entity.ogTitle;
    if (entity.ogDescription !== undefined)
      doc.ogDescription = entity.ogDescription;
    if (entity.ogImage !== undefined) doc.ogImage = entity.ogImage;
    if (entity.isAIGeneratedImage !== undefined)
      doc.isAIGeneratedImage = entity.isAIGeneratedImage;

    return doc;
  }

  async insert(createDto: CreateMetaSettingDto): Promise<MetaSetting> {
    const metaSetting = new this.metaSettingModel({
      publicId: uuidv4(),
      ...createDto,
      languageId: createDto.languageId
        ? new Types.ObjectId(createDto.languageId)
        : undefined,
    });
    const savedMetaSetting = await metaSetting.save();
    return this.toEntity(savedMetaSetting);
  }

  async findByLanguageId(
    languageId: string
  ): Promise<MetaSettingWithLanguage | null> {
    const metaSetting = await this.metaSettingModel
      .findOne({
        languageId: new Types.ObjectId(languageId),
      })
      .populate('languageId', '-_id -__v')
      .exec();

    return metaSetting
      ? (this.toEntity(metaSetting) as MetaSettingWithLanguage)
      : null;
  }

  async findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<MetaSettingWithLanguage | null> {
    // Same implementation as findByLanguageId since we always need language info
    return this.findByLanguageId(languageId);
  }

  async findByPublicIdWithLanguage(
    publicId: string
  ): Promise<MetaSettingWithLanguage | null> {
    const metaSetting = await this.metaSettingModel
      .findOne({ publicId })
      .populate('languageId', '-_id -__v')
      .exec();

    return metaSetting
      ? (this.toEntity(metaSetting) as MetaSettingWithLanguage)
      : null;
  }

  async createOrUpdateByLanguageId(
    createDto: CreateMetaSettingDto
  ): Promise<MetaSetting> {
    const existing = await this.metaSettingModel
      .findOne({
        languageId: new Types.ObjectId(createDto.languageId),
      })
      .exec();

    if (existing) {
      // Update existing meta setting
      const updateData = this.toDocument({
        siteName: createDto.siteName,
        metaTitle: createDto.metaTitle,
        metaDescription: createDto.metaDescription,
        metaKeyword: createDto.metaKeyword,
        ogTitle: createDto.ogTitle,
        ogDescription: createDto.ogDescription,
        ogImage: createDto.ogImage,
        isAIGeneratedImage: createDto.isAIGeneratedImage || 'NO',
      });

      const updated = await this.metaSettingModel.findByIdAndUpdate(
        existing._id,
        updateData,
        { new: true }
      );

      if (!updated) {
        throw new Error('Failed to update meta setting');
      }

      return this.toEntity(updated);
    } else {
      // Create new meta setting
      return this.insert(createDto);
    }
  }

  async updateByPublicId(
    publicId: string,
    updateDto: UpdateMetaSettingDto
  ): Promise<MetaSetting> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.metaSettingModel.findOneAndUpdate(
      { publicId },
      updateData,
      { new: true }
    );

    if (!doc) {
      throw new Error(`MetaSetting with publicId ${publicId} not found`);
    }

    return this.toEntity(doc);
  }

  async createForAllActiveLanguages(
    createDto: Omit<CreateMetaSettingDto, 'languageId'>
  ): Promise<MetaSetting[]> {
    const languageIds = await this.getAllActiveLanguageIds();

    const metaSettings = languageIds.map((languageId) => ({
      publicId: uuidv4(),
      ...createDto,
      languageId: new Types.ObjectId(languageId), // Convert string to ObjectId
    }));

    const createdMetaSettings =
      await this.metaSettingModel.insertMany(metaSettings);
    return createdMetaSettings.map((metaSetting) =>
      this.toEntity(metaSetting as unknown as MetaSettingDocument)
    );
  }

  async getAllActiveLanguageIds(): Promise<string[]> {
    const languages = await this.languageModel
      .find({
        status: true,
      })
      .select('_id')
      .exec();

    // Return primary keys (_id), NOT publicIds
    return languages.map((lang) =>
      (lang._id as { toString(): string }).toString()
    );
  }

  async getDefaultLanguageId(): Promise<string> {
    const defaultLanguage = await this.languageModel
      .findOne({
        isDefault: 'YES',
        status: true,
      })
      .exec();

    if (!defaultLanguage) {
      throw new Error('No default language found');
    }

    // Return the primary key (_id), NOT the publicId
    return (defaultLanguage._id as { toString(): string }).toString();
  }

  async getLanguageByCode(
    languageCode: string
  ): Promise<{ id: string; folder: string } | null> {
    const language = await this.languageModel
      .findOne({
        folder: languageCode,
        status: true,
      })
      .select('_id folder')
      .exec();

    return language
      ? {
          id: (language._id as { toString(): string }).toString(),
          folder: language.folder,
        }
      : null;
  }

  async existsByLanguageId(languageId: string): Promise<boolean> {
    const metaSetting = await this.metaSettingModel
      .findOne({
        languageId: new Types.ObjectId(languageId),
      })
      .exec();
    return !!metaSetting;
  }

  async deleteByLanguageId(languageId: string): Promise<boolean> {
    try {
      const result = await this.metaSettingModel
        .deleteOne({
          languageId: new Types.ObjectId(languageId),
        })
        .exec();
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  // Base interface implementations
  async getDetail(filter: Partial<MetaSetting>): Promise<MetaSetting | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) {
      mongoFilter.publicId = filter.publicId;
    }
    if (filter.id) {
      mongoFilter._id = filter.id;
    }
    if (filter.languageId) {
      // Handle different languageId formats
      if (typeof filter.languageId === 'string') {
        mongoFilter.languageId = new Types.ObjectId(filter.languageId);
      } else {
        mongoFilter.languageId = filter.languageId;
      }
    }
    if (filter.siteName) {
      mongoFilter.siteName = filter.siteName;
    }

    const doc = await this.metaSettingModel.findOne(mongoFilter);
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<MetaSetting>
  ): Promise<MetaSetting> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.metaSettingModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!doc) {
      throw new Error(`MetaSetting with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.metaSettingModel.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  }
}
