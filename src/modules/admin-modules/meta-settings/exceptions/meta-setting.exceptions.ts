import { HttpException, HttpStatus } from '@nestjs/common';

export class MetaSettingNotFoundException extends HttpException {
  constructor(
    identifier: string,
    identifierType: 'publicId' | 'languageId' | 'id' = 'publicId'
  ) {
    const message =
      identifierType === 'languageId'
        ? `Meta setting for language ID '${identifier}' not found`
        : `Meta setting with ${identifierType} '${identifier}' not found`;

    super(
      {
        message,
        code: 'META_SETTING_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class MetaSettingValidationException extends HttpException {
  constructor(message: string, validationErrors?: unknown) {
    super(
      {
        message,
        code: 'META_SETTING_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingAlreadyExistsException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Meta setting for language ID '${languageId}' already exists`,
        code: 'META_SETTING_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class MetaSettingAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'META_SETTING_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class MetaSettingLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Language with ID '${languageId}' not found or inactive`,
        code: 'META_SETTING_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingFileUploadException extends HttpException {
  constructor(message: string, details?: string) {
    super(
      {
        message: `OG image upload failed: ${message}`,
        code: 'META_SETTING_FILE_UPLOAD_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingImageException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `OG image processing failed: ${message}`,
        code: 'META_SETTING_IMAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class InvalidMetaSettingDataException extends HttpException {
  constructor(field: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid ${field}: '${value}'. ${requirement}`,
        code: 'INVALID_META_SETTING_DATA',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingCreationException extends HttpException {
  constructor(message: string, details?: unknown) {
    super(
      {
        message: `Failed to create meta setting: ${message}`,
        code: 'META_SETTING_CREATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingUpdateException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to update meta setting '${publicId}': ${message}`,
        code: 'META_SETTING_UPDATE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingDeletionException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to delete meta setting '${publicId}': ${message}`,
        code: 'META_SETTING_DELETION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingMultiLanguageException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Multi-language operation failed: ${message}`,
        code: 'META_SETTING_MULTI_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingSEOValidationException extends HttpException {
  constructor(field: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid SEO ${field}: '${value}'. ${requirement}`,
        code: 'META_SETTING_SEO_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingPermissionException extends HttpException {
  constructor(operation: string) {
    super(
      {
        message: `Insufficient permissions to ${operation} meta setting`,
        code: 'META_SETTING_PERMISSION_ERROR',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class MetaSettingLanguageCodeException extends HttpException {
  constructor(languageCode: string) {
    super(
      {
        message: `Invalid or unsupported language code: '${languageCode}'`,
        code: 'META_SETTING_LANGUAGE_CODE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingAIGeneratedImageException extends HttpException {
  constructor(value: string) {
    super(
      {
        message: `Invalid AI generated image value: '${value}'. Must be 'YES' or 'NO'`,
        code: 'META_SETTING_AI_IMAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingDuplicateLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Meta setting for language '${languageId}' already exists. Only one meta setting per language is allowed`,
        code: 'META_SETTING_DUPLICATE_LANGUAGE',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class MetaSettingDefaultLanguageException extends HttpException {
  constructor() {
    super(
      {
        message:
          'Default language not found. Please ensure at least one active default language exists',
        code: 'META_SETTING_DEFAULT_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingBulkOperationException extends HttpException {
  constructor(action: string, failedCount: number, totalCount: number) {
    super(
      {
        message: `Bulk ${action} operation partially failed. ${failedCount} out of ${totalCount} operations failed`,
        code: 'META_SETTING_BULK_OPERATION_ERROR',
        statusCode: HttpStatus.PARTIAL_CONTENT,
      },
      HttpStatus.PARTIAL_CONTENT
    );
  }
}

export class MetaSettingFileSizeException extends HttpException {
  constructor(filename: string, size: number, maxSize: number) {
    super(
      {
        message: `File '${filename}' size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
        code: 'META_SETTING_FILE_SIZE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MetaSettingFileTypeException extends HttpException {
  constructor(filename: string, mimeType: string, allowedTypes: string[]) {
    super(
      {
        message: `File '${filename}' type '${mimeType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'META_SETTING_FILE_TYPE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
