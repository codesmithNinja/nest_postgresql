import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ILanguagesRepository } from './languages.repository.interface';
import { Language } from '../../entities/language.entity';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class LanguagesPostgresRepository
  extends PostgresRepository<Language>
  implements ILanguagesRepository
{
  protected readonly logger = new Logger(LanguagesPostgresRepository.name);
  protected readonly modelName = 'language' as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get selectFields(): Record<string, boolean> {
    return {
      id: true,
      publicId: true,
      name: true,
      folder: true,
      iso2: true,
      iso3: true,
      flagImage: true,
      direction: true,
      status: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // Interface implementation methods
  async findById(id: string): Promise<Language | null> {
    return this.getDetailById(id);
  }

  async findMany(
    filter?: Partial<Language>,
    options?: QueryOptions
  ): Promise<Language[]> {
    return this.getAll(filter, options);
  }

  async update(id: string, data: Partial<Language>): Promise<Language> {
    return this.updateById(id, data);
  }

  async findByPublicId(publicId: string): Promise<Language | null> {
    const result = await this.prisma.language.findUnique({
      where: { publicId },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async findByName(name: string): Promise<Language | null> {
    const result = await this.prisma.language.findUnique({
      where: { name },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async findByFolder(folder: string): Promise<Language | null> {
    const result = await this.prisma.language.findFirst({
      where: { folder },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async findByIso2(iso2: string): Promise<Language | null> {
    const result = await this.prisma.language.findUnique({
      where: { iso2: iso2.toUpperCase() },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async findByIso3(iso3: string): Promise<Language | null> {
    const result = await this.prisma.language.findUnique({
      where: { iso3: iso3.toUpperCase() },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async findDefault(): Promise<Language | null> {
    const result = await this.prisma.language.findFirst({
      where: { isDefault: 'YES' },
      select: this.selectFields,
    });

    return result as Language | null;
  }

  async setAllNonDefault(): Promise<void> {
    await this.prisma.language.updateMany({
      data: { isDefault: 'NO' },
    });
  }

  async findWithPagination(
    filter?: Partial<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where = filter ? this.convertFilterToPrisma(filter) : {};

    const [items, totalCount] = await Promise.all([
      this.prisma.language.findMany({
        where,
        select: this.selectFields,
        skip,
        take: limit,
        orderBy: options?.sort
          ? Object.entries(options.sort).map(([key, value]) => ({
              [key]: value === 1 ? 'asc' : 'desc',
            }))
          : undefined,
      }),
      this.prisma.language.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as unknown as Language[],
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
    filter?: Partial<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build search conditions using the provided search fields
    const searchConditions = {
      OR: searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as const },
      })),
    };

    // Build additional filters
    const additionalFilters = this.buildAdditionalFilters(filter);
    const whereClause = additionalFilters
      ? { AND: [searchConditions, additionalFilters] }
      : searchConditions;

    // Execute queries in parallel
    const [items, totalCount] = await Promise.all([
      this.prisma.language.findMany({
        where: whereClause,
        select: this.selectFields,
        skip,
        take: limit,
        orderBy: options?.sort
          ? Object.entries(options.sort).map(([key, value]) => ({
              [key]: value === 1 ? 'asc' : 'desc',
            }))
          : [{ createdAt: 'desc' }],
      }),
      this.prisma.language.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as unknown as Language[],
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }> {
    const updateResult = await this.prisma.language.updateMany({
      where: { publicId: { in: publicIds } },
      data: data as Prisma.LanguageUpdateManyMutationInput,
    });

    const updated = await this.prisma.language.findMany({
      where: { publicId: { in: publicIds } },
      select: this.selectFields,
    });

    return {
      count: updateResult.count,
      updated: updated as unknown as Language[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Language[] }> {
    const deleted = await this.prisma.language.findMany({
      where: { publicId: { in: publicIds } },
      select: this.selectFields,
    });

    const deleteResult = await this.prisma.language.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: deleted as unknown as Language[],
    };
  }

  private buildAdditionalFilters(
    filter?: Partial<Language>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const prismaFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (
        key !== 'name' &&
        key !== 'folder' &&
        key !== 'iso2' &&
        key !== 'iso3'
      ) {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          prismaFilter[key] = value;
        }
      }
    });

    return Object.keys(prismaFilter).length > 0 ? prismaFilter : null;
  }

  protected getModelDelegate() {
    return this.prisma.language as unknown as {
      findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
      findUnique: (args?: Record<string, unknown>) => Promise<unknown>;
      findFirst: (args?: Record<string, unknown>) => Promise<unknown>;
      create: (args?: Record<string, unknown>) => Promise<unknown>;
      update: (args?: Record<string, unknown>) => Promise<unknown>;
      updateMany: (
        args?: Record<string, unknown>
      ) => Promise<{ count: number }>;
      delete: (args?: Record<string, unknown>) => Promise<unknown>;
      deleteMany: (
        args?: Record<string, unknown>
      ) => Promise<{ count: number }>;
      count: (args?: Record<string, unknown>) => Promise<number>;
    };
  }
}
