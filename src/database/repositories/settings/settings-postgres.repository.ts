import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ISettingsRepository } from './settings.repository.interface';
import {
  Settings,
  CreateSettingsData,
  UpdateSettingsData,
} from '../../entities/settings.entity';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class SettingsPostgresRepository
  extends PostgresRepository<Settings>
  implements ISettingsRepository
{
  protected readonly logger = new Logger(SettingsPostgresRepository.name);
  protected readonly modelName = 'settings' as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get selectFields(): Prisma.SettingsSelect {
    return {
      id: true,
      groupType: true,
      recordType: true,
      key: true,
      value: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  async getAll(
    filter?: Partial<Settings>,
    options?: QueryOptions
  ): Promise<Settings[]> {
    const where = this.buildWhereClause(filter);
    const result = await this.prisma.settings.findMany({
      where,
      select: this.selectFields,
      ...this.buildQueryOptions(options),
    });
    return result as Settings[];
  }

  async getDetailById(id: string): Promise<Settings | null> {
    const result = await this.prisma.settings.findUnique({
      where: { id },
      select: this.selectFields,
    });
    return result as Settings | null;
  }

  async getDetail(
    filter: Partial<Settings>,
    options?: QueryOptions
  ): Promise<Settings | null> {
    const where = this.buildWhereClause(filter);
    const queryOptions = this.buildQueryOptions(options);
    const result = await this.prisma.settings.findFirst({
      where,
      select: this.selectFields,
      ...queryOptions,
    });
    return result as Settings | null;
  }

  async insert(data: Partial<Settings>): Promise<Settings> {
    const result = await this.prisma.settings.create({
      data: data as Prisma.SettingsCreateInput,
      select: this.selectFields,
    });
    return result as Settings;
  }

  async updateById(id: string, data: Partial<Settings>): Promise<Settings> {
    const result = await this.prisma.settings.update({
      where: { id },
      data: data as Prisma.SettingsUpdateInput,
      select: this.selectFields,
    });
    return result as Settings;
  }

  async updateMany(
    filter: Partial<Settings>,
    data: Partial<Settings>
  ): Promise<{ count: number; updated: Settings[] }> {
    const where = this.buildWhereClause(filter);

    // Perform the update
    const updateResult = await this.prisma.settings.updateMany({
      where,
      data: data as Prisma.SettingsUpdateManyMutationInput,
    });

    // Get updated items
    const updatedItems = await this.prisma.settings.findMany({
      where,
      select: this.selectFields,
    });

    return {
      count: updateResult.count,
      updated: updatedItems as Settings[],
    };
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.settings.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async deleteMany(
    filter: Partial<Settings>
  ): Promise<{ count: number; deleted: Settings[] }> {
    const where = this.buildWhereClause(filter);

    // Get items that will be deleted
    const itemsToDelete = await this.prisma.settings.findMany({
      where,
      select: this.selectFields,
    });

    // Perform the deletion
    const deleteResult = await this.prisma.settings.deleteMany({ where });

    return {
      count: deleteResult.count,
      deleted: itemsToDelete as Settings[],
    };
  }

  async count(filter?: Partial<Settings>): Promise<number> {
    const where = this.buildWhereClause(filter);
    return await this.prisma.settings.count({ where });
  }

  async exists(filter: Partial<Settings>): Promise<boolean> {
    const where = this.buildWhereClause(filter);
    const count = await this.prisma.settings.count({ where });
    return count > 0;
  }

  async findWithPagination(
    filter?: Partial<Settings>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Settings>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filter);

    const [items, totalCount] = await Promise.all([
      this.prisma.settings.findMany({
        where,
        select: this.selectFields,
        skip,
        take: limit,
        ...this.buildQueryOptions({ ...options, skip, limit }),
      }),
      this.prisma.settings.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as Settings[],
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

  async findByGroupType(groupType: string): Promise<Settings[]> {
    const result = await this.prisma.settings.findMany({
      where: { groupType },
      select: this.selectFields,
      orderBy: { key: 'asc' },
    });
    return result as Settings[];
  }

  async findByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<Settings | null> {
    const result = await this.prisma.settings.findUnique({
      where: {
        groupType_key: {
          groupType,
          key,
        },
      },
      select: this.selectFields,
    });
    return result as Settings | null;
  }

  async upsertByGroupTypeAndKey(
    groupType: string,
    key: string,
    data: CreateSettingsData | UpdateSettingsData
  ): Promise<Settings> {
    const upsertData = {
      ...data,
      groupType,
      key,
    };

    const result = await this.prisma.settings.upsert({
      where: {
        groupType_key: {
          groupType,
          key,
        },
      },
      update: data as Prisma.SettingsUpdateInput,
      create: upsertData as Prisma.SettingsCreateInput,
      select: this.selectFields,
    });

    return result as Settings;
  }

  async deleteByGroupType(groupType: string): Promise<number> {
    const deleteResult = await this.prisma.settings.deleteMany({
      where: { groupType },
    });
    return deleteResult.count;
  }

  async deleteByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<boolean> {
    try {
      await this.prisma.settings.delete({
        where: {
          groupType_key: {
            groupType,
            key,
          },
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }

  async bulkUpsert(settings: CreateSettingsData[]): Promise<Settings[]> {
    const results: Settings[] = [];

    for (const setting of settings) {
      const result = await this.upsertByGroupTypeAndKey(
        setting.groupType,
        setting.key,
        setting
      );
      results.push(result);
    }

    return results;
  }

  private buildWhereClause(
    filter?: Partial<Settings>
  ): Prisma.SettingsWhereInput {
    if (!filter) return {};

    const where: Prisma.SettingsWhereInput = {};

    if (filter.id) where.id = filter.id;
    if (filter.groupType) where.groupType = filter.groupType;
    if (filter.recordType) {
      where.recordType =
        filter.recordType as unknown as Prisma.EnumRecordTypeFilter;
    }
    if (filter.key) where.key = filter.key;

    return where;
  }

  private buildQueryOptions(
    options?: QueryOptions
  ): Prisma.SettingsFindManyArgs {
    if (!options) return {};

    const queryOptions: Prisma.SettingsFindManyArgs = {};

    if (options.skip !== undefined) queryOptions.skip = options.skip;
    if (options.limit !== undefined) queryOptions.take = options.limit;

    if (options.sort) {
      queryOptions.orderBy = Object.entries(options.sort).map(
        ([field, direction]) => ({
          [field]: direction === 1 ? 'asc' : 'desc',
        })
      );
    }

    return queryOptions;
  }
}
