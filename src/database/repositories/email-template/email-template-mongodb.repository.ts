import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import {
  EmailTemplate as EmailTemplateSchema,
  EmailTemplateDocument,
} from '../../schemas/email-template.schema';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateWithLanguage,
  MinimalLanguage,
} from '../../entities/email-template.entity';
import { IEmailTemplateRepository } from './email-template.repository.interface';
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
export class EmailTemplateMongodbRepository
  extends MongoRepository<EmailTemplateDocument, EmailTemplate>
  implements IEmailTemplateRepository
{
  constructor(
    @InjectModel(EmailTemplateSchema.name)
    private emailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(emailTemplateModel);
  }

  protected toEntity(doc: EmailTemplateDocument): EmailTemplate {
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
      task: doc.task,
      senderEmail: doc.senderEmail,
      replyEmail: doc.replyEmail,
      senderName: doc.senderName,
      subject: doc.subject,
      message: doc.message,
      status: doc.status ?? true,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<EmailTemplate>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    // languageId must be the primary key (_id) of the language, not publicId
    if (entity.languageId !== undefined) {
      doc.languageId =
        typeof entity.languageId === 'string'
          ? new Types.ObjectId(entity.languageId)
          : entity.languageId;
    }
    if (entity.task !== undefined) doc.task = entity.task;
    if (entity.senderEmail !== undefined) doc.senderEmail = entity.senderEmail;
    if (entity.replyEmail !== undefined) doc.replyEmail = entity.replyEmail;
    if (entity.senderName !== undefined) doc.senderName = entity.senderName;
    if (entity.subject !== undefined) doc.subject = entity.subject;
    if (entity.message !== undefined) doc.message = entity.message;
    if (entity.status !== undefined) doc.status = entity.status;

    return doc;
  }

  async insert(createDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    // Use default language if languageId is not provided
    const resolvedLanguageId =
      createDto.languageId || (await this.getDefaultLanguageId());

    const emailTemplate = new this.emailTemplateModel({
      publicId: uuidv4(),
      task: createDto.task,
      senderEmail: createDto.senderEmail,
      replyEmail: createDto.replyEmail,
      senderName: createDto.senderName,
      subject: createDto.subject,
      message: createDto.message,
      status: createDto.status ?? true,
      languageId: new Types.ObjectId(resolvedLanguageId),
    });
    const savedEmailTemplate = await emailTemplate.save();
    return this.toEntity(savedEmailTemplate);
  }

  async findByLanguageId(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    const emailTemplate = await this.emailTemplateModel
      .findOne({
        languageId: new Types.ObjectId(languageId),
      })
      .populate('languageId', '-_id -__v')
      .exec();

    return emailTemplate
      ? (this.toEntity(emailTemplate) as EmailTemplateWithLanguage)
      : null;
  }

  async findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    // Same implementation as findByLanguageId since we always need language info
    return this.findByLanguageId(languageId);
  }

  async findByPublicIdWithLanguage(
    publicId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    const emailTemplate = await this.emailTemplateModel
      .findOne({ publicId })
      .populate('languageId', '-_id -__v')
      .exec();

    return emailTemplate
      ? (this.toEntity(emailTemplate) as EmailTemplateWithLanguage)
      : null;
  }

  async findByTaskAndLanguage(
    task: string,
    languageId: string
  ): Promise<EmailTemplate | null> {
    const emailTemplate = await this.emailTemplateModel
      .findOne({
        task,
        languageId: new Types.ObjectId(languageId),
      })
      .exec();

    return emailTemplate ? this.toEntity(emailTemplate) : null;
  }

  async createOrUpdateByLanguageId(
    createDto: CreateEmailTemplateDto
  ): Promise<EmailTemplate> {
    const existing = await this.emailTemplateModel
      .findOne({
        languageId: new Types.ObjectId(createDto.languageId),
      })
      .exec();

    if (existing) {
      // Update existing email template (excluding task which is immutable)
      const updateData = this.toDocument({
        senderEmail: createDto.senderEmail,
        replyEmail: createDto.replyEmail,
        senderName: createDto.senderName,
        subject: createDto.subject,
        message: createDto.message,
        status: createDto.status ?? true,
      });

      const updated = await this.emailTemplateModel.findByIdAndUpdate(
        existing._id,
        updateData,
        { new: true }
      );

      if (!updated) {
        throw new Error('Failed to update email template');
      }

      return this.toEntity(updated);
    } else {
      // Create new email template
      return this.insert(createDto);
    }
  }

  async updateByPublicId(
    publicId: string,
    updateDto: UpdateEmailTemplateDto
  ): Promise<EmailTemplate> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.emailTemplateModel.findOneAndUpdate(
      { publicId },
      updateData,
      { new: true }
    );

    if (!doc) {
      throw new Error(`EmailTemplate with publicId ${publicId} not found`);
    }

    return this.toEntity(doc);
  }

  async createForAllActiveLanguages(
    createDto: Omit<CreateEmailTemplateDto, 'languageId'>
  ): Promise<EmailTemplate[]> {
    const languageIds = await this.getAllActiveLanguageIds();

    const emailTemplates = languageIds.map((languageId) => ({
      publicId: uuidv4(),
      ...createDto,
      languageId: new Types.ObjectId(languageId), // Convert string to ObjectId
      status: createDto.status ?? true,
    }));

    const createdEmailTemplates =
      await this.emailTemplateModel.insertMany(emailTemplates);
    return createdEmailTemplates.map((emailTemplate) =>
      this.toEntity(emailTemplate as unknown as EmailTemplateDocument)
    );
  }

  async bulkUpdateStatus(
    publicIds: string[],
    status: boolean
  ): Promise<number> {
    const result = await this.emailTemplateModel.updateMany(
      {
        publicId: { $in: publicIds },
      },
      {
        $set: { status },
      }
    );
    return result.modifiedCount || 0;
  }

  async bulkUpdateStatusByTask(task: string, status: boolean): Promise<number> {
    const result = await this.emailTemplateModel.updateMany(
      { task },
      { $set: { status } }
    );
    return result.modifiedCount || 0;
  }

  async getAll(
    filter: object = {},
    options?: QueryOptions
  ): Promise<EmailTemplate[]> {
    // Convert filter for MongoDB compatibility
    const mongoFilter = { ...filter };

    // Handle languageId conversion from string to ObjectId
    if ('languageId' in mongoFilter && mongoFilter.languageId) {
      mongoFilter.languageId =
        typeof mongoFilter.languageId === 'string'
          ? new Types.ObjectId(mongoFilter.languageId)
          : mongoFilter.languageId;
    }

    // Execute query with language population for consistency
    const query = this.emailTemplateModel.find(mongoFilter);
    const populatedQuery = query.populate('languageId', '-_id -__v');
    const docs = await this.applyQueryOptions(populatedQuery, options).exec();
    return docs.map((doc) => this.toEntity(doc));
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
    const emailTemplate = await this.emailTemplateModel
      .findOne({
        languageId: new Types.ObjectId(languageId),
      })
      .exec();
    return !!emailTemplate;
  }

  async existsByTaskAndLanguage(
    task: string,
    languageId: string
  ): Promise<boolean> {
    const emailTemplate = await this.emailTemplateModel
      .findOne({
        task,
        languageId: new Types.ObjectId(languageId),
      })
      .exec();
    return !!emailTemplate;
  }

  async deleteByLanguageId(languageId: string): Promise<boolean> {
    try {
      const result = await this.emailTemplateModel
        .deleteOne({
          languageId: new Types.ObjectId(languageId),
        })
        .exec();
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  async findByStatusWithLanguage(
    status: boolean,
    languageId?: string
  ): Promise<EmailTemplateWithLanguage[]> {
    const filter: Record<string, unknown> = { status };
    if (languageId) {
      filter.languageId = new Types.ObjectId(languageId);
    }

    const emailTemplates = await this.emailTemplateModel
      .find(filter)
      .populate('languageId', '-_id -__v')
      .sort({ createdAt: -1 })
      .exec();

    return emailTemplates.map((emailTemplate) =>
      this.toEntity(emailTemplate)
    ) as EmailTemplateWithLanguage[];
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<EmailTemplate>
  ): Promise<EmailTemplate | null> {
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
    if (filter.task) {
      mongoFilter.task = filter.task;
    }
    if (filter.status !== undefined) {
      mongoFilter.status = filter.status;
    }

    const doc = await this.emailTemplateModel.findOne(mongoFilter);
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.emailTemplateModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    if (!doc) {
      throw new Error(`EmailTemplate with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.emailTemplateModel.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      const result = await this.emailTemplateModel
        .deleteOne({ publicId })
        .exec();
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  async deleteByTask(task: string): Promise<number> {
    try {
      const result = await this.emailTemplateModel.deleteMany({ task }).exec();
      return result.deletedCount || 0;
    } catch {
      return 0;
    }
  }

  async findWithPaginationAndLanguage(
    languageCode: string,
    page: number,
    limit: number
  ): Promise<{
    data: EmailTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Get language by code to find the language ID
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    const filter = {
      languageId: new Types.ObjectId(language.id),
    };

    const [total, emailTemplates] = await Promise.all([
      this.emailTemplateModel.countDocuments(filter).exec(),
      this.emailTemplateModel
        .find(filter)
        .populate('languageId', '-_id -__v')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    const data = emailTemplates.map((emailTemplate) =>
      this.toEntity(emailTemplate)
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: Partial<EmailTemplate>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<EmailTemplate>> {
    // Build search conditions using the provided search fields
    const searchConditions = {
      $or: searchFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    };

    // Build additional filters
    const additionalFilters: Record<string, unknown> = {};
    if (filter?.languageId) {
      additionalFilters.languageId =
        typeof filter.languageId === 'string'
          ? new Types.ObjectId(filter.languageId)
          : filter.languageId;
    }
    if (filter?.status !== undefined) {
      additionalFilters.status = filter.status;
    }
    if (filter?.senderEmail) {
      additionalFilters.senderEmail = {
        $regex: filter.senderEmail,
        $options: 'i',
      };
    }

    const mongoFilter = {
      $and: [searchConditions, additionalFilters],
    };

    // Build sort order and pagination defaults
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const sort: Record<string, 1 | -1> = options?.sort || { createdAt: -1 };

    const [total, emailTemplates] = await Promise.all([
      this.emailTemplateModel.countDocuments(mongoFilter).exec(),
      this.emailTemplateModel
        .find(mongoFilter)
        .populate('languageId', '-_id -__v')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sort)
        .exec(),
    ]);

    const items = emailTemplates.map((emailTemplate) =>
      this.toEntity(emailTemplate)
    );

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

  async findAllWithPagination(
    page: number,
    limit: number,
    includeInactive: boolean,
    languageId?: string
  ): Promise<{
    data: EmailTemplateWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const mongoFilter: Record<string, unknown> = {};

    if (!includeInactive) {
      mongoFilter.status = true;
    }

    // Use the resolved languageId if provided (already resolved by service layer)
    if (languageId) {
      mongoFilter.languageId = new Types.ObjectId(languageId);
    }

    const [emailTemplates, total] = await Promise.all([
      this.emailTemplateModel
        .find(mongoFilter)
        .populate('languageId', '-_id -__v')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.emailTemplateModel.countDocuments(mongoFilter).exec(),
    ]);

    return {
      data: emailTemplates.map((template) =>
        this.toEntity(template)
      ) as EmailTemplateWithLanguage[],
      total,
      page,
      limit,
    };
  }
}
