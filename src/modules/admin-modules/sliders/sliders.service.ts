import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ISliderRepository,
  SLIDERS_REPOSITORY,
} from '../../../database/repositories/slider/slider.repository.interface';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';
import { SliderWithLanguage } from '../../../database/entities/slider.entity';
import {
  CreateSliderDto as CreateSliderDtoValidated,
  UpdateSliderDto as UpdateSliderDtoValidated,
  BulkUpdateSlidersDto,
  BulkDeleteSlidersDto,
  SliderQueryDto,
  SliderResponseDto,
  PaginatedSliderResponseDto,
  SliderListResponseDto,
  BulkOperationResultDto,
} from './dto/sliders.dto';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import {
  SliderNotFoundException,
  SlidersNotFoundException,
  SliderLanguageException,
  SliderFileUploadException,
  SliderCreationException,
  SliderUpdateException,
  SliderColorValidationException,
  SliderUrlValidationException,
} from './exceptions/sliders.exceptions';
import { FileUploadUtil } from '../../../common/utils/file-upload.util';
import { getBucketName } from '../../../common/utils/file-upload.util';

@Injectable()
export class SlidersService {
  private readonly logger = new Logger(SlidersService.name);

  constructor(
    @Inject(SLIDERS_REPOSITORY)
    private readonly sliderRepository: ISliderRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languagesRepository: ILanguagesRepository,
    private readonly i18nResponse: I18nResponseService
  ) {}

