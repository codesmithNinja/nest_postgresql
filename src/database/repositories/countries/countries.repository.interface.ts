import {
  IRepository,
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';
import { Country } from '../../entities/country.entity';

export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface ICountriesRepository extends IRepository<Country> {
  findById(id: string): Promise<Country | null>;
  findMany(
    filter?: MongoQuery<Country>,
    options?: QueryOptions
  ): Promise<Country[]>;
  update(id: string, data: Partial<Country>): Promise<Country>;
  findByPublicId(publicId: string): Promise<Country | null>;
  findByIso2(iso2: string): Promise<Country | null>;
  findByIso3(iso3: string): Promise<Country | null>;
  findDefault(): Promise<Country | null>;
  setAllNonDefault(): Promise<void>;
  findWithPagination(
    filter?: MongoQuery<Country>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Country>>;
  findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Country>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Country>>;
  bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Country>
  ): Promise<{ count: number; updated: Country[] }>;
  bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Country[] }>;
}

export const COUNTRIES_REPOSITORY = 'COUNTRIES_REPOSITORY';
