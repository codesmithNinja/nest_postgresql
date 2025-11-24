import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailTemplateNotFoundException extends HttpException {
  constructor(
    identifier: string,
    identifierType: 'publicId' | 'languageId' | 'id' = 'publicId'
  ) {
    const message =
      identifierType === 'languageId'
        ? `Email template for language ID '${identifier}' not found`
        : `Email template with ${identifierType} '${identifier}' not found`;

    super(
      {
        message,
        code: 'EMAIL_TEMPLATE_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class EmailTemplateValidationException extends HttpException {
  constructor(message: string, validationErrors?: unknown) {
    super(
      {
        message,
        code: 'EMAIL_TEMPLATE_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: validationErrors,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateAlreadyExistsException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Email template for language ID '${languageId}' already exists`,
        code: 'EMAIL_TEMPLATE_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class EmailTemplateAccessDeniedException extends HttpException {
  constructor() {
    super(
      {
        message: 'Access denied. Admin authentication required',
        code: 'EMAIL_TEMPLATE_ACCESS_DENIED',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class EmailTemplateLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Language with ID '${languageId}' not found or inactive`,
        code: 'EMAIL_TEMPLATE_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateTaskException extends HttpException {
  constructor(task: string, operation: string = 'update') {
    super(
      {
        message: `Cannot ${operation} task field '${task}'. Task is immutable after creation`,
        code: 'EMAIL_TEMPLATE_TASK_IMMUTABLE',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateTaskValidationException extends HttpException {
  constructor(task: string, requirement: string) {
    super(
      {
        message: `Invalid task '${task}'. ${requirement}`,
        code: 'EMAIL_TEMPLATE_TASK_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateTaskAlreadyExistsException extends HttpException {
  constructor(task: string, languageId: string) {
    super(
      {
        message: `Email template with task '${task}' already exists for language ID '${languageId}'`,
        code: 'EMAIL_TEMPLATE_TASK_ALREADY_EXISTS',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class InvalidEmailTemplateDataException extends HttpException {
  constructor(field: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid ${field}: '${value}'. ${requirement}`,
        code: 'INVALID_EMAIL_TEMPLATE_DATA',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateCreationException extends HttpException {
  constructor(message: string, details?: unknown) {
    super(
      {
        message: `Failed to create email template: ${message}`,
        code: 'EMAIL_TEMPLATE_CREATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        details,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateUpdateException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to update email template '${publicId}': ${message}`,
        code: 'EMAIL_TEMPLATE_UPDATE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateDeletionException extends HttpException {
  constructor(publicId: string, message: string) {
    super(
      {
        message: `Failed to delete email template '${publicId}': ${message}`,
        code: 'EMAIL_TEMPLATE_DELETION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateMultiLanguageException extends HttpException {
  constructor(message: string) {
    super(
      {
        message: `Multi-language email template operation failed: ${message}`,
        code: 'EMAIL_TEMPLATE_MULTI_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplatePermissionException extends HttpException {
  constructor(operation: string) {
    super(
      {
        message: `Insufficient permissions to ${operation} email template`,
        code: 'EMAIL_TEMPLATE_PERMISSION_ERROR',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN
    );
  }
}

export class EmailTemplateLanguageCodeException extends HttpException {
  constructor(languageCode: string) {
    super(
      {
        message: `Invalid or unsupported language code: '${languageCode}'`,
        code: 'EMAIL_TEMPLATE_LANGUAGE_CODE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateDuplicateLanguageException extends HttpException {
  constructor(languageId: string) {
    super(
      {
        message: `Email template for language '${languageId}' already exists. Only one email template per language is allowed`,
        code: 'EMAIL_TEMPLATE_DUPLICATE_LANGUAGE',
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT
    );
  }
}

export class EmailTemplateDefaultLanguageException extends HttpException {
  constructor() {
    super(
      {
        message:
          'Default language not found. Please ensure at least one active default language exists',
        code: 'EMAIL_TEMPLATE_DEFAULT_LANGUAGE_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateBulkOperationException extends HttpException {
  constructor(action: string, failedCount: number, totalCount: number) {
    super(
      {
        message: `Bulk ${action} operation partially failed. ${failedCount} out of ${totalCount} operations failed`,
        code: 'EMAIL_TEMPLATE_BULK_OPERATION_ERROR',
        statusCode: HttpStatus.PARTIAL_CONTENT,
      },
      HttpStatus.PARTIAL_CONTENT
    );
  }
}

export class EmailTemplateContentException extends HttpException {
  constructor(field: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid email template ${field}: '${value}'. ${requirement}`,
        code: 'EMAIL_TEMPLATE_CONTENT_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateEmailValidationException extends HttpException {
  constructor(emailField: string, emailValue: string) {
    super(
      {
        message: `Invalid email format for ${emailField}: '${emailValue}'`,
        code: 'EMAIL_TEMPLATE_EMAIL_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateSubjectException extends HttpException {
  constructor(subject: string, requirement: string) {
    super(
      {
        message: `Invalid email template subject: '${subject}'. ${requirement}`,
        code: 'EMAIL_TEMPLATE_SUBJECT_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateMessageException extends HttpException {
  constructor(messageLength: number, maxLength: number) {
    super(
      {
        message: `Email template message is too long (${messageLength} characters). Maximum allowed: ${maxLength} characters`,
        code: 'EMAIL_TEMPLATE_MESSAGE_LENGTH_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateHTMLValidationException extends HttpException {
  constructor(details: string) {
    super(
      {
        message: `Invalid HTML content in email template: ${details}`,
        code: 'EMAIL_TEMPLATE_HTML_VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateSenderException extends HttpException {
  constructor(senderField: string, value: string, requirement: string) {
    super(
      {
        message: `Invalid ${senderField}: '${value}'. ${requirement}`,
        code: 'EMAIL_TEMPLATE_SENDER_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class EmailTemplateCacheException extends HttpException {
  constructor(operation: string, details?: string) {
    super(
      {
        message: `Email template cache operation failed: ${operation}. ${details || ''}`,
        code: 'EMAIL_TEMPLATE_CACHE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
