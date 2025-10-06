import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ManageDropdownService } from './manage-dropdown.service';
import {
  CreateManageDropdownDto,
  UpdateManageDropdownDto,
  BulkOperationDto,
  AdminQueryDto,
  ManageDropdownResponseDto,
  PaginatedManageDropdownResponseDto,
} from './dto/manage-dropdown.dto';
import { AdminJwtUserGuard } from '../../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../../common/decorators/public.decorator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { LanguageDetectionService } from '../utils/language-detection.service';
import { LanguageResponseDto } from '../language/dto/language.dto';

interface RequestWithLanguage extends Request {
  language?: string;
  i18nLang?: string;
  detectedLanguageCode?: string;
}

@ApiTags('Master Dropdown Management')
@Controller('manage-dropdown')
export class ManageDropdownController {
  constructor(
    private readonly manageDropdownService: ManageDropdownService,
    private readonly languageDetectionService: LanguageDetectionService
  ) {}

  private transformToResponseDto(dropdown: any): ManageDropdownResponseDto {
    return {
      id: dropdown.id,
      publicId: dropdown.publicId,
      name: dropdown.name,
      uniqueCode: dropdown.uniqueCode,
      dropdownType: dropdown.dropdownType,
      isDefault: dropdown.isDefault,
      languageId: dropdown.language as LanguageResponseDto,
      status: dropdown.status,
      useCount: dropdown.useCount,
      createdAt: dropdown.createdAt,
      updatedAt: dropdown.updatedAt,
    };
  }

