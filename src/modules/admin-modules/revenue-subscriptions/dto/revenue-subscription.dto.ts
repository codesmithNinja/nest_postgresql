import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export enum SubscriptionTypeEnum {
  INVESTOR = 'INVESTOR',
  SPONSOR = 'SPONSOR',
}

export class CreateRevenueSubscriptionDto {
  @ApiProperty({
    description: 'Revenue subscription type',
    example: SubscriptionTypeEnum.INVESTOR,
    enum: SubscriptionTypeEnum,
    examples: {
      investor: {
        summary: 'Investor Subscription',
        description: 'Subscription plan for investors',
        value: SubscriptionTypeEnum.INVESTOR,
      },
      sponsor: {
        summary: 'Sponsor Subscription',
        description: 'Subscription plan for sponsors',
        value: SubscriptionTypeEnum.SPONSOR,
      },
    },
  })
  @IsNotEmpty()
  @IsEnum(SubscriptionTypeEnum, {
    message: 'Subscription type must be either INVESTOR or SPONSOR',
  })
  subscriptionType!: SubscriptionTypeEnum;

  @ApiProperty({
    description: 'Subscription amount in USD',
    example: 299.99,
    minimum: 0.01,
    maximum: 999999.99,
    examples: {
      basic: {
        summary: 'Basic Plan',
        description: 'Basic subscription plan pricing',
        value: 99.99,
      },
      premium: {
        summary: 'Premium Plan',
        description: 'Premium subscription plan pricing',
        value: 299.99,
      },
      enterprise: {
        summary: 'Enterprise Plan',
        description: 'Enterprise subscription plan pricing',
        value: 999.99,
      },
    },
  })
  @IsNotEmpty()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must have at most 2 decimal places' }
  )
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(999999.99, { message: 'Amount cannot exceed 999,999.99' })
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Maximum investment allowed for INVESTOR subscriptions',
    example: 50000,
    minimum: 1,
    maximum: 99999999.99,
  })
  @ValidateIf(
    (obj: CreateRevenueSubscriptionDto) =>
      obj.subscriptionType === SubscriptionTypeEnum.INVESTOR
  )
  @IsNotEmpty({
    message: 'maxInvestmentAllowed is required for INVESTOR subscriptions',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'maxInvestmentAllowed must have at most 2 decimal places' }
  )
  @Min(1, { message: 'maxInvestmentAllowed must be greater than 0' })
  @Max(99999999.99, {
    message: 'maxInvestmentAllowed cannot exceed 99,999,999.99',
  })
  @Type(() => Number)
  maxInvestmentAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of projects allowed for SPONSOR subscriptions',
    example: 5,
    minimum: 1,
    maximum: 1000,
  })
  @ValidateIf(
    (obj: CreateRevenueSubscriptionDto) =>
      obj.subscriptionType === SubscriptionTypeEnum.SPONSOR
  )
  @IsNotEmpty({
    message: 'maxProjectAllowed is required for SPONSOR subscriptions',
  })
  @IsNumber({}, { message: 'maxProjectAllowed must be a number' })
  @Min(1, { message: 'maxProjectAllowed must be greater than 0' })
  @Max(1000, { message: 'maxProjectAllowed cannot exceed 1000' })
  @Type(() => Number)
  maxProjectAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum project goal limit for SPONSOR subscriptions',
    example: 1000000,
    minimum: 1,
    maximum: 99999999.99,
  })
  @ValidateIf(
    (obj: CreateRevenueSubscriptionDto) =>
      obj.subscriptionType === SubscriptionTypeEnum.SPONSOR
  )
  @IsNotEmpty({
    message: 'maxProjectGoalLimit is required for SPONSOR subscriptions',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'maxProjectGoalLimit must have at most 2 decimal places' }
  )
  @Min(1, { message: 'maxProjectGoalLimit must be greater than 0' })
  @Max(99999999.99, {
    message: 'maxProjectGoalLimit cannot exceed 99,999,999.99',
  })
  @Type(() => Number)
  maxProjectGoalLimit?: number;

  @ApiPropertyOptional({
    description: 'Whether refunds are allowed',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  allowRefund?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Number of days refunds are allowed (required if allowRefund is true)',
    example: 30,
    minimum: 1,
    maximum: 365,
  })
  @ValidateIf((obj: CreateRevenueSubscriptionDto) => obj.allowRefund === true)
  @IsNotEmpty({
    message: 'allowRefundDays is required when allowRefund is true',
  })
  @IsNumber({}, { message: 'allowRefundDays must be a number' })
  @Min(1, { message: 'allowRefundDays must be at least 1 day' })
  @Max(365, { message: 'allowRefundDays cannot exceed 365 days' })
  @Type(() => Number)
  allowRefundDays?: number;

  @ApiPropertyOptional({
    description: 'Whether cancellation is allowed',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  allowCancel?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Number of days cancellation is allowed (required if allowCancel is true)',
    example: 7,
    minimum: 1,
    maximum: 365,
  })
  @ValidateIf((obj: CreateRevenueSubscriptionDto) => obj.allowCancel === true)
  @IsNotEmpty({
    message: 'allowCancelDays is required when allowCancel is true',
  })
  @IsNumber({}, { message: 'allowCancelDays must be a number' })
  @Min(1, { message: 'allowCancelDays must be at least 1 day' })
  @Max(365, { message: 'allowCancelDays cannot exceed 365 days' })
  @Type(() => Number)
  allowCancelDays?: number;

  @ApiPropertyOptional({
    description: 'Access to secondary market for INVESTOR subscriptions',
    example: true,
  })
  @ValidateIf(
    (obj: CreateRevenueSubscriptionDto) =>
      obj.subscriptionType === SubscriptionTypeEnum.INVESTOR
  )
  @IsNotEmpty({
    message: 'secondaryMarketAccess is required for INVESTOR subscriptions',
  })
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  secondaryMarketAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Early bird access to opportunities',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  earlyBirdAccess?: boolean = true;

  @ApiPropertyOptional({
    description: 'Revenue subscription status (active/inactive)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Language ID for the content (optional, defaults to default language)',
    example: '{{ENGLISH_LANG_ID}}',
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiProperty({
    description: 'Revenue subscription title',
    example: 'Premium Investor Plan',
    minLength: 1,
    maxLength: 200,
    examples: {
      investor: {
        summary: 'Investor Plan Title',
        description: 'Title for investor subscription',
        value: 'Premium Investor Plan',
      },
      sponsor: {
        summary: 'Sponsor Plan Title',
        description: 'Title for sponsor subscription',
        value: 'Enterprise Sponsor Plan',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Revenue subscription description',
    example:
      'Access to premium investment opportunities with enhanced features and priority support.',
    minLength: 1,
    maxLength: 2000,
    examples: {
      investor: {
        summary: 'Investor Plan Description',
        description: 'Description for investor subscription',
        value:
          'Access to premium investment opportunities with enhanced features and priority support.',
      },
      sponsor: {
        summary: 'Sponsor Plan Description',
        description: 'Description for sponsor subscription',
        value:
          'Comprehensive sponsorship package with maximum project capacity and goal limits.',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;
}

export class UpdateRevenueSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Revenue subscription type',
    example: SubscriptionTypeEnum.INVESTOR,
    enum: SubscriptionTypeEnum,
  })
  @IsOptional()
  @IsEnum(SubscriptionTypeEnum, {
    message: 'Subscription type must be either INVESTOR or SPONSOR',
  })
  subscriptionType?: SubscriptionTypeEnum;

  @ApiPropertyOptional({
    description: 'Subscription amount in USD',
    example: 399.99,
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must have at most 2 decimal places' }
  )
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(999999.99, { message: 'Amount cannot exceed 999,999.99' })
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Maximum investment allowed',
    example: 75000,
    minimum: 1,
    maximum: 99999999.99,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(99999999.99)
  @Type(() => Number)
  maxInvestmentAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of projects allowed',
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  maxProjectAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum project goal limit',
    example: 2000000,
    minimum: 1,
    maximum: 99999999.99,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(99999999.99)
  @Type(() => Number)
  maxProjectGoalLimit?: number;

  @ApiPropertyOptional({
    description: 'Whether refunds are allowed',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  allowRefund?: boolean;

  @ApiPropertyOptional({
    description: 'Number of days refunds are allowed',
    example: 14,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  allowRefundDays?: number;

  @ApiPropertyOptional({
    description: 'Whether cancellation is allowed',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  allowCancel?: boolean;

  @ApiPropertyOptional({
    description: 'Number of days cancellation is allowed',
    example: 3,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  allowCancelDays?: number;

  @ApiPropertyOptional({
    description: 'Access to secondary market',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  secondaryMarketAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Early bird access to opportunities',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  earlyBirdAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Revenue subscription status (active/inactive)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Revenue subscription title',
    example: 'Updated Premium Investor Plan',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Revenue subscription description',
    example: 'Updated description with enhanced features and new benefits.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Language ID for the content (optional, defaults to default language)',
    example: '{{ENGLISH_LANG_ID}}',
  })
  @IsOptional()
  @IsString()
  languageId?: string;
}

export class BulkUpdateRevenueSubscriptionDto {
  @ApiProperty({
    description: 'Array of revenue subscription public IDs to update',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];

  @ApiProperty({
    description: 'Revenue subscription status (active/inactive)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status!: boolean;
}

export class BulkDeleteRevenueSubscriptionDto {
  @ApiProperty({
    description: 'Array of revenue subscription public IDs to delete',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];
}

export class RevenueSubscriptionQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Include inactive revenue subscriptions',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  includeInactive?: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by subscription type',
    example: SubscriptionTypeEnum.INVESTOR,
    enum: SubscriptionTypeEnum,
  })
  @IsOptional()
  @IsEnum(SubscriptionTypeEnum)
  subscriptionType?: SubscriptionTypeEnum;

  @ApiPropertyOptional({
    description:
      'Language ID for filtering content (optional - defaults to default language if not provided)',
    example: 'clm1234567890',
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Language code for response (en, es, fr, ar)',
    example: 'en',
    enum: ['en', 'es', 'fr', 'ar'],
  })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional({
    description: 'Filter by title (partial match)',
    example: 'premium',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Search term for filtering by title or description',
    example: 'premium investment',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (active/inactive)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status?: boolean;
}

export class RevenueSubscriptionResponseDto {
  @ApiProperty({
    description: 'Revenue subscription ID',
    example: 'clm1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Subscription type',
    enum: SubscriptionTypeEnum,
    example: SubscriptionTypeEnum.INVESTOR,
  })
  subscriptionType!: SubscriptionTypeEnum;

  @ApiProperty({
    description: 'Subscription amount',
    example: 299.99,
  })
  amount!: number;

  @ApiPropertyOptional({
    description: 'Maximum investment allowed (INVESTOR only)',
    example: 50000,
  })
  maxInvestmentAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum projects allowed (SPONSOR only)',
    example: 5,
  })
  maxProjectAllowed?: number;

  @ApiPropertyOptional({
    description: 'Maximum project goal limit (SPONSOR only)',
    example: 1000000,
  })
  maxProjectGoalLimit?: number;

  @ApiProperty({
    description: 'Whether refunds are allowed',
    example: true,
  })
  allowRefund!: boolean;

  @ApiPropertyOptional({
    description: 'Number of days refunds are allowed',
    example: 30,
  })
  allowRefundDays?: number;

  @ApiProperty({
    description: 'Whether cancellation is allowed',
    example: true,
  })
  allowCancel!: boolean;

  @ApiPropertyOptional({
    description: 'Number of days cancellation is allowed',
    example: 7,
  })
  allowCancelDays?: number;

  @ApiPropertyOptional({
    description: 'Access to secondary market (INVESTOR only)',
    example: true,
  })
  secondaryMarketAccess?: boolean;

  @ApiProperty({
    description: 'Early bird access to opportunities',
    example: true,
  })
  earlyBirdAccess!: boolean;

  @ApiProperty({
    description: 'Revenue subscription title',
    example: 'Premium Investor Plan',
  })
  title!: string;

  @ApiProperty({
    description: 'Revenue subscription description',
    example:
      'Access to premium investment opportunities with enhanced features.',
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'Language details',
    properties: {
      publicId: { type: 'string' },
      name: { type: 'string' },
    },
  })
  language?: {
    publicId: string;
    name: string;
  };

  @ApiProperty({ description: 'Use count', example: 15 })
  useCount!: number;

  @ApiProperty({ description: 'Revenue subscription status', example: true })
  status!: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

export class PaginatedRevenueSubscriptionResponseDto {
  @ApiProperty({ type: [RevenueSubscriptionResponseDto] })
  data!: RevenueSubscriptionResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 50 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit!: number;
}

export class RevenueSubscriptionListResponseDto {
  @ApiProperty({
    description: 'List of revenue subscriptions',
    type: [RevenueSubscriptionResponseDto],
  })
  revenueSubscriptions!: RevenueSubscriptionResponseDto[];

  @ApiProperty({
    description: 'Total count of revenue subscriptions',
    example: 12,
  })
  count!: number;
}

export class RevenueSubscriptionErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Revenue subscription not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'REVENUE_SUBSCRIPTION_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}

export class BulkOperationRevenueSubscriptionResultDto {
  @ApiProperty({
    description: 'Number of affected records',
    example: 3,
  })
  count!: number;

  @ApiProperty({
    description: 'Success message',
    example: '3 revenue subscriptions updated successfully',
  })
  message!: string;
}

// Error response DTO for API documentation
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Revenue subscription not found',
  })
  message!: string;

  @ApiProperty({ description: 'HTTP status code', example: 404 })
  statusCode!: number;

  @ApiProperty({
    description: 'Error code',
    example: 'REVENUE_SUBSCRIPTION_NOT_FOUND',
  })
  error?: string;
}

// Alias for backwards compatibility with controller
export const AdminRevenueSubscriptionQueryDto = RevenueSubscriptionQueryDto;
