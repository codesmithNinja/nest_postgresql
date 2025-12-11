import {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import {
  Slider,
  CreateSliderDto,
  SliderWithLanguage,
} from '../../entities/slider.entity';

export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface ISliderRepository extends IRepository<Slider> {
  /**
   * Find sliders by language for frontend (only active)
   * @param languageId Language ID to filter by
   * @returns Promise<SliderWithLanguage[]>
   */
  findForPublic(languageId: string): Promise<SliderWithLanguage[]>;

  /**
   * Find sliders by language with optional inactive inclusion
   * @param languageId Language ID to filter by
   * @param includeInactive Whether to include inactive sliders
   * @returns Promise<SliderWithLanguage[]>
   */
  findByLanguage(
    languageId: string,
    includeInactive?: boolean
  ): Promise<SliderWithLanguage[]>;

  /**
   * Find slider by public ID with language populated
   * @param publicId Slider public ID
   * @returns Promise<SliderWithLanguage | null>
   */
  findByPublicId(publicId: string): Promise<SliderWithLanguage | null>;

  /**
   * Find sliders by unique code (all language variants)
   * @param uniqueCode Unique code to search for
   * @returns Promise<SliderWithLanguage[]>
   */
  findByUniqueCode(uniqueCode: number): Promise<SliderWithLanguage[]>;

  /**
   * Find sliders with pagination by language
   * @param page Page number
   * @param limit Items per page
   * @param languageId Language ID to filter by
   * @param includeInactive Whether to include inactive sliders
   * @returns Promise with paginated data
   */
  findWithPaginationByLanguage(
    page: number,
    limit: number,
    languageId: string,
    includeInactive: boolean
  ): Promise<{
    data: SliderWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find sliders with pagination and search
   * @param searchTerm Search term to match against slider fields
   * @param searchFields Fields to search in
   * @param filter Additional filters to apply
   * @param options Pagination and sorting options
   * @returns Promise with paginated search results
   */
  findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Slider>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Slider>>;

  /**
   * Create slider in multiple languages
   * @param createDto Slider data
   * @param languageIds Array of language IDs to create slider in
   * @returns Promise<Slider[]>
   */
  createMultiLanguage(
    createDto: CreateSliderDto,
    languageIds: string[]
  ): Promise<Slider[]>;

  /**
   * Create slider in multiple languages with language-specific file paths
   * @param createDto Slider data (without sliderImage and languageId)
   * @param languageFilePairs Array of {languageId, filePath} pairs
   * @returns Promise<Slider[]>
   */
  createMultiLanguageWithFiles(
    createDto: Omit<CreateSliderDto, 'sliderImage' | 'languageId'>,
    languageFilePairs: Array<{ languageId: string; filePath: string }>
  ): Promise<Slider[]>;

  /**
   * Get all active language codes with their IDs
   * @returns Promise<Array<{id: string, folder: string}>>
   */
  getAllActiveLanguageCodesWithIds(): Promise<
    Array<{ id: string; folder: string }>
  >;

  /**
   * Generate unique code for new slider
   * @returns Promise<number>
   */
  generateUniqueCode(): Promise<number>;

  /**
   * Get default language ID
   * @returns Promise<string>
   */
  getDefaultLanguageId(): Promise<string>;

  /**
   * Get all active language IDs
   * @returns Promise<string[]>
   */
  getAllActiveLanguageIds(): Promise<string[]>;

  /**
   * Bulk update sliders by public IDs
   * @param publicIds Array of public IDs
   * @param data Partial data to update
   * @returns Promise with count and updated items
   */
  bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Slider>
  ): Promise<{ count: number; updated: Slider[] }>;

  /**
   * Bulk delete sliders by public IDs
   * @param publicIds Array of public IDs
   * @returns Promise with count and deleted items
   */
  bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Slider[] }>;

  /**
   * Delete all language variants of a slider by unique code
   * @param uniqueCode Unique code of slider to delete
   * @returns Promise<number> Number of deleted records
   */
  deleteByUniqueCode(uniqueCode: number): Promise<number>;

  /**
   * Check if unique code exists
   * @param uniqueCode Unique code to check
   * @returns Promise<boolean>
   */
  isUniqueCodeExists(uniqueCode: number): Promise<boolean>;
}

export const SLIDERS_REPOSITORY = 'SLIDERS_REPOSITORY';
