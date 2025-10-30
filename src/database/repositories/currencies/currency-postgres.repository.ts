import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Currency, CreateCurrencyDto } from '../../entities/currency.entity';
import { ICurrencyRepository } from './currency.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CurrencyPostgresRepository
  extends PostgresRepository<Currency>
  implements ICurrencyRepository
{
  protected modelName = 'currency';
  protected selectFields = {
    id: true,
    publicId: true,
    name: true,
    code: true,
    symbol: true,
    status: true,
    useCount: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async insert(createDto: CreateCurrencyDto): Promise<Currency> {
    const currency = await this.prisma.currency.create({
      data: {
        publicId: uuidv4(),
        ...createDto,
        code: createDto.code.toUpperCase(),
      },
    });
    return currency as Currency;
  }

  async findForPublic(): Promise<Currency[]> {
    const currencies = await this.prisma.currency.findMany({
      where: { status: true },
      orderBy: { name: 'asc' },
    });
    return currencies as Currency[];
  }

  async findCurrenciesWithPagination(
    page: number,
    limit: number,
    includeInactive = false
  ): Promise<{
    data: Currency[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {};

    if (!includeInactive) {
      whereClause.status = true;
    }

    const [currencies, total] = await Promise.all([
      this.prisma.currency.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.currency.count({
        where: whereClause,
      }),
    ]);

    return {
      data: currencies as Currency[],
      total,
      page,
      limit,
    };
  }

  async findByPublicId(publicId: string): Promise<Currency | null> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
    });
    return currency as Currency | null;
  }

  async findByCode(code: string): Promise<Currency | null> {
    const currency = await this.prisma.currency.findUnique({
      where: { code: code.toUpperCase() },
    });
    return currency as Currency | null;
  }

  async findByName(name: string): Promise<Currency | null> {
    const currency = await this.prisma.currency.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    return currency as Currency | null;
  }

  async updateByPublicId(
    publicId: string,
    updateDto: Partial<Currency>
  ): Promise<Currency> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.code !== undefined)
      updateData.code = updateDto.code.toUpperCase();
    if (updateDto.symbol !== undefined) updateData.symbol = updateDto.symbol;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    const currency = await this.prisma.currency.update({
      where: { publicId },
      data: updateData,
    });
    return currency as Currency;
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    try {
      // First check if currency is in use
      const currency = await this.findByPublicId(publicId);
      if (!currency) {
        return false;
      }

      if (currency.useCount > 0) {
        throw new Error(
          `Cannot delete currency with useCount: ${currency.useCount}`
        );
      }

      await this.prisma.currency.delete({
        where: { publicId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    await this.prisma.currency.update({
      where: { publicId },
      data: { useCount: { increment: 1 } },
    });
  }

  async decrementUseCount(publicId: string): Promise<void> {
    await this.prisma.currency.update({
      where: { publicId },
      data: { useCount: { decrement: 1 } },
    });
  }

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Currency>
  ): Promise<{ count: number; updated: Currency[] }> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await this.prisma.currency.updateMany({
      where: { publicId: { in: publicIds } },
      data: updateData,
    });

    const updatedCurrencies = await this.prisma.currency.findMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: result.count,
      updated: updatedCurrencies as Currency[],
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Currency[] }> {
    // First get currencies to be deleted for return value
    const currenciesToDelete = await this.prisma.currency.findMany({
      where: { publicId: { in: publicIds } },
    });

    // Check if any currency is in use
    for (const currency of currenciesToDelete) {
      if (currency.useCount > 0) {
        throw new Error(
          `Cannot delete currency ${currency.publicId} with useCount: ${currency.useCount}`
        );
      }
    }

    const deleteResult = await this.prisma.currency.deleteMany({
      where: { publicId: { in: publicIds } },
    });

    return {
      count: deleteResult.count,
      deleted: currenciesToDelete as Currency[],
    };
  }

  async isInUse(publicId: string): Promise<boolean> {
    const currency = await this.prisma.currency.findUnique({
      where: { publicId },
      select: { useCount: true },
    });
    return currency ? currency.useCount > 0 : false;
  }

  // Base interface implementations
  async getDetail(filter: Partial<Currency>): Promise<Currency | null> {
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
    if (filter.code) {
      whereClause.code = filter.code;
    }

    const currency = await this.prisma.currency.findFirst({
      where: whereClause,
    });
    return currency as Currency | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<Currency>
  ): Promise<Currency> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.code !== undefined) updateData.code = updateDto.code;
    if (updateDto.symbol !== undefined) updateData.symbol = updateDto.symbol;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.useCount !== undefined)
      updateData.useCount = updateDto.useCount;

    const currency = await this.prisma.currency.update({
      where: { id },
      data: updateData,
    });
    return currency as Currency;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.currency.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  protected convertFilterToPrisma(
    filter: Partial<Currency>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.name) {
      prismaFilter.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.code) {
      prismaFilter.code = filter.code;
    }
    if (filter.symbol) {
      prismaFilter.symbol = { contains: filter.symbol, mode: 'insensitive' };
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }

    return prismaFilter;
  }
}
