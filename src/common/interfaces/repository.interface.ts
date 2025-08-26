export interface IRepository<T> {
  // Basic operations
  getAll(filter?: Partial<T>, options?: QueryOptions): Promise<T[]>;
  getDetailById(id: string, options?: QueryOptions): Promise<T | null>;
  getDetail(filter: Partial<T>, options?: QueryOptions): Promise<T | null>;
  insert(data: Partial<T>): Promise<T>;
  updateById(id: string, data: Partial<T>): Promise<T>;
  updateMany(
    filter: Partial<T>,
    data: Partial<T>
  ): Promise<{ count: number; updated: T[] }>;
  deleteById(id: string): Promise<boolean>;
  deleteMany(filter: Partial<T>): Promise<{ count: number; deleted: T[] }>;
  count(filter?: Partial<T>): Promise<number>;

  // Utility methods
  exists(filter: Partial<T>): Promise<boolean>;
  findWithPagination(
    filter?: Partial<T>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
}

export interface QueryOptions {
  select?: string[];
  populate?: string[];
  skip?: number; // ✅ ADD THIS
  limit?: number; // ✅ ADD THIS
  sort?: Record<string, 1 | -1>;
}

export interface PaginationOptions extends QueryOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
