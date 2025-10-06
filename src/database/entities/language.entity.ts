export interface Language {
  id: string;
  publicId: string;
  name: string;
  code: string;
  direction: string;
  flagImage?: string;
  isDefault: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLanguageDto {
  name: string;
  code: string;
  direction?: string;
  flagImage?: string;
  isDefault?: string;
  status?: boolean;
}

export interface UpdateLanguageDto {
  name?: string;
  code?: string;
  direction?: string;
  flagImage?: string;
  isDefault?: string;
  status?: boolean;
}

export interface LanguageWithDropdowns extends Language {
  manageDropdowns?: any[];
}
