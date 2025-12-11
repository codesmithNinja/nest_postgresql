import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import {
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateWithLanguage,
  MinimalLanguage,
} from '../../entities/email-template.entity';
import { IEmailTemplateRepository } from './email-template.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailTemplatePostgresRepository
  extends PostgresRepository<EmailTemplate>
  implements IEmailTemplateRepository
{
  protected modelName = 'emailTemplate';
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
    task: true,
    senderEmail: true,
    replyEmail: true,
    senderName: true,
    subject: true,
    message: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    // Use default language if languageId is not provided
    const resolvedLanguageId =
      createDto.languageId || (await this.getDefaultLanguageId());

    const emailTemplate = await this.prisma.emailTemplate.create({
      data: {
        publicId: uuidv4(),
        task: createDto.task,
        senderEmail: createDto.senderEmail,
        replyEmail: createDto.replyEmail,
        senderName: createDto.senderName,
        subject: createDto.subject,
        message: createDto.message,
        status: createDto.status ?? true,
        // languageId must be the primary key (id) of the language, not publicId
        languageId: resolvedLanguageId,
      },
    });
    return emailTemplate as EmailTemplate;
  }

  async findByLanguageId(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: { languageId },
      include: { language: true },
    });

    return emailTemplate
      ? ({
          ...emailTemplate,
          languageId: emailTemplate.language
            ? ({
                publicId: emailTemplate.language.publicId,
                name: emailTemplate.language.name,
              } as MinimalLanguage)
            : emailTemplate.languageId,
          language: emailTemplate.language
            ? {
                ...emailTemplate.language,
                code: emailTemplate.language.folder, // Map folder to code field
              }
            : undefined,
        } as EmailTemplateWithLanguage)
      : null;
  }

  async findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    // Same implementation as findByLanguageId since we always need language info
    return this.findByLanguageId(languageId);
  }

  async findByPublicIdWithLanguage(
    publicId: string
  ): Promise<EmailTemplateWithLanguage | null> {
    const emailTemplate = await this.prisma.emailTemplate.findUnique({
      where: { publicId },
      include: { language: true },
    });

    return emailTemplate
      ? ({
          ...emailTemplate,
          languageId: emailTemplate.language
            ? ({
                publicId: emailTemplate.language.publicId,
                name: emailTemplate.language.name,
                folder: emailTemplate.language.folder,
                iso2: emailTemplate.language.iso2,
                iso3: emailTemplate.language.iso3,
              } as MinimalLanguage)
            : emailTemplate.languageId,
          language: emailTemplate.language
            ? {
                ...emailTemplate.language,
                code: emailTemplate.language.folder, // Map folder to code field
              }
            : undefined,
        } as EmailTemplateWithLanguage)
      : null;
  }

  async findByTaskAndLanguage(
    task: string,
    languageId: string
  ): Promise<EmailTemplate | null> {
    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: {
        task,
        languageId,
      },
    });
    return emailTemplate as EmailTemplate | null;
  }

  async createOrUpdateByLanguageId(
    createDto: CreateEmailTemplateDto
  ): Promise<EmailTemplate> {
    const existing = await this.prisma.emailTemplate.findFirst({
      where: { languageId: createDto.languageId },
    });

    if (existing) {
      // Update existing email template (excluding task which is immutable)
      const updated = await this.prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          senderEmail: createDto.senderEmail,
          replyEmail: createDto.replyEmail,
          senderName: createDto.senderName,
          subject: createDto.subject,
          message: createDto.message,
          status: createDto.status ?? true,
        },
      });
      return updated as EmailTemplate;
    } else {
      // Create new email template
      return this.insert(createDto);
    }
  }

  async updateByPublicId(
    publicId: string,
    updateDto: UpdateEmailTemplateDto
  ): Promise<EmailTemplate> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.senderEmail !== undefined)
      updateData.senderEmail = updateDto.senderEmail;
    if (updateDto.replyEmail !== undefined)
      updateData.replyEmail = updateDto.replyEmail;
    if (updateDto.senderName !== undefined)
      updateData.senderName = updateDto.senderName;
    if (updateDto.subject !== undefined) updateData.subject = updateDto.subject;
    if (updateDto.message !== undefined) updateData.message = updateDto.message;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    const emailTemplate = await this.prisma.emailTemplate.update({
      where: { publicId },
      data: updateData,
    });
    return emailTemplate as EmailTemplate;
  }

  async createForAllActiveLanguages(
    createDto: Omit<CreateEmailTemplateDto, 'languageId'>
  ): Promise<EmailTemplate[]> {
    const languageIds = await this.getAllActiveLanguageIds();

    const emailTemplates = await Promise.all(
      languageIds.map((languageId) =>
        this.prisma.emailTemplate.create({
          data: {
            publicId: uuidv4(),
            ...createDto,
            languageId,
            status: createDto.status ?? true,
          },
        })
      )
    );
    return emailTemplates as EmailTemplate[];
  }

  async bulkUpdateStatus(
    publicIds: string[],
    status: boolean
  ): Promise<number> {
    const result = await this.prisma.emailTemplate.updateMany({
      where: {
        publicId: {
          in: publicIds,
        },
      },
      data: {
        status,
      },
    });
    return result.count;
  }

  async bulkUpdateStatusByTask(task: string, status: boolean): Promise<number> {
    const result = await this.prisma.emailTemplate.updateMany({
      where: { task },
      data: { status },
    });
    return result.count;
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
    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: { languageId },
    });
    return !!emailTemplate;
  }

  async existsByTaskAndLanguage(
    task: string,
    languageId: string
  ): Promise<boolean> {
    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: { task, languageId },
    });
    return !!emailTemplate;
  }

  async deleteByLanguageId(languageId: string): Promise<boolean> {
    try {
      const result = await this.prisma.emailTemplate.deleteMany({
        where: { languageId },
      });
      return result.count > 0;
    } catch {
      return false;
    }
  }

  async findByStatusWithLanguage(
    status: boolean,
    languageId?: string
  ): Promise<EmailTemplateWithLanguage[]> {
    const whereClause: Record<string, unknown> = { status };
    if (languageId) {
      whereClause.languageId = languageId;
    }

    const emailTemplates = await this.prisma.emailTemplate.findMany({
      where: whereClause,
      include: { language: true },
      orderBy: { createdAt: 'desc' },
    });

    return emailTemplates.map((emailTemplate) => ({
      ...emailTemplate,
      languageId: emailTemplate.language
        ? ({
            publicId: emailTemplate.language.publicId,
            name: emailTemplate.language.name,
            folder: emailTemplate.language.folder,
            iso2: emailTemplate.language.iso2,
            iso3: emailTemplate.language.iso3,
          } as MinimalLanguage)
        : emailTemplate.languageId,
      language: emailTemplate.language
        ? {
            ...emailTemplate.language,
            code: emailTemplate.language.folder, // Map folder to code field
          }
        : undefined,
    })) as EmailTemplateWithLanguage[];
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<EmailTemplate>
  ): Promise<EmailTemplate | null> {
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
    if (filter.task) {
      whereClause.task = filter.task;
    }
    if (filter.status !== undefined) {
      whereClause.status = filter.status;
    }

    const emailTemplate = await this.prisma.emailTemplate.findFirst({
      where: whereClause,
    });
    return emailTemplate as EmailTemplate | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    // Convert entity fields to Prisma update format
    const updateData: Record<string, unknown> = {};

    if (updateDto.senderEmail !== undefined)
      updateData.senderEmail = updateDto.senderEmail;
    if (updateDto.replyEmail !== undefined)
      updateData.replyEmail = updateDto.replyEmail;
    if (updateDto.senderName !== undefined)
      updateData.senderName = updateDto.senderName;
    if (updateDto.subject !== undefined) updateData.subject = updateDto.subject;
    if (updateDto.message !== undefined) updateData.message = updateDto.message;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    // Note: task is intentionally excluded as it's immutable after creation

    const emailTemplate = await this.prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });
    return emailTemplate as EmailTemplate;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      await this.prisma.emailTemplate.delete({
        where: { publicId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteByTask(task: string): Promise<number> {
    try {
      const result = await this.prisma.emailTemplate.deleteMany({
        where: { task },
      });
      return result.count;
    } catch {
      return 0;
    }
  }

  async findWithPaginationAndLanguage(
    languageCode: string,
    page: number,
    limit: number
  ): Promise<{
    data: EmailTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Get language by code to find the language ID
    const language = await this.getLanguageByCode(languageCode);
    if (!language) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    const whereClause = {
      languageId: language.id,
    };

    const [total, emailTemplates] = await Promise.all([
      this.prisma.emailTemplate.count({
        where: whereClause,
      }),
      this.prisma.emailTemplate.findMany({
        where: whereClause,
        include: { language: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = emailTemplates.map((emailTemplate) => ({
      ...emailTemplate,
      languageId: emailTemplate.language
        ? ({
            publicId: emailTemplate.language.publicId,
            name: emailTemplate.language.name,
            folder: emailTemplate.language.folder,
            iso2: emailTemplate.language.iso2,
            iso3: emailTemplate.language.iso3,
          } as MinimalLanguage)
        : emailTemplate.languageId,
      language: emailTemplate.language
        ? {
            ...emailTemplate.language,
            code: emailTemplate.language.folder, // Map folder to code field
          }
        : undefined,
    })) as EmailTemplate[];

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: Partial<EmailTemplate>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<EmailTemplate>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    // Build search conditions using the provided search fields
    const searchConditions = {
      OR: searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as const },
      })),
    };

    // Build additional filters
    const additionalFilters: Record<string, unknown> = {};
    if (filter?.languageId) {
      additionalFilters.languageId = filter.languageId;
    }
    if (filter?.status !== undefined) {
      additionalFilters.status = filter.status;
    }
    if (filter?.senderEmail) {
      additionalFilters.senderEmail = {
        contains: filter.senderEmail,
        mode: 'insensitive',
      };
    }

    const whereClause = {
      AND: [searchConditions, additionalFilters],
    };

    // Build sort order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (options?.sort) {
      Object.entries(options.sort).forEach(([key, value]) => {
        orderBy[key] = value === 1 ? 'asc' : 'desc';
      });
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, emailTemplates] = await Promise.all([
      this.prisma.emailTemplate.count({
        where: whereClause,
      }),
      this.prisma.emailTemplate.findMany({
        where: whereClause,
        include: { language: true },
        skip: ((options?.page || 1) - 1) * (options?.limit || 10),
        take: options?.limit || 10,
        orderBy,
      }),
    ]);

    const items = emailTemplates.map((emailTemplate) => ({
      ...emailTemplate,
      languageId: emailTemplate.language
        ? ({
            publicId: emailTemplate.language.publicId,
            name: emailTemplate.language.name,
            folder: emailTemplate.language.folder,
            iso2: emailTemplate.language.iso2,
            iso3: emailTemplate.language.iso3,
          } as MinimalLanguage)
        : emailTemplate.languageId,
      language: emailTemplate.language
        ? {
            ...emailTemplate.language,
            code: emailTemplate.language.folder,
          }
        : undefined,
    })) as EmailTemplate[];

    const totalPages = Math.ceil(total / limit);

    return {
      items,
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
    filter: Partial<EmailTemplate>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.task) {
      prismaFilter.task = {
        contains: filter.task,
        mode: 'insensitive',
      };
    }
    if (filter.senderEmail) {
      prismaFilter.senderEmail = {
        contains: filter.senderEmail,
        mode: 'insensitive',
      };
    }
    if (filter.subject) {
      prismaFilter.subject = {
        contains: filter.subject,
        mode: 'insensitive',
      };
    }
    if (filter.languageId) {
      prismaFilter.languageId = filter.languageId;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }

    return prismaFilter;
  }

  async findAllWithPagination(
    page: number,
    limit: number,
    includeInactive: boolean,
    languageId?: string
  ): Promise<{
    data: EmailTemplateWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {};

    if (!includeInactive) {
      whereClause.status = true;
    }

    // Use the resolved languageId if provided (already resolved by service layer)
    if (languageId) {
      whereClause.languageId = languageId;
    }

    const [emailTemplates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where: whereClause,
        include: { language: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailTemplate.count({
        where: whereClause,
      }),
    ]);

    return {
      data: emailTemplates.map((template) => ({
        ...template,
        languageId: template.language
          ? ({
              publicId: template.language.publicId,
              name: template.language.name,
            } as MinimalLanguage)
          : template.languageId,
        language: template.language
          ? {
              ...template.language,
              code: template.language.folder, // Map folder to code field
            }
          : undefined,
      })) as EmailTemplateWithLanguage[],
      total,
      page,
      limit,
    };
  }
}
