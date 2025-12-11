import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  IManageDropdownRepository,
  MANAGE_DROPDOWN_REPOSITORY,
} from '../../../database/repositories/manage-dropdown/manage-dropdown.repository.interface';
import {
  ILanguagesRepository,
  LANGUAGES_REPOSITORY,
} from '../../../database/repositories/languages/languages.repository.interface';
import { PaginationOptions } from '../../../common/interfaces/repository.interface';
import {
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
} from '../../../database/entities/manage-dropdown.entity';
import {
  CreateManageDropdownDto as CreateManageDropdownDtoValidated,
  UpdateManageDropdownDto as UpdateManageDropdownDtoValidated,
  BulkUpdateManageDropdownDto,
  BulkDeleteManageDropdownDto,
} from './dto/manage-dropdown.dto';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

@Injectable()
export class ManageDropdownService {
  private readonly logger = new Logger(ManageDropdownService.name);

  constructor(
    @Inject(MANAGE_DROPDOWN_REPOSITORY)
    private readonly manageDropdownRepository: IManageDropdownRepository,
    @Inject(LANGUAGES_REPOSITORY)
    private readonly languagesRepository: ILanguagesRepository,
    private readonly i18nResponse: I18nResponseService
  ) {}

  async create(
    dropdownType: string,
    createDropdownDto: CreateManageDropdownDtoValidated
  ): Promise<ManageDropdown> {
    try {
      // Validate dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Get language ID (primary key) - use provided one or default language
      // IMPORTANT: languageId must be the primary key (_id/id), NOT publicId
      let languageId = createDropdownDto.languageId;
      if (!languageId) {
        languageId = await this.manageDropdownRepository.getDefaultLanguageId();
      }

      // Check for existing dropdown with same name in any language (same unique code)
      const existingDropdowns = await this.manageDropdownRepository.findByType(
        normalizedDropdownType,
        true // include inactive
      );

      const existingByName = existingDropdowns.find(
        (dropdown) =>
          dropdown.name.toLowerCase() === createDropdownDto.name.toLowerCase()
      );
      if (existingByName) {
        throw new ConflictException(
          `Dropdown option with name '${createDropdownDto.name}' already exists for type '${normalizedDropdownType}'`
        );
      }

      // Auto-generate unique 10-digit code
      const uniqueCode =
        await this.manageDropdownRepository.generateUniqueCode();

      // Get all active language IDs (primary keys) for multi-language replication
      const allLanguageIds =
        await this.manageDropdownRepository.getAllActiveLanguageIds();

      // Prepare create data
      const createData: CreateManageDropdownDto = {
        name: createDropdownDto.name,
        uniqueCode,
        dropdownType: normalizedDropdownType,
        languageId, // This will be overridden in multi-language creation
        status: createDropdownDto.status ?? true,
      };

      // Create dropdown entries for all active languages using their primary keys
      const createdDropdowns =
        await this.manageDropdownRepository.createMultiLanguage(
          createData,
          allLanguageIds // Array of language primary keys (_id/id)
        );

      // Return only the dropdown for the requested language (or default language)
      const requestedLanguageDropdown = createdDropdowns.find(
        (dropdown) => dropdown.languageId === languageId
      );

      return requestedLanguageDropdown
        ? requestedLanguageDropdown
        : createdDropdowns[0];
    } catch (error) {
      this.logger.error(
        `Failed to create dropdown for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async findByTypeForPublic(
    dropdownType: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage[]> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Get dropdowns from repository
      const dropdowns = await this.manageDropdownRepository.findByTypeForPublic(
        normalizedDropdownType,
        resolvedLanguageId
      );

      return dropdowns;
    } catch (error) {
      this.logger.error(
        `Failed to fetch dropdowns for type ${dropdownType} (public):`,
        error
      );
      throw error;
    }
  }

  async findByTypeForAdmin(
    dropdownType: string,
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = true,
    languageId?: string,
    search?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);

      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      // Set up pagination options
      const options: PaginationOptions = {
        page,
        limit,
        sort: { createdAt: -1 },
      };

      // Prepare additional filters
      const additionalFilters = {
        dropdownType: normalizedDropdownType,
        languageId: resolvedLanguageId,
        ...(includeInactive ? {} : { status: true }),
      };

      let result;
      if (search && search.trim()) {
        // Use new search method
        const searchResult =
          await this.manageDropdownRepository.findWithPaginationAndSearch(
            search.trim(),
            ['name'],
            additionalFilters,
            options
          );
        result = {
          data: searchResult.items as ManageDropdownWithLanguage[],
          total: searchResult.pagination.totalCount,
          page: searchResult.pagination.currentPage,
          limit: searchResult.pagination.limit,
        };
      } else {
        // Use existing pagination method
        result = await this.manageDropdownRepository.findByTypeWithPagination(
          normalizedDropdownType,
          page,
          limit,
          includeInactive,
          resolvedLanguageId
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch dropdowns for type ${dropdownType} (admin):`,
        error
      );
      throw error;
    }
  }

