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
  ): Promise<ManageDropdown[]> {
    try {
      // Validate dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      // Check for existing dropdown with same name and type
      const existingDropdowns =
        await this.manageDropdownRepository.findByTypeAndLanguage(
          normalizedDropdownType,
          createDropdownDto.languageId || ''
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

      // If this is set as default, unset other defaults in the same type
      if (createDropdownDto.isDefault === 'YES') {
        await this.unsetDefaultsForType(
          normalizedDropdownType,
          createDropdownDto.languageId || ''
        );
      }

      // Prepare create data
      const createData: CreateManageDropdownDto = {
        ...createDropdownDto,
        dropdownType: normalizedDropdownType,
        status: createDropdownDto.status ?? true,
      };

      // Create dropdown entry
      const createdDropdown =
        await this.manageDropdownRepository.insert(createData);

      this.logger.log(
        `Created dropdown entry for type ${normalizedDropdownType}: ${createData.name}`
      );
      return [createdDropdown];
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
    languageCode?: string
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
        languageCode
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
    languageCode?: string
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
          languageCode
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

      const existingDropdown = await this.findByPublicId(publicId);

      // Verify dropdown type matches
      if (existingDropdown.dropdownType !== normalizedDropdownType) {
        throw new BadRequestException(
          `Dropdown type mismatch. Expected '${normalizedDropdownType}', found '${existingDropdown.dropdownType}'`
        );
      }

      // Check for name conflicts if updating name
      if (
        updateDropdownDto.name &&
        updateDropdownDto.name !== existingDropdown.name
      ) {
        const languageDropdowns =
          await this.manageDropdownRepository.findByTypeAndLanguage(
            normalizedDropdownType,
            existingDropdown.languageId
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

      // If setting as default, unset other defaults
      if (
        updateDropdownDto.isDefault === 'YES' &&
        existingDropdown.isDefault !== 'YES'
      ) {
        await this.unsetDefaultsForType(
          normalizedDropdownType,
          existingDropdown.languageId
        );
      }

      const updatedDropdown = await this.manageDropdownRepository.updateById(
        existingDropdown.id,
        updateDropdownDto
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

  async delete(
    dropdownType: string,
    publicId: string
  ): Promise<ManageDropdown> {
    try {
      // Validate and normalize dropdown type
      const normalizedDropdownType = this.normalizeDropdownType(dropdownType);
      if (!this.validateDropdownType(normalizedDropdownType)) {
        throw new BadRequestException(`Invalid dropdown type: ${dropdownType}`);
      }

      const existingDropdown = await this.findByPublicId(publicId);

      // Verify dropdown type matches
      if (existingDropdown.dropdownType !== normalizedDropdownType) {
        throw new BadRequestException(
          `Dropdown type mismatch. Expected '${normalizedDropdownType}', found '${existingDropdown.dropdownType}'`
        );
      }

      // Check if this is a default option
      if (existingDropdown.isDefault === 'YES') {
        this.logger.warn(
          `Deleting default dropdown option ${publicId} for type ${normalizedDropdownType}`
        );
      }

      const wasDeleted = await this.manageDropdownRepository.deleteById(
        existingDropdown.id
      );

      if (!wasDeleted) {
        throw new Error('Failed to delete dropdown option');
      }

      this.logger.log(
        `Deleted dropdown ${publicId} from type ${normalizedDropdownType}`
      );
      return existingDropdown;
    } catch (error) {
      this.logger.error(
        `Failed to delete dropdown ${publicId} for type ${dropdownType}:`,
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

      // Check for default options if deactivating or deleting
      if (
        bulkOperationDto.action === 'deactivate' ||
        bulkOperationDto.action === 'delete'
      ) {
        const defaultDropdowns = dropdowns.filter(
          (dropdown) => dropdown.isDefault === 'YES'
        );
        if (defaultDropdowns.length > 0) {
          this.logger.warn(
            `Bulk ${bulkOperationDto.action} operation includes ${defaultDropdowns.length} default options`
          );
        }
      }

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

  private async unsetDefaultsForType(
    dropdownType: string,
    languageId: string
  ): Promise<void> {
    try {
      const existingDefaults =
        await this.manageDropdownRepository.findByTypeAndLanguage(
          dropdownType,
          languageId
        );

      const defaultDropdowns = existingDefaults.filter(
        (dropdown) => dropdown.isDefault === 'YES'
      );

      for (const defaultDropdown of defaultDropdowns) {
        await this.manageDropdownRepository.updateById(defaultDropdown.id, {
          isDefault: 'NO',
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to unset defaults for type ${dropdownType}:`,
        error
      );
    }
  }

  private normalizeDropdownType(dropdownType: string): string {
    return dropdownType.toLowerCase().trim();
  }

  private validateDropdownType(dropdownType: string): boolean {
    // Add validation logic for supported dropdown types
    const supportedTypes = ['industry', 'category', 'status', 'type'];
    return supportedTypes.includes(dropdownType);
  }
}
