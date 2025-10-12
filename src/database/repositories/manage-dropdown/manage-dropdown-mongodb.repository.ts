import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  ManageDropdown as ManageDropdownSchema,
  ManageDropdownDocument,
} from '../../schemas/manage-dropdown.schema';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
  BulkOperationDto,
  MinimalLanguage,
} from '../../entities/manage-dropdown.entity';
import { IManageDropdownRepository } from './manage-dropdown.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
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
export class ManageDropdownMongodbRepository
  extends MongoRepository<ManageDropdownDocument, ManageDropdown>
  implements IManageDropdownRepository
{
  constructor(
    @InjectModel(ManageDropdownSchema.name)
    private manageDropdownModel: Model<ManageDropdownDocument>,
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(manageDropdownModel);
  }

  protected toEntity(doc: ManageDropdownDocument): ManageDropdown {
    return {
      id: (doc._id as { toString(): string }).toString(),
      publicId: doc.publicId,
      name: doc.name,
      uniqueCode: doc.uniqueCode || 0,
      dropdownType: doc.dropdownType,
      // languageId should always be the primary key (_id) of the language
      // When populated, we extract the minimal language info for display
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
      status: doc.status,
      useCount: doc.useCount,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<ManageDropdown>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.name !== undefined) doc.name = entity.name;
    if (entity.uniqueCode !== undefined) doc.uniqueCode = entity.uniqueCode;
    if (entity.dropdownType !== undefined)
      doc.dropdownType = entity.dropdownType;
    // languageId must be the primary key (_id) of the language, not publicId
    if (entity.languageId !== undefined) doc.languageId = entity.languageId;
    if (entity.status !== undefined) doc.status = entity.status;
    if (entity.useCount !== undefined) doc.useCount = entity.useCount;
    if (entity.publicId !== undefined) doc.publicId = entity.publicId;

    return doc;
  }

  async insert(createDto: CreateManageDropdownDto): Promise<ManageDropdown> {
    const dropdown = new this.manageDropdownModel({
      publicId: uuidv4(),
      ...createDto,
    });
    const savedDropdown = await dropdown.save();
    return this.toEntity(savedDropdown);
  }

  async findByType(
    dropdownType: string,
    includeInactive = false
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: Record<string, unknown> = { dropdownType };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const dropdowns = await this.manageDropdownModel
      .find(whereClause)
      .populate('languageId', '-_id -__v')
      .sort({ name: 1 })
      .exec();
    return dropdowns.map((dropdown) =>
      this.toEntity(dropdown)
    ) as ManageDropdownWithLanguage[];
  }

  async findByTypeAndLanguage(
    dropdownType: string,
    languageId: string
  ): Promise<ManageDropdown[]> {
    const dropdowns = await this.manageDropdownModel
      .find({
        dropdownType,
        languageId,
        status: true,
      })
      .sort({ name: 1 })
      .exec();
    return dropdowns.map((dropdown) => this.toEntity(dropdown));
  }

  async findByPublicId(
    publicId: string
  ): Promise<ManageDropdownWithLanguage | null> {
    const dropdown = await this.manageDropdownModel
      .findOne({ publicId })
      .populate('languageId', '-_id -__v')
      .exec();
    return dropdown
      ? (this.toEntity(dropdown) as ManageDropdownWithLanguage)
      : null;
  }

  async findByTypeForPublic(
    dropdownType: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: Record<string, unknown> = {
      dropdownType,
      status: true,
    };

    // If languageId is provided, use it; otherwise get default language
    if (languageId) {
      whereClause.languageId = languageId;
    } else {
      const defaultLanguageId = await this.getDefaultLanguageId();
      whereClause.languageId = defaultLanguageId;
    }

    const dropdowns = await this.manageDropdownModel
      .find(whereClause)
      .populate('languageId', '-_id -__v')
      .sort({ name: 1 })
      .exec();

    return dropdowns.map((dropdown) =>
      this.toEntity(dropdown)
    ) as ManageDropdownWithLanguage[];
  }

  async createMultiLanguage(
    createDto: CreateManageDropdownDto,
    languageIds: string[]
  ): Promise<ManageDropdown[]> {
    const dropdowns = languageIds.map((languageId) => ({
      publicId: uuidv4(),
      ...createDto,
      languageId,
    }));

    const createdDropdowns =
      await this.manageDropdownModel.insertMany(dropdowns);
    return createdDropdowns.map((dropdown) =>
      this.toEntity(dropdown as ManageDropdownDocument)
    );
  }

  async incrementUseCount(id: string): Promise<void> {
    await this.manageDropdownModel
      .findByIdAndUpdate(id, { $inc: { useCount: 1 } })
      .exec();
  }

  async bulkOperation(bulkDto: BulkOperationDto): Promise<number> {
    let updateData: Record<string, unknown> = {};

    switch (bulkDto.action) {
      case 'activate':
        updateData = { status: true };
        break;
      case 'deactivate':
        updateData = { status: false };
        break;
      case 'delete':
        updateData = { status: false };
        break;
      default:
        throw new Error(`Unsupported bulk action: ${String(bulkDto.action)}`);
    }

    const result = await this.manageDropdownModel
      .updateMany({ publicId: { $in: bulkDto.publicIds } }, updateData)
      .exec();

    return result.modifiedCount;
  }

  async findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive = false,
    languageId?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = { dropdownType };

    if (!includeInactive) {
      whereClause.status = true;
    }

    // If languageId is provided, use it; otherwise get default language
    if (languageId) {
      whereClause.languageId = languageId;
    } else {
      const defaultLanguageId = await this.getDefaultLanguageId();
      whereClause.languageId = defaultLanguageId;
    }

    const [dropdowns, total] = await Promise.all([
      this.manageDropdownModel
        .find(whereClause)
        .populate('languageId', '-_id -__v')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.manageDropdownModel.countDocuments(whereClause),
    ]);

    return {
      data: dropdowns.map((dropdown) =>
        this.toEntity(dropdown)
      ) as ManageDropdownWithLanguage[],
      total,
      page,
      limit,
    };
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<ManageDropdown>
  ): Promise<ManageDropdown | null> {
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
    if (filter.dropdownType) {
      mongoFilter.dropdownType = filter.dropdownType;
    }

    const doc = await this.manageDropdownModel.findOne(mongoFilter);
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<ManageDropdown>
  ): Promise<ManageDropdown> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.manageDropdownModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!doc) {
      throw new Error(`ManageDropdown with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.manageDropdownModel.findByIdAndUpdate(
        id,
        { status: false },
        { new: true }
      );
      return !!result;
    } catch {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<ManageDropdown>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ManageDropdown>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, unknown> = {};
    if (filter) {
      if (filter.name) {
        mongoFilter.name = { $regex: filter.name, $options: 'i' };
      }
      if (filter.dropdownType) {
        mongoFilter.dropdownType = filter.dropdownType;
      }
      if (filter.status !== undefined) {
        mongoFilter.status = filter.status;
      }
      if (filter.languageId) {
        mongoFilter.languageId = filter.languageId;
      }
    }

    const [docs, total] = await Promise.all([
      this.manageDropdownModel
        .find(mongoFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.manageDropdownModel.countDocuments(mongoFilter),
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

  async findByUniqueCode(
    uniqueCode: number
  ): Promise<ManageDropdownWithLanguage[]> {
    const dropdowns = await this.manageDropdownModel
      .find({ uniqueCode })
      .populate('languageId', '-_id -__v')
      .sort({ createdAt: -1 })
      .exec();

    return dropdowns.map((dropdown) =>
      this.toEntity(dropdown)
    ) as ManageDropdownWithLanguage[];
  }

  async findSingleByTypeAndLanguage(
    dropdownType: string,
    publicId: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage | null> {
    const whereClause: Record<string, unknown> = {
      dropdownType,
      publicId,
    };

    // If languageId is provided, use it; otherwise get default language
    if (languageId) {
      whereClause.languageId = languageId;
    } else {
      const defaultLanguageId = await this.getDefaultLanguageId();
      whereClause.languageId = defaultLanguageId;
    }

    const dropdown = await this.manageDropdownModel
      .findOne(whereClause)
      .populate('languageId', '-_id -__v')
      .exec();

    return dropdown
      ? (this.toEntity(dropdown) as ManageDropdownWithLanguage)
      : null;
  }

  async generateUniqueCode(): Promise<number> {
    // Generate a random 10-digit number
    const min = 1000000000; // 10^9
    const max = 9999999999; // 10^10 - 1

    let uniqueCode: number;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;

      // Check if this code already exists
      const existing = await this.manageDropdownModel
        .findOne({ uniqueCode })
        .exec();
      if (!existing) {
        isUnique = true;
        return uniqueCode;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique code after maximum attempts');
  }

  /**
   * Gets the primary key (_id) of the default language, NOT the publicId
   * This is used for foreign key relationships in the database
   * @returns Promise<string> The primary key (_id) of the default language
   */
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

  /**
   * Gets all active language primary keys (_id), NOT the publicIds
   * These are used for foreign key relationships in the database
   * @returns Promise<string[]> Array of primary keys (_id) of active languages
   */
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

  async deleteByUniqueCode(uniqueCode: number): Promise<number> {
    // Check useCount before deletion
    const dropdowns = await this.manageDropdownModel
      .find({ uniqueCode })
      .exec();

    for (const dropdown of dropdowns) {
      if (dropdown.useCount > 0) {
        throw new Error(
          `Cannot delete dropdown with unique code ${uniqueCode}. It has useCount: ${dropdown.useCount}`
        );
      }
    }

    // Delete all language variants of this unique code
    const result = await this.manageDropdownModel
      .deleteMany({ uniqueCode })
      .exec();
    return result.deletedCount || 0;
  }
}
