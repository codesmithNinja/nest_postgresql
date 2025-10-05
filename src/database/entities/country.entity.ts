export interface Country {
  id: string;
  publicId: string;
  name: string;
  iso2: string;
  iso3: string;
  flag: string;
  isDefault: 'YES' | 'NO';
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}
