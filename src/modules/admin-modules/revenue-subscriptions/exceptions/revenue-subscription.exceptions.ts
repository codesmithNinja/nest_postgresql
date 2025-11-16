import { HttpException, HttpStatus } from '@nestjs/common';

export class RevenueSubscriptionNotFoundException extends HttpException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Revenue subscription with identifier '${identifier}' not found`
      : 'Revenue subscription not found';
    super(
      {
        message,
        error: 'Revenue Subscription Not Found',
        statusCode: HttpStatus.NOT_FOUND,
        code: 'REVENUE_SUBSCRIPTION_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class RevenueSubscriptionInUseException extends HttpException {
  constructor(identifier: string, useCount: number) {
    super(
      {
        message: `Cannot delete revenue subscription '${identifier}' as it is currently in use (useCount: ${useCount})`,
        error: 'Revenue Subscription In Use',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'REVENUE_SUBSCRIPTION_IN_USE',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidSubscriptionTypeException extends HttpException {
  constructor(subscriptionType: string) {
    super(
      {
        message: `Invalid subscription type '${subscriptionType}'. Must be either 'INVESTOR' or 'SPONSOR'`,
        error: 'Invalid Subscription Type',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_SUBSCRIPTION_TYPE',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ConditionalFieldValidationException extends HttpException {
  constructor(subscriptionType: string, missingField: string) {
    super(
      {
        message: `Field '${missingField}' is required for subscription type '${subscriptionType}'`,
        error: 'Conditional Field Validation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'CONDITIONAL_FIELD_VALIDATION_ERROR',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidConditionalFieldException extends HttpException {
  constructor(subscriptionType: string, invalidField: string) {
    super(
      {
        message: `Field '${invalidField}' is not allowed for subscription type '${subscriptionType}'`,
        error: 'Invalid Conditional Field',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_CONDITIONAL_FIELD',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class RevenueSubscriptionAlreadyExistsException extends HttpException {
  constructor(field: string, value: string) {
    super(
      {
        message: `Revenue subscription with ${field} '${value}' already exists`,
        error: 'Revenue Subscription Already Exists',
        statusCode: HttpStatus.CONFLICT,
        code: 'REVENUE_SUBSCRIPTION_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT
    );
  }
}

export class RevenueSubscriptionOperationFailedException extends HttpException {
  constructor(operation: string, reason?: string) {
    const message = reason
      ? `Revenue subscription ${operation} failed: ${reason}`
      : `Revenue subscription ${operation} failed`;
    super(
      {
        message,
        error: 'Revenue Subscription Operation Failed',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'REVENUE_SUBSCRIPTION_OPERATION_FAILED',
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class BulkRevenueSubscriptionOperationException extends HttpException {
  constructor(action: string, reason?: string) {
    const message = reason
      ? `Bulk revenue subscription ${action} operation failed: ${reason}`
      : `Bulk revenue subscription ${action} operation failed`;
    super(
      {
        message,
        error: 'Bulk Revenue Subscription Operation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'BULK_REVENUE_SUBSCRIPTION_OPERATION_FAILED',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class RevenueSubscriptionLanguageNotFoundException extends HttpException {
  constructor(subscriptionId?: string, languageId?: string) {
    const message =
      subscriptionId && languageId
        ? `Revenue subscription language content not found for subscription '${subscriptionId}' and language '${languageId}'`
        : 'Revenue subscription language content not found';
    super(
      {
        message,
        error: 'Revenue Subscription Language Not Found',
        statusCode: HttpStatus.NOT_FOUND,
        code: 'REVENUE_SUBSCRIPTION_LANGUAGE_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class InvalidAmountException extends HttpException {
  constructor(amount: number) {
    super(
      {
        message: `Invalid amount '${amount}'. Amount must be a positive number`,
        error: 'Invalid Amount',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_AMOUNT',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidRefundDaysException extends HttpException {
  constructor(days?: number) {
    const message =
      days !== undefined
        ? `Invalid refund days '${days}'. Must be a positive number when allowRefund is true`
        : 'Refund days are required when allowRefund is true';
    super(
      {
        message,
        error: 'Invalid Refund Days',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_REFUND_DAYS',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidCancelDaysException extends HttpException {
  constructor(days?: number) {
    const message =
      days !== undefined
        ? `Invalid cancel days '${days}'. Must be a positive number when allowCancel is true`
        : 'Cancel days are required when allowCancel is true';
    super(
      {
        message,
        error: 'Invalid Cancel Days',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_CANCEL_DAYS',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class RevenueSubscriptionValidationException extends HttpException {
  constructor(message: string, validationErrors?: unknown) {
    super(
      {
        message,
        code: 'REVENUE_SUBSCRIPTION_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class RevenueSubscriptionAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'REVENUE_SUBSCRIPTION_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}
