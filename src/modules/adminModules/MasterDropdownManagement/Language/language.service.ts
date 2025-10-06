import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ILanguageRepository,
  LANGUAGE_REPOSITORY,
} from '../../../../database/repositories/language/language.repository.interface';
import {
  Language,
  CreateLanguageDto,
  UpdateLanguageDto,
} from '../../../../database/entities/language.entity';
import { MasterDropdownCacheService } from '../utils/cache.service';
import {
  CreateLanguageDto as CreateLanguageDtoValidated,
  UpdateLanguageDto as UpdateLanguageDtoValidated,
} from './dto/language.dto';

@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);

  constructor(
    @Inject(LANGUAGE_REPOSITORY)
    private readonly languageRepository: ILanguageRepository,
    private readonly cacheService: MasterDropdownCacheService
  ) {}

  async create(
    createLanguageDto: CreateLanguageDtoValidated
  ): Promise<Language> {
    try {
      // Check if language code already exists
      const existingByCode = await this.languageRepository.findByCode(
        createLanguageDto.code
      );
      if (existingByCode) {
        throw new ConflictException(
          `Language with code '${createLanguageDto.code}' already exists`
        );
      }

      // Check if language name already exists
      const existingLanguages = await this.languageRepository.getAll();
      const existingByName = existingLanguages.find(
        (lang: any) =>
          lang.name.toLowerCase() === createLanguageDto.name.toLowerCase()
      );
      if (existingByName) {
        throw new ConflictException(
          `Language with name '${createLanguageDto.name}' already exists`
        );
      }

      // If this is set as default, unset all other defaults first
      if (createLanguageDto.isDefault === 'YES') {
        await this.languageRepository.unsetAllDefaults();
      }

      // Set default values
      const languageData: CreateLanguageDto = {
        ...createLanguageDto,
        code: createLanguageDto.code.toLowerCase(),
        direction: createLanguageDto.direction || 'ltr',
        isDefault: createLanguageDto.isDefault || 'NO',
        status: createLanguageDto.status ?? true,
      };

      const language = await this.languageRepository.insert(languageData);

      // Cache the new language
      this.cacheService.setLanguage(language);

      // Invalidate language lists cache
      this.cacheService.invalidateLanguageCache();

      this.logger.log(`Language created: ${language.name} (${language.code})`);
      return language;
    } catch (error) {
      this.logger.error(`Failed to create language:`, error);
      throw error;
    }
  }

  async findAll(): Promise<Language[]> {
    try {
      // Try to get from cache first
      const cachedLanguages = await this.cacheService.getAllLanguages();
      if (cachedLanguages) {
        return cachedLanguages;
      }

      const languages = await this.languageRepository.getAll();

      // Cache the result
      this.cacheService.setAllLanguages(languages);

      return languages;
    } catch (error) {
      this.logger.error('Failed to fetch all languages:', error);
      throw error;
    }
  }

  async findAllActive(): Promise<Language[]> {
    try {
      // Try to get from cache first
      const cachedLanguages = await this.cacheService.getActiveLanguages();
      if (cachedLanguages) {
        return cachedLanguages;
      }

      const languages = await this.languageRepository.findActiveLanguages();

      // Cache the result
      this.cacheService.setActiveLanguages(languages);

      return languages;
    } catch (error) {
      this.logger.error('Failed to fetch active languages:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Language> {
    try {
      // Try to get from cache first
      const cachedLanguage = await this.cacheService.getLanguageById(id);
      if (cachedLanguage) {
        return cachedLanguage;
      }

      const language = await this.languageRepository.getDetailById(id);
      if (!language) {
        throw new NotFoundException(`Language with ID '${id}' not found`);
      }

      // Cache the result
      this.cacheService.setLanguage(language);

      return language;
    } catch (error) {
      this.logger.error(`Failed to fetch language by ID ${id}:`, error);
      throw error;
    }
  }

  async findByPublicId(publicId: string): Promise<Language> {
    try {
      // Try to get from cache first
      const cachedLanguage =
        await this.cacheService.getLanguageByPublicId(publicId);
      if (cachedLanguage) {
        return cachedLanguage;
      }

      const language = await this.languageRepository.getDetail({ publicId });
      if (!language) {
        throw new NotFoundException(
          `Language with public ID '${publicId}' not found`
        );
      }

      // Cache the result
      this.cacheService.setLanguage(language);

      return language;
    } catch (error) {
      this.logger.error(
        `Failed to fetch language by public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  async findByCode(code: string): Promise<Language> {
    try {
      // Try to get from cache first
      const cachedLanguage = await this.cacheService.getLanguageByCode(
        code.toLowerCase()
      );
      if (cachedLanguage) {
        return cachedLanguage;
      }

      const language = await this.languageRepository.findByCode(
        code.toLowerCase()
      );
      if (!language) {
        throw new NotFoundException(`Language with code '${code}' not found`);
      }

      // Cache the result
      this.cacheService.setLanguage(language);

      return language;
    } catch (error) {
      this.logger.error(`Failed to fetch language by code ${code}:`, error);
      throw error;
    }
  }

  async getDefaultLanguage(): Promise<Language> {
    try {
      // Try to get from cache first
      const cachedLanguage = await this.cacheService.getDefaultLanguage();
      if (cachedLanguage) {
        return cachedLanguage;
      }

      const language = await this.languageRepository.findByIsDefault('YES');
      if (!language) {
        // If no default language exists, try to get English
        const englishLanguage = await this.languageRepository.findByCode('en');
        if (englishLanguage) {
          // Set English as default
          const defaultLanguage = await this.languageRepository.setAsDefault(
            englishLanguage.id
          );
          this.cacheService.setLanguage(defaultLanguage);
          this.cacheService.invalidateLanguageCache();
          return defaultLanguage;
        }
        throw new NotFoundException(
          'No default language found and English language not available'
        );
      }

      // Cache the result
      this.cacheService.setLanguage(language);

      return language;
    } catch (error) {
      this.logger.error('Failed to fetch default language:', error);
      throw error;
    }
  }

  async update(
    publicId: string,
    updateLanguageDto: UpdateLanguageDtoValidated
  ): Promise<Language> {
    try {
      const existingLanguage = await this.findByPublicId(publicId);

      // Check for conflicts if updating code or name
      if (
        updateLanguageDto.code &&
        updateLanguageDto.code !== existingLanguage.code
      ) {
        const existingByCode = await this.languageRepository.findByCode(
          updateLanguageDto.code.toLowerCase()
        );
        if (existingByCode && existingByCode.id !== existingLanguage.id) {
          throw new ConflictException(
            `Language with code '${updateLanguageDto.code}' already exists`
          );
        }
      }

      if (
        updateLanguageDto.name &&
        updateLanguageDto.name !== existingLanguage.name
      ) {
        const allLanguages = await this.languageRepository.getAll();
        const existingByName = allLanguages.find(
          (lang: any) =>
            lang.name.toLowerCase() === updateLanguageDto.name!.toLowerCase() &&
            lang.id !== existingLanguage.id
        );
        if (existingByName) {
          throw new ConflictException(
            `Language with name '${updateLanguageDto.name}' already exists`
          );
        }
      }

      // If setting as default, unset all other defaults first
      if (
        updateLanguageDto.isDefault === 'YES' &&
        existingLanguage.isDefault !== 'YES'
      ) {
        await this.languageRepository.unsetAllDefaults();
      }

      // Prepare update data
      const updateData: UpdateLanguageDto = {
        ...updateLanguageDto,
      };

      if (updateData.code) {
        updateData.code = updateData.code.toLowerCase();
      }

      const updatedLanguage = await this.languageRepository.updateById(
        existingLanguage.id,
        updateData
      );

      // Invalidate cache
      this.cacheService.invalidateLanguageCache(existingLanguage);
      this.cacheService.setLanguage(updatedLanguage);

      this.logger.log(
        `Language updated: ${updatedLanguage.name} (${updatedLanguage.code})`
      );
      return updatedLanguage;
    } catch (error) {
      this.logger.error(
        `Failed to update language with public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  async setAsDefault(publicId: string): Promise<Language> {
    try {
      const language = await this.findByPublicId(publicId);

      if (!language.status) {
        throw new BadRequestException(
          'Cannot set inactive language as default'
        );
      }

      const defaultLanguage = await this.languageRepository.setAsDefault(
        language.id
      );

      // Invalidate cache
      this.cacheService.invalidateLanguageCache();
      this.cacheService.setLanguage(defaultLanguage);

      this.logger.log(
        `Language set as default: ${defaultLanguage.name} (${defaultLanguage.code})`
      );
      return defaultLanguage;
    } catch (error) {
      this.logger.error(
        `Failed to set language as default with public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  async delete(publicId: string): Promise<Language> {
    try {
      const language = await this.findByPublicId(publicId);

      if (language.isDefault === 'YES') {
        throw new BadRequestException(
          'Cannot delete the default language. Please set another language as default first.'
        );
      }

      const wasDeleted = await this.languageRepository.deleteById(language.id);

      if (!wasDeleted) {
        throw new Error('Failed to delete language');
      }

      // Invalidate cache
      this.cacheService.invalidateLanguageCache(language);

      this.logger.log(
        `Language soft deleted: ${language.name} (${language.code})`
      );
      return language;
    } catch (error) {
      this.logger.error(
        `Failed to delete language with public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Language[]; total: number; page: number; limit: number }> {
    try {
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      const filter = {};
      const paginationOptions = { page, limit };
      const result = await this.languageRepository.findWithPagination(
        filter,
        paginationOptions
      );
      return {
        data: result.items,
        total: result.pagination.totalCount,
        page: result.pagination.currentPage,
        limit: result.pagination.limit,
      };
    } catch (error) {
      this.logger.error('Failed to fetch languages with pagination:', error);
      throw error;
    }
  }

  async bulkUpdateStatus(
    publicIds: string[],
    status: boolean
  ): Promise<number> {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new BadRequestException('No language IDs provided');
      }

      // Find all languages by public IDs to get internal IDs
      const languages = await Promise.all(
        publicIds.map((publicId) => this.findByPublicId(publicId))
      );

      // Check if trying to deactivate default language
      if (!status) {
        const defaultLanguage = languages.find(
          (lang) => lang.isDefault === 'YES'
        );
        if (defaultLanguage) {
          throw new BadRequestException(
            'Cannot deactivate the default language'
          );
        }
      }

      const internalIds = languages.map((lang) => lang.id);
      const updatedCount = await this.languageRepository.bulkUpdateStatus(
        internalIds,
        status
      );

      // Invalidate cache for affected languages
      languages.forEach((language) => {
        this.cacheService.invalidateLanguageCache(language);
      });

      this.logger.log(
        `Bulk updated ${updatedCount} languages status to ${status}`
      );
      return updatedCount;
    } catch (error) {
      this.logger.error('Failed to bulk update language status:', error);
      throw error;
    }
  }
}
