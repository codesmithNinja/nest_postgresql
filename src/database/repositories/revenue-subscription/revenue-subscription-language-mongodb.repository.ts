import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { RevenueSubscriptionLanguage } from '../../entities/revenue-subscription.entity';
import {
  RevenueSubscriptionLanguage as RevenueSubscriptionLanguageSchema,
  RevenueSubscriptionLanguageDocument,
} from '../../schemas/revenue-subscription-language.schema';
import { IRevenueSubscriptionLanguageRepository } from './revenue-subscription.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RevenueSubscriptionLanguageMongoRepository
  extends MongoRepository<
    RevenueSubscriptionLanguageDocument,
    RevenueSubscriptionLanguage
  >
  implements IRevenueSubscriptionLanguageRepository
{
  constructor(
    @InjectModel(RevenueSubscriptionLanguageSchema.name)
    private revenueSubscriptionLanguageModel: Model<RevenueSubscriptionLanguageDocument>
  ) {
    super(revenueSubscriptionLanguageModel);
  }

  protected toEntity(
    document: RevenueSubscriptionLanguageDocument
  ): RevenueSubscriptionLanguage {
    const entity: RevenueSubscriptionLanguage = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: document.id ?? document._id?.toString() ?? '',
      publicId: document.publicId,
      mainSubscriptionId:
        typeof document.mainSubscriptionId === 'object'
          ? (document.mainSubscriptionId as { toString(): string }).toString()
          : document.mainSubscriptionId,
      title: document.title,
      description: document.description,
      languageId:
        typeof document.languageId === 'object'
          ? (document.languageId as { toString(): string }).toString()
          : document.languageId,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    };
    return entity;
  }

  protected toDocument(
    entity: Partial<RevenueSubscriptionLanguage>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    if (entity.mainSubscriptionId !== undefined) {
      doc.mainSubscriptionId =
        typeof entity.mainSubscriptionId === 'string'
          ? new Types.ObjectId(entity.mainSubscriptionId)
          : entity.mainSubscriptionId;
    }
    if (entity.title !== undefined) doc.title = entity.title;
    if (entity.description !== undefined) doc.description = entity.description;
    if (entity.languageId !== undefined) {
      doc.languageId =
        typeof entity.languageId === 'string'
          ? new Types.ObjectId(entity.languageId)
          : entity.languageId;
    }

    return doc;
  }

  async insert(
    data: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const languageContentData = {
      publicId: uuidv4(),
      mainSubscriptionId: new Types.ObjectId(data.mainSubscriptionId!),
      title: data.title!,
      description: data.description!,
      languageId: new Types.ObjectId(data.languageId!),
    };

    const document = new this.revenueSubscriptionLanguageModel(
      languageContentData
    );
    const savedDocument = await document.save();
    return this.toEntity(savedDocument);
  }

  async findByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<RevenueSubscriptionLanguage | null> {
    const document = await this.revenueSubscriptionLanguageModel
      .findOne({
        mainSubscriptionId: new Types.ObjectId(mainSubscriptionId),
        languageId: new Types.ObjectId(languageId),
      })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async findByMainSubscriptionId(
    mainSubscriptionId: string
  ): Promise<RevenueSubscriptionLanguage[]> {
    const documents = await this.revenueSubscriptionLanguageModel
      .find({ mainSubscriptionId: new Types.ObjectId(mainSubscriptionId) })
      .sort({ createdAt: -1 })
      .exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async createMultiLanguageContent(
    mainSubscriptionId: string,
    languageContents: Array<{
      languageId: string;
      title: string;
      description: string;
    }>
  ): Promise<RevenueSubscriptionLanguage[]> {
    const contents = languageContents.map((content) => ({
      publicId: uuidv4(),
      mainSubscriptionId: new Types.ObjectId(mainSubscriptionId),
      title: content.title,
      description: content.description,
      languageId: new Types.ObjectId(content.languageId),
    }));

    const createdDocuments =
      await this.revenueSubscriptionLanguageModel.insertMany(contents);
    return createdDocuments.map((doc) =>
      this.toEntity(doc as unknown as RevenueSubscriptionLanguageDocument)
    );
  }

  async updateByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string,
    updateDto: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;

    const document = await this.revenueSubscriptionLanguageModel
      .findOneAndUpdate(
        {
          mainSubscriptionId: new Types.ObjectId(mainSubscriptionId),
          languageId: new Types.ObjectId(languageId),
        },
        updateData,
        { new: true }
      )
      .exec();

    if (!document) {
      throw new Error(
        `Revenue subscription language content not found for subscription ${mainSubscriptionId} and language ${languageId}`
      );
    }

    return this.toEntity(document);
  }

  async deleteByMainSubscriptionId(
    mainSubscriptionId: string
  ): Promise<number> {
    const result = await this.revenueSubscriptionLanguageModel
      .deleteMany({
        mainSubscriptionId: new Types.ObjectId(mainSubscriptionId),
      })
      .exec();
    return result.deletedCount || 0;
  }

  async deleteByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<boolean> {
    try {
      const result = await this.revenueSubscriptionLanguageModel
        .deleteMany({
          mainSubscriptionId: new Types.ObjectId(mainSubscriptionId),
          languageId: new Types.ObjectId(languageId),
        })
        .exec();
      return (result.deletedCount || 0) > 0;
    } catch {
      return false;
    }
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) mongoFilter.publicId = filter.publicId;
    if (filter.id) mongoFilter._id = filter.id;
    if (filter.mainSubscriptionId) {
      mongoFilter.mainSubscriptionId = new Types.ObjectId(
        filter.mainSubscriptionId
      );
    }
    if (filter.languageId) {
      mongoFilter.languageId = new Types.ObjectId(filter.languageId);
    }

    const document = await this.revenueSubscriptionLanguageModel
      .findOne(mongoFilter)
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const updateData = this.toDocument(updateDto);

    const document = await this.revenueSubscriptionLanguageModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!document) {
      throw new Error(
        `Revenue subscription language content with id ${id} not found`
      );
    }

    return this.toEntity(document);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.revenueSubscriptionLanguageModel
        .findByIdAndDelete(id)
        .exec();
      return result !== null;
    } catch {
      return false;
    }
  }

  protected convertFilterToMongo(
    filter: Partial<RevenueSubscriptionLanguage>
  ): Record<string, unknown> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.mainSubscriptionId) {
      mongoFilter.mainSubscriptionId = new Types.ObjectId(
        filter.mainSubscriptionId
      );
    }
    if (filter.languageId) {
      mongoFilter.languageId = new Types.ObjectId(filter.languageId);
    }
    if (filter.title) {
      mongoFilter.title = { $regex: filter.title, $options: 'i' };
    }
    if (filter.description) {
      mongoFilter.description = { $regex: filter.description, $options: 'i' };
    }

    return mongoFilter;
  }
}
