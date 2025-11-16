import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RevenueSubscription,
  RevenueSubscriptionWithLanguage,
  CreateRevenueSubscriptionDto,
} from '../../entities/revenue-subscription.entity';
import { IRevenueSubscriptionRepository } from './revenue-subscription.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RevenueSubscriptionPostgresRepository
  extends PostgresRepository<RevenueSubscription>
  implements IRevenueSubscriptionRepository
{
  protected modelName = 'revenueSubscription';
  protected selectFields = {
    id: true,
    publicId: true,
    subscriptionType: true,
    amount: true,
    maxInvestmentAllowed: true,
    maxProjectAllowed: true,
    maxProjectGoalLimit: true,
    allowRefund: true,
    allowRefundDays: true,
    allowCancel: true,
    allowCancelDays: true,
    secondaryMarketAccess: true,
    earlyBirdAccess: true,
    useCount: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(
    createDto: CreateRevenueSubscriptionDto
  ): Promise<RevenueSubscription> {
    const subscription = await this.prisma.revenueSubscription.create({
      data: {
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
      },
    });
    return {
      ...subscription,
      amount: Number(subscription.amount),
      maxInvestmentAllowed: subscription.maxInvestmentAllowed
        ? Number(subscription.maxInvestmentAllowed)
        : undefined,
      maxProjectAllowed: subscription.maxProjectAllowed
        ? Number(subscription.maxProjectAllowed)
        : undefined,
      maxProjectGoalLimit: subscription.maxProjectGoalLimit
        ? Number(subscription.maxProjectGoalLimit)
        : undefined,
    } as RevenueSubscription;
  }

  async findForPublic(
    languageId: string
  ): Promise<RevenueSubscriptionWithLanguage[]> {
    const subscriptions = await this.prisma.revenueSubscription.findMany({
      where: { status: true },
      include: {
        languageContents: {
          where: { languageId },
          include: { language: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions
      .filter((sub) => sub.languageContents.length > 0)
      .map((subscription) => {
        const langContent = subscription.languageContents[0];
        return {
          ...subscription,
          amount: Number(subscription.amount),
          maxInvestmentAllowed: subscription.maxInvestmentAllowed
            ? Number(subscription.maxInvestmentAllowed)
            : undefined,
          maxProjectAllowed: subscription.maxProjectAllowed
            ? Number(subscription.maxProjectAllowed)
            : undefined,
          maxProjectGoalLimit: subscription.maxProjectGoalLimit
            ? Number(subscription.maxProjectGoalLimit)
            : undefined,
          title: langContent.title,
          description: langContent.description,
          language: langContent.language
            ? {
                id: langContent.language.id,
                name: langContent.language.name,
                code: langContent.language.folder,
                folder: langContent.language.folder,
                direction: langContent.language.direction,
                flagImage: langContent.language.flagImage,
              }
            : undefined,
        } as RevenueSubscriptionWithLanguage;
      });
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
    const whereClause: Record<string, unknown> = {};

    if (subscriptionType) {
      whereClause.subscriptionType = subscriptionType;
    }

    if (!includeInactive) {
      whereClause.status = true;
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.revenueSubscription.findMany({
        where: whereClause,
        include: {
          languageContents: {
            where: { languageId },
            include: { language: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.revenueSubscription.count({
        where: whereClause,
      }),
    ]);

    const data = subscriptions
      .filter((sub) => sub.languageContents.length > 0)
      .map((subscription) => {
        const langContent = subscription.languageContents[0];
        return {
          ...subscription,
          amount: Number(subscription.amount),
          maxInvestmentAllowed: subscription.maxInvestmentAllowed
            ? Number(subscription.maxInvestmentAllowed)
            : undefined,
          maxProjectAllowed: subscription.maxProjectAllowed
            ? Number(subscription.maxProjectAllowed)
            : undefined,
          maxProjectGoalLimit: subscription.maxProjectGoalLimit
            ? Number(subscription.maxProjectGoalLimit)
            : undefined,
          title: langContent.title,
          description: langContent.description,
          language: langContent.language
            ? {
                id: langContent.language.id,
                name: langContent.language.name,
                code: langContent.language.folder,
                folder: langContent.language.folder,
                direction: langContent.language.direction,
                flagImage: langContent.language.flagImage,
              }
            : undefined,
        } as RevenueSubscriptionWithLanguage;
      });

    return { data, total, page, limit };
  }

  async findByPublicIdWithLanguage(
    publicId: string,
    languageId: string
  ): Promise<RevenueSubscriptionWithLanguage | null> {
    const subscription = await this.prisma.revenueSubscription.findUnique({
      where: { publicId },
      include: {
        languageContents: {
          where: { languageId },
          include: { language: true },
        },
      },
    });

    if (!subscription || subscription.languageContents.length === 0) {
      return null;
    }

    const langContent = subscription.languageContents[0];
    return {
      ...subscription,
      amount: Number(subscription.amount),
      maxInvestmentAllowed: subscription.maxInvestmentAllowed
        ? Number(subscription.maxInvestmentAllowed)
        : undefined,
      maxProjectAllowed: subscription.maxProjectAllowed
        ? Number(subscription.maxProjectAllowed)
        : undefined,
      maxProjectGoalLimit: subscription.maxProjectGoalLimit
        ? Number(subscription.maxProjectGoalLimit)
        : undefined,
      title: langContent.title,
      description: langContent.description,
      language: langContent.language
        ? {
            id: langContent.language.id,
            name: langContent.language.name,
            code: langContent.language.folder,
            folder: langContent.language.folder,
            direction: langContent.language.direction,
            flagImage: langContent.language.flagImage,
          }
        : undefined,
    } as RevenueSubscriptionWithLanguage;
  }

  async createWithMultiLanguageContent(
    createDto: CreateRevenueSubscriptionDto,
    languageIds: string[]
  ): Promise<RevenueSubscription> {
    // First create the main subscription
    const subscription = await this.insert(createDto);

    // Then create language content for all languages
    await Promise.all(
      languageIds.map((languageId) =>
        this.prisma.revenueSubscriptionLanguage.create({
          data: {
            publicId: uuidv4(),
            mainSubscriptionId: subscription.id,
            title: createDto.title,
            description: createDto.description,
            languageId,
          },
        })
      )
    );

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
    const updateData: Record<string, unknown> = {};

    // Update main subscription fields
    if (updateDto.subscriptionType !== undefined)
      updateData.subscriptionType = updateDto.subscriptionType;
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.maxInvestmentAllowed !== undefined)
      updateData.maxInvestmentAllowed = updateDto.maxInvestmentAllowed;
    if (updateDto.maxProjectAllowed !== undefined)
      updateData.maxProjectAllowed = updateDto.maxProjectAllowed;
    if (updateDto.maxProjectGoalLimit !== undefined)
      updateData.maxProjectGoalLimit = updateDto.maxProjectGoalLimit;
    if (updateDto.allowRefund !== undefined)
      updateData.allowRefund = updateDto.allowRefund;
    if (updateDto.allowRefundDays !== undefined)
      updateData.allowRefundDays = updateDto.allowRefundDays;
    if (updateDto.allowCancel !== undefined)
      updateData.allowCancel = updateDto.allowCancel;
    if (updateDto.allowCancelDays !== undefined)
      updateData.allowCancelDays = updateDto.allowCancelDays;
    if (updateDto.secondaryMarketAccess !== undefined)
      updateData.secondaryMarketAccess = updateDto.secondaryMarketAccess;
    if (updateDto.earlyBirdAccess !== undefined)
      updateData.earlyBirdAccess = updateDto.earlyBirdAccess;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    const subscription = await this.prisma.revenueSubscription.update({
      where: { publicId },
      data: updateData,
    });

    // Update language content if provided
    if (languageContents && languageContents.length > 0) {
      for (const langContent of languageContents) {
        const langUpdateData: Record<string, unknown> = {
          title: langContent.title,
          description: langContent.description,
        };

        await this.prisma.revenueSubscriptionLanguage.updateMany({
          where: {
            mainSubscriptionId: subscription.id,
            languageId: langContent.languageId,
          },
          data: langUpdateData,
        });
      }
    }

    return {
      ...subscription,
      amount: Number(subscription.amount),
      maxInvestmentAllowed: subscription.maxInvestmentAllowed
        ? Number(subscription.maxInvestmentAllowed)
        : undefined,
      maxProjectAllowed: subscription.maxProjectAllowed
        ? Number(subscription.maxProjectAllowed)
        : undefined,
      maxProjectGoalLimit: subscription.maxProjectGoalLimit
        ? Number(subscription.maxProjectGoalLimit)
        : undefined,
    } as RevenueSubscription;
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      // First check if subscription is in use
      const subscription = await this.prisma.revenueSubscription.findUnique({
        where: { publicId },
        select: { useCount: true, id: true },
      });

      if (!subscription) {
        return false;
      }

      if (subscription.useCount > 0) {
        throw new Error(
          `Cannot delete revenue subscription with useCount: ${subscription.useCount}`
        );
      }

      // Delete language contents first (cascade)
      await this.prisma.revenueSubscriptionLanguage.deleteMany({
        where: { mainSubscriptionId: subscription.id },
      });

      // Then delete main subscription
      await this.prisma.revenueSubscription.delete({
        where: { publicId },
      });

      return true;
    } catch {
      return false;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    await this.prisma.revenueSubscription.update({
      where: { publicId },
      data: { useCount: { increment: 1 } },
    });
  }

  async decrementUseCount(publicId: string): Promise<void> {
    await this.prisma.revenueSubscription.update({
      where: { publicId },
      data: { useCount: { decrement: 1 } },
    });
  }

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<RevenueSubscription>
  ): Promise<{ count: number; updated: RevenueSubscription[] }> {
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.subscriptionType !== undefined)
      updateData.subscriptionType = data.subscriptionType;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.earlyBirdAccess !== undefined)
      updateData.earlyBirdAccess = data.earlyBirdAccess;

    const result = await this.prisma.revenueSubscription.updateMany({
      where: { publicId: { in: publicIds } },
      data: updateData,
    });

    const updatedSubscriptions = await this.prisma.revenueSubscription.findMany(
      {
        where: { publicId: { in: publicIds } },
      }
    );

    return {
      count: result.count,
      updated: updatedSubscriptions.map((sub) => ({
        ...sub,
        amount: Number(sub.amount),
        maxInvestmentAllowed: sub.maxInvestmentAllowed
          ? Number(sub.maxInvestmentAllowed)
          : undefined,
        maxProjectAllowed: sub.maxProjectAllowed
          ? Number(sub.maxProjectAllowed)
          : undefined,
        maxProjectGoalLimit: sub.maxProjectGoalLimit
          ? Number(sub.maxProjectGoalLimit)
          : undefined,
      })) as RevenueSubscription[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: RevenueSubscription[] }> {
    // First get subscriptions to be deleted for return value
    const subscriptionsToDelete =
      await this.prisma.revenueSubscription.findMany({
        where: { publicId: { in: publicIds } },
      });

    // Check if any subscription is in use
    for (const subscription of subscriptionsToDelete) {
      if (subscription.useCount > 0) {
        throw new Error(
          `Cannot delete revenue subscription ${subscription.publicId} with useCount: ${subscription.useCount}`
        );
      }
    }

    // Delete language contents first
    await this.prisma.revenueSubscriptionLanguage.deleteMany({
      where: {
        mainSubscriptionId: {
          in: subscriptionsToDelete.map((sub) => sub.id),
        },
      },
    });

    // Then delete main subscriptions
    const deleteResult = await this.prisma.revenueSubscription.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: subscriptionsToDelete.map((sub) => ({
        ...sub,
        amount: Number(sub.amount),
        maxInvestmentAllowed: sub.maxInvestmentAllowed
          ? Number(sub.maxInvestmentAllowed)
          : undefined,
        maxProjectAllowed: sub.maxProjectAllowed
          ? Number(sub.maxProjectAllowed)
          : undefined,
        maxProjectGoalLimit: sub.maxProjectGoalLimit
          ? Number(sub.maxProjectGoalLimit)
          : undefined,
      })) as RevenueSubscription[],
    };
  }

  async isInUse(publicId: string): Promise<boolean> {
    const subscription = await this.prisma.revenueSubscription.findUnique({
      where: { publicId },
      select: { useCount: true },
    });
    return subscription ? subscription.useCount > 0 : false;
  }

  async getDefaultLanguageId(): Promise<string> {
    const defaultLanguage = await this.prisma.language.findFirst({
      where: {
        isDefault: 'YES',
        status: true,
      },
    });

    if (!defaultLanguage) {
      throw new Error('No default language found');
    }

    return defaultLanguage.id;
  }

  async getAllActiveLanguageIds(): Promise<string[]> {
    const languages = await this.prisma.language.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
      },
    });

    return languages.map((lang) => lang.id);
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
    const whereClause: Record<string, unknown> = {};

    if (filter.publicId) whereClause.publicId = filter.publicId;
    if (filter.id) whereClause.id = filter.id;
    if (filter.subscriptionType)
      whereClause.subscriptionType = filter.subscriptionType;

    const subscription = await this.prisma.revenueSubscription.findFirst({
      where: whereClause,
    });
    return subscription as RevenueSubscription | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<RevenueSubscription>
  ): Promise<RevenueSubscription> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.subscriptionType !== undefined)
      updateData.subscriptionType = updateDto.subscriptionType;
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.useCount !== undefined)
      updateData.useCount = updateDto.useCount;

    const subscription = await this.prisma.revenueSubscription.update({
      where: { id },
      data: updateData,
    });
    return {
      ...subscription,
      amount: Number(subscription.amount),
      maxInvestmentAllowed: subscription.maxInvestmentAllowed
        ? Number(subscription.maxInvestmentAllowed)
        : undefined,
      maxProjectAllowed: subscription.maxProjectAllowed
        ? Number(subscription.maxProjectAllowed)
        : undefined,
      maxProjectGoalLimit: subscription.maxProjectGoalLimit
        ? Number(subscription.maxProjectGoalLimit)
        : undefined,
    } as RevenueSubscription;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.revenueSubscription.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  protected convertFilterToPrisma(
    filter: Partial<RevenueSubscription>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.subscriptionType) {
      prismaFilter.subscriptionType = filter.subscriptionType;
    }
    if (filter.amount !== undefined) {
      prismaFilter.amount = filter.amount;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }

    return prismaFilter;
  }
}
