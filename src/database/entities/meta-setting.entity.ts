import { Language } from './language.entity';

export interface MinimalLanguage {
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
}

export interface MetaSetting {
  id: string;
  publicId: string;
  languageId: string | Language | MinimalLanguage;
  language?: Language;
  siteName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeyword: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  isAIGeneratedImage: 'YES' | 'NO';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMetaSettingDto {
  languageId: string;
  siteName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeyword: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  isAIGeneratedImage?: 'YES' | 'NO';
}

export interface UpdateMetaSettingDto {
  siteName?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeyword?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  isAIGeneratedImage?: 'YES' | 'NO';
}

export interface MetaSettingWithLanguage extends MetaSetting {
  language: Language;
}
