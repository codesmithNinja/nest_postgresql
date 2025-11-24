import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  IMetaSettingRepository,
  META_SETTING_REPOSITORY,
} from '../../../database/repositories/meta-setting/meta-setting.repository.interface';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';
import {
  MetaSetting,
  MetaSettingWithLanguage,
} from '../../../database/entities/meta-setting.entity';
import {
  CreateMetaSettingDto,
  UpdateMetaSettingDto,
  MetaSettingResponseDto,
  MetaSettingListResponseDto,
} from './dto/meta-setting.dto';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import {
  MetaSettingNotFoundException,
  MetaSettingFileUploadException,
  MetaSettingCreationException,
  MetaSettingUpdateException,
  MetaSettingSEOValidationException,
  MetaSettingAIGeneratedImageException,
  MetaSettingDefaultLanguageException,
  InvalidMetaSettingDataException,
} from './exceptions/meta-setting.exceptions';
import {
  FileUploadUtil,
  FileUploadResult,
} from '../../../common/utils/file-upload.util';
import { getBucketName } from '../../../common/utils/file-upload.util';

@Injectable()
export class MetaSettingsService {
  private readonly logger = new Logger(MetaSettingsService.name);

  constructor(
    @Inject(META_SETTING_REPOSITORY)
    private readonly metaSettingRepository: IMetaSettingRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languagesRepository: ILanguagesRepository,
    private readonly i18nResponse: I18nResponseService
  ) {}

