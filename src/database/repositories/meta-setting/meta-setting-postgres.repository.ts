import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MetaSetting,
  CreateMetaSettingDto,
  UpdateMetaSettingDto,
  MetaSettingWithLanguage,
  MinimalLanguage,
} from '../../entities/meta-setting.entity';
import { IMetaSettingRepository } from './meta-setting.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MetaSettingPostgresRepository
  extends PostgresRepository<MetaSetting>
  implements IMetaSettingRepository
{
  protected modelName = 'metaSetting';
  protected selectFields = {
    id: true,
    publicId: true,
    languageId: true,
    language: {
      select: {
        id: true,
        publicId: true,
        name: true,
        folder: true,
        iso2: true,
        iso3: true,
        direction: true,
        flagImage: true,
      },
    },
    siteName: true,
    metaTitle: true,
    metaDescription: true,
    metaKeyword: true,
    ogTitle: true,
    ogDescription: true,
    ogImage: true,
    isAIGeneratedImage: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateMetaSettingDto): Promise<MetaSetting> {
    const metaSetting = await this.prisma.metaSetting.create({
      data: {
        publicId: uuidv4(),
        ...createDto,
        // languageId must be the primary key (id) of the language, not publicId
        languageId: createDto.languageId,
      },
    });
    return metaSetting as MetaSetting;
  }

  async findByLanguageId(
    languageId: string
  ): Promise<MetaSettingWithLanguage | null> {
    const metaSetting = await this.prisma.metaSetting.findUnique({
      where: { languageId },
      include: { language: true },
    });

    return metaSetting
      ? ({
          ...metaSetting,
          languageId: metaSetting.language
            ? ({
                publicId: metaSetting.language.publicId,
                name: metaSetting.language.name,
              } as MinimalLanguage)
            : metaSetting.languageId,
          language: metaSetting.language
            ? {
                ...metaSetting.language,
                code: metaSetting.language.folder, // Map folder to code field
              }
            : undefined,
        } as MetaSettingWithLanguage)
      : null;
  }

  async findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<MetaSettingWithLanguage | null> {
    // Same implementation as findByLanguageId since we always need language info
    return this.findByLanguageId(languageId);
  }

  async findByPublicIdWithLanguage(
    publicId: string
  ): Promise<MetaSettingWithLanguage | null> {
    const metaSetting = await this.prisma.metaSetting.findUnique({
      where: { publicId },
      include: { language: true },
    });

    return metaSetting
      ? ({
          ...metaSetting,
          languageId: metaSetting.language
            ? ({
                publicId: metaSetting.language.publicId,
                name: metaSetting.language.name,
                folder: metaSetting.language.folder,
                iso2: metaSetting.language.iso2,
                iso3: metaSetting.language.iso3,
              } as MinimalLanguage)
            : metaSetting.languageId,
          language: metaSetting.language
            ? {
                ...metaSetting.language,
                code: metaSetting.language.folder, // Map folder to code field
              }
            : undefined,
        } as MetaSettingWithLanguage)
      : null;
  }

  async createOrUpdateByLanguageId(
    createDto: CreateMetaSettingDto
  ): Promise<MetaSetting> {
    const existing = await this.prisma.metaSetting.findUnique({
      where: { languageId: createDto.languageId },
    });

    if (existing) {
      // Update existing meta setting
      const updated = await this.prisma.metaSetting.update({
        where: { languageId: createDto.languageId },
        data: {
          siteName: createDto.siteName,
          metaTitle: createDto.metaTitle,
          metaDescription: createDto.metaDescription,
          metaKeyword: createDto.metaKeyword,
          ogTitle: createDto.ogTitle,
          ogDescription: createDto.ogDescription,
          ogImage: createDto.ogImage,
          isAIGeneratedImage: createDto.isAIGeneratedImage || 'NO',
        },
      });
      return updated as MetaSetting;
    } else {
      // Create new meta setting
      return this.insert(createDto);
    }
  }

  async updateByPublicId(
    publicId: string,
    updateDto: UpdateMetaSettingDto
  ): Promise<MetaSetting> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.siteName !== undefined)
      updateData.siteName = updateDto.siteName;
    if (updateDto.metaTitle !== undefined)
      updateData.metaTitle = updateDto.metaTitle;
    if (updateDto.metaDescription !== undefined)
      updateData.metaDescription = updateDto.metaDescription;
    if (updateDto.metaKeyword !== undefined)
      updateData.metaKeyword = updateDto.metaKeyword;
    if (updateDto.ogTitle !== undefined) updateData.ogTitle = updateDto.ogTitle;
    if (updateDto.ogDescription !== undefined)
      updateData.ogDescription = updateDto.ogDescription;
    if (updateDto.ogImage !== undefined) updateData.ogImage = updateDto.ogImage;
    if (updateDto.isAIGeneratedImage !== undefined)
      updateData.isAIGeneratedImage = updateDto.isAIGeneratedImage;

    const metaSetting = await this.prisma.metaSetting.update({
      where: { publicId },
      data: updateData,
    });
    return metaSetting as MetaSetting;
  }

  async createForAllActiveLanguages(
    createDto: Omit<CreateMetaSettingDto, 'languageId'>
  ): Promise<MetaSetting[]> {
    const languageIds = await this.getAllActiveLanguageIds();

    const metaSettings = await Promise.all(
      languageIds.map((languageId) =>
        this.prisma.metaSetting.create({
          data: {
            publicId: uuidv4(),
            ...createDto,
            languageId,
          },
        })
      )
    );
    return metaSettings as MetaSetting[];
  }

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

  async getLanguageByCode(
    languageCode: string
  ): Promise<{ id: string; folder: string } | null> {
    const language = await this.prisma.language.findFirst({
      where: {
        folder: languageCode,
        status: true,
      },
      select: {
        id: true,
        folder: true,
      },
    });

    return language || null;
  }

  async existsByLanguageId(languageId: string): Promise<boolean> {
    const metaSetting = await this.prisma.metaSetting.findUnique({
      where: { languageId },
    });
    return !!metaSetting;
  }

  async deleteByLanguageId(languageId: string): Promise<boolean> {
    try {
      await this.prisma.metaSetting.delete({
        where: { languageId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Base interface implementations
  async getDetail(filter: Partial<MetaSetting>): Promise<MetaSetting | null> {
    const whereClause: Record<string, unknown> = {};

    if (filter.publicId) {
      whereClause.publicId = filter.publicId;
    }
    if (filter.id) {
      whereClause.id = filter.id;
    }
    if (filter.languageId) {
      whereClause.languageId = filter.languageId;
    }
    if (filter.siteName) {
      whereClause.siteName = filter.siteName;
    }

    const metaSetting = await this.prisma.metaSetting.findFirst({
      where: whereClause,
    });
    return metaSetting as MetaSetting | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<MetaSetting>
  ): Promise<MetaSetting> {
    // Convert entity fields to Prisma update format
    const updateData: Record<string, unknown> = {};

    if (updateDto.siteName !== undefined)
      updateData.siteName = updateDto.siteName;
    if (updateDto.metaTitle !== undefined)
      updateData.metaTitle = updateDto.metaTitle;
    if (updateDto.metaDescription !== undefined)
      updateData.metaDescription = updateDto.metaDescription;
    if (updateDto.metaKeyword !== undefined)
      updateData.metaKeyword = updateDto.metaKeyword;
    if (updateDto.ogTitle !== undefined) updateData.ogTitle = updateDto.ogTitle;
    if (updateDto.ogDescription !== undefined)
      updateData.ogDescription = updateDto.ogDescription;
    if (updateDto.ogImage !== undefined) updateData.ogImage = updateDto.ogImage;
    if (updateDto.isAIGeneratedImage !== undefined)
      updateData.isAIGeneratedImage = updateDto.isAIGeneratedImage;

    const metaSetting = await this.prisma.metaSetting.update({
      where: { id },
      data: updateData,
    });
    return metaSetting as MetaSetting;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.metaSetting.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  protected convertFilterToPrisma(
    filter: Partial<MetaSetting>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.siteName) {
      prismaFilter.siteName = {
        contains: filter.siteName,
        mode: 'insensitive',
      };
    }
    if (filter.metaTitle) {
      prismaFilter.metaTitle = {
        contains: filter.metaTitle,
        mode: 'insensitive',
      };
    }
    if (filter.languageId) {
      prismaFilter.languageId = filter.languageId;
    }
    if (filter.isAIGeneratedImage !== undefined) {
      prismaFilter.isAIGeneratedImage = filter.isAIGeneratedImage;
    }

    return prismaFilter;
  }
}
