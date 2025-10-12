import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
  BulkOperationDto,
} from '../../entities/manage-dropdown.entity';

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
    languageId?: string
  ): Promise<ManageDropdownWithLanguage[]>;
  findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive?: boolean,
    languageId?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;
  findSingleByTypeAndLanguage(
    dropdownType: string,
    publicId: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage | null>;
  createMultiLanguage(
    createDto: CreateManageDropdownDto,
    languageIds: string[]
  ): Promise<ManageDropdown[]>;
  generateUniqueCode(): Promise<number>;
  getDefaultLanguageId(): Promise<string>;
  getAllActiveLanguageIds(): Promise<string[]>;
  incrementUseCount(id: string): Promise<void>;
  bulkOperation(bulkDto: BulkOperationDto): Promise<number>;
  deleteByUniqueCode(uniqueCode: number): Promise<number>;
}

export const MANAGE_DROPDOWN_REPOSITORY = 'MANAGE_DROPDOWN_REPOSITORY';
