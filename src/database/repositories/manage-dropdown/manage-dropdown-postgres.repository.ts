import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
  MinimalLanguage,
} from '../../entities/manage-dropdown.entity';
import {
  IManageDropdownRepository,
  MongoQuery,
} from './manage-dropdown.repository.interface';
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
        // languageId must be the primary key (id) of the language, not publicId
        languageId: createDto.languageId,
      },
    });
    return dropdown as ManageDropdown;
  }

  async findByType(
    dropdownType: string,
    includeInactive = false
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: Record<string, unknown> = { dropdownType };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { name: 'asc' },
    });
    return dropdowns.map((dropdown) => ({
      ...dropdown,
      languageId: dropdown.language
        ? ({
            publicId: dropdown.language.publicId,
            name: dropdown.language.name,
          } as MinimalLanguage)
        : dropdown.languageId,
      language: dropdown.language
        ? {
            ...dropdown.language,
            code: dropdown.language.folder, // Map folder to code field
          }
        : undefined,
    })) as ManageDropdownWithLanguage[];
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
    return dropdown
      ? ({
          ...dropdown,
          languageId: dropdown.language
            ? {
                ...dropdown.language,
                code: dropdown.language.folder, // Map folder to code field
              }
            : dropdown.languageId,
          language: dropdown.language
            ? {
                ...dropdown.language,
                code: dropdown.language.folder, // Map folder to code field
              }
            : undefined,
        } as ManageDropdownWithLanguage)
      : null;
  }

  async findByTypeForPublic(
    dropdownType: string,
    languageId: string // Required - service layer resolves this
  ): Promise<ManageDropdownWithLanguage[]> {
    const whereClause: Record<string, unknown> = {
      dropdownType,
      status: true,
    };

    // Use the resolved languageId directly (already resolved by service layer)
    whereClause.languageId = languageId;

    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { name: 'asc' },
    });
    return dropdowns.map((dropdown) => ({
      ...dropdown,
      languageId: dropdown.language
        ? ({
            publicId: dropdown.language.publicId,
            name: dropdown.language.name,
          } as MinimalLanguage)
        : dropdown.languageId,
      language: dropdown.language
        ? {
            ...dropdown.language,
            code: dropdown.language.folder, // Map folder to code field
          }
        : undefined,
    })) as ManageDropdownWithLanguage[];
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<ManageDropdown>
  ): Promise<{ count: number; updated: ManageDropdown[] }> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.useCount !== undefined) updateData.useCount = data.useCount;

    const result = await this.prisma.manageDropdown.updateMany({
      where: { publicId: { in: publicIds } },
      data: updateData,
    });

    const updatedDropdowns = await this.prisma.manageDropdown.findMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: result.count,
      updated: updatedDropdowns as ManageDropdown[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: ManageDropdown[] }> {
    // First get dropdowns to be deleted for return value
    const dropdownsToDelete = await this.prisma.manageDropdown.findMany({
      where: { publicId: { in: publicIds } },
    });

    // Check if any dropdown is in use
    for (const dropdown of dropdownsToDelete) {
      if (dropdown.useCount > 0) {
        throw new Error(
          `Cannot delete dropdown ${dropdown.publicId} with useCount: ${dropdown.useCount}`
        );
      }
    }

    const deleteResult = await this.prisma.manageDropdown.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: dropdownsToDelete as ManageDropdown[],
    };
  }

  async findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive: boolean,
    languageId: string // Required - service layer resolves this
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = { dropdownType };

    if (!includeInactive) {
      whereClause.status = true;
    }

    // Use the resolved languageId directly (already resolved by service layer)
    whereClause.languageId = languageId;

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
      data: dropdowns.map((dropdown) => ({
        ...dropdown,
        languageId: dropdown.language
          ? {
              ...dropdown.language,
              code: dropdown.language.folder, // Map folder to code field
            }
          : dropdown.languageId,
        language: dropdown.language
          ? {
              ...dropdown.language,
              code: dropdown.language.folder, // Map folder to code field
            }
          : undefined,
      })) as ManageDropdownWithLanguage[],
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<ManageDropdown>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ManageDropdown>> {
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
      this.prisma.manageDropdown.findMany({
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
      this.prisma.manageDropdown.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as unknown as ManageDropdown[],
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

  // Base interface implementations
  async getDetail(
    filter: Partial<ManageDropdown>
  ): Promise<ManageDropdown | null> {
    const whereClause: Record<string, unknown> = {};

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
    const updateData: Record<string, unknown> = {};

    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.uniqueCode !== undefined)
      updateData.uniqueCode = updateDto.uniqueCode;
    if (updateDto.dropdownType !== undefined)
      updateData.dropdownType = updateDto.dropdownType;
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
    } catch {
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

  protected convertFilterToPrisma(
    filter: Partial<ManageDropdown>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

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

  async findByUniqueCode(
    uniqueCode: number
  ): Promise<ManageDropdownWithLanguage[]> {
    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: { uniqueCode },
      include: { language: true },
      orderBy: { createdAt: 'desc' },
    });
    return dropdowns.map((dropdown) => ({
      ...dropdown,
      languageId: dropdown.language
        ? ({
            publicId: dropdown.language.publicId,
            name: dropdown.language.name,
          } as MinimalLanguage)
        : dropdown.languageId,
      language: dropdown.language
        ? {
            ...dropdown.language,
            code: dropdown.language.folder, // Map folder to code field
          }
        : undefined,
    })) as ManageDropdownWithLanguage[];
  }

  async findSingleByTypeAndLanguage(
    dropdownType: string,
    publicId: string,
    languageId: string // Required - service layer resolves this
  ): Promise<ManageDropdownWithLanguage | null> {
    const whereClause: Record<string, unknown> = {
      dropdownType,
      publicId,
    };

    // Use the resolved languageId directly (already resolved by service layer)
    whereClause.languageId = languageId;

    const dropdown = await this.prisma.manageDropdown.findFirst({
      where: whereClause,
      include: { language: true },
    });

    return dropdown
      ? ({
          ...dropdown,
          languageId: dropdown.language
            ? {
                ...dropdown.language,
                code: dropdown.language.folder, // Map folder to code field
              }
            : dropdown.languageId,
          language: dropdown.language
            ? {
                ...dropdown.language,
                code: dropdown.language.folder, // Map folder to code field
              }
            : undefined,
        } as ManageDropdownWithLanguage)
      : null;
  }

  async generateUniqueCode(): Promise<number> {
    // Generate a random 10-digit number
    const min = 1000000000; // 10^9
    const max = 9999999999; // 10^10 - 1

    let uniqueCode: number;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;

      // Check if this code already exists
      const existing = await this.prisma.manageDropdown.findFirst({
        where: { uniqueCode },
      });

      if (!existing) {
        isUnique = true;
        return uniqueCode;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique code after maximum attempts');
  }

  /**
   * Gets the primary key (id) of the default language, NOT the publicId
   * This is used for foreign key relationships in the database
   * @returns Promise<string> The primary key (id) of the default language
   */
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

    // Return the primary key (id), NOT the publicId
    return defaultLanguage.id;
  }

  /**
   * Gets all active language primary keys (id), NOT the publicIds
   * These are used for foreign key relationships in the database
   * @returns Promise<string[]> Array of primary keys (id) of active languages
   */
  async getAllActiveLanguageIds(): Promise<string[]> {
    const languages = await this.prisma.language.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
      },
    });

    // Return primary keys (id), NOT publicIds
    return languages.map((lang) => lang.id);
  }

  async deleteByUniqueCode(uniqueCode: number): Promise<number> {
    // Check useCount before deletion
    const dropdowns = await this.prisma.manageDropdown.findMany({
      where: { uniqueCode },
    });

    for (const dropdown of dropdowns) {
      if (dropdown.useCount > 0) {
        throw new Error(
          `Cannot delete dropdown with unique code ${uniqueCode}. It has useCount: ${dropdown.useCount}`
        );
      }
    }

    // Delete all language variants of this unique code
    const result = await this.prisma.manageDropdown.deleteMany({
      where: { uniqueCode },
    });

    return result.count;
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<ManageDropdown>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const prismaFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (key !== 'name') {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          prismaFilter[key] = value;
        }
      }
    });

    return Object.keys(prismaFilter).length > 0 ? prismaFilter : null;
  }
}
