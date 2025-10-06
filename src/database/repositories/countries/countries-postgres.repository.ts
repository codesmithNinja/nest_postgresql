import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ICountriesRepository } from './countries.repository.interface';
import { Country } from '../../entities/country.entity';
import {
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class CountriesPostgresRepository
  extends PostgresRepository<Country>
  implements ICountriesRepository
{
  protected readonly logger = new Logger(CountriesPostgresRepository.name);
  protected readonly modelName = 'country' as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get selectFields(): Record<string, boolean> {
    return {
      id: true,
      publicId: true,
      name: true,
      iso2: true,
      iso3: true,
      flag: true,
      isDefault: true,
      status: true,
      useCount: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // Interface implementation methods
  async findById(id: string): Promise<Country | null> {
    return this.getDetailById(id);
  }

  async findMany(
    filter?: Partial<Country>,
    options?: QueryOptions
  ): Promise<Country[]> {
    return this.getAll(filter, options);
  }

  async update(id: string, data: Partial<Country>): Promise<Country> {
    return this.updateById(id, data);
  }

  async findByPublicId(publicId: string): Promise<Country | null> {
    const result = await this.prisma.country.findUnique({
      where: { publicId },
      select: this.selectFields,
    });

    return result as Country | null;
  }

  async findByIso2(iso2: string): Promise<Country | null> {
    const result = await this.prisma.country.findUnique({
      where: { iso2: iso2.toUpperCase() },
      select: this.selectFields,
    });

    return result as Country | null;
  }

  async findByIso3(iso3: string): Promise<Country | null> {
    const result = await this.prisma.country.findUnique({
      where: { iso3: iso3.toUpperCase() },
      select: this.selectFields,
    });

    return result as Country | null;
  }

  async findDefault(): Promise<Country | null> {
    const result = await this.prisma.country.findFirst({
      where: { isDefault: 'YES' },
      select: this.selectFields,
    });

    return result as Country | null;
  }

  async setAllNonDefault(): Promise<void> {
    await this.prisma.country.updateMany({
      data: { isDefault: 'NO' },
    });
  }

  async findWithPagination(
    filter?: Partial<Country>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Country>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where = filter ? this.convertFilterToPrisma(filter) : {};

    const [items, totalCount] = await Promise.all([
      this.prisma.country.findMany({
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
      this.prisma.country.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as unknown as Country[],
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
    data: Partial<Country>
  ): Promise<{ count: number; updated: Country[] }> {
    const updateResult = await this.prisma.country.updateMany({
      where: { publicId: { in: publicIds } },
      data: data as Prisma.CountryUpdateManyMutationInput,
    });

    const updated = await this.prisma.country.findMany({
      where: { publicId: { in: publicIds } },
      select: this.selectFields,
    });

    return {
      count: updateResult.count,
      updated: updated as unknown as Country[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Country[] }> {
    const deleted = await this.prisma.country.findMany({
      where: { publicId: { in: publicIds } },
      select: this.selectFields,
    });

    const deleteResult = await this.prisma.country.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: deleted as unknown as Country[],
    };
  }

  protected getModelDelegate() {
    return this.prisma.country as unknown as {
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
