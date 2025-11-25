import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentGatewayNotFoundException extends HttpException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Payment gateway with identifier '${identifier}' not found`
      : 'Payment gateway not found';
    super(
      {
        message,
        error: 'Payment Gateway Not Found',
        statusCode: HttpStatus.NOT_FOUND,
        code: 'PAYMENT_GATEWAY_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class PaymentGatewayAlreadyExistsException extends HttpException {
  constructor(paymentSlug: string) {
    super(
      {
        message: `Payment gateway with slug '${paymentSlug}' already exists`,
        error: 'Payment Gateway Already Exists',
        statusCode: HttpStatus.CONFLICT,
        code: 'PAYMENT_GATEWAY_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT
    );
  }
}

export class InvalidPaymentSlugException extends HttpException {
  constructor(slug: string) {
    super(
      {
        message: `Invalid payment slug format: '${slug}'. Must contain only lowercase letters, numbers, underscores, and hyphens`,
        error: 'Invalid Payment Slug',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_PAYMENT_SLUG',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidPaymentModeException extends HttpException {
  constructor(mode: string) {
    super(
      {
        message: `Invalid payment mode: '${mode}'. Must be either 'sandbox' or 'live'`,
        error: 'Invalid Payment Mode',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_PAYMENT_MODE',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class PaymentGatewayConfigurationException extends HttpException {
  constructor(field: string, reason?: string) {
    const message = reason
      ? `Invalid payment gateway configuration for '${field}': ${reason}`
      : `Invalid payment gateway configuration for '${field}'`;
    super(
      {
        message,
        error: 'Payment Gateway Configuration Error',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'PAYMENT_GATEWAY_CONFIGURATION_ERROR',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class PaymentGatewayOperationFailedException extends HttpException {
  constructor(operation: string, reason?: string) {
    const message = reason
      ? `Payment gateway ${operation} failed: ${reason}`
      : `Payment gateway ${operation} failed`;
    super(
      {
        message,
        error: 'Payment Gateway Operation Failed',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'PAYMENT_GATEWAY_OPERATION_FAILED',
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class DefaultPaymentGatewayException extends HttpException {
  constructor(action: string, paymentSlug: string) {
    super(
      {
        message: `Cannot ${action} the default payment gateway '${paymentSlug}'. Please set another gateway as default first`,
        error: 'Default Payment Gateway Error',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'DEFAULT_PAYMENT_GATEWAY_ERROR',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class PaymentGatewayValidationException extends HttpException {
  constructor(field: string, value: unknown, requirement: string) {
    super(
      {
        message: `Validation failed for field '${field}' with value '${String(value)}': ${requirement}`,
        error: 'Payment Gateway Validation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'PAYMENT_GATEWAY_VALIDATION_FAILED',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
