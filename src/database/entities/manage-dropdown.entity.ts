import { Language } from './language.entity';

export interface ManageDropdown {
  id: string;
  publicId: string;
  name: string;
  uniqueCode?: number;
  dropdownType: string;
  countryShortCode?: string;
  isDefault?: string;
  languageId: string;
  language?: Language;
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateManageDropdownDto {
  name: string;
  uniqueCode?: number;
  dropdownType: string;
  countryShortCode?: string;
  isDefault?: string;
  languageId?: string; // Optional - will be auto-detected
  status?: boolean;
}

export interface UpdateManageDropdownDto {
  name?: string;
  uniqueCode?: number;
  countryShortCode?: string;
  isDefault?: string;
  status?: boolean;
}

export interface ManageDropdownWithLanguage extends ManageDropdown {
  language: Language;
}

export interface BulkOperationDto {
  publicIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}