  @Get(':optionType')
  @Public()
  @ApiOperation({
    summary: 'Get dropdown options for public use',
    description:
      'Retrieve active dropdown options by type for public access. No authentication required. Supports language detection from headers.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code for filtering (optional)',
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown options retrieved successfully',
    type: [ManageDropdownResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid dropdown type',
  })
  async getDropdownsForPublic(
    @Param('optionType') optionType: string,
    @Query('lang') languageCode?: string,
    @Req() request?: RequestWithLanguage
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto[];
  }> {
    // Auto-detect language if not provided
    let detectedLanguageCode = languageCode;
    if (!detectedLanguageCode && request) {
      detectedLanguageCode =
        this.languageDetectionService.detectLanguageFromRequest(request);
    }

    // Get regular dropdowns
    const dropdowns = await this.manageDropdownService.findByTypeForPublic(
      optionType,
      detectedLanguageCode
    );

    // Increment use count for accessed dropdowns (fire-and-forget)
    dropdowns.forEach((dropdown) => {
      this.manageDropdownService
        .incrementUseCount(dropdown.publicId)
        .catch(() => {
          // Silently handle errors for use count increment
        });
    });

    return {
      message: 'Dropdown options retrieved successfully',
      statusCode: HttpStatus.OK,
      data: dropdowns.map(dropdown => this.transformToResponseDto(dropdown)),
    };
  }

  @Get(':optionType/admin')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dropdown options for admin',
    description:
      'Retrieve all dropdown options by type for admin use. Admin authentication required. Includes inactive options.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown options retrieved successfully',
    type: PaginatedManageDropdownResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getDropdownsForAdmin(
    @Param('optionType') optionType: string,
    @Query() adminQueryDto: AdminQueryDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: PaginatedManageDropdownResponseDto;
  }> {
    const { page = 1, limit = 10, includeInactive = true, lang } = adminQueryDto;
    const result = await this.manageDropdownService.findByTypeForAdmin(
      optionType,
      page,
      limit,
      includeInactive,
      lang
    );

    return {
      message: 'Dropdown options retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        data: result.data.map(dropdown => this.transformToResponseDto(dropdown)),
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Post(':optionType')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new dropdown option',
    description:
      'Create a new dropdown option. Admin authentication required. Automatically detects language and creates entries for all active languages if languageId not provided.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiBody({ type: CreateManageDropdownDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dropdown option created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ManageDropdownResponseDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dropdown option with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async createDropdown(
    @Param('optionType') optionType: string,
    @Body(ValidationPipe) createDropdownDto: CreateManageDropdownDto,
    @Req() request?: RequestWithLanguage
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto[];
  }> {
    // Auto-detect language for multi-language creation
    let detectedLanguageCode;
    if (request && !createDropdownDto.languageId) {
      detectedLanguageCode =
        this.languageDetectionService.detectLanguageFromRequest(request);
    }

    const dropdowns = await this.manageDropdownService.create(
      optionType,
      createDropdownDto,
      detectedLanguageCode
    );

    return {
      message: `Dropdown option created successfully for ${dropdowns.length} language(s)`,
      statusCode: HttpStatus.CREATED,
      data: dropdowns.map(dropdown => ({
        id: dropdown.id,
        publicId: dropdown.publicId,
        name: dropdown.name,
        uniqueCode: dropdown.uniqueCode,
        dropdownType: dropdown.dropdownType,
        isDefault: dropdown.isDefault,
        languageId: dropdown.languageId as any, // For created dropdowns, we don't have language object populated
        status: dropdown.status,
        useCount: dropdown.useCount,
        createdAt: dropdown.createdAt,
        updatedAt: dropdown.updatedAt,
      } as ManageDropdownResponseDto)),
    };
  }

  @Get(':optionType/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dropdown option by public ID',
    description:
      'Retrieve a specific dropdown option by its public ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Dropdown option public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown option retrieved successfully',
    type: ManageDropdownResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown option not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getDropdownByPublicId(
    @Param('optionType') optionType: string,
    @Param('publicId') publicId: string
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown = await this.manageDropdownService.findByPublicId(publicId);

    return {
      message: 'Dropdown option retrieved successfully',
      statusCode: HttpStatus.OK,
      data: this.transformToResponseDto(dropdown),
    };
  }

  @Patch(':optionType/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update dropdown option',
    description:
      'Update an existing dropdown option. Admin authentication required.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Dropdown option public ID',
    example: 'clm1234567890',
  })
  @ApiBody({ type: UpdateManageDropdownDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown option updated successfully',
    type: ManageDropdownResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown option not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dropdown option with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async updateDropdown(
    @Param('optionType') optionType: string,
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateDropdownDto: UpdateManageDropdownDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown = await this.manageDropdownService.update(
      optionType,
      publicId,
      updateDropdownDto
    );

    return {
      message: 'Dropdown option updated successfully',
      statusCode: HttpStatus.OK,
      data: {
        id: dropdown.id,
        publicId: dropdown.publicId,
        name: dropdown.name,
        uniqueCode: dropdown.uniqueCode,
        dropdownType: dropdown.dropdownType,
        isDefault: dropdown.isDefault,
        languageId: dropdown.languageId as any, // Updated dropdown doesn't have language object populated
        status: dropdown.status,
        useCount: dropdown.useCount,
        createdAt: dropdown.createdAt,
        updatedAt: dropdown.updatedAt,
      } as ManageDropdownResponseDto,
    };
  }

  @Delete(':optionType/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete dropdown option',
    description:
      'Soft delete a dropdown option (sets status to false). Admin authentication required.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Dropdown option public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown option deleted successfully',
    type: ManageDropdownResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown option not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async deleteDropdown(
    @Param('optionType') optionType: string,
    @Param('publicId') publicId: string
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown = await this.manageDropdownService.delete(
      optionType,
      publicId
    );

    return {
      message: 'Dropdown option deleted successfully',
      statusCode: HttpStatus.OK,
      data: {
        id: dropdown.id,
        publicId: dropdown.publicId,
        name: dropdown.name,
        uniqueCode: dropdown.uniqueCode,
        dropdownType: dropdown.dropdownType,
        isDefault: dropdown.isDefault,
        languageId: dropdown.languageId as any, // Deleted dropdown doesn't have language object populated
        status: dropdown.status,
        useCount: dropdown.useCount,
        createdAt: dropdown.createdAt,
        updatedAt: dropdown.updatedAt,
      } as ManageDropdownResponseDto,
    };
  }

  @Patch(':optionType/bulk')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk operations on dropdown options',
    description:
      'Perform bulk operations (activate, deactivate, delete) on multiple dropdown options. Admin authentication required.',
  })
  @ApiParam({
    name: 'optionType',
    description: 'Dropdown option type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiBody({ type: BulkOperationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            affectedCount: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk operation parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkOperation(
    @Param('optionType') optionType: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) bulkOperationDto: BulkOperationDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: { affectedCount: number };
  }> {
    const affectedCount = await this.manageDropdownService.bulkOperation(
      optionType,
      bulkOperationDto
    );

    return {
      message: `Bulk ${bulkOperationDto.action} operation completed successfully`,
      statusCode: HttpStatus.OK,
      data: { affectedCount },
    };
  }
}
