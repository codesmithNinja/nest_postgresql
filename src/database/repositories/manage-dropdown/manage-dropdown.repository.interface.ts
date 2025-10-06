import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  UpdateManageDropdownDto,
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
  findByTypeForPublic(
    dropdownType: string,
    languageCode?: string
  ): Promise<ManageDropdownWithLanguage[]>;
  createMultiLanguage(
    createDto: CreateManageDropdownDto,
    languageIds: string[]
  ): Promise<ManageDropdown[]>;
  incrementUseCount(id: string): Promise<void>;
  bulkOperation(bulkDto: BulkOperationDto): Promise<number>;
  findByTypeWithPagination(
    dropdownType: string,
    page: number,
    limit: number,
    includeInactive?: boolean,
    languageCode?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;
}

export const MANAGE_DROPDOWN_REPOSITORY = 'MANAGE_DROPDOWN_REPOSITORY';
