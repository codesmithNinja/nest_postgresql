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
  ValidationPipe,
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
import { CurrenciesService } from './currencies.service';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  BulkCurrencyOperationDto,
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
  BulkCurrencyOperationException,
} from './exceptions/currencies.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Currency Management')
@Controller('currencies')
@UseInterceptors(I18nResponseInterceptor)
export class CurrenciesController {
  private readonly logger = new Logger(CurrenciesController.name);

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
      'Retrieve all active currencies without authentication. Used for front-end applications.',
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
      this.logger.log('Fetching public currencies');

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
    } catch (error) {
      this.logger.error(
        'Failed to fetch public currencies',
        (error as Error).stack
      );

      return this.i18nResponse.translateError(
        'currencies.fetch_failed',
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
      'Retrieve all currencies with pagination and admin authentication.',
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
      this.logger.log(
        `Fetching admin currencies - page: ${adminQueryDto.page || 1}, limit: ${
          adminQueryDto.limit || 10
        }`
      );

      const { page = 1, limit = 10, includeInactive = true } = adminQueryDto;

      const result = await this.currenciesService.getCurrenciesForAdmin(
        page,
        limit,
        includeInactive
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
    } catch (error) {
      this.logger.error(
        'Failed to fetch admin currencies',
        (error as Error).stack
      );

      return this.i18nResponse.translateError(
        'currencies.fetch_failed',
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
  async createCurrency(
    @Body(ValidationPipe) createCurrencyDto: CreateCurrencyDto
  ) {
    try {
      this.logger.log(
        `Creating currency: ${createCurrencyDto.name} (${createCurrencyDto.code})`
      );

      const currency =
        await this.currenciesService.createCurrency(createCurrencyDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.created',
        HttpStatus.CREATED,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      this.logger.error('Failed to create currency', (error as Error).stack);

      if (error instanceof CurrencyAlreadyExistsException) {
        return this.i18nResponse.translateError(
          'currencies.already_exists',
          HttpStatus.CONFLICT
        );
      }

      return this.i18nResponse.translateError(
        'currencies.creation_failed',
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
      'Retrieve a specific currency by its public ID. Admin authentication required.',
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
      this.logger.log(`Fetching currency with publicId: ${publicId}`);

      const currency =
        await this.currenciesService.getCurrencyByPublicId(publicId);

      return this.i18nResponse.translateAndRespond(
        'currencies.retrieved_successfully',
        HttpStatus.OK,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch currency ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof CurrencyNotFoundException) {
        return this.i18nResponse.translateError(
          'currencies.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'currencies.fetch_failed',
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
    @Body(ValidationPipe) updateCurrencyDto: UpdateCurrencyDto
  ) {
    try {
      this.logger.log(`Updating currency: ${publicId}`);

      const currency = await this.currenciesService.updateCurrency(
        publicId,
        updateCurrencyDto
      );

      return this.i18nResponse.translateAndRespond(
        'currencies.updated',
        HttpStatus.OK,
        this.transformToResponseDto(currency)
      );
    } catch (error) {
      this.logger.error(
        `Failed to update currency ${publicId}`,
        (error as Error).stack
      );

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
        'currencies.update_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete currency',
    description:
      'Delete a currency by public ID. Admin authentication required. Only allowed if useCount is 0.',
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
      this.logger.log(`Deleting currency: ${publicId}`);

      const success = await this.currenciesService.deleteCurrency(publicId);

      return this.i18nResponse.translateAndRespond(
        'currencies.deleted',
        HttpStatus.OK,
        { deleted: success }
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete currency ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof CurrencyNotFoundException) {
        return this.i18nResponse.translateError(
          'currencies.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof CurrencyInUseException) {
        return this.i18nResponse.translateError(
          'currencies.in_use',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'currencies.deletion_failed',
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
      'Update the status of multiple currencies. Admin authentication required.',
  })
  @ApiBody({ type: BulkCurrencyOperationDto })
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
    type: CurrencyErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async bulkUpdateCurrencies(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    bulkOperationDto: BulkCurrencyOperationDto
  ) {
    try {
      this.logger.log(
        `Bulk ${bulkOperationDto.action} operation on ${bulkOperationDto.publicIds.length} currencies`
      );

      const affectedCount =
        await this.currenciesService.bulkOperation(bulkOperationDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.bulk_operation_success',
        HttpStatus.OK,
        { affectedCount }
      );
    } catch (error) {
      this.logger.error(
        `Failed bulk ${bulkOperationDto.action} operation`,
        (error as Error).stack
      );

      if (error instanceof BulkCurrencyOperationException) {
        return this.i18nResponse.translateError(
          'currencies.bulk_operation_failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'currencies.bulk_operation_failed',
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
      'Delete multiple currencies. Admin authentication required. Only allowed if useCount is 0 for all currencies.',
  })
  @ApiBody({ type: BulkCurrencyOperationDto })
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
  async bulkDeleteCurrencies(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    bulkOperationDto: BulkCurrencyOperationDto
  ) {
    try {
      this.logger.log(
        `Bulk delete operation on ${bulkOperationDto.publicIds.length} currencies`
      );

      // Override action to delete
      const deleteDto: BulkCurrencyOperationDto = {
        ...bulkOperationDto,
        action: 'delete',
      };

      const deletedCount =
        await this.currenciesService.bulkOperation(deleteDto);

      return this.i18nResponse.translateAndRespond(
        'currencies.bulk_delete_success',
        HttpStatus.OK,
        { deletedCount }
      );
    } catch (error) {
      this.logger.error('Failed bulk delete operation', (error as Error).stack);

      if (error instanceof BulkCurrencyOperationException) {
        return this.i18nResponse.translateError(
          'currencies.bulk_delete_failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'currencies.bulk_delete_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
