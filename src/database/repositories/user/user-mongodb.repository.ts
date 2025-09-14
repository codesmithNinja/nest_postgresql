import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { IUserRepository } from './user.repository.interface';
import { User, UserDocument } from '../../schemas/user.schema';
import { User as UserEntity, OutsideLink } from '../../entities/user.entity';
import {
  ActiveStatus,
  NotificationStatus,
} from '../../../common/enums/database-type.enum';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class UserMongoRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) protected readonly model: Model<UserDocument>
  ) {}

  protected toEntity(doc: UserDocument | null): UserEntity | null {
    if (!doc) return null;

    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id: (obj._id as { toString: () => string })?.toString() || '',
      publicId:
        this.getString(obj.publicId) ||
        (obj._id as { toString: () => string })?.toString() ||
        '',
      firstName: this.getString(obj.firstName),
      lastName: this.getString(obj.lastName),
      email: this.getString(obj.email),
      password: this.getString(obj.password),
      phoneNumber: this.getString(obj.phoneNumber),
      userLocation: this.getString(obj.userLocation),
      zipcode: this.getString(obj.zipcode),
      kycStatus: this.getString(obj.kycStatus),
      kycReferenceId: this.getString(obj.kycReferenceId),
      aboutYourself: this.getString(obj.aboutYourself),
      outsideLinks: this.transformOutsideLinks(obj.outsideLinks),
      photo: this.getString(obj.photo),
      coverPhoto: this.getString(obj.coverPhoto),
      active: this.getActiveStatus(obj.active),
      enableTwoFactorAuth: this.getString(obj.enableTwoFactorAuth),
      appliedBytwoFactorAuth: this.getString(obj.appliedBytwoFactorAuth),
      twoFactorAuthVerified: this.getString(obj.twoFactorAuthVerified),
      twoFactorSecretKey: this.getString(obj.twoFactorSecretKey),
      signupIpAddress: this.getString(obj.signupIpAddress),
      loginIpAddress: this.getString(obj.loginIpAddress),
      uniqueGoogleId: this.getString(obj.uniqueGoogleId),
      uniqueLinkedInId: this.getString(obj.uniqueLinkedInId),
      uniqueFacebookId: this.getString(obj.uniqueFacebookId),
      uniqueTwitterId: this.getString(obj.uniqueTwitterId),
      achCustomerId: this.getString(obj.achCustomerId),
      achAccountId: this.getString(obj.achAccountId),
      achAccountStatus: this.getString(obj.achAccountStatus),
      isAdmin: this.getString(obj.isAdmin),
      accountActivationToken: this.getString(obj.accountActivationToken),
      passwordChangedAt: this.getDate(obj.passwordChangedAt),
      passwordResetToken: this.getString(obj.passwordResetToken),
      passwordResetExpires: this.getDate(obj.passwordResetExpires),
      walletId: this.getString(obj.walletId),
      mangoPayOwnerId: this.getString(obj.mangoPayOwnerId),
      mangoPayOwnerWalletId: this.getString(obj.mangoPayOwnerWalletId),
      plaidDwollaCustomerId: this.getString(obj.plaidDwollaCustomerId),
      plaidDwollFundingSourceId: this.getString(obj.plaidDwollFundingSourceId),
      plaidDwollFundingSourceStatus: this.getString(
        obj.plaidDwollFundingSourceStatus
      ),
      plaidDwollaKYCStatus: this.getString(obj.plaidDwollaKYCStatus),
      globalSocketId: this.getString(obj.globalSocketId),
      enableNotification: this.getNotificationStatus(obj.enableNotification),
      notificationLanguageId: this.getString(obj.notificationLanguageId),
      walletAddress: this.getString(obj.walletAddress),
      userTypeId: this.getString(obj.userTypeId),
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(entity: Partial<UserEntity>): Record<string, unknown> {
    if (!entity) return {};

    const doc: Record<string, unknown> = {
      ...(entity.id && { _id: entity.id }),
      ...(entity.publicId && { publicId: this.getString(entity.publicId) }),
      firstName: this.getString(entity.firstName),
      lastName: this.getString(entity.lastName),
      email: this.getString(entity.email),
      password: this.getString(entity.password),
      active: entity.active || ActiveStatus.PENDING,
      enableTwoFactorAuth: this.getString(entity.enableTwoFactorAuth),
      appliedBytwoFactorAuth: this.getString(entity.appliedBytwoFactorAuth),
      twoFactorAuthVerified: this.getString(entity.twoFactorAuthVerified),
      enableNotification: entity.enableNotification || NotificationStatus.NO,
    };

    // Optional fields
    if (entity.phoneNumber)
      doc.phoneNumber = this.getString(entity.phoneNumber);
    if (entity.photo) doc.photo = this.getString(entity.photo);
    if (entity.coverPhoto) doc.coverPhoto = this.getString(entity.coverPhoto);
    if (entity.userLocation)
      doc.userLocation = this.getString(entity.userLocation);
    if (entity.zipcode) doc.zipcode = this.getString(entity.zipcode);
    if (entity.kycStatus) doc.kycStatus = this.getString(entity.kycStatus);
    if (entity.kycReferenceId)
      doc.kycReferenceId = this.getString(entity.kycReferenceId);
    if (entity.aboutYourself)
      doc.aboutYourself = this.getString(entity.aboutYourself);
    if (entity.outsideLinks) doc.outsideLinks = entity.outsideLinks;
    if (entity.twoFactorSecretKey)
      doc.twoFactorSecretKey = this.getString(entity.twoFactorSecretKey);
    if (entity.achCustomerId)
      doc.achCustomerId = this.getString(entity.achCustomerId);
    if (entity.achAccountId)
      doc.achAccountId = this.getString(entity.achAccountId);
    if (entity.achAccountStatus)
      doc.achAccountStatus = this.getString(entity.achAccountStatus);
    if (entity.isAdmin) doc.isAdmin = this.getString(entity.isAdmin);
    if (entity.accountActivationToken)
      doc.accountActivationToken = this.getString(
        entity.accountActivationToken
      );
    if (entity.passwordChangedAt)
      doc.passwordChangedAt = entity.passwordChangedAt;
    if (entity.passwordResetToken)
      doc.passwordResetToken = this.getString(entity.passwordResetToken);
    if (entity.passwordResetExpires)
      doc.passwordResetExpires = entity.passwordResetExpires;
    if (entity.walletId) doc.walletId = this.getString(entity.walletId);
    if (entity.mangoPayOwnerId)
      doc.mangoPayOwnerId = this.getString(entity.mangoPayOwnerId);
    if (entity.mangoPayOwnerWalletId)
      doc.mangoPayOwnerWalletId = this.getString(entity.mangoPayOwnerWalletId);

    // Keep track of timestamps
    if (entity.createdAt) doc.createdAt = entity.createdAt;
    if (entity.updatedAt) doc.updatedAt = entity.updatedAt;

    return doc;
  }

  protected applyOptions<T extends Query<unknown, unknown>>(
    query: T,
    options?: QueryOptions
  ): T {
    if (!options) return query;

    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    if (options.select) query = query.select(options.select.join(' ')) as T;
    if (options.populate) {
      options.populate.forEach((path) => {
        query = query.populate(path) as T;
      });
    }

    return query;
  }

  protected getString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  protected getDate(value: unknown): Date | undefined {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }

  protected getActiveStatus(value: unknown): ActiveStatus {
    const strValue = this.getString(value);
    return Object.values(ActiveStatus).includes(strValue as ActiveStatus)
      ? (strValue as ActiveStatus)
      : ActiveStatus.PENDING;
  }

  protected getNotificationStatus(value: unknown): NotificationStatus {
    const strValue = this.getString(value);
    return Object.values(NotificationStatus).includes(
      strValue as NotificationStatus
    )
      ? (strValue as NotificationStatus)
      : NotificationStatus.NO;
  }

  protected transformOutsideLinks(links: unknown): OutsideLink[] {
    if (!Array.isArray(links)) return [];

    return links.map((link): OutsideLink => {
      if (typeof link === 'object' && link !== null) {
        const { title, url } = link as { title?: unknown; url?: unknown };
        return {
          title: this.getString(title),
          url: this.getString(url),
        };
      }
      return { title: '', url: '' };
    });
  }

  // IRepository implementation
  async getAll(
    filter?: Partial<UserEntity>,
    options?: QueryOptions
  ): Promise<UserEntity[]> {
    const query = this.model.find(this.toDocument(filter || {}));
    const docs = await this.applyOptions(query, options).exec();
    return docs
      .map((doc) => this.toEntity(doc))
      .filter((entity): entity is UserEntity => entity !== null);
  }

  async getDetailById(
    id: string,
    options?: QueryOptions
  ): Promise<UserEntity | null> {
    const query = this.model.findById(id);
    const doc = await this.applyOptions(query, options).exec();
    return this.toEntity(doc);
  }

  async getDetail(
    filter: Partial<UserEntity>,
    options?: QueryOptions
  ): Promise<UserEntity | null> {
    const query = this.model.findOne(this.toDocument(filter));
    const doc = await this.applyOptions(query, options).exec();
    return this.toEntity(doc);
  }

  async insert(data: Partial<UserEntity>): Promise<UserEntity> {
    const doc = await this.model.create(this.toDocument(data));
    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to create user entity');
    }
    return entity;
  }

  async updateById(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to convert document to entity');
    }
    return entity;
  }

  async updateMany(
    filter: Partial<UserEntity>,
    data: Partial<UserEntity>
  ): Promise<{ count: number; updated: UserEntity[] }> {
    const updateResult = await this.model
      .updateMany(this.toDocument(filter), { $set: this.toDocument(data) })
      .exec();

    const updatedDocs = await this.model.find(this.toDocument(filter)).exec();

    return {
      count: updateResult.modifiedCount || 0,
      updated: updatedDocs
        .map((doc) => this.toEntity(doc))
        .filter((entity): entity is UserEntity => entity !== null),
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(
    filter: Partial<UserEntity>
  ): Promise<{ count: number; deleted: UserEntity[] }> {
    const toDelete = await this.model.find(this.toDocument(filter)).exec();
    const result = await this.model.deleteMany(this.toDocument(filter)).exec();

    return {
      count: result.deletedCount || 0,
      deleted: toDelete
        .map((doc) => this.toEntity(doc))
        .filter((entity): entity is UserEntity => entity !== null),
    };
  }

  async count(filter?: Partial<UserEntity>): Promise<number> {
    return this.model.countDocuments(this.toDocument(filter || {})).exec();
  }

  async exists(filter: Partial<UserEntity>): Promise<boolean> {
    const doc = await this.model.exists(this.toDocument(filter));
    return !!doc;
  }

  async findWithPagination(
    filter?: Partial<UserEntity>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<UserEntity>> {
    const { page = 1, limit = 10, ...queryOptions } = options || {};
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.getAll(filter, { ...queryOptions, skip, limit }),
      this.count(filter),
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

  // UserRepository specific methods
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.model.findById(id).exec();
    return this.toEntity(doc);
  }

  async findMany(
    filter?: Partial<UserEntity>,
    options?: QueryOptions
  ): Promise<UserEntity[]> {
    const query = this.model.find(this.toDocument(filter || {}));
    const docs = await this.applyOptions(query, options).exec();
    return docs
      .map((doc) => this.toEntity(doc))
      .filter((entity): entity is UserEntity => entity !== null);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.model.findOne({ email }).exec();
    return this.toEntity(doc);
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    const doc = await this.model.findOne({ slug }).exec();
    return this.toEntity(doc);
  }

  async findByActivationToken(token: string): Promise<UserEntity | null> {
    const doc = await this.model
      .findOne({ accountActivationToken: token })
      .exec();
    return this.toEntity(doc);
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    const doc = await this.model.findOne({ passwordResetToken: token }).exec();
    return this.toEntity(doc);
  }

  async activateUser(id: string): Promise<UserEntity> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { active: ActiveStatus.ACTIVE, accountActivationToken: '' },
        { new: true }
      )
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to convert document to entity');
    }
    return entity;
  }

  async deactivateUser(id: string): Promise<UserEntity> {
    const doc = await this.model
      .findByIdAndUpdate(id, { active: ActiveStatus.INACTIVE }, { new: true })
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to convert document to entity');
    }
    return entity;
  }

  async updatePassword(
    id: string,
    hashedPassword: string
  ): Promise<UserEntity> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
        },
        { new: true }
      )
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to convert document to entity');
    }
    return entity;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: this.toDocument(data) }, { new: true })
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    const entity = this.toEntity(doc);
    if (!entity) {
      throw new Error('Failed to convert document to entity');
    }
    return entity;
  }
}
