import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  MetaSetting,
  CreateMetaSettingDto,
  UpdateMetaSettingDto,
  MetaSettingWithLanguage,
} from '../../entities/meta-setting.entity';

export interface IMetaSettingRepository extends IRepository<MetaSetting> {
  /**
   * Find meta setting by language for frontend (public endpoint)
   * @param languageId Language ID to find meta setting for
   * @returns Promise<MetaSettingWithLanguage | null>
   */
  findByLanguageId(languageId: string): Promise<MetaSettingWithLanguage | null>;

  /**
   * Find meta setting by language with language populated (admin endpoint)
   * @param languageId Language ID to find meta setting for
   * @returns Promise<MetaSettingWithLanguage | null>
   */
  findByLanguageIdWithLanguage(
    languageId: string
  ): Promise<MetaSettingWithLanguage | null>;

  /**
   * Find meta setting by public ID with language populated
   * @param publicId Meta setting public ID
   * @returns Promise<MetaSettingWithLanguage | null>
   */
  findByPublicIdWithLanguage(
    publicId: string
  ): Promise<MetaSettingWithLanguage | null>;

  /**
   * Create or update meta setting for a specific language
   * @param createDto Meta setting data
   * @returns Promise<MetaSetting>
   */
  createOrUpdateByLanguageId(
    createDto: CreateMetaSettingDto
  ): Promise<MetaSetting>;

  /**
   * Update meta setting by public ID
   * @param publicId Meta setting public ID
   * @param updateDto Data to update
   * @returns Promise<MetaSetting>
   */
  updateByPublicId(
    publicId: string,
    updateDto: UpdateMetaSettingDto
  ): Promise<MetaSetting>;

  /**
   * Create meta settings for all active languages
   * @param createDto Meta setting data (without languageId)
   * @returns Promise<MetaSetting[]>
   */
  createForAllActiveLanguages(
    createDto: Omit<CreateMetaSettingDto, 'languageId'>
  ): Promise<MetaSetting[]>;

  /**
   * Get all active language IDs
   * @returns Promise<string[]>
   */
  getAllActiveLanguageIds(): Promise<string[]>;

  /**
   * Get default language ID
   * @returns Promise<string>
   */
  getDefaultLanguageId(): Promise<string>;

  /**
   * Get language details by code (iso2)
   * @param languageCode Language code (e.g., 'en', 'es')
   * @returns Promise<{id: string, folder: string} | null>
   */
  getLanguageByCode(
    languageCode: string
  ): Promise<{ id: string; folder: string } | null>;

  /**
   * Check if meta setting exists for language
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  existsByLanguageId(languageId: string): Promise<boolean>;

  /**
   * Delete meta setting by language ID
   * @param languageId Language ID
   * @returns Promise<boolean>
   */
  deleteByLanguageId(languageId: string): Promise<boolean>;
}

export const META_SETTING_REPOSITORY = 'META_SETTING_REPOSITORY';
