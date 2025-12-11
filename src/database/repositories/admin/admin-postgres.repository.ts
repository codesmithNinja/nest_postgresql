import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { Admin } from '../../entities/admin.entity';
import { IAdminRepository, MongoQuery } from './admin.repository.interface';
import {
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export class AdminPostgresRepository
  extends PostgresRepository<Admin>
  implements IAdminRepository
{
  protected modelName = 'admin';
  protected selectFields = {
    id: true,
    publicId: true,
    firstName: true,
    lastName: true,
    email: true,
    photo: true,
    password: true,
    passwordChangedAt: true,
    passwordResetToken: true,
    passwordResetExpires: true,
    active: true,
    loginIpAddress: true,
    currentLoginDateTime: true,
    lastLoginDateTime: true,
    twoFactorAuthVerified: true,
    twoFactorSecretKey: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: string): Promise<Admin | null> {
    return await this.getDetailById(id);
  }

  async findMany(
    filter?: MongoQuery<Admin>,
    options?: QueryOptions
  ): Promise<Admin[]> {
    return await this.getAll(filter as Partial<Admin>, options);
  }

  async update(id: string, data: Partial<Admin>): Promise<Admin> {
    return await this.updateById(id, data);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return await this.getDetail({ email } as Partial<Admin>);
  }

  async findByPublicId(publicId: string): Promise<Admin | null> {
    return await this.getDetail({ publicId } as Partial<Admin>);
  }

  async findByResetToken(token: string): Promise<Admin | null> {
    return await this.getDetail({
      passwordResetToken: token,
    } as Partial<Admin>);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<Admin> {
    return await this.updateById(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    } as Partial<Admin>);
  }

  async findWithPagination(
    filter?: MongoQuery<Admin>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Admin>> {
    const page = options?.skip
      ? Math.floor(options.skip / (options.limit || 10)) + 1
      : 1;
    const limit = options?.limit || 10;

    const [items, totalCount] = await Promise.all([
      this.getAll(filter as Partial<Admin>, options),
      this.count(filter as Partial<Admin>),
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
    filter?: MongoQuery<Admin>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Admin>> {
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
    const [items, total] = await Promise.all([
      this.prisma.admin.findMany({
        where: whereClause,
        select: this.selectFields,
        skip,
        take: limit,
        orderBy: options?.sort || { createdAt: 'desc' },
      }),
      this.prisma.admin.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((item) => this.toEntity(item)),
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
    filter?: MongoQuery<Admin>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const prismaFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key !== 'firstName' && key !== 'lastName' && key !== 'email') {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          prismaFilter[key] = value;
        }
      }
    });

    return Object.keys(prismaFilter).length > 0 ? prismaFilter : null;
  }

  protected convertFilterToPrisma(
    filter: Partial<Admin>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'firstName' || key === 'lastName' || key === 'email') {
        if (typeof value === 'string') {
          prismaFilter[key] = {
            contains: value,
            mode: 'insensitive',
          };
        }
      } else {
        prismaFilter[key] = value;
      }
    });

    return prismaFilter;
  }

  private toEntity(item: Record<string, unknown>): Admin {
    return {
      id: item.id as string,
      publicId: item.publicId as string,
      firstName: item.firstName as string,
      lastName: item.lastName as string,
      email: item.email as string,
      photo: (item.photo as string | null) ?? undefined,
      password: item.password as string,
      passwordChangedAt: (item.passwordChangedAt as Date | null) ?? undefined,
      passwordResetToken:
        (item.passwordResetToken as string | null) ?? undefined,
      passwordResetExpires:
        (item.passwordResetExpires as Date | null) ?? undefined,
      active: item.active as boolean,
      loginIpAddress: (item.loginIpAddress as string | null) ?? undefined,
      currentLoginDateTime:
        (item.currentLoginDateTime as Date | null) ?? undefined,
      lastLoginDateTime: (item.lastLoginDateTime as Date | null) ?? undefined,
      twoFactorAuthVerified: item.twoFactorAuthVerified as boolean,
      twoFactorSecretKey:
        (item.twoFactorSecretKey as string | null) ?? undefined,
      createdAt: item.createdAt as Date,
      updatedAt: item.updatedAt as Date,
    };
  }
}
