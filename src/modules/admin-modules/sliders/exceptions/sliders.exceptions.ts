import { HttpException, HttpStatus } from '@nestjs/common';

export class SliderNotFoundException extends HttpException {
  constructor(
    identifier: string,
    identifierType: 'publicId' | 'uniqueCode' | 'id' = 'publicId'
  ) {
    const message =
      identifierType === 'uniqueCode'
        ? `Slider with unique code '${identifier}' not found`
        : `Slider with ${identifierType} '${identifier}' not found`;

    super(
      {
        message,
        code: 'SLIDER_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class SlidersNotFoundException extends HttpException {
  constructor(languageId?: string) {
    const message = languageId
      ? `No sliders found for language ID '${languageId}'`
      : 'No sliders found';

    super(
      {
        message,
        code: 'SLIDERS_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class SliderValidationException extends HttpException {
  constructor(message: string, validationErrors?: unknown) {
    super(
      {
        message,
        code: 'SLIDER_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderAlreadyExistsException extends HttpException {
  constructor(field: string, value: string | number) {
    super(
      {
        message: `Slider with ${field} '${value}' already exists`,
        code: 'SLIDER_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class SliderAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'SLIDER_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class SliderLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Language with ID '${languageId}' not found or inactive`,
        code: 'SLIDER_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderFileUploadException extends HttpException {
  constructor(message: string, details?: string) {
    super(
      {
        message: `File upload failed: ${message}`,
        code: 'SLIDER_FILE_UPLOAD_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderImageException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Image processing failed: ${message}`,
        code: 'SLIDER_IMAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderBulkOperationException extends HttpException {
  constructor(action: string, failedCount: number, totalCount: number) {
    super(
      {
        message: `Bulk ${action} operation partially failed. ${failedCount} out of ${totalCount} operations failed`,
        code: 'SLIDER_BULK_OPERATION_ERROR',
        statusCode: HttpStatus.PARTIAL_CONTENT,
      },
      HttpStatus.PARTIAL_CONTENT
    );
  }
}

export class InvalidSliderDataException extends HttpException {
  constructor(field: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid ${field}: '${value}'. ${requirement}`,
        code: 'INVALID_SLIDER_DATA',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderUniqueCodeGenerationException extends HttpException {
  constructor() {
    super(
      {
        message:
          'Unable to generate unique code for slider after maximum attempts',
        code: 'SLIDER_UNIQUE_CODE_GENERATION_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class SliderCreationException extends HttpException {
  constructor(message: string, details?: unknown) {
    super(
      {
        message: `Failed to create slider: ${message}`,
        code: 'SLIDER_CREATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderUpdateException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to update slider '${publicId}': ${message}`,
        code: 'SLIDER_UPDATE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderDeletionException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to delete slider '${publicId}': ${message}`,
        code: 'SLIDER_DELETION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderMultiLanguageException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Multi-language operation failed: ${message}`,
        code: 'SLIDER_MULTI_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderColorValidationException extends HttpException {
  constructor(colorField: string, colorValue: string) {
    super(
      {
        message: `Invalid color for ${colorField}: '${colorValue}'. Must be a valid hex color code (e.g., #000000)`,
        code: 'SLIDER_COLOR_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderUrlValidationException extends HttpException {
  constructor(url: string) {
    super(
      {
        message: `Invalid button URL: '${url}'. Must be a valid URL or relative path`,
        code: 'SLIDER_URL_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SliderPermissionException extends HttpException {
  constructor(operation: string) {
    super(
      {
        message: `Insufficient permissions to ${operation} slider`,
        code: 'SLIDER_PERMISSION_ERROR',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}
