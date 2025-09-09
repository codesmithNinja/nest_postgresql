import { Injectable } from '@nestjs/common';
import { Model, Document, Query } from 'mongoose';
import {
  IRepository,
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

@Injectable()
export abstract class MongoRepository<T extends Document, E = unknown>
  implements IRepository<E>
{
  constructor(protected readonly model: Model<T>) {}

  protected abstract toEntity(doc: T): E;
  protected abstract toDocument(entity: Partial<E>): Record<string, unknown>;

  protected applyQueryOptions<Q extends Query<unknown, unknown>>(
    query: Q,
    options?: QueryOptions
  ): Q {
    if (!options) return query;

    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    if (options.select) query = query.select(options.select.join(' ')) as Q;
    if (options.populate) {
      options.populate.forEach((path) => {
        query = query.populate(path) as Q;
      });
    }

    return query;
  }

  async getAll(filter: object = {}, options?: QueryOptions): Promise<E[]> {
    const query = this.model.find(filter);
    const docs = await this.applyQueryOptions(query, options).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async getDetailById(id: string, options?: QueryOptions): Promise<E | null> {
    const query = this.model.findById(id);
    const doc = await this.applyQueryOptions(query, options).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async getDetail(filter: object, options?: QueryOptions): Promise<E | null> {
    const query = this.model.findOne(filter);
    const doc = await this.applyQueryOptions(query, options).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async insert(data: Partial<E>): Promise<E> {
    const doc = await this.model.create(this.toDocument(data));
    return this.toEntity(doc);
  }

  async updateById(id: string, data: object): Promise<E> {
    const doc = await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!doc) {
      throw new Error(`Document with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async updateMany(
    filter: object,
    data: object
  ): Promise<{ count: number; updated: E[] }> {
    const updateResult = await this.model.updateMany(filter, data).exec();

    const updatedDocs = await this.model.find(filter).exec();

    return {
      count: updateResult.modifiedCount || 0,
      updated: updatedDocs.map((doc) => this.toEntity(doc)),
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteMany(filter: object): Promise<{ count: number; deleted: E[] }> {
    const toDelete = await this.model.find(filter).exec();
    const result = await this.model.deleteMany(filter).exec();

    return {
      count: result.deletedCount || 0,
      deleted: toDelete.map((doc) => this.toEntity(doc)),
    };
  }

  async count(filter: object = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: object): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }

  async findWithPagination(
    filter?: object,
    options?: PaginationOptions
  ): Promise<PaginatedResult<E>> {
    const { page = 1, limit = 10, ...queryOptions } = options || {};
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.getAll(filter, { ...queryOptions, skip, limit }),
      this.count(filter),
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
}
