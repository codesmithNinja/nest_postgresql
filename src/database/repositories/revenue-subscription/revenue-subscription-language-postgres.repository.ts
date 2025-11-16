import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { RevenueSubscriptionLanguage } from '../../entities/revenue-subscription.entity';
import { IRevenueSubscriptionLanguageRepository } from './revenue-subscription.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RevenueSubscriptionLanguagePostgresRepository
  extends PostgresRepository<RevenueSubscriptionLanguage>
  implements IRevenueSubscriptionLanguageRepository
{
  protected modelName = 'revenueSubscriptionLanguage';
  protected selectFields = {
    id: true,
    publicId: true,
    mainSubscriptionId: true,
    title: true,
    description: true,
    languageId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(
    data: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const languageContent =
      await this.prisma.revenueSubscriptionLanguage.create({
        data: {
          publicId: uuidv4(),
          mainSubscriptionId: data.mainSubscriptionId!,
          title: data.title!,
          description: data.description!,
          languageId: data.languageId!,
        },
      });
    return languageContent as RevenueSubscriptionLanguage;
  }

  async findByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<RevenueSubscriptionLanguage | null> {
    const languageContent =
      await this.prisma.revenueSubscriptionLanguage.findFirst({
        where: {
          mainSubscriptionId,
          languageId,
        },
      });
    return languageContent as RevenueSubscriptionLanguage | null;
  }

  async findByMainSubscriptionId(
    mainSubscriptionId: string
  ): Promise<RevenueSubscriptionLanguage[]> {
    const languageContents =
      await this.prisma.revenueSubscriptionLanguage.findMany({
        where: { mainSubscriptionId },
        orderBy: { createdAt: 'desc' },
      });
    return languageContents as RevenueSubscriptionLanguage[];
  }

  async createMultiLanguageContent(
    mainSubscriptionId: string,
    languageContents: Array<{
      languageId: string;
      title: string;
      description: string;
    }>
  ): Promise<RevenueSubscriptionLanguage[]> {
    const contents = await Promise.all(
      languageContents.map((content) =>
        this.prisma.revenueSubscriptionLanguage.create({
          data: {
            publicId: uuidv4(),
            mainSubscriptionId,
            title: content.title,
            description: content.description,
            languageId: content.languageId,
          },
        })
      )
    );
    return contents as RevenueSubscriptionLanguage[];
  }

  async updateByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string,
    updateDto: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;

    await this.prisma.revenueSubscriptionLanguage.updateMany({
      where: {
        mainSubscriptionId,
        languageId,
      },
      data: updateData,
    });

    // Return the updated record
    const updated = await this.prisma.revenueSubscriptionLanguage.findFirst({
      where: {
        mainSubscriptionId,
        languageId,
      },
    });

    return updated as RevenueSubscriptionLanguage;
  }

  async deleteByMainSubscriptionId(
    mainSubscriptionId: string
  ): Promise<number> {
    const result = await this.prisma.revenueSubscriptionLanguage.deleteMany({
      where: { mainSubscriptionId },
    });
    return result.count;
  }

  async deleteByMainSubscriptionAndLanguage(
    mainSubscriptionId: string,
    languageId: string
  ): Promise<boolean> {
    try {
      const result = await this.prisma.revenueSubscriptionLanguage.deleteMany({
        where: {
          mainSubscriptionId,
          languageId,
        },
      });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage | null> {
    const whereClause: Record<string, unknown> = {};

    if (filter.publicId) whereClause.publicId = filter.publicId;
    if (filter.id) whereClause.id = filter.id;
    if (filter.mainSubscriptionId)
      whereClause.mainSubscriptionId = filter.mainSubscriptionId;
    if (filter.languageId) whereClause.languageId = filter.languageId;

    const languageContent =
      await this.prisma.revenueSubscriptionLanguage.findFirst({
        where: whereClause,
      });
    return languageContent as RevenueSubscriptionLanguage | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<RevenueSubscriptionLanguage>
  ): Promise<RevenueSubscriptionLanguage> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.mainSubscriptionId !== undefined)
      updateData.mainSubscriptionId = updateDto.mainSubscriptionId;
    if (updateDto.languageId !== undefined)
      updateData.languageId = updateDto.languageId;

    const languageContent =
      await this.prisma.revenueSubscriptionLanguage.update({
        where: { id },
        data: updateData,
      });
    return languageContent as RevenueSubscriptionLanguage;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.revenueSubscriptionLanguage.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  protected convertFilterToPrisma(
    filter: Partial<RevenueSubscriptionLanguage>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.mainSubscriptionId) {
      prismaFilter.mainSubscriptionId = filter.mainSubscriptionId;
    }
    if (filter.languageId) {
      prismaFilter.languageId = filter.languageId;
    }
    if (filter.title) {
      prismaFilter.title = { contains: filter.title, mode: 'insensitive' };
    }
    if (filter.description) {
      prismaFilter.description = {
        contains: filter.description,
        mode: 'insensitive',
      };
    }

    return prismaFilter;
  }
}
