import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IUserRepository } from './user.repository.interface';
import { User } from '../../entities/user.entity';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

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
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: this.selectFields,
    });
  }

  async findBySlug(slug: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        slug: true,
        photo: true,
        coverPhoto: true,
        aboutYourself: true,
        outsideLinks: true,
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userLocation: true,
        walletAddress: true,
        createdAt: true,
      },
    });
  }

  async findByActivationToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        accountActivationToken: token,
        active: ActiveStatus.PENDING,
      },
      select: this.selectFields,
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
      select: this.selectFields,
    });
  }

  async activateUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        active: ActiveStatus.ACTIVE,
        accountActivationToken: null,
      },
      select: this.selectFields,
    });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        active: ActiveStatus.INACTIVE,
      },
      select: this.selectFields,
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
      select: this.selectFields,
    });
  }
}
