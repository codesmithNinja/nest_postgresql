import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Language,
  CreateLanguageDto,
  UpdateLanguageDto,
} from '../../entities/language.entity';
import { ILanguageRepository } from './language.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LanguagePostgresRepository
  extends PostgresRepository<Language>
  implements ILanguageRepository
{
  protected modelName = 'language';
  protected selectFields = {
    id: true,
    publicId: true,
    name: true,
    code: true,
    direction: true,
    flagImage: true,
    isDefault: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateLanguageDto): Promise<Language> {
    const language = await this.prisma.language.create({
      data: {
        publicId: uuidv4(),
        ...createDto,
      },
    });
    return language as Language;
  }

  async findByCode(code: string): Promise<Language | null> {
    const language = await this.prisma.language.findUnique({
      where: { code: code.toLowerCase() },
    });
    return language as Language | null;
  }

  async findByIsDefault(isDefault: string): Promise<Language | null> {
    const language = await this.prisma.language.findFirst({
      where: { isDefault },
    });
    return language as Language | null;
  }

  async findAllActive(): Promise<Language[]> {
    const languages = await this.prisma.language.findMany({
      where: { status: true },
      orderBy: { name: 'asc' },
    });
    return languages as Language[];
  }

  async setAsDefault(id: string): Promise<Language> {
    // First, unset all other defaults
    await this.unsetAllDefaults();

    // Then set this language as default
    const language = await this.prisma.language.update({
      where: { id },
      data: { isDefault: 'YES' },
    });
    return language as Language;
  }

  async unsetAllDefaults(): Promise<void> {
    await this.prisma.language.updateMany({
      where: { isDefault: 'YES' },
      data: { isDefault: 'NO' },
    });
  }

  async findWithDropdowns(id: string): Promise<Language | null> {
    const language = await this.prisma.language.findUnique({
      where: { id },
      include: {
        manageDropdowns: true,
      },
    });
    return language as Language | null;
  }

  async findActiveLanguages(): Promise<Language[]> {
    return this.findAllActive();
  }

  async bulkUpdateStatus(ids: string[], status: boolean): Promise<number> {
    const result = await this.prisma.language.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return result.count;
  }

  async getDetail(filter: Partial<Language>): Promise<Language | null> {
    const whereClause: any = {};

    if (filter.publicId) {
      whereClause.publicId = filter.publicId;
    }
    if (filter.id) {
      whereClause.id = filter.id;
    }
    if (filter.code) {
      whereClause.code = filter.code;
    }
    if (filter.name) {
      whereClause.name = filter.name;
    }

    const language = await this.prisma.language.findFirst({
      where: whereClause,
    });
    return language as Language | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<Language>
  ): Promise<Language> {
    const language = await this.prisma.language.update({
      where: { id },
      data: updateDto,
    });
    return language as Language;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.language.update({
        where: { id },
        data: { status: false },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause = filter ? this.convertFilterToPrisma(filter) : {};

    const [languages, total] = await Promise.all([
      this.prisma.language.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.language.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: languages as Language[],
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

  protected convertFilterToPrisma(filter: Partial<Language>): any {
    const prismaFilter: any = {};

    if (filter.name) {
      prismaFilter.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.code) {
      prismaFilter.code = filter.code;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }
    if (filter.isDefault) {
      prismaFilter.isDefault = filter.isDefault;
    }

    return prismaFilter;
  }
}