  /**
   * Get meta setting for public/frontend use
   */
  async getMetaSettingForPublic(
    languageId?: string
  ): Promise<MetaSettingListResponseDto> {
    try {
      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get meta setting from repository
      const metaSetting =
        await this.metaSettingRepository.findByLanguageId(resolvedLanguageId);

      if (!metaSetting) {
        throw new MetaSettingNotFoundException(
          resolvedLanguageId,
          'languageId'
        );
      }

      // Get language code for response
      const language =
        await this.languagesRepository.findById(resolvedLanguageId);
      const languageCode = language?.code || 'en';

      return {
        metaSetting: this.transformToResponseDto(metaSetting),
        language: languageCode,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta setting for languageId ${languageId}:`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Get meta setting for admin
   */
  async getMetaSettingForAdmin(
    languageId?: string
  ): Promise<MetaSettingListResponseDto> {
    try {
      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get meta setting from repository
      const metaSetting =
        await this.metaSettingRepository.findByLanguageIdWithLanguage(
          resolvedLanguageId
        );

      if (!metaSetting) {
        throw new MetaSettingNotFoundException(
          resolvedLanguageId,
          'languageId'
        );
      }

      // Get language code for response
      const languageCode = metaSetting.language?.code || 'en';

      return {
        metaSetting: this.transformToResponseDto(metaSetting),
        language: languageCode,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta setting for admin with languageId ${languageId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get meta setting by public ID
   */
  async getMetaSettingByPublicId(
    publicId: string,
    languageId?: string
  ): Promise<MetaSettingResponseDto> {
    try {
      // Note: Meta settings are language-specific entities, so we use publicId to find the specific meta setting
      // The languageId parameter is available for future enhancement if needed
      const metaSetting =
        await this.metaSettingRepository.findByPublicIdWithLanguage(publicId);
      if (!metaSetting) {
        throw new MetaSettingNotFoundException(publicId, 'publicId');
      }

      return this.transformToResponseDto(metaSetting);
    } catch (error) {
      this.logger.error(
        `Failed to fetch meta setting by public ID ${publicId} with languageId ${languageId}:`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Create meta settings for all active languages
   */
  async createMetaSettings(
    createDto: CreateMetaSettingDto,
    file?: Express.Multer.File
  ): Promise<MetaSettingResponseDto> {
    try {
      // Validate meta setting data
      this.validateMetaSettingData(createDto);

      // Get all active languages
      const allLanguages =
        await this.metaSettingRepository.getAllActiveLanguageIds();
      if (!allLanguages || allLanguages.length === 0) {
        throw new MetaSettingDefaultLanguageException();
      }

      // Get language codes for file upload
      const languageCodes = await Promise.all(
        allLanguages.map(async (langId) => {
          const lang = await this.languagesRepository.getDetailById(langId);
          return lang?.folder || 'en';
        })
      );

      // Handle file upload for all languages
      let fileResults: { filePath: string }[] = [];
      if (file) {
        try {
          const uniqueCode = Math.floor(Math.random() * 1000000);
          const uploadResult: FileUploadResult[] =
            await FileUploadUtil.uploadFileForLanguages(
              file,
              {
                bucketName: getBucketName('META'),
                allowedMimeTypes: [
                  'image/jpeg',
                  'image/png',
                  'image/webp',
                  'image/svg+xml',
                ],
                maxSizeInMB: 5,
                fieldName: 'ogImage',
              },
              uniqueCode,
              languageCodes
            );
          fileResults = uploadResult;
        } catch (uploadError) {
          this.logger.error(
            'File upload failed:',
            (uploadError as Error).stack
          );
          throw new MetaSettingFileUploadException(
            uploadError instanceof Error
              ? uploadError.message
              : 'Unknown upload error'
          );
        }
      } else {
        // Default placeholder image for each language
        fileResults = languageCodes.map((langCode) => ({
          filePath: `placeholder-og-image-${langCode}.jpg`,
        }));
      }

      // Create meta settings for all languages
      const createdMetaSettings: MetaSetting[] = [];
      for (let i = 0; i < allLanguages.length; i++) {
        const languageId = allLanguages[i];
        const ogImage = fileResults[i]?.filePath || 'placeholder-og-image.jpg';

        // Check if meta setting already exists for this language
        const existing =
          await this.metaSettingRepository.existsByLanguageId(languageId);
        if (existing) {
          this.logger.warn(
            `Meta setting already exists for language ${languageId}, skipping creation`
          );
          continue;
        }

        const createData = {
          languageId,
          siteName: createDto.siteName,
          metaTitle: createDto.metaTitle,
          metaDescription: createDto.metaDescription,
          metaKeyword: createDto.metaKeyword,
          ogTitle: createDto.ogTitle,
          ogDescription: createDto.ogDescription,
          ogImage,
          isAIGeneratedImage: createDto.isAIGeneratedImage || 'NO',
        };

        const created = await this.metaSettingRepository.insert(createData);
        createdMetaSettings.push(created);
      }

      if (createdMetaSettings.length === 0) {
        throw new MetaSettingCreationException(
          'No meta settings were created. All languages may already have meta settings.'
        );
      }

      // Return the meta setting for the default language
      const defaultLanguageId =
        await this.metaSettingRepository.getDefaultLanguageId();
      const defaultMetaSetting =
        createdMetaSettings.find((ms) => ms.languageId === defaultLanguageId) ||
        createdMetaSettings[0];

      // Get the populated version for response
      const populatedMetaSetting =
        await this.metaSettingRepository.findByPublicIdWithLanguage(
          defaultMetaSetting.publicId
        );
      if (!populatedMetaSetting) {
        throw new MetaSettingCreationException(
          'Failed to retrieve created meta setting'
        );
      }

      return this.transformToResponseDto(populatedMetaSetting);
    } catch (error) {
      this.logger.error('Failed to create meta settings:', error);
      throw error;
    }
  }

  /**
   * Update meta setting
   */
  async updateMetaSetting(
    publicId: string,
    updateDto: UpdateMetaSettingDto,
    file?: Express.Multer.File
  ): Promise<MetaSettingResponseDto> {
    try {
      // Find existing meta setting
      const existingMetaSetting =
        await this.metaSettingRepository.findByPublicIdWithLanguage(publicId);
      if (!existingMetaSetting) {
        throw new MetaSettingNotFoundException(publicId, 'publicId');
      }

      // Validate update data
      if (updateDto.isAIGeneratedImage) {
        this.validateAIGeneratedImageValue(updateDto.isAIGeneratedImage);
      }
      if (
        updateDto.siteName ||
        updateDto.metaTitle ||
        updateDto.metaDescription
      ) {
        this.validateMetaSettingData(updateDto);
      }

      // Handle file upload if new image provided
      const updatedData = { ...updateDto };
      if (file) {
        const filePath = await this.handleLanguageSpecificFileUpload(
          existingMetaSetting,
          file
        );
        updatedData.ogImage = filePath;
      }

      // Update meta setting
      await this.metaSettingRepository.updateByPublicId(publicId, updatedData);

      // Get the updated meta setting with language info
      const populatedMetaSetting =
        await this.metaSettingRepository.findByPublicIdWithLanguage(publicId);
      if (!populatedMetaSetting) {
        throw new MetaSettingUpdateException(
          publicId,
          'Failed to retrieve updated meta setting'
        );
      }

      return this.transformToResponseDto(populatedMetaSetting);
    } catch (error) {
      this.logger.error(`Failed to update meta setting ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Handle language-specific file upload for OG image
   */
  private async handleLanguageSpecificFileUpload(
    existingMetaSetting: MetaSettingWithLanguage,
    file: Express.Multer.File
  ): Promise<string> {
    try {
      // Delete old language-specific file
      if (
        existingMetaSetting.ogImage &&
        !existingMetaSetting.ogImage.includes('placeholder')
      ) {
        await FileUploadUtil.deleteFile(existingMetaSetting.ogImage);
      }

      // Get language code from the existing meta setting
      const languageCode = existingMetaSetting.language?.code || 'en';

      // Generate language-specific filename
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const uniqueCode = Math.floor(Math.random() * 1000000);
      const languageSpecificFileName = FileUploadUtil.generateLanguageFileName(
        `og-image.${fileExtension}`,
        uniqueCode,
        languageCode,
        'meta-setting'
      );

      // Upload new file with language-specific name
      const result = await FileUploadUtil.uploadFile(file, {
        bucketName: getBucketName('META'),
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/svg+xml',
        ],
        maxSizeInMB: 5,
        fieldName: 'ogImage',
        customFileName: languageSpecificFileName,
      });

      return result.filePath;
    } catch (error) {
      this.logger.error('Language-specific OG image upload failed:', error);
      throw new MetaSettingFileUploadException(
        error instanceof Error ? error.message : 'Unknown upload error'
      );
    }
  }

  /**
   * Resolve language ID to primary key
   * Priority order:
   * 1. No languageId provided -> default language
   * 2. Language publicId provided -> converts to primary key
   * 3. Language primary key provided -> validates and returns if valid
   * @param languageId - Optional language identifier (publicId or primary key)
   * @returns Promise<string> The language primary key (id/_id)
   * @throws BadRequestException if languageId is invalid
   */
  private async resolveLanguageId(languageId?: string): Promise<string> {
    if (!languageId) {
      // No languageId provided, use default language
      const defaultLanguage = await this.languagesRepository.findDefault();
      if (!defaultLanguage) {
        throw new BadRequestException('No default language found');
      }
      return defaultLanguage.id;
    }

    // First, try to find by publicId (most common case)
    const languageByPublicId =
      await this.languagesRepository.findByPublicId(languageId);
    if (languageByPublicId && languageByPublicId.status) {
      return languageByPublicId.id;
    }

    // If not found by publicId, try to find by primary key (backward compatibility)
    const languageById = await this.languagesRepository.findById(languageId);
    if (languageById && languageById.status) {
      return languageById.id;
    }

    // If neither works, throw an error
    throw new BadRequestException(
      `Invalid languageId: ${languageId}. Language not found or inactive.`
    );
  }

  /**
   * Validate meta setting data
   */
  private validateMetaSettingData(
    data: CreateMetaSettingDto | UpdateMetaSettingDto
  ): void {
    // Validate site name
    if (
      data.siteName &&
      (data.siteName.length < 1 || data.siteName.length > 200)
    ) {
      throw new InvalidMetaSettingDataException(
        'siteName',
        data.siteName,
        'Must be between 1 and 200 characters'
      );
    }

    // Validate meta title
    if (
      data.metaTitle &&
      (data.metaTitle.length < 1 || data.metaTitle.length > 300)
    ) {
      throw new MetaSettingSEOValidationException(
        'metaTitle',
        data.metaTitle,
        'Must be between 1 and 300 characters for optimal SEO'
      );
    }

    // Validate meta description
    if (
      data.metaDescription &&
      (data.metaDescription.length < 1 || data.metaDescription.length > 500)
    ) {
      throw new MetaSettingSEOValidationException(
        'metaDescription',
        data.metaDescription,
        'Must be between 1 and 500 characters for optimal SEO'
      );
    }

    // Validate meta keywords
    if (
      data.metaKeyword &&
      (data.metaKeyword.length < 1 || data.metaKeyword.length > 1000)
    ) {
      throw new MetaSettingSEOValidationException(
        'metaKeyword',
        data.metaKeyword,
        'Must be between 1 and 1000 characters'
      );
    }

    // Validate OG title
    if (
      data.ogTitle &&
      (data.ogTitle.length < 1 || data.ogTitle.length > 300)
    ) {
      throw new InvalidMetaSettingDataException(
        'ogTitle',
        data.ogTitle,
        'Must be between 1 and 300 characters'
      );
    }

    // Validate OG description
    if (
      data.ogDescription &&
      (data.ogDescription.length < 1 || data.ogDescription.length > 500)
    ) {
      throw new InvalidMetaSettingDataException(
        'ogDescription',
        data.ogDescription,
        'Must be between 1 and 500 characters'
      );
    }
  }

  /**
   * Validate AI generated image value
   */
  private validateAIGeneratedImageValue(value: string): void {
    if (!['YES', 'NO'].includes(value.toUpperCase())) {
      throw new MetaSettingAIGeneratedImageException(value);
    }
  }

  /**
   * Transform entity to response DTO
   */
  private transformToResponseDto(
    metaSetting: MetaSettingWithLanguage
  ): MetaSettingResponseDto {
    return {
      id: metaSetting.id,
      publicId: metaSetting.publicId,
      languageId: metaSetting.languageId,
      language: metaSetting.language
        ? {
            publicId: metaSetting.language.publicId,
            name: metaSetting.language.name,
          }
        : undefined,
      siteName: metaSetting.siteName,
      metaTitle: metaSetting.metaTitle,
      metaDescription: metaSetting.metaDescription,
      metaKeyword: metaSetting.metaKeyword,
      ogTitle: metaSetting.ogTitle,
      ogDescription: metaSetting.ogDescription,
      ogImage: metaSetting.ogImage,
      isAIGeneratedImage: metaSetting.isAIGeneratedImage,
      createdAt: metaSetting.createdAt,
      updatedAt: metaSetting.updatedAt,
    };
  }
}
