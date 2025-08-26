import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IUserRepository } from './user.repository.interface';
import { User, OutsideLink } from '../../entities/user.entity';
import {
  ActiveStatus,
  NotificationStatus,
} from '../../../common/enums/database-type.enum';
import { Prisma, $Enums } from '@prisma/client';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

type PrismaUserResult = {
  id: string;
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
  userTypeId: string;
  userType: {
    id: string;
    name: string;
    description: string | null;
  };
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
  protected modelName = 'user';
  protected selectFields = {
    id: true,
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
      select: {
        id: true,
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
        },
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
        },
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
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
      select: {
        id: true,
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
        },
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
        },
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return result ? this.mapToUser(result) : null;
  }

  async findByActivationToken(token: string): Promise<User | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        accountActivationToken: token,
        active: ActiveStatus.PENDING,
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
        active: ActiveStatus.ACTIVE,
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

  // ✅ HELPER METHOD TO PROPERLY MAP PRISMA RESULT TO USER ENTITY
  private mapToUser(prismaUser: PrismaUserResult): User {
    return {
      id: String(prismaUser.id || ''),
      firstName: String(prismaUser.firstName || ''),
      lastName: String(prismaUser.lastName || ''),
      slug: prismaUser.slug ? String(prismaUser.slug) : undefined,
      photo: prismaUser.photo ? String(prismaUser.photo) : undefined,
      coverPhoto: prismaUser.coverPhoto
        ? String(prismaUser.coverPhoto)
        : undefined,
      email: String(prismaUser.email || ''),
      password: String(prismaUser.password || ''),
      phoneNumber: prismaUser.phoneNumber
        ? String(prismaUser.phoneNumber)
        : undefined,
      userLocation: prismaUser.userLocation
        ? String(prismaUser.userLocation)
        : undefined,
      zipcode: prismaUser.zipcode ? String(prismaUser.zipcode) : undefined,
      kycStatus: prismaUser.kycStatus
        ? String(prismaUser.kycStatus)
        : undefined,
      kycReferenceId: prismaUser.kycReferenceId
        ? String(prismaUser.kycReferenceId)
        : undefined,
      aboutYourself: prismaUser.aboutYourself
        ? String(prismaUser.aboutYourself)
        : undefined,
      outsideLinks: (() => {
        try {
          return prismaUser.outsideLinks
            ? JSON.parse(String(prismaUser.outsideLinks))
            : [];
        } catch {
          return [];
        }
      })() as OutsideLink[],
      userTypeId: String(prismaUser.userTypeId || ''),
      userType: prismaUser.userType || null,
      active: (() => {
        const active = String(prismaUser.active || '').toUpperCase();
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
      })(),
      enableTwoFactorAuth: prismaUser.enableTwoFactorAuth ? 'true' : 'false',
      appliedBytwoFactorAuth: prismaUser.appliedBytwoFactorAuth
        ? 'true'
        : 'false',
      twoFactorAuthVerified: prismaUser.twoFactorAuthVerified
        ? 'true'
        : 'false',
      twoFactorSecretKey: prismaUser.twoFactorSecretKey
        ? String(prismaUser.twoFactorSecretKey)
        : undefined,
      signupIpAddress: prismaUser.signupIpAddress
        ? String(prismaUser.signupIpAddress)
        : undefined,
      loginIpAddress: prismaUser.loginIpAddress
        ? String(prismaUser.loginIpAddress)
        : undefined,
      uniqueGoogleId: prismaUser.uniqueGoogleId
        ? String(prismaUser.uniqueGoogleId)
        : undefined,
      uniqueLinkedInId: prismaUser.uniqueLinkedInId
        ? String(prismaUser.uniqueLinkedInId)
        : undefined,
      uniqueFacebookId: prismaUser.uniqueFacebookId
        ? String(prismaUser.uniqueFacebookId)
        : undefined,
      uniqueTwitterId: prismaUser.uniqueTwitterId
        ? String(prismaUser.uniqueTwitterId)
        : undefined,
      achCustomerId: prismaUser.achCustomerId
        ? String(prismaUser.achCustomerId)
        : undefined,
      achAccountId: prismaUser.achAccountId
        ? String(prismaUser.achAccountId)
        : undefined,
      achAccountStatus: prismaUser.achAccountStatus
        ? String(prismaUser.achAccountStatus)
        : undefined,
      isAdmin: prismaUser.isAdmin ? 'true' : 'false',
      accountActivationToken: prismaUser.accountActivationToken
        ? String(prismaUser.accountActivationToken)
        : undefined,
      passwordChangedAt: prismaUser.passwordChangedAt || new Date(),
      passwordResetToken: prismaUser.passwordResetToken
        ? String(prismaUser.passwordResetToken)
        : undefined,
      passwordResetExpires: prismaUser.passwordResetExpires || new Date(),
      walletId: prismaUser.walletId ? String(prismaUser.walletId) : undefined,
      mangoPayOwnerId: prismaUser.mangoPayOwnerId
        ? String(prismaUser.mangoPayOwnerId)
        : undefined,
      mangoPayOwnerWalletId: prismaUser.mangoPayOwnerWalletId
        ? String(prismaUser.mangoPayOwnerWalletId)
        : undefined,
      plaidDwollaCustomerId: prismaUser.plaidDwollaCustomerId
        ? String(prismaUser.plaidDwollaCustomerId)
        : undefined,
      plaidDwollFundingSourceId: prismaUser.plaidDwollFundingSourceId
        ? String(prismaUser.plaidDwollFundingSourceId)
        : undefined,
      plaidDwollFundingSourceStatus: prismaUser.plaidDwollFundingSourceStatus
        ? String(prismaUser.plaidDwollFundingSourceStatus)
        : undefined,
      plaidDwollaKYCStatus: prismaUser.plaidDwollaKYCStatus
        ? String(prismaUser.plaidDwollaKYCStatus)
        : undefined,
      globalSocketId: prismaUser.globalSocketId
        ? String(prismaUser.globalSocketId)
        : undefined,
      enableNotification: prismaUser.enableNotification
        ? NotificationStatus.YES
        : NotificationStatus.NO,
      notificationLanguageId: prismaUser.notificationLanguageId
        ? String(prismaUser.notificationLanguageId)
        : undefined,
      notificationLanguage: prismaUser.notificationLanguage,
      walletAddress: prismaUser.walletAddress
        ? String(prismaUser.walletAddress)
        : undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
