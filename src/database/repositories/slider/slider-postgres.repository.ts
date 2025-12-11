import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Slider,
  CreateSliderDto,
  SliderWithLanguage,
  MinimalLanguage,
} from '../../entities/slider.entity';
import { ISliderRepository, MongoQuery } from './slider.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SliderPostgresRepository
  extends PostgresRepository<Slider>
  implements ISliderRepository
{
  protected modelName = 'slider';
  protected selectFields = {
    id: true,
    publicId: true,
    uniqueCode: true,
    sliderImage: true,
    title: true,
    description: true,
    buttonTitle: true,
    buttonLink: true,
    languageId: true,
    language: {
      select: {
        id: true,
        publicId: true,
        name: true,
        code: true,
        direction: true,
        flagImage: true,
      },
    },
    customColor: true,
    titleColor: true,
    descriptionColor: true,
    buttonTitleColor: true,
    buttonBackground: true,
    // Second set of description and button fields
    descriptionTwo: true,
    buttonTitleTwo: true,
    buttonLinkTwo: true,
    descriptionTwoColor: true,
    buttonTwoColor: true,
    buttonBackgroundTwo: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateSliderDto): Promise<Slider> {
    const slider = await this.prisma.slider.create({
      data: {
        publicId: uuidv4(),
        ...createDto,
        // languageId must be the primary key (id) of the language, not publicId
        languageId: createDto.languageId,
      },
    });
    return slider as Slider;
  }

  async findForPublic(languageId: string): Promise<SliderWithLanguage[]> {
    const sliders = await this.prisma.slider.findMany({
      where: {
        languageId,
        status: true,
      },
      include: { language: true },
      orderBy: { createdAt: 'desc' },
    });

    return sliders.map((slider) => ({
      ...slider,
      languageId: slider.language
        ? ({
            publicId: slider.language.publicId,
            name: slider.language.name,
          } as MinimalLanguage)
        : slider.languageId,
      language: slider.language
        ? {
            ...slider.language,
            code: slider.language.folder, // Map folder to code field
          }
        : undefined,
    })) as SliderWithLanguage[];
  }

  async findByLanguage(
    languageId: string,
    includeInactive = false
  ): Promise<SliderWithLanguage[]> {
    const whereClause: Record<string, unknown> = { languageId };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const sliders = await this.prisma.slider.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { createdAt: 'desc' },
    });

    return sliders.map((slider) => ({
      ...slider,
      languageId: slider.language
        ? ({
            publicId: slider.language.publicId,
            name: slider.language.name,
          } as MinimalLanguage)
        : slider.languageId,
      language: slider.language
        ? {
            ...slider.language,
            code: slider.language.folder, // Map folder to code field
          }
        : undefined,
    })) as SliderWithLanguage[];
  }

  async findByPublicId(publicId: string): Promise<SliderWithLanguage | null> {
    const slider = await this.prisma.slider.findUnique({
      where: { publicId },
      include: { language: true },
    });

    return slider
      ? ({
          ...slider,
          languageId: slider.language
            ? {
                ...slider.language,
                code: slider.language.folder, // Map folder to code field
              }
            : slider.languageId,
          language: slider.language
            ? {
                ...slider.language,
                code: slider.language.folder, // Map folder to code field
              }
            : undefined,
        } as SliderWithLanguage)
      : null;
  }

  async findByUniqueCode(uniqueCode: number): Promise<SliderWithLanguage[]> {
    const sliders = await this.prisma.slider.findMany({
      where: { uniqueCode },
      include: { language: true },
      orderBy: { createdAt: 'desc' },
    });

    return sliders.map((slider) => ({
      ...slider,
      languageId: slider.language
        ? ({
            publicId: slider.language.publicId,
            name: slider.language.name,
          } as MinimalLanguage)
        : slider.languageId,
      language: slider.language
        ? {
            ...slider.language,
            code: slider.language.folder, // Map folder to code field
          }
        : undefined,
    })) as SliderWithLanguage[];
  }

  async findWithPaginationByLanguage(
    page: number,
    limit: number,
    languageId: string,
    includeInactive: boolean
  ): Promise<{
    data: SliderWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = { languageId };

    if (!includeInactive) {
      whereClause.status = true;
    }

    const [sliders, total] = await Promise.all([
      this.prisma.slider.findMany({
        where: whereClause,
        include: { language: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.slider.count({
        where: whereClause,
      }),
    ]);

    return {
      data: sliders.map((slider) => ({
        ...slider,
        languageId: slider.language
          ? {
              ...slider.language,
              code: slider.language.folder, // Map folder to code field
            }
          : slider.languageId,
        language: slider.language
          ? {
              ...slider.language,
              code: slider.language.folder, // Map folder to code field
            }
          : undefined,
      })) as SliderWithLanguage[],
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Slider>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Slider>> {
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
      this.prisma.slider.findMany({
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
      this.prisma.slider.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: items as unknown as Slider[],
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

  async createMultiLanguage(
    createDto: CreateSliderDto,
    languageIds: string[]
  ): Promise<Slider[]> {
    const sliders = await Promise.all(
      languageIds.map((languageId) =>
        this.prisma.slider.create({
          data: {
            publicId: uuidv4(),
            ...createDto,
            languageId,
          },
        })
      )
    );
    return sliders as Slider[];
  }

  async createMultiLanguageWithFiles(
    createDto: Omit<CreateSliderDto, 'sliderImage' | 'languageId'>,
    languageFilePairs: Array<{ languageId: string; filePath: string }>
  ): Promise<Slider[]> {
    const sliders = await Promise.all(
      languageFilePairs.map(({ languageId, filePath }) =>
        this.prisma.slider.create({
          data: {
            publicId: uuidv4(),
            ...createDto,
            sliderImage: filePath,
            languageId,
          },
        })
      )
    );
    return sliders as Slider[];
  }

  async getAllActiveLanguageCodesWithIds(): Promise<
    Array<{ id: string; folder: string }>
  > {
    const languages = await this.prisma.language.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        folder: true,
      },
    });

    return languages;
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
      const existing = await this.prisma.slider.findFirst({
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

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Slider>
  ): Promise<{ count: number; updated: Slider[] }> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.buttonTitle !== undefined)
      updateData.buttonTitle = data.buttonTitle;
    if (data.buttonLink !== undefined) updateData.buttonLink = data.buttonLink;
    if (data.customColor !== undefined)
      updateData.customColor = data.customColor;
    if (data.titleColor !== undefined) updateData.titleColor = data.titleColor;
    if (data.descriptionColor !== undefined)
      updateData.descriptionColor = data.descriptionColor;
    if (data.buttonTitleColor !== undefined)
      updateData.buttonTitleColor = data.buttonTitleColor;
    if (data.buttonBackground !== undefined)
      updateData.buttonBackground = data.buttonBackground;
    if (data.descriptionTwo !== undefined)
      updateData.descriptionTwo = data.descriptionTwo;
    if (data.buttonTitleTwo !== undefined)
      updateData.buttonTitleTwo = data.buttonTitleTwo;
    if (data.buttonLinkTwo !== undefined)
      updateData.buttonLinkTwo = data.buttonLinkTwo;
    if (data.descriptionTwoColor !== undefined)
      updateData.descriptionTwoColor = data.descriptionTwoColor;
    if (data.buttonTwoColor !== undefined)
      updateData.buttonTwoColor = data.buttonTwoColor;
    if (data.buttonBackgroundTwo !== undefined)
      updateData.buttonBackgroundTwo = data.buttonBackgroundTwo;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sliderImage !== undefined)
      updateData.sliderImage = data.sliderImage;

    const result = await this.prisma.slider.updateMany({
      where: { publicId: { in: publicIds } },
      data: updateData,
    });

    const updatedSliders = await this.prisma.slider.findMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: result.count,
      updated: updatedSliders as Slider[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Slider[] }> {
    // First get sliders to be deleted for return value
    const slidersToDelete = await this.prisma.slider.findMany({
      where: { publicId: { in: publicIds } },
    });

    const deleteResult = await this.prisma.slider.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: slidersToDelete as Slider[],
    };
  }

  async deleteByUniqueCode(uniqueCode: number): Promise<number> {
    // Delete all language variants of this unique code
    const result = await this.prisma.slider.deleteMany({
      where: { uniqueCode },
    });

    return result.count;
  }

  async isUniqueCodeExists(uniqueCode: number): Promise<boolean> {
    const slider = await this.prisma.slider.findFirst({
      where: { uniqueCode },
    });
    return !!slider;
  }

  // Base interface implementations
  async getDetail(filter: Partial<Slider>): Promise<Slider | null> {
    const whereClause: Record<string, unknown> = {};

    if (filter.publicId) {
      whereClause.publicId = filter.publicId;
    }
    if (filter.id) {
      whereClause.id = filter.id;
    }
    if (filter.uniqueCode !== undefined) {
      whereClause.uniqueCode = filter.uniqueCode;
    }
    if (filter.title) {
      whereClause.title = filter.title;
    }

    const slider = await this.prisma.slider.findFirst({
      where: whereClause,
    });
    return slider as Slider | null;
  }

  async updateById(id: string, updateDto: Partial<Slider>): Promise<Slider> {
    // Convert entity fields to Prisma update format
    const updateData: Record<string, unknown> = {};

    if (updateDto.uniqueCode !== undefined)
      updateData.uniqueCode = updateDto.uniqueCode;
    if (updateDto.sliderImage !== undefined)
      updateData.sliderImage = updateDto.sliderImage;
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.buttonTitle !== undefined)
      updateData.buttonTitle = updateDto.buttonTitle;
    if (updateDto.buttonLink !== undefined)
      updateData.buttonLink = updateDto.buttonLink;
    if (updateDto.customColor !== undefined)
      updateData.customColor = updateDto.customColor;
    if (updateDto.titleColor !== undefined)
      updateData.titleColor = updateDto.titleColor;
    if (updateDto.descriptionColor !== undefined)
      updateData.descriptionColor = updateDto.descriptionColor;
    if (updateDto.buttonTitleColor !== undefined)
      updateData.buttonTitleColor = updateDto.buttonTitleColor;
    if (updateDto.buttonBackground !== undefined)
      updateData.buttonBackground = updateDto.buttonBackground;

    // Second set of description and button fields
    if (updateDto.descriptionTwo !== undefined)
      updateData.descriptionTwo = updateDto.descriptionTwo;
    if (updateDto.buttonTitleTwo !== undefined)
      updateData.buttonTitleTwo = updateDto.buttonTitleTwo;
    if (updateDto.buttonLinkTwo !== undefined)
      updateData.buttonLinkTwo = updateDto.buttonLinkTwo;
    if (updateDto.descriptionTwoColor !== undefined)
      updateData.descriptionTwoColor = updateDto.descriptionTwoColor;
    if (updateDto.buttonTwoColor !== undefined)
      updateData.buttonTwoColor = updateDto.buttonTwoColor;
    if (updateDto.buttonBackgroundTwo !== undefined)
      updateData.buttonBackgroundTwo = updateDto.buttonBackgroundTwo;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    const slider = await this.prisma.slider.update({
      where: { id },
      data: updateData,
    });
    return slider as Slider;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.slider.update({
        where: { id },
        data: { status: false },
      });
      return true;
    } catch {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<Slider>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Slider>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause = filter ? this.convertFilterToPrisma(filter) : {};

    const [sliders, total] = await Promise.all([
      this.prisma.slider.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.slider.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: sliders as Slider[],
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
    filter: Partial<Slider>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.title) {
      prismaFilter.title = { contains: filter.title, mode: 'insensitive' };
    }
    if (filter.description) {
      prismaFilter.description = {
        contains: filter.description,
        mode: 'insensitive',
      };
    }
    if (filter.uniqueCode !== undefined) {
      prismaFilter.uniqueCode = filter.uniqueCode;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }
    if (filter.languageId) {
      prismaFilter.languageId = filter.languageId;
    }
    if (filter.customColor !== undefined) {
      prismaFilter.customColor = filter.customColor;
    }

    return prismaFilter;
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<Slider>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const prismaFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (
        key !== 'title' &&
        key !== 'description' &&
        key !== 'buttonTitle' &&
        key !== 'buttonTitleTwo' &&
        key !== 'descriptionTwo'
      ) {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          prismaFilter[key] = value;
        }
      }
    });

    return Object.keys(prismaFilter).length > 0 ? prismaFilter : null;
  }
}
