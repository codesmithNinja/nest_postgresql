export interface Language {
  id: string;
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
  flagImage: string;
  direction: 'ltr' | 'rtl';
  status: boolean;
  isDefault: 'YES' | 'NO';
  createdAt: Date;
  updatedAt: Date;
}
