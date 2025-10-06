import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  ManageDropdown as ManageDropdownSchema,
  ManageDropdownDocument,
} from '../../schemas/manage-dropdown.schema';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  UpdateManageDropdownDto,
  ManageDropdownWithLanguage,
  BulkOperationDto,
} from '../../entities/manage-dropdown.entity';
import { IManageDropdownRepository } from './manage-dropdown.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ManageDropdownMongodbRepository
  extends MongoRepository<ManageDropdownDocument, ManageDropdown>
  implements IManageDropdownRepository
{
  constructor(
    @InjectModel(ManageDropdownSchema.name)
    private manageDropdownModel: Model<ManageDropdownDocument>
  ) {
    super(manageDropdownModel);
  }

  protected toEntity(doc: ManageDropdownDocument): ManageDropdown {
    return {
      id: (doc._id as any).toString(),
      publicId: doc.publicId,
      name: doc.name,
      uniqueCode: doc.uniqueCode,
      dropdownType: doc.dropdownType,
      countryShortCode: doc.countryShortCode,
      isDefault: doc.isDefault,
      languageId: (doc.languageId as any)?.toString() || doc.languageId,
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
    if (entity.countryShortCode !== undefined)
      doc.countryShortCode = entity.countryShortCode;
    if (entity.isDefault !== undefined) doc.isDefault = entity.isDefault;
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
    const whereClause: any = { dropdownType };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const dropdowns = await this.manageDropdownModel
      .find(whereClause)
      .populate('languageId', '-_id -__v')
      .sort({ name: 1 })
      .exec();
    return dropdowns.map((dropdown) => ({
      ...this.toEntity(dropdown),
      language: (dropdown as any).languageId,
    })) as ManageDropdownWithLanguage[];
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
      ? ({
          ...this.toEntity(dropdown),
          language: (dropdown as any).languageId,
        } as ManageDropdownWithLanguage)
      : null;
  }

  async findByTypeForPublic(
    dropdownType: string,
    languageCode?: string
  ): Promise<ManageDropdownWithLanguage[]> {
    let dropdowns;

    if (languageCode) {
      dropdowns = await this.manageDropdownModel
        .find({
          dropdownType,
          status: true,
        })
        .populate({
          path: 'languageId',
          match: { code: languageCode, status: true },
          select: '-_id -__v',
        })
        .sort({ name: 1 })
        .exec();

      // Filter out dropdowns where language population failed
      dropdowns = dropdowns.filter((dropdown) => dropdown.languageId);
    } else {
      dropdowns = await this.manageDropdownModel
        .find({
          dropdownType,
          status: true,
        })
        .populate('languageId', '-_id -__v')
        .sort({ name: 1 })
        .exec();
    }

    return dropdowns.map((dropdown) => ({
      ...this.toEntity(dropdown),
      language: (dropdown as any).languageId,
    })) as ManageDropdownWithLanguage[];
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
    let updateData: any = {};

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
        throw new Error(`Unsupported bulk action: ${bulkDto.action}`);
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
    languageCode?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: any = { dropdownType };

    if (!includeInactive) {
      whereClause.status = true;
    }

    let dropdowns, total;

    if (languageCode) {
      // Filter by language code using population matching
      [dropdowns, total] = await Promise.all([
        this.manageDropdownModel
          .find(whereClause)
          .populate({
            path: 'languageId',
            match: { code: languageCode, status: true },
            select: '-_id -__v',
          })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.manageDropdownModel
          .aggregate([
            { $match: whereClause },
            {
              $lookup: {
                from: 'languages',
                localField: 'languageId',
                foreignField: '_id',
                as: 'language',
              },
            },
            { $unwind: '$language' },
            {
              $match: {
                'language.code': languageCode,
                'language.status': true,
              },
            },
            { $count: 'total' },
          ])
          .exec()
          .then((result) => result[0]?.total || 0),
      ]);

      // Filter out dropdowns where language population failed
      dropdowns = dropdowns.filter((dropdown) => dropdown.languageId);
    } else {
      [dropdowns, total] = await Promise.all([
        this.manageDropdownModel
          .find(whereClause)
          .populate('languageId', '-_id -__v')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.manageDropdownModel.countDocuments(whereClause),
      ]);
    }

    return {
      data: dropdowns.map((dropdown) => ({
        ...this.toEntity(dropdown),
        language: (dropdown as any).languageId,
      })) as ManageDropdownWithLanguage[],
      total,
      page,
      limit,
    };
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<ManageDropdown>
  ): Promise<ManageDropdown | null> {
    const mongoFilter: any = {};

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
    } catch (error) {
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

    const mongoFilter: any = {};
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
}
