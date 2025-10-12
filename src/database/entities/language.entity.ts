export interface Language {
  id: string;
  publicId: string;
  name: string;
  folder: string;
  code: string; // This maps to folder in the database
  iso2: string;
  iso3: string;
  flagImage: string;
  direction: 'ltr' | 'rtl';
  status: boolean;
  isDefault: 'YES' | 'NO';
  createdAt: Date;
  updatedAt: Date;
}

// Export DTOs for repositories
export interface CreateLanguageDto {
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
  flagImage?: string;
  direction?: 'ltr' | 'rtl';
  status?: boolean;
  isDefault?: 'YES' | 'NO';
}

export interface UpdateLanguageDto {
  name?: string;
  folder?: string;
  iso2?: string;
  iso3?: string;
  flagImage?: string;
  direction?: 'ltr' | 'rtl';
  status?: boolean;
  isDefault?: 'YES' | 'NO';
}
