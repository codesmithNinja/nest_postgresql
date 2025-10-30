import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
  UseInterceptors,
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
import { ManageDropdownService } from './manage-dropdown.service';
import {
  CreateManageDropdownDto,
  UpdateManageDropdownDto,
  BulkUpdateManageDropdownDto,
  BulkDeleteManageDropdownDto,
  AdminQueryDto,
  ManageDropdownResponseDto,
  DropdownTypeParamDto,
  ManageDropdownListResponseDto,
  ManageDropdownErrorResponseDto,
} from './dto/manage-dropdown.dto';
import { ManageDropdownWithLanguage } from '../../../database/entities/manage-dropdown.entity';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import {
  ManageDropdownNotFoundException,
  InvalidDropdownTypeException,
} from './exceptions/manage-dropdown.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Master Dropdown Management')
@Controller('manage-dropdown')
@UseInterceptors(I18nResponseInterceptor)
export class ManageDropdownController {
  private readonly logger = new Logger(ManageDropdownController.name);

  constructor(
    private readonly manageDropdownService: ManageDropdownService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  private transformToResponseDto(
    dropdown: ManageDropdownWithLanguage
  ): ManageDropdownResponseDto {
    return {
      id: dropdown.id,
      publicId: dropdown.publicId,
      name: dropdown.name,
      uniqueCode: dropdown.uniqueCode || 0,
      dropdownType: dropdown.dropdownType,
      languageId: dropdown.languageId,
      language: dropdown.language
        ? {
            id: dropdown.language.id || '',
            name: dropdown.language.name || '',
            code: dropdown.language.code || '',
            direction: dropdown.language.direction || 'ltr',
            flag: dropdown.language.flagImage ?? undefined,
          }
        : undefined,
      status: dropdown.status,
      useCount: dropdown.useCount,
      createdAt: dropdown.createdAt,
      updatedAt: dropdown.updatedAt,
    };
  }

  @Get(':dropdownType/front')
  @Public()
  @ApiOperation({
    summary: 'Get dropdown options by dropdown type (Public)',
    description:
      'Retrieve active dropdown options for a specific dropdown type without authentication. Used for front-end applications.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type',
    example: 'industry',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description: 'Language ID for filtering (optional)',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown options retrieved successfully',
    type: ManageDropdownListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid option type',
    type: ManageDropdownErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown options not found',
    type: ManageDropdownErrorResponseDto,
  })
  async getPublicDropdownsByDropdownType(
    @Param() params: DropdownTypeParamDto,
    @Query('languageId') languageId?: string
  ) {
    try {
      this.logger.log(
        `Fetching public dropdowns for dropdown type: ${params.dropdownType}, languageId: ${languageId || 'default'}`
      );

      const dropdowns =
        await this.manageDropdownService.getPublicDropdownsByDropdownType(
          params.dropdownType,
          languageId
        );

      // Increment use count for accessed dropdowns (fire-and-forget)
      /* this.manageDropdownService
          .incrementUseCount(dropdown.publicId) */

      const response = {
        dropdowns: dropdowns.map((dropdown) =>
          this.transformToResponseDto(dropdown)
        ),
        count: dropdowns.length,
      };

      return this.i18nResponse.translateAndRespond(
        'dropdowns.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch public dropdowns for dropdown type: ${params.dropdownType}`,
        (error as Error).stack
      );

      if (error instanceof ManageDropdownNotFoundException) {
        return this.i18nResponse.translateError(
          'dropdowns.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof InvalidDropdownTypeException) {
        return this.i18nResponse.translateError(
          'dropdowns.invalid_option_type',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'dropdowns.fetch_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':dropdownType/admin')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dropdown options by dropdown type (Admin)',
    description:
      'Retrieve all dropdown options for a specific dropdown type with admin authentication.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type',
    example: 'industry',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown options retrieved successfully',
    type: ManageDropdownListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid option type',
    type: ManageDropdownErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown options not found',
    type: ManageDropdownErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getAdminDropdownsByDropdownType(
    @Param() params: DropdownTypeParamDto,
    @Query() adminQueryDto: AdminQueryDto
  ) {
    try {
      this.logger.log(
        `Fetching admin dropdowns for dropdown type: ${params.dropdownType}, languageId: ${adminQueryDto.languageId || 'default'}`
      );

      const {
        page = 1,
        limit = 10,
        includeInactive = true,
        languageId,
      } = adminQueryDto;

      const result =
        await this.manageDropdownService.getDropdownsByDropdownType(
          params.dropdownType,
          page,
          limit,
          includeInactive,
          languageId
        );

      const response = {
        dropdowns: result.data.map((dropdown) =>
          this.transformToResponseDto(dropdown)
        ),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };

      return this.i18nResponse.translateAndRespond(
        'dropdowns.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch admin dropdowns for dropdown type: ${params.dropdownType}`,
        (error as Error).stack
      );

      if (error instanceof ManageDropdownNotFoundException) {
        return this.i18nResponse.translateError(
          'dropdowns.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof InvalidDropdownTypeException) {
        return this.i18nResponse.translateError(
          'dropdowns.invalid_option_type',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'dropdowns.fetch_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':dropdownType')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new dropdown option',
    description: 'Create a new dropdown option. Admin authentication required.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
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
    @Param('dropdownType') dropdownType: string,
    @Body() createDropdownDto: CreateManageDropdownDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown = await this.manageDropdownService.create(
      dropdownType,
      createDropdownDto
    );

    return {
      message: `Dropdown option created successfully`,
      statusCode: HttpStatus.CREATED,
      data: {
        id: dropdown.id,
        publicId: dropdown.publicId,
        name: dropdown.name,
        uniqueCode: dropdown.uniqueCode || 0,
        dropdownType: dropdown.dropdownType,
        languageId: dropdown.languageId,
        status: dropdown.status,
        useCount: dropdown.useCount,
        createdAt: dropdown.createdAt,
        updatedAt: dropdown.updatedAt,
      } as ManageDropdownResponseDto,
    };
  }

  @Patch(':dropdownType/bulk-update')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk update dropdown options status',
    description:
      'Update the status of multiple dropdown options. Admin authentication required.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiBody({ type: BulkUpdateManageDropdownDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed successfully',
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
    description: 'Invalid bulk update parameters',
    type: ManageDropdownErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkUpdateDropdowns(
    @Param('dropdownType') dropdownType: string,
    @Body() bulkUpdateDto: BulkUpdateManageDropdownDto
  ) {
    try {
      this.logger.log(
        `Bulk update operation on ${bulkUpdateDto.publicIds.length} dropdown options for type: ${dropdownType}`
      );

      const result = await this.manageDropdownService.bulkUpdateDropdowns(
        dropdownType,
        bulkUpdateDto
      );

      return this.i18nResponse.translateAndRespond(
        'dropdowns.bulk_update_success',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error('Failed bulk update operation', (error as Error).stack);

      return this.i18nResponse.translateError(
        'dropdowns.bulk_update_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':dropdownType/bulk-delete')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk delete dropdown options',
    description:
      'Delete multiple dropdown options. Admin authentication required. Only allowed if useCount is 0 for all options.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiBody({ type: BulkDeleteManageDropdownDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk delete operation completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            deletedCount: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'One or more dropdown options are in use (useCount > 0)',
    type: ManageDropdownErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkDeleteDropdowns(
    @Param('dropdownType') dropdownType: string,
    @Body() bulkDeleteDto: BulkDeleteManageDropdownDto
  ) {
    try {
      this.logger.log(
        `Bulk delete operation on ${bulkDeleteDto.publicIds.length} dropdown options for type: ${dropdownType}`
      );

      const result = await this.manageDropdownService.bulkDeleteDropdowns(
        dropdownType,
        bulkDeleteDto
      );

      return this.i18nResponse.translateAndRespond(
        'dropdowns.bulk_delete_success',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error('Failed bulk delete operation', (error as Error).stack);

      return this.i18nResponse.translateError(
        'dropdowns.bulk_delete_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':dropdownType/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dropdown option by public ID',
    description:
      'Retrieve a specific dropdown option by its public ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
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
    @Param('dropdownType') dropdownType: string,
    @Param('publicId') publicId: string,
    @Query('languageId') languageId?: string
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown =
      await this.manageDropdownService.findSingleByTypeAndLanguage(
        dropdownType,
        publicId,
        languageId
      );

    return {
      message: 'Dropdown option retrieved successfully',
      statusCode: HttpStatus.OK,
      data: this.transformToResponseDto(dropdown),
    };
  }

  @Patch(':dropdownType/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update dropdown option',
    description:
      'Update an existing dropdown option. Admin authentication required.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
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
    @Param('dropdownType') dropdownType: string,
    @Param('publicId') publicId: string,
    @Body() updateDropdownDto: UpdateManageDropdownDto,
    @Query('languageId') languageId?: string
  ): Promise<{
    message: string;
    statusCode: number;
    data: ManageDropdownResponseDto;
  }> {
    const dropdown = await this.manageDropdownService.update(
      dropdownType,
      publicId,
      updateDropdownDto,
      languageId
    );

    return {
      message: 'Dropdown option updated successfully',
      statusCode: HttpStatus.OK,
      data: {
        id: dropdown.id,
        publicId: dropdown.publicId,
        name: dropdown.name,
        uniqueCode: dropdown.uniqueCode || 0,
        dropdownType: dropdown.dropdownType,
        languageId: dropdown.languageId,
        status: dropdown.status,
        useCount: dropdown.useCount,
        createdAt: dropdown.createdAt,
        updatedAt: dropdown.updatedAt,
      } as ManageDropdownResponseDto,
    };
  }

  @Delete(':dropdownType/:uniqueCode')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete dropdown option by unique code',
    description:
      'Delete all language variants of a dropdown option by unique code. Admin authentication required. Only allowed if useCount is 0.',
  })
  @ApiParam({
    name: 'dropdownType',
    description: 'Dropdown type (e.g., industry, category)',
    example: 'industry',
  })
  @ApiParam({
    name: 'uniqueCode',
    description: 'Unique 10-digit code of the dropdown option',
    example: '1234567890',
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dropdown option deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            deletedCount: { type: 'number' },
            dropdowns: {
              type: 'array',
              items: { $ref: '#/components/schemas/ManageDropdownResponseDto' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dropdown option not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dropdown is in use (useCount > 0)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async deleteDropdownByUniqueCode(
    @Param('dropdownType') dropdownType: string,
    @Param('uniqueCode') uniqueCode: number
  ): Promise<{
    message: string;
    statusCode: number;
    data: {
      deletedCount: number;
      dropdowns: ManageDropdownResponseDto[];
    };
  }> {
    const result = await this.manageDropdownService.deleteByUniqueCode(
      dropdownType,
      Number(uniqueCode)
    );

    return {
      message: 'Dropdown option deleted successfully',
      statusCode: HttpStatus.OK,
      data: {
        deletedCount: result.deletedCount,
        dropdowns: result.dropdowns.map((dropdown) =>
          this.transformToResponseDto(dropdown)
        ),
      },
    };
  }
}
