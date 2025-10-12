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
  ManageDropdown,
  CreateManageDropdownDto,
  ManageDropdownWithLanguage,
} from '../../../database/entities/manage-dropdown.entity';
import {
  CreateManageDropdownDto as CreateManageDropdownDtoValidated,
  UpdateManageDropdownDto as UpdateManageDropdownDtoValidated,
  BulkOperationDto as BulkOperationDtoValidated,
} from './dto/manage-dropdown.dto';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

@Injectable()
export class ManageDropdownService {
  private readonly logger = new Logger(ManageDropdownService.name);

  constructor(
    @Inject(MANAGE_DROPDOWN_REPOSITORY)
    private readonly manageDropdownRepository: IManageDropdownRepository,
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

      this.logger.log(
        `Created dropdown entries for type ${normalizedDropdownType}: ${createData.name} with unique code ${uniqueCode}`
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

      // Get dropdowns from repository
      const dropdowns = await this.manageDropdownRepository.findByTypeForPublic(
        normalizedDropdownType,
        languageId
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
    languageId?: string
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

      const result =
        await this.manageDropdownRepository.findByTypeWithPagination(
          normalizedDropdownType,
          page,
          limit,
          includeInactive,
          languageId
        );

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

      const dropdown =
        await this.manageDropdownRepository.findSingleByTypeAndLanguage(
          normalizedDropdownType,
          publicId,
          languageId
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
    updateDropdownDto: UpdateManageDropdownDtoValidated,
    languageId?: string
  ): Promise<ManageDropdown> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Find dropdown with language support
      const existingDropdown = await this.findSingleByTypeAndLanguage(
        normalizedDropdownType,
        publicId,
        languageId
      );

      // Check for name conflicts if updating name
      if (
        updateDropdownDto.name &&
        updateDropdownDto.name !== existingDropdown.name
      ) {
        // Extract the languageId (primary key) for conflict checking
        // languageId should always be a string (primary key) or MinimalLanguage with publicId
        let languageId: string;
        if (typeof existingDropdown.languageId === 'string') {
          languageId = existingDropdown.languageId;
        } else if (
          existingDropdown.languageId &&
          'publicId' in existingDropdown.languageId
        ) {
          // If it's populated language data, we need to get the actual language ID
          // This should not happen in normal operation, but handle it gracefully
          languageId =
            await this.manageDropdownRepository.getDefaultLanguageId();
        } else {
          throw new Error('Invalid languageId format in existing dropdown');
        }

        const languageDropdowns =
          await this.manageDropdownRepository.findByTypeAndLanguage(
            normalizedDropdownType,
            languageId
          );
        const existingByName = languageDropdowns.find(
          (dropdown) =>
            dropdown.name.toLowerCase() ===
              updateDropdownDto.name!.toLowerCase() &&
            dropdown.id !== existingDropdown.id
        );
        if (existingByName) {
          throw new ConflictException(
            `Dropdown option with name '${updateDropdownDto.name}' already exists for this type and language`
          );
        }
      }

      // Only allow updating name and status
      const allowedUpdateData = {
        ...(updateDropdownDto.name && { name: updateDropdownDto.name }),
        ...(updateDropdownDto.status !== undefined && {
          status: updateDropdownDto.status,
        }),
      };

      const updatedDropdown = await this.manageDropdownRepository.updateById(
        existingDropdown.id,
        allowedUpdateData
      );

      this.logger.log(
        `Updated dropdown ${publicId} in type ${normalizedDropdownType}`
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

      this.logger.log(
        `Deleted ${deletedCount} dropdown variants with unique code ${uniqueCode} from type ${normalizedDropdownType}`
      );

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

  async bulkOperation(
    dropdownType: string,
    bulkOperationDto: BulkOperationDtoValidated
  ): Promise<number> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      if (
        !bulkOperationDto.publicIds ||
        bulkOperationDto.publicIds.length === 0
      ) {
        throw new BadRequestException('No dropdown IDs provided');
      }

      // Verify all dropdowns exist and belong to the correct type
      const dropdowns = await Promise.all(
        bulkOperationDto.publicIds.map((publicId) =>
          this.findByPublicId(publicId)
        )
      );

      const invalidDropdowns = dropdowns.filter(
        (dropdown) => dropdown.dropdownType !== normalizedDropdownType
      );
      if (invalidDropdowns.length > 0) {
        throw new BadRequestException(
          `Some dropdowns do not belong to type '${normalizedDropdownType}'`
        );
      }

      // Log operation for tracking
      this.logger.log(
        `Starting bulk ${bulkOperationDto.action} operation for ${bulkOperationDto.publicIds.length} dropdowns in type ${normalizedDropdownType}`
      );

      const operationCount =
        await this.manageDropdownRepository.bulkOperation(bulkOperationDto);

      this.logger.log(
        `Bulk ${bulkOperationDto.action} operation completed: ${operationCount} dropdowns affected in type ${normalizedDropdownType}`
      );
      return operationCount;
    } catch (error) {
      this.logger.error(
        `Failed to perform bulk ${bulkOperationDto.action} for type ${dropdownType}:`,
        error
      );
      throw error;
    }
  }

  async incrementUseCount(publicId: string): Promise<void> {
    try {
      const dropdown = await this.findByPublicId(publicId);
      await this.manageDropdownRepository.incrementUseCount(dropdown.id);

      this.logger.debug(`Incremented use count for dropdown ${publicId}`);
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
    languageId?: string
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
      languageId
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
