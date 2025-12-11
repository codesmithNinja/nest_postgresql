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
import { CurrenciesService } from './currencies.service';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  BulkUpdateCurrencyDto,
  BulkDeleteCurrencyDto,
  AdminCurrencyQueryDto,
  CurrencyResponseDto,
  CurrencyListResponseDto,
  CurrencyErrorResponseDto,
  PaginatedCurrencyResponseDto,
} from './dto/currencies.dto';
import { Currency } from '../../../database/entities/currency.entity';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import {
  CurrencyNotFoundException,
  CurrencyAlreadyExistsException,
  CurrencyInUseException,
} from './exceptions/currencies.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Currency Management')
@Controller('currencies')
@UseInterceptors(I18nResponseInterceptor)
export class CurrenciesController {
  constructor(
    private readonly currenciesService: CurrenciesService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  private transformToResponseDto(currency: Currency): CurrencyResponseDto {
    return {
      id: currency.id,
      publicId: currency.publicId,
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      status: currency.status,
      useCount: currency.useCount,
      createdAt: currency.createdAt,
      updatedAt: currency.updatedAt,
    };
  }

  @Get('front')
  @Public()
  @ApiOperation({
    summary: 'Get active currencies (Public)',
    description:
      'Public endpoint to retrieve all active currencies for frontend usage',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currencies retrieved successfully',
    type: CurrencyListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No currencies found',
    type: CurrencyErrorResponseDto,
  })
  async getPublicCurrencies() {
    try {
      const currencies = await this.currenciesService.getPublicCurrencies();

      const response = {
        currencies: currencies.map((currency) =>
          this.transformToResponseDto(currency)
        ),
        count: currencies.length,
      };

      return this.i18nResponse.translateAndRespond(
        'currencies.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch {
      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all currencies (Admin)',
    description:
      'Admin endpoint to retrieve all currencies with pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive currencies',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currencies retrieved successfully',
    type: PaginatedCurrencyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getAdminCurrencies(@Query() adminQueryDto: AdminCurrencyQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        includeInactive = true,
        search,
      } = adminQueryDto;

      const result = await this.currenciesService.getCurrenciesForAdmin(
        page,
        limit,
        includeInactive,
        search
      );

      const response = {
        data: result.data.map((currency) =>
          this.transformToResponseDto(currency)
        ),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };

      return this.i18nResponse.translateAndRespond(
        'currencies.retrieved_successfully',
        HttpStatus.OK,
        response
      );
    } catch {
      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new currency',
    description: 'Create a new currency. Admin authentication required.',
  })
  @ApiBody({ type: CreateCurrencyDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Currency created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: { $ref: '#/components/schemas/CurrencyResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Currency with this name or code already exists',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async createCurrency(@Body() createCurrencyDto: CreateCurrencyDto) {
    try {
      const currency =
        await this.currenciesService.createCurrency(createCurrencyDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.created_successfully',
        HttpStatus.CREATED,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      if (error instanceof CurrencyAlreadyExistsException) {
        return this.i18nResponse.translateError(
          'currencies.already_exists',
          HttpStatus.CONFLICT
        );
      }

      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch('bulk-update')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk update currency status',
    description:
      'Admin endpoint to update status of multiple currencies at once',
  })
  @ApiBody({ type: BulkUpdateCurrencyDto })
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
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkUpdateCurrencies(@Body() bulkUpdateDto: BulkUpdateCurrencyDto) {
    try {
      const result =
        await this.currenciesService.bulkUpdateCurrencies(bulkUpdateDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.bulk_update_success',
        HttpStatus.OK,
        result
      );
    } catch {
      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch('bulk-delete')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk delete currencies',
    description:
      'Admin endpoint to delete multiple currencies at once (only if useCount is 0 for each)',
  })
  @ApiBody({ type: BulkDeleteCurrencyDto })
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
    description: 'One or more currencies are in use (useCount > 0)',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkDeleteCurrencies(@Body() bulkDeleteDto: BulkDeleteCurrencyDto) {
    try {
      const result =
        await this.currenciesService.bulkDeleteCurrencies(bulkDeleteDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.bulk_delete_success',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      if (error instanceof CurrencyInUseException) {
        return this.i18nResponse.translateError(
          'currencies.operation_failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get currency by public ID',
    description:
      'Admin endpoint to retrieve a specific currency by its public ID',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Currency public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currency retrieved successfully',
    type: CurrencyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Currency not found',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getCurrencyByPublicId(@Param('publicId') publicId: string) {
    try {
      const currency =
        await this.currenciesService.getCurrencyByPublicId(publicId);

      return this.i18nResponse.translateAndRespond(
        'currencies.retrieved_successfully',
        HttpStatus.OK,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      if (error instanceof CurrencyNotFoundException) {
        return this.i18nResponse.translateError(
          'currencies.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update currency',
    description: 'Update an existing currency. Admin authentication required.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Currency public ID',
    example: 'clm1234567890',
  })
  @ApiBody({ type: UpdateCurrencyDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currency updated successfully',
    type: CurrencyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Currency not found',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Currency with this name or code already exists',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async updateCurrency(
    @Param('publicId') publicId: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto
  ) {
    try {
      const currency = await this.currenciesService.updateCurrency(
        publicId,
        updateCurrencyDto
      );

      return this.i18nResponse.translateAndRespond(
        'currencies.updated_successfully',
        HttpStatus.OK,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      if (error instanceof CurrencyNotFoundException) {
        return this.i18nResponse.translateError(
          'currencies.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof CurrencyAlreadyExistsException) {
        return this.i18nResponse.translateError(
          'currencies.already_exists',
          HttpStatus.CONFLICT
        );
      }

      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete currency',
    description: 'Admin endpoint to delete a currency (only if useCount is 0)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Currency public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currency deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Currency not found',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Currency is in use (useCount > 0)',
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async deleteCurrency(@Param('publicId') publicId: string) {
    try {
      const success = await this.currenciesService.deleteCurrency(publicId);

      return this.i18nResponse.translateAndRespond(
        'currencies.deleted_successfully',
        HttpStatus.OK,
        { deleted: success }
      );
    } catch (error) {
      if (error instanceof CurrencyNotFoundException) {
        return this.i18nResponse.translateError(
          'currencies.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof CurrencyInUseException) {
        return this.i18nResponse.translateError(
          'currencies.operation_failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'currencies.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
