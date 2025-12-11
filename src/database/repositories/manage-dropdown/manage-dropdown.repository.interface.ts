import {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
} from '../../entities/manage-dropdown.entity';

export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface IManageDropdownRepository extends IRepository<ManageDropdown> {
  findByType(
    dropdownType: string,
    includeInactive?: boolean
  ): Promise<ManageDropdownWithLanguage[]>;
  findByTypeAndLanguage(
    dropdownType: string,
    languageId: string
  ): Promise<ManageDropdown[]>;
  findByPublicId(publicId: string): Promise<ManageDropdownWithLanguage | null>;
  findByUniqueCode(uniqueCode: number): Promise<ManageDropdownWithLanguage[]>;
  findByTypeForPublic(
    dropdownType: string,
    languageId: string
  ): Promise<ManageDropdownWithLanguage[]>;
  findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive: boolean,
    languageId: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find manage dropdown options with pagination and search
   * @param searchTerm Search term to match against dropdown option names
   * @param searchFields Fields to search in
   * @param filter Additional filters to apply
   * @param options Pagination and sorting options
   * @returns Promise with paginated search results
   */
  findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<ManageDropdown>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ManageDropdown>>;

  findSingleByTypeAndLanguage(
    dropdownType: string,
    publicId: string,
    languageId: string
  ): Promise<ManageDropdownWithLanguage | null>;
  createMultiLanguage(
    createDto: CreateManageDropdownDto,
    languageIds: string[]
  ): Promise<ManageDropdown[]>;
  generateUniqueCode(): Promise<number>;
  getDefaultLanguageId(): Promise<string>;
  getAllActiveLanguageIds(): Promise<string[]>;
  incrementUseCount(id: string): Promise<void>;
  bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<ManageDropdown>
  ): Promise<{ count: number; updated: ManageDropdown[] }>;
  bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: ManageDropdown[] }>;
  deleteByUniqueCode(uniqueCode: number): Promise<number>;
}

export const MANAGE_DROPDOWN_REPOSITORY = 'MANAGE_DROPDOWN_REPOSITORY';
