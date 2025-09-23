import { $Enums, Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import {
  ActiveStatus,
  NotificationStatus,
} from '../../../common/enums/database-type.enum';
import { QueryOptions } from '../../../common/interfaces/repository.interface';
import { OutsideLink, User } from '../../entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';

import { PostgresRepository } from '../base/postgres.repository';
import { IUserRepository } from './user.repository.interface';

type PrismaUserResult = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  slug: string | null;
  photo: string | null;
  coverPhoto: string | null;
  email: string;
  password: string;
  phoneNumber: string | null;
  userLocation: string | null;
  zipcode: string | null;
  kycStatus: string | null;
  kycReferenceId: string | null;
  aboutYourself: string | null;
  outsideLinks: string | null;
  userTypeId: string | null;
  userType: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  active: $Enums.ActiveStatus;
  enableTwoFactorAuth: string;
  appliedBytwoFactorAuth: string;
  twoFactorAuthVerified: string;
  twoFactorSecretKey: string | null;
  signupIpAddress: string | null;
  loginIpAddress: string | null;
  uniqueGoogleId: string | null;
  uniqueLinkedInId: string | null;
  uniqueFacebookId: string | null;
  uniqueTwitterId: string | null;
  achCustomerId: string | null;
  achAccountId: string | null;
  achAccountStatus: string | null;
  isAdmin: string | null;
  accountActivationToken: string | null;
  passwordChangedAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  walletId: string | null;
  mangoPayOwnerId: string | null;
  mangoPayOwnerWalletId: string | null;
  plaidDwollaCustomerId: string | null;
  plaidDwollFundingSourceId: string | null;
  plaidDwollFundingSourceStatus: string | null;
  plaidDwollaKYCStatus: string | null;
  globalSocketId: string | null;
  enableNotification: $Enums.NotificationStatus;
  notificationLanguageId: string | null;
  notificationLanguage: {
    id: string;
    name: string;
    code: string;
  } | null;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UserPostgresRepository
  extends PostgresRepository<User>
  implements IUserRepository
{
  protected modelName = 'user' as const;
  protected selectFields = {
    id: true,
    publicId: true,
    firstName: true,
    lastName: true,
    slug: true,
    photo: true,
    coverPhoto: true,
    email: true,
    password: true,
    phoneNumber: true,
    userLocation: true,
    zipcode: true,
    kycStatus: true,
    kycReferenceId: true,
    aboutYourself: true,
    outsideLinks: true,
    userTypeId: true,
    userType: {
      select: {
        id: true,
        name: true,
        description: true,
      },
    } as const,
    active: true,
    enableTwoFactorAuth: true,
    appliedBytwoFactorAuth: true,
    twoFactorAuthVerified: true,
    twoFactorSecretKey: true,
    signupIpAddress: true,
    loginIpAddress: true,
    uniqueGoogleId: true,
    uniqueLinkedInId: true,
    uniqueFacebookId: true,
    uniqueTwitterId: true,
    achCustomerId: true,
    achAccountId: true,
    achAccountStatus: true,
    isAdmin: true,
    accountActivationToken: true,
    passwordChangedAt: true,
    passwordResetToken: true,
    passwordResetExpires: true,
    walletId: true,
    mangoPayOwnerId: true,
    mangoPayOwnerWalletId: true,
    plaidDwollaCustomerId: true,
    plaidDwollFundingSourceId: true,
    plaidDwollFundingSourceStatus: true,
    plaidDwollaKYCStatus: true,
    globalSocketId: true,
    enableNotification: true,
    notificationLanguageId: true,
    notificationLanguage: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    } as const,
    walletAddress: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ✅ ADD MISSING METHODS
  async findById(id: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({
      where: { id },
      select: this.selectFields,
    });
    return result ? this.mapToUser(result) : null;
  }

  async findMany(
    filter?: Partial<User>,
    options?: QueryOptions
  ): Promise<User[]> {
    // Convert filter to Prisma's UserWhereInput
    const where: Prisma.UserWhereInput = {};
    if (filter) {
      if (filter.id) where.id = filter.id;
      if (filter.email) where.email = filter.email;
      if (filter.active)
        where.active = filter.active as unknown as $Enums.ActiveStatus;
      if (filter.outsideLinks)
        where.outsideLinks = JSON.stringify(filter.outsideLinks);
      // Add other filter fields as needed
    }

    const results = await this.prisma.user.findMany({
      where,
      select: this.selectFields,
      skip: options?.skip,
      take: options?.limit,
      ...(options?.sort && {
        orderBy: Object.entries(options.sort).map(([key, value]) => ({
          [key]: value === 1 ? 'asc' : 'desc',
        })) as Prisma.UserOrderByWithRelationInput[],
      }),
    });
    return results.map((result) => this.mapToUser(result));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Map our User type to Prisma's UserUpdateInput
    const prismaUpdateData = {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.photo !== undefined && { photo: data.photo }),
      ...(data.coverPhoto !== undefined && { coverPhoto: data.coverPhoto }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.password !== undefined && { password: data.password }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
      ...(data.userLocation !== undefined && {
        userLocation: data.userLocation,
      }),
      ...(data.zipcode !== undefined && { zipcode: data.zipcode }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.outsideLinks !== undefined && {
        outsideLinks:
          typeof data.outsideLinks === 'string'
            ? data.outsideLinks
            : JSON.stringify(data.outsideLinks),
      }),
    };

    const result = await this.prisma.user.update({
      where: { id },
      data: prismaUpdateData,
      select: this.selectFields,
    });
    return this.mapToUser(result);
  }

  // ✅ FIX EXISTING METHODS WITH PROPER TYPE MAPPING
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({
      where: { email },
      select: this.selectFields,
    });
    return result ? this.mapToUser(result) : null;
  }

  async findBySlug(slug: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({
      where: { slug },
      select: this.selectFields,
    });
    return result ? this.mapToUser(result) : null;
  }

  async findByActivationToken(token: string): Promise<User | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        accountActivationToken: token,
        active: $Enums.ActiveStatus.PENDING,
      },
      select: this.selectFields,
    });

    return result ? this.mapToUser(result) : null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
      select: this.selectFields,
    });
    return result ? this.mapToUser(result) : null;
  }

  async activateUser(id: string): Promise<User> {
    const result = await this.prisma.user.update({
      where: { id },
      data: {
        active: $Enums.ActiveStatus.ACTIVE,
        accountActivationToken: null,
      },
      select: this.selectFields,
    });
    return this.mapToUser(result);
  }

  async deactivateUser(id: string): Promise<User> {
    const result = await this.prisma.user.update({
      where: { id },
      data: {
        active: ActiveStatus.INACTIVE,
      },
      select: this.selectFields,
    });
    return this.mapToUser(result);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const result = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
      select: this.selectFields,
    });
    return this.mapToUser(result);
  }

  // Override base class methods for type safety
  protected convertFilterToPrisma(
    filter: Partial<User>
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (filter.id) where.id = filter.id;
    if (filter.email) where.email = filter.email;
    if (filter.slug) where.slug = filter.slug;
    if (filter.active) where.active = filter.active as $Enums.ActiveStatus;
    if (filter.firstName) where.firstName = filter.firstName;
    if (filter.lastName) where.lastName = filter.lastName;
    return where;
  }

  protected convertDataToPrisma(
    data: Partial<User>
  ): Prisma.UserUpdateInput | Prisma.UserCreateInput {
    const prismaData: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) prismaData.firstName = data.firstName;
    if (data.lastName !== undefined) prismaData.lastName = data.lastName;
    if (data.slug !== undefined) prismaData.slug = data.slug;
    if (data.photo !== undefined) prismaData.photo = data.photo;
    if (data.coverPhoto !== undefined) prismaData.coverPhoto = data.coverPhoto;
    if (data.email !== undefined) prismaData.email = data.email;
    if (data.password !== undefined) prismaData.password = data.password;
    if (data.phoneNumber !== undefined)
      prismaData.phoneNumber = data.phoneNumber;
    if (data.userLocation !== undefined)
      prismaData.userLocation = data.userLocation;
    if (data.zipcode !== undefined) prismaData.zipcode = data.zipcode;
    if (data.active !== undefined)
      prismaData.active = data.active as $Enums.ActiveStatus;
    if (data.outsideLinks !== undefined) {
      prismaData.outsideLinks =
        typeof data.outsideLinks === 'string'
          ? data.outsideLinks
          : JSON.stringify(data.outsideLinks);
    }
    if (data.accountActivationToken !== undefined) {
      prismaData.accountActivationToken = data.accountActivationToken;
    }
    if (data.signupIpAddress !== undefined) {
      prismaData.signupIpAddress = data.signupIpAddress;
    }

    return prismaData;
  }

  // ✅ HELPER METHOD TO PROPERLY MAP PRISMA RESULT TO USER ENTITY
  private mapToUser(prismaUser: PrismaUserResult): User {
    if (!prismaUser || typeof prismaUser !== 'object') {
      throw new Error('Invalid Prisma user result');
    }

    return {
      id: this.safeString(prismaUser.id, ''),
      publicId: this.safeString(prismaUser.publicId, ''),
      firstName: this.safeString(prismaUser.firstName, ''),
      lastName: this.safeString(prismaUser.lastName, ''),
      slug: this.safeOptionalString(prismaUser.slug),
      photo: this.safeOptionalString(prismaUser.photo),
      coverPhoto: this.safeOptionalString(prismaUser.coverPhoto),
      email: this.safeString(prismaUser.email, ''),
      password: this.safeString(prismaUser.password, ''),
      phoneNumber: this.safeOptionalString(prismaUser.phoneNumber),
      userLocation: this.safeOptionalString(prismaUser.userLocation),
      zipcode: this.safeOptionalString(prismaUser.zipcode),
      kycStatus: this.safeOptionalString(prismaUser.kycStatus),
      kycReferenceId: this.safeOptionalString(prismaUser.kycReferenceId),
      aboutYourself: this.safeOptionalString(prismaUser.aboutYourself),
      outsideLinks: this.safeParseOutsideLinks(prismaUser.outsideLinks),
      userTypeId: this.safeOptionalString(prismaUser.userTypeId),
      userType: this.safeUserType(prismaUser.userType) || undefined,
      active: this.safeActiveStatus(prismaUser.active),
      enableTwoFactorAuth: this.safeBooleanToString(
        prismaUser.enableTwoFactorAuth
      ),
      appliedBytwoFactorAuth: this.safeBooleanToString(
        prismaUser.appliedBytwoFactorAuth
      ),
      twoFactorAuthVerified: this.safeBooleanToString(
        prismaUser.twoFactorAuthVerified
      ),
      twoFactorSecretKey: this.safeOptionalString(
        prismaUser.twoFactorSecretKey
      ),
      signupIpAddress: this.safeOptionalString(prismaUser.signupIpAddress),
      loginIpAddress: this.safeOptionalString(prismaUser.loginIpAddress),
      uniqueGoogleId: this.safeOptionalString(prismaUser.uniqueGoogleId),
      uniqueLinkedInId: this.safeOptionalString(prismaUser.uniqueLinkedInId),
      uniqueFacebookId: this.safeOptionalString(prismaUser.uniqueFacebookId),
      uniqueTwitterId: this.safeOptionalString(prismaUser.uniqueTwitterId),
      achCustomerId: this.safeOptionalString(prismaUser.achCustomerId),
      achAccountId: this.safeOptionalString(prismaUser.achAccountId),
      achAccountStatus: this.safeOptionalString(prismaUser.achAccountStatus),
      isAdmin: this.safeBooleanToString(prismaUser.isAdmin),
      accountActivationToken: this.safeOptionalString(
        prismaUser.accountActivationToken
      ),
      passwordChangedAt: this.safeDate(prismaUser.passwordChangedAt),
      passwordResetToken: this.safeOptionalString(
        prismaUser.passwordResetToken
      ),
      passwordResetExpires: this.safeDate(prismaUser.passwordResetExpires),
      walletId: this.safeOptionalString(prismaUser.walletId),
      mangoPayOwnerId: this.safeOptionalString(prismaUser.mangoPayOwnerId),
      mangoPayOwnerWalletId: this.safeOptionalString(
        prismaUser.mangoPayOwnerWalletId
      ),
      plaidDwollaCustomerId: this.safeOptionalString(
        prismaUser.plaidDwollaCustomerId
      ),
      plaidDwollFundingSourceId: this.safeOptionalString(
        prismaUser.plaidDwollFundingSourceId
      ),
      plaidDwollFundingSourceStatus: this.safeOptionalString(
        prismaUser.plaidDwollFundingSourceStatus
      ),
      plaidDwollaKYCStatus: this.safeOptionalString(
        prismaUser.plaidDwollaKYCStatus
      ),
      globalSocketId: this.safeOptionalString(prismaUser.globalSocketId),
      enableNotification: this.safeNotificationStatus(
        prismaUser.enableNotification
      ),
      notificationLanguageId: this.safeOptionalString(
        prismaUser.notificationLanguageId
      ),
      notificationLanguage:
        this.safeNotificationLanguage(prismaUser.notificationLanguage) ||
        undefined,
      walletAddress: this.safeOptionalString(prismaUser.walletAddress),
      createdAt: this.safeDate(prismaUser.createdAt, new Date()),
      updatedAt: this.safeDate(prismaUser.updatedAt, new Date()),
    };
  }

  // Helper methods for safe property access
  private safeString(value: unknown, defaultValue: string): string {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (typeof value === 'object' && value !== null)
      return JSON.stringify(value);
    // For remaining primitives or edge cases - should never reach here due to above checks
    return defaultValue;
  }

  private safeOptionalString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (typeof value === 'object' && value !== null)
      return JSON.stringify(value);
    // For remaining primitives or edge cases - should never reach here due to above checks
    return undefined;
  }

  private safeDate(value: unknown, defaultValue?: Date): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value) return new Date(value);
    return defaultValue || new Date();
  }

  private safeBooleanToString(value: unknown): string {
    return value ? 'true' : 'false';
  }

  private safeActiveStatus(value: unknown): ActiveStatus {
    if (!value) return ActiveStatus.PENDING;
    const stringValue =
      typeof value === 'string'
        ? value
        : typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : '';
    const active = stringValue.toUpperCase();
    switch (active) {
      case 'ACTIVE':
        return ActiveStatus.ACTIVE;
      case 'INACTIVE':
        return ActiveStatus.INACTIVE;
      case 'DELETED':
        return ActiveStatus.DELETED;
      default:
        return ActiveStatus.PENDING;
    }
  }

  private safeNotificationStatus(value: unknown): NotificationStatus {
    return value ? NotificationStatus.YES : NotificationStatus.NO;
  }

  private safeParseOutsideLinks(value: unknown): OutsideLink[] {
    try {
      if (!value) return [];
      if (typeof value === 'string') {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? (parsed as OutsideLink[]) : [];
      }
      return Array.isArray(value) ? (value as OutsideLink[]) : [];
    } catch {
      return [];
    }
  }

  private safeUserType(value: unknown): {
    id: string;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  } | null {
    if (!value || typeof value !== 'object') return null;
    const obj = value as Record<string, unknown>;
    return {
      id:
        typeof obj.id === 'string'
          ? obj.id
          : obj.id && typeof obj.id !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.id)
            : '',
      name:
        typeof obj.name === 'string'
          ? obj.name
          : obj.name && typeof obj.name !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.name)
            : '',
      description: obj.description
        ? typeof obj.description === 'string'
          ? obj.description
          : typeof obj.description !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.description)
            : undefined
        : undefined,
      createdAt: obj.createdAt instanceof Date ? obj.createdAt : undefined,
      updatedAt: obj.updatedAt instanceof Date ? obj.updatedAt : undefined,
    };
  }

  private safeNotificationLanguage(value: unknown): {
    id: string;
    name: string;
    code: string;
    createdAt?: Date;
    updatedAt?: Date;
  } | null {
    if (!value || typeof value !== 'object') return null;
    const obj = value as Record<string, unknown>;
    return {
      id:
        typeof obj.id === 'string'
          ? obj.id
          : obj.id && typeof obj.id !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.id)
            : '',
      name:
        typeof obj.name === 'string'
          ? obj.name
          : obj.name && typeof obj.name !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.name)
            : '',
      code:
        typeof obj.code === 'string'
          ? obj.code
          : obj.code && typeof obj.code !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.code)
            : '',
      createdAt: obj.createdAt instanceof Date ? obj.createdAt : undefined,
      updatedAt: obj.updatedAt instanceof Date ? obj.updatedAt : undefined,
    };
  }
}
