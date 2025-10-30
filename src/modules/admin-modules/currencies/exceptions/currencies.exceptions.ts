import { HttpException, HttpStatus } from '@nestjs/common';

export class CurrencyNotFoundException extends HttpException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Currency with identifier '${identifier}' not found`
      : 'Currency not found';
    super(
      {
        message,
        error: 'Currency Not Found',
        statusCode: HttpStatus.NOT_FOUND,
        code: 'CURRENCY_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class CurrencyAlreadyExistsException extends HttpException {
  constructor(field: string, value: string) {
    super(
      {
        message: `Currency with ${field} '${value}' already exists`,
        error: 'Currency Already Exists',
        statusCode: HttpStatus.CONFLICT,
        code: 'CURRENCY_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT
    );
  }
}

export class CurrencyInUseException extends HttpException {
  constructor(identifier: string, useCount: number) {
    super(
      {
        message: `Cannot delete currency '${identifier}' as it is currently in use (useCount: ${useCount})`,
        error: 'Currency In Use',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'CURRENCY_IN_USE',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidCurrencyCodeException extends HttpException {
  constructor(code: string) {
    super(
      {
        message: `Invalid currency code format: '${code}'. Must be exactly 3 uppercase letters`,
        error: 'Invalid Currency Code',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_CURRENCY_CODE',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class CurrencyOperationFailedException extends HttpException {
  constructor(operation: string, reason?: string) {
    const message = reason
      ? `Currency ${operation} failed: ${reason}`
      : `Currency ${operation} failed`;
    super(
      {
        message,
        error: 'Currency Operation Failed',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'CURRENCY_OPERATION_FAILED',
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class BulkCurrencyOperationException extends HttpException {
  constructor(action: string, reason?: string) {
    const message = reason
      ? `Bulk currency ${action} operation failed: ${reason}`
      : `Bulk currency ${action} operation failed`;
    super(
      {
        message,
        error: 'Bulk Currency Operation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'BULK_CURRENCY_OPERATION_FAILED',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
