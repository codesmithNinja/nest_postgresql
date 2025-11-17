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
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { RevenueSubscriptionsService } from './revenue-subscriptions.service';
import {
  CreateRevenueSubscriptionDto,
  UpdateRevenueSubscriptionDto,
  RevenueSubscriptionQueryDto,
  BulkUpdateRevenueSubscriptionDto,
  BulkDeleteRevenueSubscriptionDto,
  RevenueSubscriptionResponseDto,
  RevenueSubscriptionListResponseDto,
  ErrorResponseDto,
} from './dto/revenue-subscription.dto';

@ApiTags('Revenue Subscriptions')
@Controller('revenue-subscriptions')
@UsePipes(new ValidationPipe({ transform: true }))
export class RevenueSubscriptionsController {
  constructor(
    private readonly revenueSubscriptionsService: RevenueSubscriptionsService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Public()
  @Get('front')
  @ApiOperation({
    summary: 'Get active revenue subscriptions for frontend',
    description:
      'Public endpoint to retrieve all active revenue subscriptions with language-specific content',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscriptions retrieved successfully',
    type: [RevenueSubscriptionResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async getActiveRevenueSubscriptions(
    @Query('languageId') languageId?: string
  ) {
    try {
      const subscriptions =
        await this.revenueSubscriptionsService.getActiveRevenueSubscriptions(
          languageId
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.retrieved_successfully',
        HttpStatus.OK,
        subscriptions
      );
    } catch {
      return this.i18nResponse.translateError(
        'revenue_subscriptions.retrieval_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all revenue subscriptions (Admin)',
    description:
      'Admin endpoint to retrieve all revenue subscriptions with pagination and filters',
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
    name: 'search',
    required: false,
    description: 'Search term for title or description',
    example: 'premium',
  })
  @ApiQuery({
    name: 'subscriptionType',
    required: false,
    description: 'Filter by subscription type',
    enum: ['INVESTOR', 'SPONSOR'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscriptions retrieved successfully',
    type: RevenueSubscriptionListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async getAllRevenueSubscriptions(
    @Query() queryDto: RevenueSubscriptionQueryDto,
    @Query('languageId') languageId?: string
  ) {
    try {
      const result =
        await this.revenueSubscriptionsService.getAllRevenueSubscriptions(
          queryDto,
          languageId
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch {
      return this.i18nResponse.translateError(
        'revenue_subscriptions.retrieval_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Get(':publicId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get revenue subscription by ID (Admin)',
    description:
      'Admin endpoint to retrieve a specific revenue subscription by public ID',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Revenue subscription public ID',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscription retrieved successfully',
    type: RevenueSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue subscription not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async getRevenueSubscriptionById(
    @Param('publicId') publicId: string,
    @Query('languageId') languageId?: string
  ) {
    try {
      const subscription =
        await this.revenueSubscriptionsService.getRevenueSubscriptionById(
          publicId,
          languageId
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.retrieved_successfully',
        HttpStatus.OK,
        subscription
      );
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.not_found',
          HttpStatus.NOT_FOUND
        );
      }
      return this.i18nResponse.translateError(
        'revenue_subscriptions.retrieval_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create revenue subscription (Admin)',
    description:
      'Admin endpoint to create a new revenue subscription with multi-language content',
  })
  @ApiBody({
    type: CreateRevenueSubscriptionDto,
    description: 'Revenue subscription creation data',
    examples: {
      investor: {
        summary: 'Investor Subscription Example',
        value: {
          subscriptionType: 'INVESTOR',
          amount: 299.99,
          maxInvestmentAllowed: 50000,
          allowRefund: true,
          allowRefundDays: 30,
          allowCancel: true,
          allowCancelDays: 7,
          secondaryMarketAccess: true,
          earlyBirdAccess: true,
          status: true,
          languageId: 'lang-id-en',
          title: 'Premium Investor Plan',
          description:
            'Access to premium investment opportunities with enhanced features and priority support.',
        },
      },
      sponsor: {
        summary: 'Sponsor Subscription Example',
        value: {
          subscriptionType: 'SPONSOR',
          amount: 499.99,
          maxProjectAllowed: 5,
          maxProjectGoalLimit: 1000000,
          allowRefund: false,
          allowCancel: true,
          allowCancelDays: 14,
          earlyBirdAccess: true,
          status: true,
          languageId: 'lang-id-en',
          title: 'Enterprise Sponsor Package',
          description:
            'Comprehensive sponsorship package with maximum project capacity and goal limits.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Revenue subscription created successfully',
    type: RevenueSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Revenue subscription already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async createRevenueSubscription(
    @Body() createDto: CreateRevenueSubscriptionDto
  ) {
    try {
      const subscription =
        await this.revenueSubscriptionsService.createRevenueSubscription(
          createDto
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.created_successfully',
        HttpStatus.CREATED,
        subscription
      );
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.already_exists',
          HttpStatus.CONFLICT
        );
      }
      if ((error as Error).message.includes('validation')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.validation_failed',
          HttpStatus.BAD_REQUEST
        );
      }
      console.log(error);
      return this.i18nResponse.translateError(
        'revenue_subscriptions.creation_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Patch(':publicId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update revenue subscription (Admin)',
    description:
      'Admin endpoint to update a revenue subscription with optional multi-language content',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Revenue subscription public ID',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description:
      'Language ID for filtering (optional - defaults to default language). Can be language publicId or _id.',
    example: 'clm1234567890',
  })
  @ApiBody({
    type: UpdateRevenueSubscriptionDto,
    description: 'Revenue subscription update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscription updated successfully',
    type: RevenueSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue subscription not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async updateRevenueSubscription(
    @Param('publicId') publicId: string,
    @Body() updateDto: UpdateRevenueSubscriptionDto,
    @Query('languageId') languageId?: string
  ) {
    try {
      const subscription =
        await this.revenueSubscriptionsService.updateRevenueSubscription(
          publicId,
          updateDto,
          undefined,
          languageId
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.updated_successfully',
        HttpStatus.OK,
        subscription
      );
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.not_found',
          HttpStatus.NOT_FOUND
        );
      }
      if ((error as Error).message.includes('validation')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.validation_failed',
          HttpStatus.BAD_REQUEST
        );
      }
      return this.i18nResponse.translateError(
        'revenue_subscriptions.update_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Delete(':publicId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete revenue subscription (Admin)',
    description:
      'Admin endpoint to delete a revenue subscription (only if useCount is 0)',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Revenue subscription public ID',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscription deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Revenue subscription is in use',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue subscription not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async deleteRevenueSubscription(@Param('publicId') publicId: string) {
    try {
      await this.revenueSubscriptionsService.deleteRevenueSubscription(
        publicId
      );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.deleted_successfully',
        HttpStatus.OK
      );
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.not_found',
          HttpStatus.NOT_FOUND
        );
      }
      if ((error as Error).message.includes('in use')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.in_use',
          HttpStatus.BAD_REQUEST
        );
      }
      return this.i18nResponse.translateError(
        'revenue_subscriptions.deletion_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Patch('bulk-update')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk update revenue subscriptions status (Admin)',
    description:
      'Admin endpoint to update status of multiple revenue subscriptions',
  })
  @ApiBody({
    type: BulkUpdateRevenueSubscriptionDto,
    description: 'Bulk update data',
    examples: {
      example: {
        summary: 'Bulk Update Example',
        value: {
          publicIds: [
            '627a5038-e5be-4135-9569-404d50c836c1',
            'e4113de7-5388-4f24-a58c-a22fb77d00a8',
          ],
          status: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscriptions updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            updated: { type: 'number' },
            failed: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async bulkUpdateRevenueSubscriptions(
    @Body() bulkUpdateDto: BulkUpdateRevenueSubscriptionDto
  ) {
    try {
      const result =
        await this.revenueSubscriptionsService.bulkUpdateRevenueSubscriptions(
          bulkUpdateDto
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.bulk_updated_successfully',
        HttpStatus.OK,
        result
      );
    } catch {
      return this.i18nResponse.translateError(
        'revenue_subscriptions.bulk_update_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AdminJwtUserGuard)
  @Patch('bulk-delete')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk delete revenue subscriptions (Admin)',
    description:
      'Admin endpoint to delete multiple revenue subscriptions (only if useCount is 0)',
  })
  @ApiBody({
    type: BulkDeleteRevenueSubscriptionDto,
    description: 'Bulk delete data',
    examples: {
      example: {
        summary: 'Bulk Delete Example',
        value: {
          publicIds: [
            '627a5038-e5be-4135-9569-404d50c836c1',
            'e4113de7-5388-4f24-a58c-a22fb77d00a8',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue subscriptions deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'number' },
            failed: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (some subscriptions in use)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async bulkDeleteRevenueSubscriptions(
    @Body() bulkDeleteDto: BulkDeleteRevenueSubscriptionDto
  ) {
    try {
      const result =
        await this.revenueSubscriptionsService.bulkDeleteRevenueSubscriptions(
          bulkDeleteDto
        );

      return this.i18nResponse.translateAndRespond(
        'revenue_subscriptions.bulk_deleted_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      if ((error as Error).message.includes('in use')) {
        return this.i18nResponse.translateError(
          'revenue_subscriptions.some_in_use',
          HttpStatus.BAD_REQUEST
        );
      }
      return this.i18nResponse.translateError(
        'revenue_subscriptions.bulk_delete_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