  async findByPublicId(publicId: string): Promise<ManageDropdownWithLanguage> {
    try {
      const dropdown =
        await this.manageDropdownRepository.findByPublicId(publicId);
      if (!dropdown) {
        throw new NotFoundException(
          `Dropdown with public ID '${publicId}' not found`
        );
      }

      return dropdown;
    } catch (error) {
      this.logger.error(
        `Failed to fetch dropdown by public ID ${publicId}:`,
        error
      );
      throw error;
    }
  }

  async findSingleByTypeAndLanguage(
    dropdownType: string,
    publicId: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Resolve languageId to primary key
      const resolvedLanguageId = await this.resolveLanguageId(languageId);

      const dropdown =
        await this.manageDropdownRepository.findSingleByTypeAndLanguage(
          normalizedDropdownType,
          publicId,
          resolvedLanguageId
        );

      if (!dropdown) {
        throw new NotFoundException(
          `Dropdown with public ID '${publicId}' not found for type '${normalizedDropdownType}'`
        );
      }

      return dropdown;
    } catch (error) {
      this.logger.error(
        `Failed to fetch dropdown ${publicId} for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async update(
    dropdownType: string,
    publicId: string,
    updateDropdownDto: UpdateManageDropdownDtoValidated
  ): Promise<ManageDropdown> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // First, find the dropdown by publicId (regardless of language)
      const existingDropdown =
        await this.manageDropdownRepository.findByPublicId(publicId);

      if (!existingDropdown) {
        throw new NotFoundException(
          `Dropdown with public ID '${publicId}' not found`
        );
      }

      // Verify the dropdown type matches
      if (existingDropdown.dropdownType !== normalizedDropdownType) {
        throw new NotFoundException(
          `Dropdown with public ID '${publicId}' not found for type '${normalizedDropdownType}'`
        );
      }

      // Prepare update data (ignore any languageId in the body)
      const allowedUpdateData: Partial<ManageDropdown> = {};

      if (updateDropdownDto.name !== undefined) {
        allowedUpdateData.name = updateDropdownDto.name;
      }

      if (updateDropdownDto.status !== undefined) {
        allowedUpdateData.status = updateDropdownDto.status;
      }

      const updatedDropdown = await this.manageDropdownRepository.updateById(
        existingDropdown.id,
        allowedUpdateData
      );

      return updatedDropdown;
    } catch (error) {
      this.logger.error(
        `Failed to update dropdown ${publicId} for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async deleteByUniqueCode(
    dropdownType: string,
    uniqueCode: number
  ): Promise<{
    deletedCount: number;
    dropdowns: ManageDropdownWithLanguage[];
  }> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Find all dropdowns with this unique code
      const existingDropdowns =
        await this.manageDropdownRepository.findByUniqueCode(uniqueCode);

      if (existingDropdowns.length === 0) {
        throw new NotFoundException(
          `No dropdown found with unique code: ${uniqueCode}`
        );
      }

      // Verify all dropdowns belong to the correct type
      const typeMismatch = existingDropdowns.find(
        (dropdown) => dropdown.dropdownType !== normalizedDropdownType
      );

      if (typeMismatch) {
        throw new BadRequestException(
          `Dropdown with unique code ${uniqueCode} does not belong to type '${normalizedDropdownType}'`
        );
      }

      // Check if any dropdown has useCount > 0
      const inUse = existingDropdowns.find((dropdown) => dropdown.useCount > 0);
      if (inUse) {
        throw new BadRequestException(
          `Cannot delete dropdown with unique code ${uniqueCode}. It is currently in use (useCount: ${inUse.useCount})`
        );
      }

      // Delete all language variants
      const deletedCount =
        await this.manageDropdownRepository.deleteByUniqueCode(uniqueCode);

      return {
        deletedCount,
        dropdowns: existingDropdowns,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete dropdown with unique code ${uniqueCode} for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async bulkUpdateDropdowns(
    dropdownType: string,
    bulkUpdateDto: BulkUpdateManageDropdownDto
  ): Promise<{ count: number; message: string }> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      if (!bulkUpdateDto.publicIds || bulkUpdateDto.publicIds.length === 0) {
        throw new BadRequestException('No dropdown public IDs provided');
      }

      const updateData: Partial<ManageDropdown> = {
        status: bulkUpdateDto.status,
      };

      const result = await this.manageDropdownRepository.bulkUpdateByPublicIds(
        bulkUpdateDto.publicIds,
        updateData
      );

      return {
        count: result.count,
        message: `${result.count} dropdowns updated successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform bulk update for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async bulkDeleteDropdowns(
    dropdownType: string,
    bulkDeleteDto: BulkDeleteManageDropdownDto
  ): Promise<{ count: number; message: string }> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      if (!bulkDeleteDto.publicIds || bulkDeleteDto.publicIds.length === 0) {
        throw new BadRequestException('No dropdown public IDs provided');
      }

      // Get all dropdowns to be deleted
      const dropdownsToDelete = await Promise.all(
        bulkDeleteDto.publicIds.map((id) => this.findByPublicId(id))
      );

      // Filter out null results and check eligibility
      const eligibleDropdowns = dropdownsToDelete.filter((dropdown) => {
        if (!dropdown) return false;
        if (dropdown.useCount > 0) {
          this.logger.warn(
            `Skipping deletion of dropdown '${dropdown.name}' due to useCount: ${dropdown.useCount}`
          );
          return false;
        }
        if (dropdown.dropdownType !== normalizedDropdownType) {
          this.logger.warn(
            `Skipping deletion of dropdown '${dropdown.name}' as it does not belong to type '${normalizedDropdownType}'`
          );
          return false;
        }
        return true;
      });

      // Delete eligible dropdowns
      const eligiblePublicIds = eligibleDropdowns.map(
        (dropdown) => dropdown.publicId
      );
      const result =
        await this.manageDropdownRepository.bulkDeleteByPublicIds(
          eligiblePublicIds
        );

      return {
        count: result.count,
        message: `${result.count} dropdowns deleted successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform bulk delete for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    try {
      const dropdown = await this.findByPublicId(publicId);
      await this.manageDropdownRepository.incrementUseCount(dropdown.id);
    } catch (error) {
      this.logger.error(
        `Failed to increment use count for dropdown ${publicId}:`,
        error
      );
      // Don't throw error as this is not critical functionality
    }
  }

  // Methods that match settings pattern exactly
  async getPublicDropdownsByDropdownType(
    dropdownType: string,
    languageId?: string
  ): Promise<ManageDropdownWithLanguage[]> {
    return this.findByTypeForPublic(dropdownType, languageId);
  }

  async getDropdownsByDropdownType(
    dropdownType: string,
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = true,
    languageId?: string,
    search?: string
  ): Promise<{
    data: ManageDropdownWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findByTypeForAdmin(
      dropdownType,
      page,
      limit,
      includeInactive,
      languageId,
      search
    );
  }

  /**
   * Resolves languageId parameter to the actual language primary key (id/_id)
   * Handles three scenarios:
   * 1. No languageId provided -> returns default language primary key
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

  private normalizeDropdownType(dropdownType: string): string {
    return dropdownType.toLowerCase().trim();
  }

  private validateDropdownType(dropdownType: string): boolean {
    // Allow any dropdown type with basic format validation
    if (!dropdownType || dropdownType.trim().length === 0) {
      return false;
    }

    const trimmed = dropdownType.trim();
    const validFormat = /^[a-zA-Z0-9_-]+$/;

    return (
      trimmed.length >= 1 && trimmed.length <= 50 && validFormat.test(trimmed)
    );
  }
}
