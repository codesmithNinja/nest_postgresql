import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

type PrismaModelDelegate = {
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args?: Record<string, unknown>) => Promise<unknown>;
  findFirst: (args?: Record<string, unknown>) => Promise<unknown>;
  create: (args?: Record<string, unknown>) => Promise<unknown>;
  update: (args?: Record<string, unknown>) => Promise<unknown>;
  updateMany: (args?: Record<string, unknown>) => Promise<{ count: number }>;
  delete: (args?: Record<string, unknown>) => Promise<unknown>;
  deleteMany: (args?: Record<string, unknown>) => Promise<{ count: number }>;
  count: (args?: Record<string, unknown>) => Promise<number>;
};

@Injectable()
export abstract class PostgresRepository<T> extends BaseRepository<T> {
  protected abstract modelName: string;
  protected abstract selectFields: Record<string, boolean | object>;

  constructor(protected prisma: PrismaService) {
    super();
  }

  async getAll(filter?: Partial<T>, options?: QueryOptions): Promise<T[]> {
    const queryOptions: {
      where?: Record<string, unknown>;
      select?: Record<string, boolean | object>;
      skip?: number;
      take?: number;
      orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    } = {
      where: filter ? this.convertFilterToPrisma(filter) : {},
      select: this.selectFields,
    };

    if (options?.skip) queryOptions.skip = options.skip;
    if (options?.limit) queryOptions.take = options.limit;
    if (options?.sort) {
      queryOptions.orderBy = Object.entries(options.sort).map(
        ([key, value]) => ({
          [key]: value === 1 ? 'asc' : 'desc',
        })
      );
    }

    const delegate = this.getModelDelegate();
    return (await delegate.findMany(queryOptions)) as T[];
  }

  async getDetailById(id: string, options?: QueryOptions): Promise<T | null> {
    const queryOptions: {
      where: { id: string };
      select?: Record<string, boolean | object>;
    } = {
      where: { id },
      select: this.selectFields,
    };

    if (options?.select) {
      queryOptions.select = options.select.reduce(
        (acc: Record<string, boolean>, field: string) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }

    const delegate = this.getModelDelegate();
    return (await delegate.findUnique(queryOptions)) as T | null;
  }

  async getDetail(
    filter: Partial<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    const queryOptions: {
      where?: Record<string, unknown>;
      select?: Record<string, boolean | object>;
    } = {
      where: this.convertFilterToPrisma(filter),
      select: this.selectFields,
    };

    if (options?.select) {
      queryOptions.select = options.select.reduce(
        (acc: Record<string, boolean>, field: string) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }

    const delegate = this.getModelDelegate();
    return (await delegate.findFirst(queryOptions)) as T | null;
  }

  async insert(data: Partial<T>): Promise<T> {
    const delegate = this.getModelDelegate();
    return (await delegate.create({
      data: this.convertDataToPrisma(data),
      select: this.selectFields,
    })) as T;
  }

  async updateById(id: string, data: Partial<T>): Promise<T> {
    const delegate = this.getModelDelegate();
    return (await delegate.update({
      where: { id },
      data: this.convertDataToPrisma(data),
      select: this.selectFields,
    })) as T;
  }

  async updateMany(
    filter: Partial<T>,
    data: Partial<T>
  ): Promise<{ count: number; updated: T[] }> {
    const delegate = this.getModelDelegate();
    const whereClause = this.convertFilterToPrisma(filter);

    // First update the records
    const updateResult = await delegate.updateMany({
      where: whereClause,
      data: this.convertDataToPrisma(data),
    });

    // Then fetch the updated records
    const updated = (await delegate.findMany({
      where: whereClause,
      select: this.selectFields,
    })) as T[];

    return {
      count: updateResult.count,
      updated,
    };
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const delegate = this.getModelDelegate();
      await delegate.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteMany(
    filter: Partial<T>
  ): Promise<{ count: number; deleted: T[] }> {
    const delegate = this.getModelDelegate();
    const whereClause = this.convertFilterToPrisma(filter);

    // First fetch the records to be deleted
    const toDelete = (await delegate.findMany({
      where: whereClause,
      select: this.selectFields,
    })) as T[];

    // Then delete them
    const deleteResult = await delegate.deleteMany({
      where: whereClause,
    });

    return {
      count: deleteResult.count,
      deleted: toDelete,
    };
  }

  async count(filter?: Partial<T>): Promise<number> {
    const delegate = this.getModelDelegate();
    return await delegate.count({
      where: filter ? this.convertFilterToPrisma(filter) : {},
    });
  }

  protected getModelDelegate(): PrismaModelDelegate {
    const delegate = (this.prisma as unknown as Record<string, unknown>)[
      this.modelName
    ] as PrismaModelDelegate;
    if (!delegate) {
      throw new Error(
        `Model '${String(this.modelName)}' not found in Prisma client`
      );
    }
    return delegate;
  }

  protected convertFilterToPrisma(filter: Partial<T>): Record<string, unknown> {
    // Default implementation - subclasses can override for custom filtering
    return filter as Record<string, unknown>;
  }

  protected convertDataToPrisma(data: Partial<T>): Record<string, unknown> {
    // Default implementation - subclasses can override for custom data mapping
    return data as Record<string, unknown>;
  }
}
