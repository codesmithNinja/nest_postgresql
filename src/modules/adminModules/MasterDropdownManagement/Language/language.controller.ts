import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { LanguageService } from './language.service';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  LanguageResponseDto,
} from './dto/language.dto';
import { AdminJwtUserGuard } from '../../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../../common/decorators/public.decorator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

@ApiTags('Languages')
@Controller('languages')
@UseGuards(AdminJwtUserGuard)
@ApiBearerAuth()
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new language',
    description:
      'Create a new language with multi-language support. Admin authentication required.',
  })
  @ApiBody({ type: CreateLanguageDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Language created successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Language with code or name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async create(
    @Body(ValidationPipe) createLanguageDto: CreateLanguageDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.create(createLanguageDto);
    return {
      message: 'Language created successfully',
      statusCode: HttpStatus.CREATED,
      data: language as LanguageResponseDto,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all languages',
    description:
      'Retrieve all languages with pagination support. Admin authentication required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Languages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/LanguageResponseDto' },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{
    message: string;
    statusCode: number;
    data: {
      data: LanguageResponseDto[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const result = await this.languageService.findWithPagination(page, limit);
    return {
      message: 'Languages retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        data: result.data as LanguageResponseDto[],
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get('active')
  @Public()
  @ApiOperation({
    summary: 'Get all active languages',
    description:
      'Retrieve all active languages for public use. No authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active languages retrieved successfully',
    type: [LanguageResponseDto],
  })
  async findAllActive(): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto[];
  }> {
    const languages = await this.languageService.findAllActive();
    return {
      message: 'Active languages retrieved successfully',
      statusCode: HttpStatus.OK,
      data: languages as LanguageResponseDto[],
    };
  }

  @Get('default')
  @Public()
  @ApiOperation({
    summary: 'Get default language',
    description: 'Retrieve the default language. No authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default language retrieved successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Default language not found',
  })
  async getDefaultLanguage(): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.getDefaultLanguage();
    return {
      message: 'Default language retrieved successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Get('code/:code')
  @Public()
  @ApiOperation({
    summary: 'Get language by code',
    description:
      'Retrieve a language by its ISO code. No authentication required.',
  })
  @ApiParam({
    name: 'code',
    description: 'Language ISO code (e.g., en, es, fr)',
    example: 'en',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language retrieved successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  async findByCode(@Param('code') code: string): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.findByCode(code);
    return {
      message: 'Language retrieved successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get language by public ID',
    description:
      'Retrieve a language by its public ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Language public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language retrieved successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  async findByPublicId(@Param('publicId') publicId: string): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.findByPublicId(publicId);
    return {
      message: 'Language retrieved successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update language',
    description: 'Update an existing language. Admin authentication required.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Language public ID',
    example: 'clm1234567890',
  })
  @ApiBody({ type: UpdateLanguageDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language updated successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Language with code or name already exists',
  })
  async update(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateLanguageDto: UpdateLanguageDto
  ): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.update(
      publicId,
      updateLanguageDto
    );
    return {
      message: 'Language updated successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Put(':publicId/set-default')
  @ApiOperation({
    summary: 'Set language as default',
    description:
      'Set a language as the default language. Admin authentication required.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Language public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language set as default successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot set inactive language as default',
  })
  async setAsDefault(@Param('publicId') publicId: string): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.setAsDefault(publicId);
    return {
      message: 'Language set as default successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete language',
    description:
      'Soft delete a language (sets status to false). Admin authentication required.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Language public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language deleted successfully',
    type: LanguageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete the default language',
  })
  async delete(@Param('publicId') publicId: string): Promise<{
    message: string;
    statusCode: number;
    data: LanguageResponseDto;
  }> {
    const language = await this.languageService.delete(publicId);
    return {
      message: 'Language deleted successfully',
      statusCode: HttpStatus.OK,
      data: language as LanguageResponseDto,
    };
  }

  @Patch('bulk/status')
  @ApiOperation({
    summary: 'Bulk update language status',
    description:
      'Update status for multiple languages at once. Admin authentication required.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of language public IDs',
          example: ['clm1234567890', 'clm0987654321'],
        },
        status: {
          type: 'boolean',
          description: 'New status for the languages',
          example: true,
        },
      },
      required: ['publicIds', 'status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Languages status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            updatedCount: { type: 'number' },
          },
        },
      },
    },
  })
  async bulkUpdateStatus(
    @Body(ValidationPipe)
    bulkUpdateDto: {
      publicIds: string[];
      status: boolean;
    }
  ): Promise<{
    message: string;
    statusCode: number;
    data: { updatedCount: number };
  }> {
    const updatedCount = await this.languageService.bulkUpdateStatus(
      bulkUpdateDto.publicIds,
      bulkUpdateDto.status
    );
    return {
      message: 'Languages status updated successfully',
      statusCode: HttpStatus.OK,
      data: { updatedCount },
    };
  }
}
