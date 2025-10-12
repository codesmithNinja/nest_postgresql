import { HttpException, HttpStatus } from '@nestjs/common';

export class ManageDropdownNotFoundException extends HttpException {
  constructor(dropdownType?: string, publicId?: string) {
    const message = publicId
      ? `Dropdown option with dropdown type '${dropdownType}' and public ID '${publicId}' not found`
      : `Dropdown options with dropdown type '${dropdownType}' not found`;

    super(
      {
        message,
        code: 'DROPDOWN_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class InvalidDropdownTypeException extends HttpException {
  constructor(dropdownType: string) {
    super(
      {
        message: `Invalid dropdown type '${dropdownType}'. Dropdown type must contain only letters, numbers, underscores, and hyphens`,
        code: 'INVALID_DROPDOWN_TYPE',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ManageDropdownValidationException extends HttpException {
  constructor(message: string, validationErrors?: unknown) {
    super(
      {
        message,
        code: 'DROPDOWN_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ManageDropdownDuplicateException extends HttpException {
  constructor(dropdownType: string, name: string) {
    super(
      {
        message: `Dropdown option with dropdown type '${dropdownType}' and name '${name}' already exists`,
        code: 'DROPDOWN_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class ManageDropdownAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'DROPDOWN_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class ManageDropdownLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Language with ID '${languageId}' not found or inactive`,
        code: 'DROPDOWN_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class ManageDropdownBulkOperationException extends HttpException {
  constructor(action: string, failedCount: number, totalCount: number) {
    super(
      {
        message: `Bulk ${action} operation partially failed. ${failedCount} out of ${totalCount} operations failed`,
        code: 'DROPDOWN_BULK_OPERATION_ERROR',
        statusCode: HttpStatus.PARTIAL_CONTENT,
      },
      HttpStatus.PARTIAL_CONTENT
    );
  }
}
