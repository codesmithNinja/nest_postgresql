import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { IAdminRepository, MongoQuery } from './admin.repository.interface';
import {
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';
import { Admin as AdminEntity } from '../../entities/admin.entity';

@Injectable()
export class AdminMongoRepository implements IAdminRepository {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>
  ) {}

  private toEntity(document: AdminDocument): AdminEntity {
    return {
      id: document._id?.toString() || (document.id as string) || '',
      publicId: document.publicId,
      firstName: document.firstName,
      lastName: document.lastName,
      email: document.email,
      photo: document.photo,
      password: document.password,
      passwordChangedAt: document.passwordChangedAt,
      passwordResetToken: document.passwordResetToken,
      passwordResetExpires: document.passwordResetExpires,
      active: document.active,
      loginIpAddress: document.loginIpAddress,
      currentLoginDateTime: document.currentLoginDateTime,
      lastLoginDateTime: document.lastLoginDateTime,
      twoFactorAuthVerified: document.twoFactorAuthVerified,
      twoFactorSecretKey: document.twoFactorSecretKey,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    };
  }

  async getAll(filter?: Partial<AdminEntity>): Promise<AdminEntity[]> {
    const documents = await this.adminModel.find(filter || {}).exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async getDetailById(id: string): Promise<AdminEntity | null> {
    const document = await this.adminModel.findById(id).exec();
    return document ? this.toEntity(document) : null;
  }

  async getDetail(filter: Partial<AdminEntity>): Promise<AdminEntity | null> {
    const document = await this.adminModel.findOne(filter).exec();
    return document ? this.toEntity(document) : null;
  }

  async insert(data: Partial<AdminEntity>): Promise<AdminEntity> {
    const document = new this.adminModel(data);
    const saved = await document.save();
    return this.toEntity(saved);
  }

  async updateById(
    id: string,
    data: Partial<AdminEntity>
  ): Promise<AdminEntity> {
    const document = await this.adminModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!document) {
      throw new Error('Admin not found');
    }
    return this.toEntity(document);
  }

  updateMany(): Promise<{ count: number; updated: AdminEntity[] }> {
    throw new Error('Method not implemented');
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.adminModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  deleteMany(): Promise<{ count: number; deleted: AdminEntity[] }> {
    throw new Error('Method not implemented');
  }

  async count(filter?: Partial<AdminEntity>): Promise<number> {
    return await this.adminModel.countDocuments(filter || {}).exec();
  }

  async exists(filter: Partial<AdminEntity>): Promise<boolean> {
    const result = await this.adminModel.findOne(filter).exec();
    return !!result;
  }

  async findById(id: string): Promise<AdminEntity | null> {
    return await this.getDetailById(id);
  }

  async findMany(
    filter?: MongoQuery<AdminEntity>,
    options?: QueryOptions
  ): Promise<AdminEntity[]> {
    const mongoFilter = this.convertToMongoFilter(filter);
    const query = this.adminModel.find(mongoFilter || {});

    if (options?.skip) {
      query.skip(options.skip);
    }
    if (options?.limit) {
      query.limit(options.limit);
    }
    if (options?.sort) {
      query.sort(options.sort);
    }

    const documents = await query.exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async update(id: string, data: Partial<AdminEntity>): Promise<AdminEntity> {
    return await this.updateById(id, data);
  }

  async findByEmail(email: string): Promise<AdminEntity | null> {
    return await this.getDetail({ email } as Partial<AdminEntity>);
  }

  async findByPublicId(publicId: string): Promise<AdminEntity | null> {
    return await this.getDetail({ publicId } as Partial<AdminEntity>);
  }

  async findByResetToken(token: string): Promise<AdminEntity | null> {
    return await this.getDetail({
      passwordResetToken: token,
    } as Partial<AdminEntity>);
  }

  async updatePassword(
    id: string,
    hashedPassword: string
  ): Promise<AdminEntity> {
    return await this.updateById(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    } as Partial<AdminEntity>);
  }

  async findWithPagination(
    filter?: MongoQuery<AdminEntity>,
    options?: QueryOptions
  ): Promise<PaginatedResult<AdminEntity>> {
    const page = options?.skip
      ? Math.floor(options.skip / (options.limit || 10)) + 1
      : 1;
    const limit = options?.limit || 10;

    const mongoFilter = this.convertToMongoFilter(filter);

    const [items, totalCount] = await Promise.all([
      this.findMany(filter, options),
      this.count(mongoFilter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
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

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<AdminEntity>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AdminEntity>> {
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
    const query = this.adminModel.find(mongoFilter);

    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.adminModel.countDocuments(mongoFilter).exec(),
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

  private buildAdditionalFilters(
    filter?: MongoQuery<AdminEntity>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key !== 'firstName' && key !== 'lastName' && key !== 'email') {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          mongoFilter[key] = value;
        }
      }
    });

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
  }

  private convertToMongoFilter(
    filter?: MongoQuery<AdminEntity>
  ): Record<string, unknown> | undefined {
    if (!filter) return undefined;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'firstName' || key === 'lastName' || key === 'email') {
        if (typeof value === 'string') {
          mongoFilter[key] = { $regex: value, $options: 'i' };
        } else {
          mongoFilter[key] = value;
        }
      } else {
        mongoFilter[key] = value;
      }
    });

    return mongoFilter;
  }
}
