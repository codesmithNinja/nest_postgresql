import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  UpdateManageDropdownDto,
  ManageDropdownWithLanguage,
  BulkOperationDto,
} from '../../entities/manage-dropdown.entity';
import { IManageDropdownRepository } from './manage-dropdown.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ManageDropdownPostgresRepository
  extends PostgresRepository<ManageDropdown>
  implements IManageDropdownRepository
{
  protected modelName = 'manageDropdown';
  protected selectFields = {
    id: true,
    publicId: true,
    name: true,
    uniqueCode: true,
    dropdownType: true,
    countryShortCode: true,
    isDefault: true,
    languageId: true,
    status: true,
    useCount: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateManageDropdownDto): Promise<ManageDropdown> {
    const dropdown = await this.prisma.manageDropdown.create({
      data: {
        publicId: uuidv4(),
        ...createDto,
        languageId: createDto.languageId!,
      },
    });
    return dropdown as ManageDropdown;
  }

  async findByType(
    dropdownType: string,
    includeInactive = false
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: any = { dropdownType };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { name: 'asc' },
    });
    return dropdowns as ManageDropdownWithLanguage[];
  }

  async findByTypeAndLanguage(
    dropdownType: string,
    languageId: string
  ): Promise<ManageDropdown[]> {
    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: {
        dropdownType,
        languageId,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
    return dropdowns as ManageDropdown[];
  }

  async findByPublicId(
    publicId: string
  ): Promise<ManageDropdownWithLanguage | null> {
    const dropdown = await this.prisma.manageDropdown.findUnique({
      where: { publicId },
      include: { language: true },
    });
    return dropdown as ManageDropdownWithLanguage | null;
  }

  async findByTypeForPublic(
    dropdownType: string,
    languageCode?: string
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: any = {
      dropdownType,
      status: true,
    };

    if (languageCode) {
      whereClause.language = {
        iso2: languageCode,
        status: true,
      };
    }

    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { name: 'asc' },
    });
    return dropdowns as ManageDropdownWithLanguage[];
  }

  async createMultiLanguage(
    createDto: CreateManageDropdownDto,
    languageIds: string[]
  ): Promise<ManageDropdown[]> {
    const dropdowns = await Promise.all(
      languageIds.map((languageId) =>
        this.prisma.manageDropdown.create({
          data: {
            publicId: uuidv4(),
            ...createDto,
            languageId,
          },
        })
      )
    );
    return dropdowns as ManageDropdown[];
  }

  async incrementUseCount(id: string): Promise<void> {
    await this.prisma.manageDropdown.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
  }

  async bulkOperation(bulkDto: BulkOperationDto): Promise<number> {
    let updateData: any = {};

    switch (bulkDto.action) {
      case 'activate':
        updateData = { status: true };
        break;
      case 'deactivate':
        updateData = { status: false };
        break;
      case 'delete':
        updateData = { status: false };
        break;
      default:
        throw new Error(`Unsupported bulk action: ${bulkDto.action}`);
    }

    const result = await this.prisma.manageDropdown.updateMany({
      where: { publicId: { in: bulkDto.publicIds } },
      data: updateData,
    });

    return result.count;
  }

  async findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive = false,
    languageCode?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: any = { dropdownType };

    if (!includeInactive) {
      whereClause.status = true;
    }

    if (languageCode) {
      whereClause.language = {
        iso2: languageCode,
        status: true,
      };
    }

    const [dropdowns, total] = await Promise.all([
      this.prisma.manageDropdown.findMany({
        where: whereClause,
        include: { language: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.manageDropdown.count({
        where: whereClause,
      }),
    ]);

    return {
      data: dropdowns as ManageDropdownWithLanguage[],
      total,
      page,
      limit,
    };
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<ManageDropdown>
  ): Promise<ManageDropdown | null> {
    const whereClause: any = {};

    if (filter.publicId) {
      whereClause.publicId = filter.publicId;
    }
    if (filter.id) {
      whereClause.id = filter.id;
    }
    if (filter.name) {
      whereClause.name = filter.name;
    }
    if (filter.dropdownType) {
      whereClause.dropdownType = filter.dropdownType;
    }

    const dropdown = await this.prisma.manageDropdown.findFirst({
      where: whereClause,
    });
    return dropdown as ManageDropdown | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<ManageDropdown>
  ): Promise<ManageDropdown> {
    // Convert entity fields to Prisma update format
    const updateData: any = {};

    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.uniqueCode !== undefined)
      updateData.uniqueCode = updateDto.uniqueCode;
    if (updateDto.dropdownType !== undefined)
      updateData.dropdownType = updateDto.dropdownType;
    if (updateDto.countryShortCode !== undefined)
      updateData.countryShortCode = updateDto.countryShortCode;
    if (updateDto.isDefault !== undefined)
      updateData.isDefault = updateDto.isDefault;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.useCount !== undefined)
      updateData.useCount = updateDto.useCount;

    const dropdown = await this.prisma.manageDropdown.update({
      where: { id },
      data: updateData,
    });
    return dropdown as ManageDropdown;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.manageDropdown.update({
        where: { id },
        data: { status: false },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<ManageDropdown>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ManageDropdown>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause = filter ? this.convertFilterToPrisma(filter) : {};

    const [dropdowns, total] = await Promise.all([
      this.prisma.manageDropdown.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.manageDropdown.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: dropdowns as ManageDropdown[],
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

  protected convertFilterToPrisma(filter: Partial<ManageDropdown>): any {
    const prismaFilter: any = {};

    if (filter.name) {
      prismaFilter.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.dropdownType) {
      prismaFilter.dropdownType = filter.dropdownType;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }
    if (filter.languageId) {
      prismaFilter.languageId = filter.languageId;
    }

    return prismaFilter;
  }
}
