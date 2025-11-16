import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  RevenueSubscription,
  RevenueSubscriptionWithLanguage,
  CreateRevenueSubscriptionDto,
} from '../../entities/revenue-subscription.entity';
import {
  RevenueSubscription as RevenueSubscriptionSchema,
  RevenueSubscriptionDocument,
} from '../../schemas/revenue-subscription.schema';
import {
  RevenueSubscriptionLanguage as RevenueSubscriptionLanguageSchema,
  RevenueSubscriptionLanguageDocument,
} from '../../schemas/revenue-subscription-language.schema';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import { IRevenueSubscriptionRepository } from './revenue-subscription.repository.interface';
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
export class RevenueSubscriptionMongoRepository
  extends MongoRepository<RevenueSubscriptionDocument, RevenueSubscription>
  implements IRevenueSubscriptionRepository
{
  constructor(
    @InjectModel(RevenueSubscriptionSchema.name)
    private revenueSubscriptionModel: Model<RevenueSubscriptionDocument>,
    @InjectModel(RevenueSubscriptionLanguageSchema.name)
    private revenueSubscriptionLanguageModel: Model<RevenueSubscriptionLanguageDocument>,
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(revenueSubscriptionModel);
  }

  protected toEntity(
    document: RevenueSubscriptionDocument
  ): RevenueSubscription {
    const entity: RevenueSubscription = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: document.id ?? document._id?.toString() ?? '',
      publicId: document.publicId,
      subscriptionType: document.subscriptionType,
      amount: document.amount,
      maxInvestmentAllowed: document.maxInvestmentAllowed,
      maxProjectAllowed: document.maxProjectAllowed,
      maxProjectGoalLimit: document.maxProjectGoalLimit,
      allowRefund: document.allowRefund,
      allowRefundDays: document.allowRefundDays,
      allowCancel: document.allowCancel,
      allowCancelDays: document.allowCancelDays,
      secondaryMarketAccess: document.secondaryMarketAccess,
      earlyBirdAccess: document.earlyBirdAccess,
      useCount: document.useCount,
      status: document.status,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    };
    return entity;
  }

  protected toDocument(
    entity: Partial<RevenueSubscription>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    if (entity.subscriptionType !== undefined)
      doc.subscriptionType = entity.subscriptionType;
    if (entity.amount !== undefined) doc.amount = entity.amount;
    if (entity.maxInvestmentAllowed !== undefined)
      doc.maxInvestmentAllowed = entity.maxInvestmentAllowed;
    if (entity.maxProjectAllowed !== undefined)
      doc.maxProjectAllowed = entity.maxProjectAllowed;
    if (entity.maxProjectGoalLimit !== undefined)
      doc.maxProjectGoalLimit = entity.maxProjectGoalLimit;
    if (entity.allowRefund !== undefined) doc.allowRefund = entity.allowRefund;
    if (entity.allowRefundDays !== undefined)
      doc.allowRefundDays = entity.allowRefundDays;
    if (entity.allowCancel !== undefined) doc.allowCancel = entity.allowCancel;
    if (entity.allowCancelDays !== undefined)
      doc.allowCancelDays = entity.allowCancelDays;
    if (entity.secondaryMarketAccess !== undefined)
      doc.secondaryMarketAccess = entity.secondaryMarketAccess;
    if (entity.earlyBirdAccess !== undefined)
      doc.earlyBirdAccess = entity.earlyBirdAccess;
    if (entity.useCount !== undefined) doc.useCount = entity.useCount;
    if (entity.status !== undefined) doc.status = entity.status;

    return doc;
  }

  async insert(
    createDto: CreateRevenueSubscriptionDto
  ): Promise<RevenueSubscription> {
    const subscriptionData = {
      publicId: uuidv4(),
      subscriptionType: createDto.subscriptionType,
      amount: createDto.amount,
      maxInvestmentAllowed: createDto.maxInvestmentAllowed,
      maxProjectAllowed: createDto.maxProjectAllowed,
      maxProjectGoalLimit: createDto.maxProjectGoalLimit,
      allowRefund: createDto.allowRefund ?? true,
      allowRefundDays: createDto.allowRefundDays,
      allowCancel: createDto.allowCancel ?? true,
      allowCancelDays: createDto.allowCancelDays,
      secondaryMarketAccess: createDto.secondaryMarketAccess,
      earlyBirdAccess: createDto.earlyBirdAccess ?? true,
      status: createDto.status ?? true,
    };

    const document = new this.revenueSubscriptionModel(subscriptionData);
    const savedDocument = await document.save();
    return this.toEntity(savedDocument);
  }

  async findForPublic(
    languageId: string
  ): Promise<RevenueSubscriptionWithLanguage[]> {
    const subscriptions = await this.revenueSubscriptionModel
      .find({ status: true })
      .sort({ createdAt: -1 })
      .exec();

    // Get default language ID for fallback
    const defaultLanguageId = await this.getDefaultLanguageId();

    // Get language contents for all subscriptions
    const subscriptionWithLanguage: RevenueSubscriptionWithLanguage[] = [];

    for (const subscription of subscriptions) {
      // First try to find content for the requested language
      let languageContent = await this.revenueSubscriptionLanguageModel
        .findOne({
          mainSubscriptionId: subscription._id,
          languageId: new Types.ObjectId(languageId),
        })
        .populate('languageId', '-__v')
        .exec();

      // If not found, try default language as fallback
      if (!languageContent) {
        languageContent = await this.revenueSubscriptionLanguageModel
          .findOne({
            mainSubscriptionId: subscription._id,
            languageId: new Types.ObjectId(defaultLanguageId),
          })
          .populate('languageId', '-__v')
          .exec();
      }

      if (languageContent) {
        const populatedLanguage =
          languageContent.languageId as unknown as PopulatedLanguageDocument;
        subscriptionWithLanguage.push({
          ...this.toEntity(subscription),
          title: languageContent.title,
          description: languageContent.description,
          language: populatedLanguage
            ? {
                publicId: populatedLanguage.publicId,
                name: populatedLanguage.name,
              }
            : undefined,
        });
      }
    }

    return subscriptionWithLanguage;
  }

  async findWithPaginationAndLanguage(
    page: number,
    limit: number,
    languageId: string,
    subscriptionType?: 'INVESTOR' | 'SPONSOR',
    includeInactive = false
  ): Promise<{
    data: RevenueSubscriptionWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (subscriptionType) {
      filter.subscriptionType = subscriptionType;
    }

    if (!includeInactive) {
      filter.status = true;
    }

    const [subscriptions, total] = await Promise.all([
      this.revenueSubscriptionModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.revenueSubscriptionModel.countDocuments(filter).exec(),
    ]);

    // Get default language ID for fallback
    const defaultLanguageId = await this.getDefaultLanguageId();

    // Get language contents for all subscriptions
    const data: RevenueSubscriptionWithLanguage[] = [];

    for (const subscription of subscriptions) {
      // First try to find content for the requested language
      let languageContent = await this.revenueSubscriptionLanguageModel
        .findOne({
          mainSubscriptionId: subscription._id,
          languageId: new Types.ObjectId(languageId),
        })
        .populate('languageId', '-__v')
        .exec();

      // If not found, try default language as fallback
      if (!languageContent) {
        languageContent = await this.revenueSubscriptionLanguageModel
          .findOne({
            mainSubscriptionId: subscription._id,
            languageId: new Types.ObjectId(defaultLanguageId),
          })
          .populate('languageId', '-__v')
          .exec();
      }

      if (languageContent) {
        const populatedLanguage =
          languageContent.languageId as unknown as PopulatedLanguageDocument;
        data.push({
          ...this.toEntity(subscription),
          title: languageContent.title,
          description: languageContent.description,
          language: populatedLanguage
            ? {
                publicId: populatedLanguage.publicId,
                name: populatedLanguage.name,
              }
            : undefined,
        });
      }
    }

    return { data, total, page, limit };
  }

  async findByPublicIdWithLanguage(
    publicId: string,
    languageId: string
  ): Promise<RevenueSubscriptionWithLanguage | null> {
    const subscription = await this.revenueSubscriptionModel
      .findOne({ publicId })
      .exec();

    if (!subscription) {
      return null;
    }

    // Convert to entity first to get the consistent ID format used in creation
    const subscriptionEntity = this.toEntity(subscription);

    // Use the same ObjectId conversion pattern as used in creation
    const mainSubscriptionObjectId = new Types.ObjectId(subscriptionEntity.id);
    const languageObjectId = new Types.ObjectId(languageId);

    // First try to find content for the requested language
    let languageContent = await this.revenueSubscriptionLanguageModel
      .findOne({
        mainSubscriptionId: mainSubscriptionObjectId,
        languageId: languageObjectId,
      })
      .populate('languageId', '-__v')
      .exec();

    // If not found, try to get default language content as fallback
    if (!languageContent) {
      const defaultLanguageId = await this.getDefaultLanguageId();
      const defaultLanguageObjectId = new Types.ObjectId(defaultLanguageId);

      languageContent = await this.revenueSubscriptionLanguageModel
        .findOne({
          mainSubscriptionId: mainSubscriptionObjectId,
          languageId: defaultLanguageObjectId,
        })
        .populate('languageId', '-__v')
        .exec();
    }

    // If still no content found, return null
    if (!languageContent) {
      return null;
    }

    const populatedLanguage =
      languageContent.languageId as unknown as PopulatedLanguageDocument;

    return {
      ...subscriptionEntity,
      title: languageContent.title,
      description: languageContent.description,
      language: populatedLanguage
        ? {
            publicId: populatedLanguage.publicId,
            name: populatedLanguage.name,
          }
        : undefined,
    };
  }

  async createWithMultiLanguageContent(
    createDto: CreateRevenueSubscriptionDto,
    languageIds: string[]
  ): Promise<RevenueSubscription> {
    // First create the main subscription
    const subscription = await this.insert(createDto);

    // Then create language content for all languages
    const languageContents = languageIds.map((languageId) => ({
      publicId: uuidv4(),
      mainSubscriptionId: new Types.ObjectId(subscription.id),
      title: createDto.title,
      description: createDto.description,
      languageId: new Types.ObjectId(languageId),
    }));

    await this.revenueSubscriptionLanguageModel.insertMany(languageContents);

    return subscription;
  }

  async updateByPublicIdWithLanguage(
    publicId: string,
    updateDto: Partial<RevenueSubscription>,
    languageContents?: Array<{
      languageId: string;
      title: string;
      description: string;
    }>
  ): Promise<RevenueSubscription> {
    const updateData = this.toDocument(updateDto);

    const document = await this.revenueSubscriptionModel
      .findOneAndUpdate({ publicId }, updateData, { new: true })
      .exec();

    if (!document) {
      throw new Error(
        `Revenue subscription with publicId ${publicId} not found`
      );
    }

    // Update language content if provided
    if (languageContents && languageContents.length > 0) {
      for (const langContent of languageContents) {
        const langUpdateData: Record<string, unknown> = {
          title: langContent.title,
          description: langContent.description,
        };

        await this.revenueSubscriptionLanguageModel
          .updateMany(
            {
              mainSubscriptionId: document._id,
              languageId: new Types.ObjectId(langContent.languageId),
            },
            langUpdateData
          )
          .exec();
      }
    }

    return this.toEntity(document);
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      // First check if subscription is in use
      const subscription = await this.revenueSubscriptionModel
        .findOne({ publicId })
        .select('useCount')
        .exec();

      if (!subscription) {
        return false;
      }

      if (subscription.useCount > 0) {
        throw new Error(
          `Cannot delete revenue subscription with useCount: ${subscription.useCount}`
        );
      }

      // Delete language contents first
      await this.revenueSubscriptionLanguageModel
        .deleteMany({ mainSubscriptionId: subscription._id })
        .exec();

      // Then delete main subscription
      const result = await this.revenueSubscriptionModel
        .deleteOne({ publicId })
        .exec();

      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    await this.revenueSubscriptionModel
      .updateOne({ publicId }, { $inc: { useCount: 1 } })
      .exec();
  }

  async decrementUseCount(publicId: string): Promise<void> {
    await this.revenueSubscriptionModel
      .updateOne({ publicId }, { $inc: { useCount: -1 } })
      .exec();
  }

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<RevenueSubscription>
  ): Promise<{ count: number; updated: RevenueSubscription[] }> {
    const updateData = this.toDocument(data);

    const result = await this.revenueSubscriptionModel
      .updateMany({ publicId: { $in: publicIds } }, updateData)
      .exec();

    const updatedDocuments = await this.revenueSubscriptionModel
      .find({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: result.modifiedCount || 0,
      updated: updatedDocuments.map((doc) => this.toEntity(doc)),
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: RevenueSubscription[] }> {
    // First get subscriptions to be deleted for return value
    const subscriptionsToDelete = await this.revenueSubscriptionModel
      .find({ publicId: { $in: publicIds } })
      .exec();

    // Check if any subscription is in use
    for (const subscription of subscriptionsToDelete) {
      if (subscription.useCount > 0) {
        throw new Error(
          `Cannot delete revenue subscription ${subscription.publicId} with useCount: ${subscription.useCount}`
        );
      }
    }

    // Delete language contents first
    await this.revenueSubscriptionLanguageModel
      .deleteMany({
        mainSubscriptionId: {
          $in: subscriptionsToDelete.map((sub) => sub._id),
        },
      })
      .exec();

    // Then delete main subscriptions
    const deleteResult = await this.revenueSubscriptionModel
      .deleteMany({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: deleteResult.deletedCount || 0,
      deleted: subscriptionsToDelete.map((doc) => this.toEntity(doc)),
    };
  }

  async isInUse(publicId: string): Promise<boolean> {
    const document = await this.revenueSubscriptionModel
      .findOne({ publicId })
      .select('useCount')
      .exec();
    return document ? document.useCount > 0 : false;
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

    return (defaultLanguage._id as { toString(): string }).toString();
  }

  async getAllActiveLanguageIds(): Promise<string[]> {
    const languages = await this.languageModel
      .find({
        status: true,
      })
      .select('_id')
      .exec();

    return languages.map((lang) =>
      (lang._id as { toString(): string }).toString()
    );
  }

  validateConditionalFields(
    subscriptionType: 'INVESTOR' | 'SPONSOR',
    data: Partial<CreateRevenueSubscriptionDto>
  ): boolean {
    if (subscriptionType === 'INVESTOR') {
      // For INVESTOR: maxInvestmentAllowed and secondaryMarketAccess are required
      if (
        data.maxInvestmentAllowed === undefined ||
        data.maxInvestmentAllowed === null
      ) {
        return false;
      }
      if (
        data.secondaryMarketAccess === undefined ||
        data.secondaryMarketAccess === null
      ) {
        return false;
      }
      // SPONSOR-specific fields should not be provided
      if (
        data.maxProjectAllowed !== undefined ||
        data.maxProjectGoalLimit !== undefined
      ) {
        return false;
      }
    } else if (subscriptionType === 'SPONSOR') {
      // For SPONSOR: maxProjectAllowed and maxProjectGoalLimit are required
      if (
        data.maxProjectAllowed === undefined ||
        data.maxProjectAllowed === null
      ) {
        return false;
      }
      if (
        data.maxProjectGoalLimit === undefined ||
        data.maxProjectGoalLimit === null
      ) {
        return false;
      }
      // INVESTOR-specific fields should not be provided
      if (
        data.maxInvestmentAllowed !== undefined ||
        data.secondaryMarketAccess !== undefined
      ) {
        return false;
      }
    }

    // Validate allowRefundDays if allowRefund is true
    if (
      data.allowRefund === true &&
      (data.allowRefundDays === undefined || data.allowRefundDays === null)
    ) {
      return false;
    }

    // Validate allowCancelDays if allowCancel is true
    if (
      data.allowCancel === true &&
      (data.allowCancelDays === undefined || data.allowCancelDays === null)
    ) {
      return false;
    }

    return true;
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<RevenueSubscription>
  ): Promise<RevenueSubscription | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) mongoFilter.publicId = filter.publicId;
    if (filter.id) mongoFilter._id = filter.id;
    if (filter.subscriptionType)
      mongoFilter.subscriptionType = filter.subscriptionType;

    const document = await this.revenueSubscriptionModel
      .findOne(mongoFilter)
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<RevenueSubscription>
  ): Promise<RevenueSubscription> {
    const updateData = this.toDocument(updateDto);

    const document = await this.revenueSubscriptionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!document) {
      throw new Error(`Revenue subscription with id ${id} not found`);
    }

    return this.toEntity(document);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.revenueSubscriptionModel
        .findByIdAndDelete(id)
        .exec();
      return result !== null;
    } catch {
      return false;
    }
  }

  protected convertFilterToMongo(
    filter: Partial<RevenueSubscription>
  ): Record<string, unknown> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.subscriptionType) {
      mongoFilter.subscriptionType = filter.subscriptionType;
    }
    if (filter.amount !== undefined) {
      mongoFilter.amount = filter.amount;
    }
    if (filter.status !== undefined) {
      mongoFilter.status = filter.status;
    }

    return mongoFilter;
  }
}
