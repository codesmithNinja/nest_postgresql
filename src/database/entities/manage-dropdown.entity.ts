import { Language } from './language.entity';

export interface MinimalLanguage {
  publicId: string;
  name: string;
}

export interface ManageDropdown {
  id: string;
  publicId: string;
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: string | Language | MinimalLanguage;
  language?: Language;
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateManageDropdownDto {
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: string;
  status?: boolean;
}

export interface UpdateManageDropdownDto {
  name?: string;
  status?: boolean;
}

export interface ManageDropdownWithLanguage extends ManageDropdown {
  language: Language;
}
