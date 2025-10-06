import { Injectable, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { Language } from '../../../../database/entities/language.entity';
import { ManageDropdownWithLanguage } from '../../../../database/entities/manage-dropdown.entity';

@Injectable()
export class MasterDropdownCacheService {
  private readonly logger = new Logger(MasterDropdownCacheService.name);
  private readonly cache: NodeCache;

  // Cache TTL in seconds
  private readonly TTL_LANGUAGES = 3600; // 1 hour
  private readonly TTL_DROPDOWNS = 1800; // 30 minutes
  private readonly TTL_DEFAULT_LANGUAGE = 7200; // 2 hours

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.TTL_DROPDOWNS,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
    });
  }

  // Language caching
  private getLanguageCacheKey(
    identifier: string,
    type: 'id' | 'code' | 'publicId' = 'id'
  ): string {
    return `language:${type}:${identifier}`;
  }

  private getAllLanguagesCacheKey(): string {
    return 'languages:all';
  }

  private getActiveLanguagesCacheKey(): string {
    return 'languages:active';
  }

  private getDefaultLanguageCacheKey(): string {
    return 'language:default';
  }

  async getLanguageById(id: string): Promise<Language | null> {
    const key = this.getLanguageCacheKey(id, 'id');
    return this.cache.get<Language>(key) || null;
  }

  async getLanguageByCode(code: string): Promise<Language | null> {
    const key = this.getLanguageCacheKey(code, 'code');
    return this.cache.get<Language>(key) || null;
  }

  async getLanguageByPublicId(publicId: string): Promise<Language | null> {
    const key = this.getLanguageCacheKey(publicId, 'publicId');
    return this.cache.get<Language>(key) || null;
  }

  async getAllLanguages(): Promise<Language[] | null> {
    const key = this.getAllLanguagesCacheKey();
    return this.cache.get<Language[]>(key) || null;
  }

  async getActiveLanguages(): Promise<Language[] | null> {
    const key = this.getActiveLanguagesCacheKey();
    return this.cache.get<Language[]>(key) || null;
  }

  async getDefaultLanguage(): Promise<Language | null> {
    const key = this.getDefaultLanguageCacheKey();
    return this.cache.get<Language>(key) || null;
  }

  setLanguage(language: Language): void {
    try {
      // Cache by different identifiers
      this.cache.set(
        this.getLanguageCacheKey(language.id, 'id'),
        language,
        this.TTL_LANGUAGES
      );
      this.cache.set(
        this.getLanguageCacheKey(language.code, 'code'),
        language,
        this.TTL_LANGUAGES
      );
      this.cache.set(
        this.getLanguageCacheKey(language.publicId, 'publicId'),
        language,
        this.TTL_LANGUAGES
      );

      // Cache default language
      if (language.isDefault === 'YES') {
        this.cache.set(
          this.getDefaultLanguageCacheKey(),
          language,
          this.TTL_DEFAULT_LANGUAGE
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to cache language ${language.id}:`, error);
    }
  }

  setAllLanguages(languages: Language[]): void {
    try {
      // Cache individual languages
      languages.forEach((language) => this.setLanguage(language));

      // Cache all languages
      this.cache.set(
        this.getAllLanguagesCacheKey(),
        languages,
        this.TTL_LANGUAGES
      );
    } catch (error) {
      this.logger.warn('Failed to cache all languages:', error);
    }
  }

  setActiveLanguages(languages: Language[]): void {
    try {
      // Cache individual languages
      languages.forEach((language) => this.setLanguage(language));

      // Cache active languages
      this.cache.set(
        this.getActiveLanguagesCacheKey(),
        languages,
        this.TTL_LANGUAGES
      );
    } catch (error) {
      this.logger.warn('Failed to cache active languages:', error);
    }
  }

  // Dropdown caching
  private getDropdownCacheKey(
    dropdownType: string,
    languageCode?: string
  ): string {
    const langSuffix = languageCode ? `:${languageCode}` : '';
    return `dropdown:${dropdownType}${langSuffix}`;
  }

  private getDropdownByPublicIdCacheKey(publicId: string): string {
    return `dropdown:publicId:${publicId}`;
  }

  private getDropdownAdminCacheKey(
    dropdownType: string,
    page?: number,
    limit?: number
  ): string {
    const pageSuffix = page && limit ? `:${page}:${limit}` : '';
    return `dropdown:admin:${dropdownType}${pageSuffix}`;
  }

  async getDropdownsByType(
    dropdownType: string,
    languageCode?: string
  ): Promise<ManageDropdownWithLanguage[] | null> {
    const key = this.getDropdownCacheKey(dropdownType, languageCode);
    return this.cache.get<ManageDropdownWithLanguage[]>(key) || null;
  }

  async getDropdownByPublicId(
    publicId: string
  ): Promise<ManageDropdownWithLanguage | null> {
    const key = this.getDropdownByPublicIdCacheKey(publicId);
    return this.cache.get<ManageDropdownWithLanguage>(key) || null;
  }

  async getDropdownsForAdmin(
    dropdownType: string,
    page?: number,
    limit?: number
  ): Promise<any | null> {
    const key = this.getDropdownAdminCacheKey(dropdownType, page, limit);
    return this.cache.get(key) || null;
  }

  setDropdownsByType(
    dropdownType: string,
    dropdowns: ManageDropdownWithLanguage[],
    languageCode?: string
  ): void {
    try {
      const key = this.getDropdownCacheKey(dropdownType, languageCode);
      this.cache.set(key, dropdowns, this.TTL_DROPDOWNS);

      // Cache individual dropdowns
      dropdowns.forEach((dropdown) => {
        this.setDropdownByPublicId(dropdown);
      });
    } catch (error) {
      this.logger.warn(
        `Failed to cache dropdowns for type ${dropdownType}:`,
        error
      );
    }
  }

  setDropdownByPublicId(dropdown: ManageDropdownWithLanguage): void {
    try {
      const key = this.getDropdownByPublicIdCacheKey(dropdown.publicId);
      this.cache.set(key, dropdown, this.TTL_DROPDOWNS);
    } catch (error) {
      this.logger.warn(`Failed to cache dropdown ${dropdown.publicId}:`, error);
    }
  }

  setDropdownsForAdmin(
    dropdownType: string,
    data: any,
    page?: number,
    limit?: number
  ): void {
    try {
      const key = this.getDropdownAdminCacheKey(dropdownType, page, limit);
      this.cache.set(key, data, this.TTL_DROPDOWNS);
    } catch (error) {
      this.logger.warn(
        `Failed to cache admin dropdowns for type ${dropdownType}:`,
        error
      );
    }
  }

  // Cache invalidation methods
  invalidateLanguageCache(language?: Language): void {
    try {
      if (language) {
        // Invalidate specific language
        this.cache.del(this.getLanguageCacheKey(language.id, 'id'));
        this.cache.del(this.getLanguageCacheKey(language.code, 'code'));
        this.cache.del(this.getLanguageCacheKey(language.publicId, 'publicId'));

        if (language.isDefault === 'YES') {
          this.cache.del(this.getDefaultLanguageCacheKey());
        }
      }

      // Invalidate language lists
      this.cache.del(this.getAllLanguagesCacheKey());
      this.cache.del(this.getActiveLanguagesCacheKey());
    } catch (error) {
      this.logger.warn('Failed to invalidate language cache:', error);
    }
  }

  invalidateDropdownCache(
    dropdownType?: string,
    dropdown?: ManageDropdownWithLanguage
  ): void {
    try {
      if (dropdown) {
        // Invalidate specific dropdown
        this.cache.del(this.getDropdownByPublicIdCacheKey(dropdown.publicId));

        // Invalidate type-specific caches
        if (dropdown.language) {
          this.cache.del(
            this.getDropdownCacheKey(
              dropdown.dropdownType,
              dropdown.language.code
            )
          );
        }
        this.cache.del(this.getDropdownCacheKey(dropdown.dropdownType));
      }

      if (dropdownType) {
        // Invalidate all caches for this dropdown type
        const keys = this.cache.keys();
        const typeKeys = keys.filter(
          (key) =>
            key.startsWith(`dropdown:${dropdownType}`) ||
            key.startsWith(`dropdown:admin:${dropdownType}`)
        );
        this.cache.del(typeKeys);
      }
    } catch (error) {
      this.logger.warn('Failed to invalidate dropdown cache:', error);
    }
  }

  // Clear all cache
  clearAll(): void {
    try {
      this.cache.flushAll();
      this.logger.log('All cache cleared');
    } catch (error) {
      this.logger.warn('Failed to clear all cache:', error);
    }
  }

  // Get cache statistics
  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  // Get all cache keys (for debugging)
  getAllKeys(): string[] {
    return this.cache.keys();
  }
}
