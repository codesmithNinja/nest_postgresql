import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export abstract class PostgresRepository<T> extends BaseRepository<T> {
  protected abstract modelName: string;
  protected abstract selectFields: any;

  constructor(protected prisma: PrismaService) {
    super();
  }

  async getAll(filter?: Partial<T>, options?: QueryOptions): Promise<T[]> {
    const queryOptions: any = {
      where: filter || {},
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

    return await this.prisma[this.modelName].findMany(queryOptions);
  }

  async getDetailById(id: string, options?: QueryOptions): Promise<T | null> {
    const queryOptions: any = {
      where: { id },
      select: this.selectFields,
    };

    if (options?.select) {
      queryOptions.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    return this.prisma[this.modelName].findUnique(queryOptions);
  }

  async getDetail(
    filter: Partial<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    const queryOptions: any = {
      where: filter,
      select: this.selectFields,
    };

    if (options?.select) {
      queryOptions.select = options.select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    return this.prisma[this.modelName].findFirst(queryOptions);
  }

  async insert(data: Partial<T>): Promise<T> {
    return this.prisma[this.modelName].create({
      data,
      select: this.selectFields,
    });
  }

  async updateById(id: string, data: Partial<T>): Promise<T> {
    return this.prisma[this.modelName].update({
      where: { id },
      data,
      select: this.selectFields,
    });
  }

  async updateMany(
    filter: Partial<T>,
    data: Partial<T>
  ): Promise<{ count: number; updated: T[] }> {
    // First update the records
    const updateResult = await this.prisma[this.modelName].updateMany({
      where: filter,
      data,
    });

    // Then fetch the updated records
    const updated = await this.prisma[this.modelName].findMany({
      where: filter,
      select: this.selectFields,
    });

    return {
      count: updateResult.count,
      updated,
    };
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma[this.modelName].delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteMany(
    filter: Partial<T>
  ): Promise<{ count: number; deleted: T[] }> {
    // First fetch the records to be deleted
    const toDelete = await this.prisma[this.modelName].findMany({
      where: filter,
      select: this.selectFields,
    });

    // Then delete them
    const deleteResult = await this.prisma[this.modelName].deleteMany({
      where: filter,
    });

    return {
      count: deleteResult.count,
      deleted: toDelete,
    };
  }

  async count(filter?: Partial<T>): Promise<number> {
    return this.prisma[this.modelName].count({
      where: filter || {},
    });
  }
}
