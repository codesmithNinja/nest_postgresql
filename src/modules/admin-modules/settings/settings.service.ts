import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import NodeCache from 'node-cache';
import {
  ISettingsRepository,
  SETTINGS_REPOSITORY,
} from '../../../database/repositories/settings/settings.repository.interface';
import {
  Settings,
  UpdateSettingsData,
} from '../../../database/entities/settings.entity';
import { RecordType } from '../../../common/enums/database-type.enum';
import { FileManagementService } from '../../../common/services/file-management.service';
import {
  SettingsNotFoundException,
  FileUploadSettingsException,
  SettingsCacheException,
} from './exceptions/settings.exceptions';
import {
  ProcessedFormDataSettings,
  SettingsServiceOptions,
  CacheKey,
} from './interfaces/settings-request.interface';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache: NodeCache;
  private readonly cacheTTL = 300; // 5 minutes default TTL
  private readonly maxCacheSize = 1000;

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private settingsRepository: ISettingsRepository,
    private fileManagementService: FileManagementService
  ) {
    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      maxKeys: this.maxCacheSize,
      useClones: false,
      checkperiod: 60, // Check for expired keys every 60 seconds
    });
  }

  onModuleInit() {
    this.logger.log('Settings service initialized with caching enabled');

    // Set up cache event listeners
    this.cache.on('set', (key: string, value: unknown) => {
      this.logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('del', (key: string, value: unknown) => {
      this.logger.debug(`Cache DELETE: ${key}`);
    });

    this.cache.on('expired', (key: string, value: unknown) => {
      this.logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  async getSettingsByGroupType(
    groupType: string,
    options: SettingsServiceOptions = { useCache: true }
  ): Promise<Settings[]> {
    const { useCache = true } = options;
    const cacheKey = this.generateCacheKey({ groupType, isPublic: false });

    // Try to get from cache first
    if (useCache) {
      const cached = this.getFromCache<Settings[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT for group type: ${groupType}`);
        return cached;
      }
    }

    this.logger.debug(
      `Cache MISS for group type: ${groupType}, fetching from database`
    );

    try {
      const settings = await this.settingsRepository.findByGroupType(groupType);

      // Cache the result
      if (useCache && settings.length > 0) {
        this.setToCache(cacheKey, settings, this.cacheTTL);
      }

      return settings;
    } catch (error) {
      this.logger.error(
        `Failed to fetch settings for group type: ${groupType}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getPublicSettingsByGroupType(
    groupType: string,
    options: SettingsServiceOptions = { useCache: true }
  ): Promise<Settings[]> {
    return this.getSettingsByGroupType(groupType, options);
  }

  async getSettingByGroupTypeAndKey(
    groupType: string,
    key: string,
    options: SettingsServiceOptions = { useCache: true }
  ): Promise<Settings | null> {
    const { useCache = true } = options;
    const cacheKey = this.generateCacheKey({ groupType, key, isPublic: false });

    // Try to get from cache first
    if (useCache) {
      const cached = this.getFromCache<Settings>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT for setting: ${groupType}/${key}`);
        return cached;
      }
    }

    this.logger.debug(
      `Cache MISS for setting: ${groupType}/${key}, fetching from database`
    );

    try {
      const setting = await this.settingsRepository.findByGroupTypeAndKey(
        groupType,
        key
      );

      // Cache the result
      if (useCache && setting) {
        this.setToCache(cacheKey, setting, this.cacheTTL);
      }

      return setting;
    } catch (error) {
      this.logger.error(
        `Failed to fetch setting: ${groupType}/${key}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async createOrUpdateSettings(
    groupType: string,
    formData: Record<string, string | Express.Multer.File>
  ): Promise<Settings[]> {
    this.logger.log(`Processing form data for group type: ${groupType}`);

    try {
      // Process form data to separate text and file settings
      const processedData = await this.processFormDataSettings(
        groupType,
        formData
      );
      const results: Settings[] = [];

      // Process text settings
      for (const textSetting of processedData.textSettings) {
        const result = await this.settingsRepository.upsertByGroupTypeAndKey(
          groupType,
          textSetting.key,
          {
            groupType,
            key: textSetting.key,
            value: textSetting.value,
            recordType: textSetting.recordType,
          }
        );
        results.push(result);
      }

      // Process file settings
      for (const fileSetting of processedData.fileSettings) {
        try {
          // Delete old file if it exists (for updates)
          if (fileSetting.oldFilePath) {
            await this.deleteOldFile(fileSetting.oldFilePath);
          }

          // Upload new file
          const uploadResult = await this.uploadFile(fileSetting.file);

          const result = await this.settingsRepository.upsertByGroupTypeAndKey(
            groupType,
            fileSetting.key,
            {
              groupType,
              key: fileSetting.key,
              value: uploadResult.filePath,
              recordType: fileSetting.recordType,
            }
          );
          results.push(result);

          this.logger.log(
            `File uploaded successfully for key: ${fileSetting.key}`
          );
        } catch (error) {
          this.logger.error(
            `File upload failed for key: ${fileSetting.key}`,
            (error as Error).stack
          );
          throw new FileUploadSettingsException(
            (error as Error).message,
            fileSetting.key
          );
        }
      }

      // Invalidate cache for this group type
      this.invalidateGroupTypeCache(groupType);

      this.logger.log(
        `Successfully processed ${results.length} settings for group type: ${groupType}`
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to create/update settings for group type: ${groupType}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async updateSetting(
    groupType: string,
    key: string,
    data: UpdateSettingsData
  ): Promise<Settings> {
    try {
      const result = await this.settingsRepository.upsertByGroupTypeAndKey(
        groupType,
        key,
        data
      );

      // Invalidate related cache entries
      this.invalidateSettingCache(groupType, key);
      this.invalidateGroupTypeCache(groupType);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update setting: ${groupType}/${key}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async deleteSetting(groupType: string, key: string): Promise<boolean> {
    try {
      // Get the setting first to check if it's a file
      const setting = await this.settingsRepository.findByGroupTypeAndKey(
        groupType,
        key
      );

      if (!setting) {
        throw new SettingsNotFoundException(groupType, key);
      }

      // If it's a file setting, delete the file
      if (setting.recordType === RecordType.FILE && setting.value) {
        await this.deleteOldFile(setting.value);
      }

      const result = await this.settingsRepository.deleteByGroupTypeAndKey(
        groupType,
        key
      );

      // Invalidate related cache entries
      this.invalidateSettingCache(groupType, key);
      this.invalidateGroupTypeCache(groupType);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to delete setting: ${groupType}/${key}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async deleteGroupType(groupType: string): Promise<number> {
    try {
      // Get all settings for this group type to clean up files
      const settings = await this.settingsRepository.findByGroupType(groupType);

      // Delete all associated files
      for (const setting of settings) {
        if (setting.recordType === RecordType.FILE && setting.value) {
          await this.deleteOldFile(setting.value);
        }
      }

      const deletedCount =
        await this.settingsRepository.deleteByGroupType(groupType);

      // Invalidate cache for this group type
      this.invalidateGroupTypeCache(groupType);

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete group type: ${groupType}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCacheStats(): Promise<NodeCache.Stats> {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize,
    };
  }

  async clearCache(groupType?: string): Promise<void> {
    try {
      if (groupType) {
        this.invalidateGroupTypeCache(groupType);
      } else {
        this.cache.flushAll();
        this.logger.log('Cache cleared completely');
      }
    } catch (error) {
      this.logger.error('Failed to clear cache', (error as Error).stack);
      throw new SettingsCacheException((error as Error).message);
    }
  }

  private async processFormDataSettings(
    groupType: string,
    formData: Record<string, string | Express.Multer.File>
  ): Promise<ProcessedFormDataSettings> {
    const textSettings: ProcessedFormDataSettings['textSettings'] = [];
    const fileSettings: ProcessedFormDataSettings['fileSettings'] = [];

    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        // Text setting
        textSettings.push({
          key,
          value,
          recordType: RecordType.STRING,
        });
      } else if (value && typeof value === 'object' && 'buffer' in value) {
        // File setting
        const existingSetting =
          await this.settingsRepository.findByGroupTypeAndKey(groupType, key);

        fileSettings.push({
          key,
          file: value,
          recordType: RecordType.FILE,
          oldFilePath:
            existingSetting?.recordType === RecordType.FILE
              ? existingSetting.value
              : undefined,
        });
      }
    }

    return { textSettings, fileSettings };
  }

  private async uploadFile(
    file: Express.Multer.File
  ): Promise<{ filePath: string }> {
    try {
      const result = await this.fileManagementService.uploadSettingsFile(file);
      return { filePath: result.filePath };
    } catch (error) {
      this.logger.error('File upload failed', (error as Error).stack);
      throw new FileUploadSettingsException((error as Error).message);
    }
  }

  private async deleteOldFile(filePath: string): Promise<void> {
    try {
      const fileExists = await this.fileManagementService.fileExists(filePath);
      if (fileExists) {
        await this.fileManagementService.deleteFile(filePath);
        this.logger.debug(`Old file deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete old file: ${filePath}`,
        (error as Error).stack
      );
      // Don't throw error for file deletion failures as it shouldn't break the main flow
    }
  }

  private generateCacheKey(key: CacheKey): string {
    const { groupType, key: settingKey, isPublic } = key;
    const prefix = isPublic ? 'public' : 'admin';

    if (settingKey) {
      return `settings:${prefix}:${groupType}:${settingKey}`;
    }
    return `settings:${prefix}:${groupType}:all`;
  }

  private getFromCache<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      this.logger.warn(
        `Cache get failed for key: ${key}`,
        (error as Error).stack
      );
      return undefined;
    }
  }

  private setToCache<T>(key: string, value: T, ttl?: number): void {
    try {
      this.cache.set(key, value, ttl || this.cacheTTL);
    } catch (error) {
      this.logger.warn(
        `Cache set failed for key: ${key}`,
        (error as Error).stack
      );
    }
  }

  private invalidateGroupTypeCache(groupType: string): void {
    try {
      const keysToDelete = this.cache
        .keys()
        .filter(
          (key) => key.includes(`settings:`) && key.includes(`:${groupType}:`)
        );

      if (keysToDelete.length > 0) {
        this.cache.del(keysToDelete);
        this.logger.debug(
          `Invalidated ${keysToDelete.length} cache entries for group type: ${groupType}`
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate cache for group type: ${groupType}`,
        (error as Error).stack
      );
    }
  }

  private invalidateSettingCache(groupType: string, key: string): void {
    try {
      const publicKey = this.generateCacheKey({
        groupType,
        key,
        isPublic: true,
      });
      const adminKey = this.generateCacheKey({
        groupType,
        key,
        isPublic: false,
      });

      this.cache.del([publicKey, adminKey]);
      this.logger.debug(`Invalidated cache for setting: ${groupType}/${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate cache for setting: ${groupType}/${key}`,
        (error as Error).stack
      );
    }
  }
}
