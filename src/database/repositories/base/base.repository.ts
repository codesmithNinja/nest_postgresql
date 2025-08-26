import {
  IRepository,
  QueryOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';

export abstract class BaseRepository<T> implements IRepository<T> {
  // Abstract methods that must be implemented by concrete classes
  abstract getAll(filter?: Partial<T>, options?: QueryOptions): Promise<T[]>;
  abstract getDetailById(id: string, options?: QueryOptions): Promise<T | null>;
  abstract getDetail(
    filter: Partial<T>,
    options?: QueryOptions
  ): Promise<T | null>;
  abstract insert(data: Partial<T>): Promise<T>;
  abstract updateById(id: string, data: Partial<T>): Promise<T>;
  abstract updateMany(
    filter: Partial<T>,
    data: Partial<T>
  ): Promise<{ count: number; updated: T[] }>;
  abstract deleteById(id: string): Promise<boolean>;
  abstract deleteMany(
    filter: Partial<T>
  ): Promise<{ count: number; deleted: T[] }>;
  abstract count(filter?: Partial<T>): Promise<number>;

  // Common implementations
  async exists(filter: Partial<T>): Promise<boolean> {
    const item = await this.getDetail(filter);
    return !!item;
  }

  async findWithPagination(
    filter?: Partial<T>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, ...queryOptions } = options || {};
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.getAll(filter, {
        ...queryOptions,
        skip,
        limit,
      } as QueryOptions),
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

  protected applyQueryOptions<
    Q extends {
      skip: (value: number) => Q;
      limit: (value: number) => Q;
      sort: (value: any) => Q;
      select: (value: string) => Q;
      populate: (value: string) => Q;
    },
  >(query: Q, options?: QueryOptions): Q {
    if (!options) return query;

    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    if (options.sort) query = query.sort(options.sort);
    if (options.select) query = query.select(options.select.join(' '));
    if (options.populate) {
      options.populate.forEach((path) => {
        query = query.populate(path);
      });
    }

    return query;
  }
}
