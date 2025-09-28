import { HttpException, HttpStatus } from '@nestjs/common';

export class SettingsNotFoundException extends HttpException {
  constructor(groupType?: string, key?: string) {
    const message = key
      ? `Settings with group type '${groupType}' and key '${key}' not found`
      : `Settings with group type '${groupType}' not found`;

    super(
      {
        message,
        code: 'SETTINGS_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class InvalidGroupTypeException extends HttpException {
  constructor(groupType: string) {
    super(
      {
        message: `Invalid group type '${groupType}'. Group type must contain only letters, numbers, underscores, and hyphens`,
        code: 'INVALID_GROUP_TYPE',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SettingsValidationException extends HttpException {
  constructor(message: string, validationErrors?: any) {
    super(
      {
        message,
        code: 'SETTINGS_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class FileUploadSettingsException extends HttpException {
  constructor(message: string, key?: string) {
    const fullMessage = key
      ? `File upload failed for key '${key}': ${message}`
      : `File upload failed: ${message}`;

    super(
      {
        message: fullMessage,
        code: 'FILE_UPLOAD_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SettingsDuplicateException extends HttpException {
  constructor(groupType: string, key: string) {
    super(
      {
        message: `Settings with group type '${groupType}' and key '${key}' already exists`,
        code: 'SETTINGS_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class SettingsAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'SETTINGS_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class SettingsCacheException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Cache operation failed: ${message}`,
        code: 'SETTINGS_CACHE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
