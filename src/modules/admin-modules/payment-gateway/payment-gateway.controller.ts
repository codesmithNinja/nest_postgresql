import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentGatewayService } from './payment-gateway.service';
import {
  CreatePaymentGatewayDto,
  UpdatePaymentGatewayDto,
  PaymentSlugParamDto,
  PaymentGatewayResponseDto,
  PaymentGatewayPublicResponseDto,
  PaymentGatewayErrorResponseDto,
} from './dto/payment-gateway.dto';
import { PaymentGateway } from '../../../database/entities/payment-gateway.entity';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import {
  PaymentGatewayNotFoundException,
  PaymentGatewayAlreadyExistsException,
  PaymentGatewayConfigurationException,
  InvalidPaymentSlugException,
} from './exceptions/payment-gateway.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Payment Gateway Management')
@Controller('payment-gateway')
@UseInterceptors(I18nResponseInterceptor)
export class PaymentGatewayController {
  private readonly logger = new Logger(PaymentGatewayController.name);

  constructor(
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  private transformToPublicResponseDto(
    paymentGateway: PaymentGateway
  ): PaymentGatewayPublicResponseDto {
    return {
      id: paymentGateway.id,
      publicId: paymentGateway.publicId,
      title: paymentGateway.title,
      paymentSlug: paymentGateway.paymentSlug,
      paymentMode: paymentGateway.paymentMode,
      isDefault: paymentGateway.isDefault,
      createdAt: paymentGateway.createdAt,
    };
  }

  private transformToAdminResponseDto(
    paymentGateway: PaymentGateway
  ): PaymentGatewayResponseDto {
    return {
      id: paymentGateway.id,
      publicId: paymentGateway.publicId,
      title: paymentGateway.title,
      paymentSlug: paymentGateway.paymentSlug,
      paymentMode: paymentGateway.paymentMode,
      sandboxDetails: paymentGateway.sandboxDetails,
      liveDetails: paymentGateway.liveDetails,
      isDefault: paymentGateway.isDefault,
      status: paymentGateway.status,
      createdAt: paymentGateway.createdAt,
      updatedAt: paymentGateway.updatedAt,
    };
  }

  @Get(':paymentSlug')
  @Public()
  @ApiOperation({
    summary: 'Get payment gateway by slug (Public)',
    description:
      'Public endpoint to retrieve an active payment gateway by its slug. Returns basic information without sensitive configuration details.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug',
    example: 'stripe',
    examples: {
      stripe: {
        summary: 'Stripe Gateway',
        description: 'Get Stripe payment gateway',
        value: 'stripe',
      },
      paypal: {
        summary: 'PayPal Gateway',
        description: 'Get PayPal payment gateway',
        value: 'paypal',
      },
      razorpay: {
        summary: 'Razorpay Gateway',
        description: 'Get Razorpay payment gateway',
        value: 'razorpay',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway retrieved successfully',
    type: PaymentGatewayPublicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment gateway not found',
    type: PaymentGatewayErrorResponseDto,
  })
  async getPublicPaymentGateway(@Param() params: PaymentSlugParamDto) {
    try {
      this.logger.log(`Fetching public payment gateway: ${params.paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayService.getPublicPaymentGateway(
          params.paymentSlug
        );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.retrieved_successfully',
        HttpStatus.OK,
        this.transformToPublicResponseDto(paymentGateway)
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch public payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayNotFoundException) {
        return this.i18nResponse.translateError(
          'payment_gateway.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':paymentSlug/admin')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment gateway by slug (Admin)',
    description:
      'Admin endpoint to retrieve a payment gateway by its slug. Returns complete information including configuration details.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug',
    example: 'stripe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway retrieved successfully',
    type: PaymentGatewayResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment gateway not found',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async getAdminPaymentGateway(@Param() params: PaymentSlugParamDto) {
    try {
      this.logger.log(`Fetching admin payment gateway: ${params.paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayService.getAdminPaymentGateway(
          params.paymentSlug
        );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.retrieved_successfully',
        HttpStatus.OK,
        this.transformToAdminResponseDto(paymentGateway)
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch admin payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayNotFoundException) {
        return this.i18nResponse.translateError(
          'payment_gateway.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':paymentSlug')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new payment gateway',
    description:
      'Create a new payment gateway with the specified slug. Admin authentication required.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug (must be unique)',
    example: 'stripe',
  })
  @ApiBody({ type: CreatePaymentGatewayDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment gateway created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: { $ref: '#/components/schemas/PaymentGatewayResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Payment gateway with this slug already exists',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment gateway configuration or slug format',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async createPaymentGateway(
    @Param() params: PaymentSlugParamDto,
    @Body() createPaymentGatewayDto: CreatePaymentGatewayDto
  ) {
    try {
      this.logger.log(`Creating payment gateway: ${params.paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayService.createPaymentGateway(
          params.paymentSlug,
          createPaymentGatewayDto
        );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.created_successfully',
        HttpStatus.CREATED,
        this.transformToAdminResponseDto(paymentGateway)
      );
    } catch (error) {
      this.logger.error(
        `Failed to create payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayAlreadyExistsException) {
        return this.i18nResponse.translateError(
          'payment_gateway.already_exists',
          HttpStatus.CONFLICT
        );
      }

      if (
        error instanceof InvalidPaymentSlugException ||
        error instanceof PaymentGatewayConfigurationException
      ) {
        return this.i18nResponse.translateError(
          'payment_gateway.invalid_configuration',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':paymentSlug')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update payment gateway',
    description:
      'Update an existing payment gateway by its slug. Admin authentication required.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug',
    example: 'stripe',
  })
  @ApiBody({ type: UpdatePaymentGatewayDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway updated successfully',
    type: PaymentGatewayResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment gateway not found',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment gateway configuration',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async updatePaymentGateway(
    @Param() params: PaymentSlugParamDto,
    @Body() updatePaymentGatewayDto: UpdatePaymentGatewayDto
  ) {
    try {
      this.logger.log(`Updating payment gateway: ${params.paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayService.updatePaymentGateway(
          params.paymentSlug,
          updatePaymentGatewayDto
        );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.updated_successfully',
        HttpStatus.OK,
        this.transformToAdminResponseDto(paymentGateway)
      );
    } catch (error) {
      this.logger.error(
        `Failed to update payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayNotFoundException) {
        return this.i18nResponse.translateError(
          'payment_gateway.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      if (error instanceof PaymentGatewayConfigurationException) {
        return this.i18nResponse.translateError(
          'payment_gateway.invalid_configuration',
          HttpStatus.BAD_REQUEST
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':paymentSlug/:publicId')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete payment gateway',
    description:
      'Delete a payment gateway by its slug and public ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug',
    example: 'stripe',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Payment gateway public ID',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway deleted successfully',
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
    description: 'Payment gateway not found',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async deletePaymentGateway(
    @Param() params: PaymentSlugParamDto,
    @Param('publicId') publicId: string
  ) {
    try {
      this.logger.log(
        `Deleting payment gateway: ${params.paymentSlug} with publicId: ${publicId}`
      );

      const success = await this.paymentGatewayService.deletePaymentGateway(
        params.paymentSlug,
        publicId
      );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.deleted_successfully',
        HttpStatus.OK,
        { deleted: success }
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayNotFoundException) {
        return this.i18nResponse.translateError(
          'payment_gateway.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':paymentSlug/set-default')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set as default payment gateway',
    description:
      'Set the specified payment gateway as the default one. Admin authentication required.',
  })
  @ApiParam({
    name: 'paymentSlug',
    description: 'Payment gateway slug',
    example: 'stripe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default payment gateway updated successfully',
    type: PaymentGatewayResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment gateway not found',
    type: PaymentGatewayErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Admin authentication required',
  })
  async setDefaultPaymentGateway(@Param() params: PaymentSlugParamDto) {
    try {
      this.logger.log(`Setting default payment gateway: ${params.paymentSlug}`);

      const paymentGateway =
        await this.paymentGatewayService.setDefaultPaymentGateway(
          params.paymentSlug
        );

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.default_set_successfully',
        HttpStatus.OK,
        this.transformToAdminResponseDto(paymentGateway)
      );
    } catch (error) {
      this.logger.error(
        `Failed to set default payment gateway: ${params.paymentSlug}`,
        (error as Error).stack
      );

      if (error instanceof PaymentGatewayNotFoundException) {
        return this.i18nResponse.translateError(
          'payment_gateway.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('admin/cache/stats')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get cache statistics',
    description:
      'Get cache statistics for payment gateway service. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            keys: { type: 'number' },
            hits: { type: 'number' },
            misses: { type: 'number' },
          },
        },
      },
    },
  })
  getCacheStats() {
    try {
      const stats = this.paymentGatewayService.getCacheStats();

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.cache_stats_retrieved',
        HttpStatus.OK,
        stats
      );
    } catch (error) {
      this.logger.error(
        'Failed to get cache statistics',
        (error as Error).stack
      );

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('admin/cache/clear')
  @UseGuards(AdminJwtUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear cache',
    description:
      'Clear all payment gateway cache. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            cleared: { type: 'boolean' },
          },
        },
      },
    },
  })
  clearCache() {
    try {
      this.paymentGatewayService.clearCache();

      return this.i18nResponse.translateAndRespond(
        'payment_gateway.cache_cleared',
        HttpStatus.OK,
        { cleared: true }
      );
    } catch (error) {
      this.logger.error('Failed to clear cache', (error as Error).stack);

      return this.i18nResponse.translateError(
        'payment_gateway.operation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