  /**
   * Get active sliders for public/frontend use
   */
  async getActiveSliders(languageId?: string): Promise<SliderListResponseDto> {
    try {
      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get active sliders from repository
      const sliders =
        await this.sliderRepository.findForPublic(resolvedLanguageId);

      if (!sliders || sliders.length === 0) {
        throw new SlidersNotFoundException(resolvedLanguageId);
      }

      return {
        sliders: sliders.map((slider) => this.transformToResponseDto(slider)),
        count: sliders.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch active sliders for languageId ${languageId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get sliders for admin with pagination and filters
   */
  async getAllSliders(
    queryDto: SliderQueryDto
  ): Promise<PaginatedSliderResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        includeInactive = true,
        languageId,
        title,
        uniqueCode,
      } = queryDto;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get sliders with pagination
      const result = await this.sliderRepository.findWithPaginationByLanguage(
        page,
        limit,
        resolvedLanguageId,
        includeInactive
      );

      // Apply additional filters if provided
      let filteredData = result.data;
      if (title) {
        filteredData = filteredData.filter((slider) =>
          slider.title.toLowerCase().includes(title.toLowerCase())
        );
      }
      if (uniqueCode !== undefined) {
        filteredData = filteredData.filter(
          (slider) => slider.uniqueCode === uniqueCode
        );
      }

      const totalPages = Math.ceil(result.total / limit);

      return {
        data: filteredData.map((slider) => this.transformToResponseDto(slider)),
        total: result.total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to fetch sliders for admin:', error);
      throw error;
    }
  }

  /**
   * Get single slider by public ID
   */
  async getSliderByPublicId(publicId: string): Promise<SliderResponseDto> {
    try {
      const slider = await this.sliderRepository.findByPublicId(publicId);
      if (!slider) {
        throw new SliderNotFoundException(publicId, 'publicId');
      }

      return this.transformToResponseDto(slider);
    } catch (error) {
      this.logger.error(
        `Failed to fetch slider by public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create new slider in all languages with language-specific files
   */
  async createSlider(
    createDto: CreateSliderDtoValidated,
    file?: Express.Multer.File
  ): Promise<SliderResponseDto> {
    try {
      // Validate input data
      this.validateSliderData(createDto);

      // Handle file upload
      if (!file) {
        throw new SliderFileUploadException('Slider image is required');
      }

      // Get language ID (primary key) - use provided one or default language
      let languageId = createDto.languageId;
      if (!languageId) {
        languageId = await this.sliderRepository.getDefaultLanguageId();
      }

      // Auto-generate unique 10-digit code
      const uniqueCode = await this.sliderRepository.generateUniqueCode();

      // Get all active languages with their codes and IDs
      const allLanguages =
        await this.sliderRepository.getAllActiveLanguageCodesWithIds();
      const languageCodes = allLanguages.map((lang) => lang.folder);

      // Upload file for all languages with language-specific naming
      const fileResults = await FileUploadUtil.uploadFileForLanguages(
        file,
        {
          bucketName: getBucketName('SLIDERS'),
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
          ],
          maxSizeInMB: 5,
          fieldName: 'slider',
        },
        uniqueCode,
        languageCodes
      );

      // Create language-file pairs for repository
      const languageFilePairs = allLanguages.map((lang, index) => ({
        languageId: lang.id,
        filePath: fileResults[index].filePath,
      }));

      // Prepare create data (without sliderImage as it's handled per language)
      const createData = {
        uniqueCode,
        title: createDto.title,
        description: createDto.description,
        buttonTitle: createDto.buttonTitle,
        buttonLink: createDto.buttonLink,
        customColor: createDto.customColor ?? false,
        titleColor: createDto.titleColor ?? '#000000',
        descriptionColor: createDto.descriptionColor ?? '#000000',
        buttonTitleColor: createDto.buttonTitleColor ?? '#FFFFFF',
        buttonBackground: createDto.buttonBackground ?? '#007BFF',
        descriptionTwo: createDto.descriptionTwo,
        buttonTitleTwo: createDto.buttonTitleTwo,
        buttonLinkTwo: createDto.buttonLinkTwo,
        descriptionTwoColor: createDto.descriptionTwoColor ?? '#666666',
        buttonTwoColor: createDto.buttonTwoColor ?? '#FFFFFF',
        buttonBackgroundTwo: createDto.buttonBackgroundTwo ?? '#28A745',
        status: createDto.status ?? true,
      };

      // Create slider entries for all active languages with language-specific files
      const createdSliders =
        await this.sliderRepository.createMultiLanguageWithFiles(
          createData,
          languageFilePairs
        );

      // Return only the slider for the requested language (or default language)
      const requestedLanguageSlider = createdSliders.find(
        (slider) => slider.languageId === languageId
      );

      const resultSlider = requestedLanguageSlider ?? createdSliders[0];

      // Get the populated version for response
      const populatedSlider = await this.sliderRepository.findByPublicId(
        resultSlider.publicId
      );
      if (!populatedSlider) {
        throw new SliderCreationException('Failed to retrieve created slider');
      }

      return this.transformToResponseDto(populatedSlider);
    } catch (error) {
      this.logger.error('Failed to create slider:', error);
      throw error;
    }
  }

  /**
   * Update slider
   */
  async updateSlider(
    publicId: string,
    updateDto: UpdateSliderDtoValidated,
    file?: Express.Multer.File
  ): Promise<SliderResponseDto> {
    try {
      // Find existing slider
      const existingSlider =
        await this.sliderRepository.findByPublicId(publicId);
      if (!existingSlider) {
        throw new SliderNotFoundException(publicId, 'publicId');
      }

      // Validate update data
      if (updateDto.titleColor)
        this.validateColorCode(updateDto.titleColor, 'titleColor');
      if (updateDto.descriptionColor)
        this.validateColorCode(updateDto.descriptionColor, 'descriptionColor');
      if (updateDto.buttonTitleColor)
        this.validateColorCode(updateDto.buttonTitleColor, 'buttonTitleColor');
      if (updateDto.buttonBackground)
        this.validateColorCode(updateDto.buttonBackground, 'buttonBackground');

      // Validate second set of color fields
      if (updateDto.descriptionTwoColor)
        this.validateColorCode(
          updateDto.descriptionTwoColor,
          'descriptionTwoColor'
        );
      if (updateDto.buttonTwoColor)
        this.validateColorCode(updateDto.buttonTwoColor, 'buttonTwoColor');
      if (updateDto.buttonBackgroundTwo)
        this.validateColorCode(
          updateDto.buttonBackgroundTwo,
          'buttonBackgroundTwo'
        );

      // Validate button links
      if (updateDto.buttonLink) this.validateUrl(updateDto.buttonLink);
      if (updateDto.buttonLinkTwo) this.validateUrl(updateDto.buttonLinkTwo);

      // Handle language-specific file upload if new image provided
      const updatedData = { ...updateDto };
      if (file) {
        const filePath = await this.handleLanguageSpecificFileUpload(
          existingSlider,
          file
        );
        updatedData.sliderImage = filePath;
      }

      // Update only this specific language variant
      await this.sliderRepository.updateById(existingSlider.id, updatedData);

      // Get the populated version for response
      const populatedSlider =
        await this.sliderRepository.findByPublicId(publicId);
      if (!populatedSlider) {
        throw new SliderUpdateException(
          publicId,
          'Failed to retrieve updated slider'
        );
      }

      return this.transformToResponseDto(populatedSlider);
    } catch (error) {
      this.logger.error(`Failed to update slider ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Delete slider by public ID
   */
  async deleteSlider(publicId: string): Promise<{ message: string }> {
    try {
      // Find existing slider
      const existingSlider =
        await this.sliderRepository.findByPublicId(publicId);
      if (!existingSlider) {
        throw new SliderNotFoundException(publicId, 'publicId');
      }

      // Get ALL language variants with the same uniqueCode to delete all their images
      const allSliderVariants = await this.sliderRepository.findByUniqueCode(
        existingSlider.uniqueCode
      );

      // Delete all image files for all language variants
      const imageDeletionPromises = allSliderVariants
        .filter((slider) => slider.sliderImage)
        .map(async (slider) => {
          try {
            await FileUploadUtil.deleteFile(slider.sliderImage);
          } catch (error) {
            this.logger.warn(
              `Failed to delete slider image: ${slider.sliderImage}`,
              error
            );
          }
        });

      await Promise.all(imageDeletionPromises);

      // Delete all language variants of this slider
      const deletedCount = await this.sliderRepository.deleteByUniqueCode(
        existingSlider.uniqueCode
      );

      return {
        message: `Slider deleted successfully (${deletedCount} variants removed)`,
      };
    } catch (error) {
      this.logger.error(`Failed to delete slider ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update slider status
   */
  async bulkUpdateSliders(
    bulkUpdateDto: BulkUpdateSlidersDto
  ): Promise<BulkOperationResultDto> {
    try {
      const { publicIds, status } = bulkUpdateDto;

      // Validate all sliders exist
      for (const publicId of publicIds) {
        const slider = await this.sliderRepository.findByPublicId(publicId);
        if (!slider) {
          throw new SliderNotFoundException(publicId, 'publicId');
        }
      }

      // Perform bulk update
      const result = await this.sliderRepository.bulkUpdateByPublicIds(
        publicIds,
        { status }
      );

      return {
        count: result.count,
        message: `${result.count} sliders updated successfully`,
      };
    } catch (error) {
      this.logger.error('Failed to bulk update sliders:', error);
      throw error;
    }
  }

  /**
   * Bulk delete sliders
   */
  async bulkDeleteSliders(
    bulkDeleteDto: BulkDeleteSlidersDto
  ): Promise<BulkOperationResultDto> {
    try {
      const { publicIds } = bulkDeleteDto;

      // Get all sliders to be deleted (following other modules' pattern)
      const slidersToDelete = await Promise.all(
        publicIds.map((id) => this.sliderRepository.findByPublicId(id))
      );

      // Filter out null results (silently skip missing records)
      const eligibleSliders = slidersToDelete.filter((slider) => {
        if (!slider) return false; // Skip missing records silently
        return true;
      }) as SliderWithLanguage[];

      // Get unique codes from eligible sliders
      const allUniqueCodes = [
        ...new Set(eligibleSliders.map((s) => s.uniqueCode)),
      ];

      // Get ALL language variants for each uniqueCode to ensure complete deletion
      const allVariantsPromises = allUniqueCodes.map((code) =>
        this.sliderRepository.findByUniqueCode(code)
      );
      const allVariantsArrays = await Promise.all(allVariantsPromises);
      const allVariants = allVariantsArrays.flat();

      // Delete ALL image files (including all language variants)
      const imageDeletionPromises = allVariants
        .filter((slider) => slider.sliderImage)
        .map(async (slider) => {
          try {
            await FileUploadUtil.deleteFile(slider.sliderImage);
          } catch (error) {
            this.logger.warn(
              `Failed to delete slider image: ${slider.sliderImage}`,
              error
            );
          }
        });

      await Promise.all(imageDeletionPromises);

      // Delete all variants by uniqueCodes (this ensures all language variants are removed)
      let totalDeleted = 0;
      for (const uniqueCode of allUniqueCodes) {
        const count =
          await this.sliderRepository.deleteByUniqueCode(uniqueCode);
        totalDeleted += count;
      }

      return {
        count: totalDeleted,
        message: `${totalDeleted} sliders deleted successfully`,
      };
    } catch (error) {
      this.logger.error('Failed to bulk delete sliders:', error);
      throw error;
    }
  }

  /**
   * Handle file upload for slider images
   */
  async handleFileUpload(
    existingSlider: SliderWithLanguage | null,
    file: Express.Multer.File,
    isUpdate: boolean = false
  ): Promise<string> {
    try {
      // Delete old file if updating
      if (isUpdate && existingSlider?.sliderImage) {
        await FileUploadUtil.deleteFile(existingSlider.sliderImage);
      }

      // Upload new file
      const result = await FileUploadUtil.uploadFile(file, {
        bucketName: getBucketName('SLIDERS'),
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/svg+xml',
        ],
        maxSizeInMB: 5,
        fieldName: 'sliderImage',
      });

      return result.filePath;
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw new SliderFileUploadException(
        error instanceof Error ? error.message : 'Unknown upload error'
      );
    }
  }

  /**
   * Handle language-specific file upload for slider image updates
   */
  async handleLanguageSpecificFileUpload(
    existingSlider: SliderWithLanguage,
    file: Express.Multer.File
  ): Promise<string> {
    try {
      // Delete old language-specific file
      if (existingSlider.sliderImage) {
        await FileUploadUtil.deleteFile(existingSlider.sliderImage);
      }

      // Get language code from the existing slider
      const languageCode = existingSlider.language?.code || 'en';

      // Generate language-specific filename
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const languageSpecificFileName = FileUploadUtil.generateLanguageFileName(
        `slider.${fileExtension}`,
        existingSlider.uniqueCode,
        languageCode,
        'slider'
      );

      // Upload new file with language-specific name
      const result = await FileUploadUtil.uploadFile(file, {
        bucketName: getBucketName('SLIDERS'),
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/svg+xml',
        ],
        maxSizeInMB: 5,
        fieldName: 'sliderImage',
        customFileName: languageSpecificFileName,
      });

      return result.filePath;
    } catch (error) {
      this.logger.error('Language-specific file upload failed:', error);
      throw new SliderFileUploadException(
        error instanceof Error ? error.message : 'Unknown upload error'
      );
    }
  }

  /**
   * Resolve language ID to primary key
   */
  private async resolveLanguageId(languageId?: string): Promise<string> {
    if (!languageId) {
      return await this.sliderRepository.getDefaultLanguageId();
    }

    // Check if it's a language code (like "en", "es") or an ID
    let language;
    if (languageId.length <= 3) {
      // Assume it's a language code (folder)
      language = await this.languagesRepository.findByFolder(languageId);
    } else {
      // Assume it's an ID
      language = await this.languagesRepository.getDetailById(languageId);
    }

    if (!language || !language.status) {
      throw new SliderLanguageException(languageId);
    }

    return language.id;
  }

  /**
   * Validate slider data
   */
  private validateSliderData(
    data: CreateSliderDtoValidated | UpdateSliderDtoValidated
  ): void {
    // Validate colors
    if (data.titleColor) this.validateColorCode(data.titleColor, 'titleColor');
    if (data.descriptionColor)
      this.validateColorCode(data.descriptionColor, 'descriptionColor');
    if (data.buttonTitleColor)
      this.validateColorCode(data.buttonTitleColor, 'buttonTitleColor');
    if (data.buttonBackground)
      this.validateColorCode(data.buttonBackground, 'buttonBackground');

    // Validate second set of color fields
    if (data.descriptionTwoColor)
      this.validateColorCode(data.descriptionTwoColor, 'descriptionTwoColor');
    if (data.buttonTwoColor)
      this.validateColorCode(data.buttonTwoColor, 'buttonTwoColor');
    if (data.buttonBackgroundTwo)
      this.validateColorCode(data.buttonBackgroundTwo, 'buttonBackgroundTwo');

    // Validate button links
    if (data.buttonLink) this.validateUrl(data.buttonLink);
    if (data.buttonLinkTwo) this.validateUrl(data.buttonLinkTwo);
  }

  /**
   * Validate hex color code
   */
  private validateColorCode(color: string, fieldName: string): void {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) {
      throw new SliderColorValidationException(fieldName, color);
    }
  }

  /**
   * Validate URL
   */
  private validateUrl(url: string): void {
    try {
      // Allow relative paths
      if (url.startsWith('/')) {
        return;
      }

      // Validate full URLs
      new URL(url);
    } catch {
      throw new SliderUrlValidationException(url);
    }
  }

  /**
   * Transform slider entity to response DTO
   */
  private transformToResponseDto(
    slider: SliderWithLanguage
  ): SliderResponseDto {
    return {
      id: slider.id,
      publicId: slider.publicId,
      uniqueCode: slider.uniqueCode,
      sliderImage: slider.sliderImage,
      title: slider.title,
      description: slider.description,
      buttonTitle: slider.buttonTitle,
      buttonLink: slider.buttonLink,
      languageId:
        typeof slider.languageId === 'string'
          ? slider.languageId
          : slider.languageId,
      language: slider.language
        ? {
            id: slider.language.id,
            name: slider.language.name,
            code: slider.language.code,
            direction: slider.language.direction,
            flagImage: slider.language.flagImage,
          }
        : undefined,
      customColor: slider.customColor,
      titleColor: slider.titleColor,
      descriptionColor: slider.descriptionColor,
      buttonTitleColor: slider.buttonTitleColor,
      buttonBackground: slider.buttonBackground,
      // Second set of description and button fields
      descriptionTwo: slider.descriptionTwo,
      buttonTitleTwo: slider.buttonTitleTwo,
      buttonLinkTwo: slider.buttonLinkTwo,
      descriptionTwoColor: slider.descriptionTwoColor,
      buttonTwoColor: slider.buttonTwoColor,
      buttonBackgroundTwo: slider.buttonBackgroundTwo,
      status: slider.status,
      createdAt: slider.createdAt,
      updatedAt: slider.updatedAt,
    };
  }
}
