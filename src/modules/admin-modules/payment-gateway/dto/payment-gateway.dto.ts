import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  Length,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaymentMode } from '../../../../database/entities/payment-gateway.entity';

export class CreatePaymentGatewayDto {
  @ApiProperty({
    description: 'Payment gateway title',
    example: 'Stripe Payment Gateway',
    minLength: 1,
    maxLength: 100,
    examples: {
      stripe: {
        summary: 'Stripe Gateway',
        description: 'Example for Stripe payment gateway',
        value: 'Stripe Payment Gateway',
      },
      paypal: {
        summary: 'PayPal Gateway',
        description: 'Example for PayPal payment gateway',
        value: 'PayPal Payment Gateway',
      },
      razorpay: {
        summary: 'Razorpay Gateway',
        description: 'Example for Razorpay payment gateway',
        value: 'Razorpay Payment Gateway',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Payment mode (sandbox or live)',
    example: 'sandbox',
    enum: PaymentMode,
    examples: {
      sandbox: {
        summary: 'Sandbox Mode',
        description: 'For testing purposes',
        value: 'sandbox',
      },
      live: {
        summary: 'Live Mode',
        description: 'For production use',
        value: 'live',
      },
    },
  })
  @IsNotEmpty()
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiProperty({
    description: 'Sandbox configuration details (key-value pairs)',
    example: {
      apiKey: 'pk_test_...',
      secretKey: 'sk_test_...',
      webhookSecret: 'whsec_...',
    },
    type: 'object',
    additionalProperties: true,
    examples: {
      stripe_sandbox: {
        summary: 'Stripe Sandbox Config',
        description: 'Stripe sandbox configuration',
        value: {
          publishableKey: 'pk_test_51234567890abcdef',
          secretKey: 'sk_test_51234567890abcdef',
          webhookSecret: 'whsec_1234567890abcdef',
        },
      },
      paypal_sandbox: {
        summary: 'PayPal Sandbox Config',
        description: 'PayPal sandbox configuration',
        value: {
          clientId: 'sb-12345-abcdef',
          clientSecret: 'EP1234567890abcdef',
          environment: 'sandbox',
        },
      },
    },
  })
  @IsNotEmpty()
  @IsObject()
  sandboxDetails!: Record<string, unknown>;

  @ApiProperty({
    description: 'Live configuration details (key-value pairs)',
    example: {
      apiKey: 'pk_live_...',
      secretKey: 'sk_live_...',
      webhookSecret: 'whsec_...',
    },
    type: 'object',
    additionalProperties: true,
    examples: {
      stripe_live: {
        summary: 'Stripe Live Config',
        description: 'Stripe live configuration',
        value: {
          publishableKey: 'pk_live_51234567890abcdef',
          secretKey: 'sk_live_51234567890abcdef',
          webhookSecret: 'whsec_1234567890abcdef',
        },
      },
      paypal_live: {
        summary: 'PayPal Live Config',
        description: 'PayPal live configuration',
        value: {
          clientId: 'AQ1234567890abcdef',
          clientSecret: 'EP1234567890abcdef',
          environment: 'live',
        },
      },
    },
  })
  @IsNotEmpty()
  @IsObject()
  liveDetails!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Set as default payment gateway',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Payment gateway status (active/inactive)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdatePaymentGatewayDto {
  @ApiPropertyOptional({
    description: 'Payment gateway title',
    example: 'Updated Stripe Payment Gateway',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Payment mode (sandbox or live)',
    example: 'live',
    enum: PaymentMode,
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({
    description: 'Sandbox configuration details (key-value pairs)',
    example: {
      apiKey: 'pk_test_updated...',
      secretKey: 'sk_test_updated...',
      webhookSecret: 'whsec_updated...',
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  sandboxDetails?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Live configuration details (key-value pairs)',
    example: {
      apiKey: 'pk_live_updated...',
      secretKey: 'sk_live_updated...',
      webhookSecret: 'whsec_updated...',
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  liveDetails?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Set as default payment gateway',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Payment gateway status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class PaymentSlugParamDto {
  @ApiProperty({
    description: 'Payment gateway slug',
    example: 'stripe',
    examples: {
      stripe: {
        summary: 'Stripe Gateway',
        description: 'Stripe payment gateway slug',
        value: 'stripe',
      },
      paypal: {
        summary: 'PayPal Gateway',
        description: 'PayPal payment gateway slug',
        value: 'paypal',
      },
      razorpay: {
        summary: 'Razorpay Gateway',
        description: 'Razorpay payment gateway slug',
        value: 'razorpay',
      },
    },
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Payment slug must contain only lowercase letters, numbers, underscores, and hyphens',
  })
  @Transform(({ value }: { value: string }) =>
    value ? String(value).toLowerCase().trim() : value
  )
  paymentSlug!: string;
}

export class PaymentGatewayResponseDto {
  @ApiProperty({ description: 'Payment Gateway ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Payment gateway title',
    example: 'Stripe Payment Gateway',
  })
  title!: string;

  @ApiProperty({ description: 'Payment gateway slug', example: 'stripe' })
  paymentSlug!: string;

  @ApiProperty({
    description: 'Payment mode',
    example: 'sandbox',
    enum: PaymentMode,
  })
  paymentMode!: PaymentMode;

  @ApiProperty({
    description: 'Sandbox configuration details',
    example: {
      publishableKey: 'pk_test_...',
      secretKey: '***hidden***',
      webhookSecret: '***hidden***',
    },
    type: 'object',
    additionalProperties: true,
  })
  sandboxDetails!: Record<string, unknown>;

  @ApiProperty({
    description: 'Live configuration details',
    example: {
      publishableKey: 'pk_live_...',
      secretKey: '***hidden***',
      webhookSecret: '***hidden***',
    },
    type: 'object',
    additionalProperties: true,
  })
  liveDetails!: Record<string, unknown>;

  @ApiProperty({ description: 'Default gateway flag', example: false })
  isDefault!: boolean;

  @ApiProperty({ description: 'Payment gateway status', example: true })
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

export class PaymentGatewayPublicResponseDto {
  @ApiProperty({ description: 'Payment Gateway ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Payment gateway title',
    example: 'Stripe Payment Gateway',
  })
  title!: string;

  @ApiProperty({ description: 'Payment gateway slug', example: 'stripe' })
  paymentSlug!: string;

  @ApiProperty({
    description: 'Payment mode',
    example: 'live',
    enum: PaymentMode,
  })
  paymentMode!: PaymentMode;

  @ApiProperty({ description: 'Default gateway flag', example: false })
  isDefault!: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}

export class PaymentGatewayErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Payment gateway not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'PAYMENT_GATEWAY_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}
