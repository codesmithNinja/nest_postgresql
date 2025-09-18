import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { Admin } from '../../entities/admin.entity';
import { IAdminRepository, MongoQuery } from './admin.repository.interface';
import {
  QueryOptions,
  PaginatedResult,
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

  protected convertFilterToPrisma(filter: Partial<Admin>): Record<string, any> {
    const prismaFilter: Record<string, any> = {};

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
}
