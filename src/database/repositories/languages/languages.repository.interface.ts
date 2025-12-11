import {
  IRepository,
  QueryOptions,
  PaginatedResult,
  PaginationOptions,
} from '../../../common/interfaces/repository.interface';
import { Language } from '../../entities/language.entity';

export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface ILanguagesRepository extends IRepository<Language> {
  findById(id: string): Promise<Language | null>;
  findMany(
    filter?: MongoQuery<Language>,
    options?: QueryOptions
  ): Promise<Language[]>;
  update(id: string, data: Partial<Language>): Promise<Language>;
  findByPublicId(publicId: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findByFolder(folder: string): Promise<Language | null>;
  findByIso2(iso2: string): Promise<Language | null>;
  findByIso3(iso3: string): Promise<Language | null>;
  findDefault(): Promise<Language | null>;
  setAllNonDefault(): Promise<void>;
  findWithPagination(
    filter?: MongoQuery<Language>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Language>>;
  findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Language>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Language>>;
  bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Language>
  ): Promise<{ count: number; updated: Language[] }>;
  bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Language[] }>;
}

export const LANGUAGES_REPOSITORY = 'LANGUAGES_REPOSITORY';
