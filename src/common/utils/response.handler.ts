import { StatusCodes } from 'http-status-codes';
import { I18nService } from 'nestjs-i18n';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  messageKey?: string;
  messageArgs?: Record<string, string | number>;
  statusCode: number;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  messageKey?: string;
  messageArgs?: Record<string, string | number>;
  statusCode: number;
  timestamp: string;
  error?: string;
}

export class ResponseHandler {
  private static i18nService: I18nService;

  /**
   * Set the i18n service instance for translation
   */
  static setI18nService(i18nService: I18nService) {
    ResponseHandler.i18nService = i18nService;
  }

  /**
   * Translate a message key to actual message
   */
  private static async translateMessage(
    messageKey: string,
    lang: string = 'en'
    // messageArgs?: Record<string, string | number>
  ): Promise<string> {
    console.log('translateMessage called with:', messageKey, 'lang:', lang);
    console.log('i18nService available:', !!ResponseHandler.i18nService);

    if (!ResponseHandler.i18nService) {
      console.log('No i18nService, returning key');
      return messageKey; // Fallback to key if no i18n service
    }

    try {
      console.log('Attempting translation...');
      const translated = await ResponseHandler.i18nService.translate(
        messageKey,
        { lang }
      );
      console.log(
        'Translation result:',
        translated,
        'type:',
        typeof translated
      );

      return typeof translated === 'string' ? translated : messageKey;
    } catch (error) {
      console.log('Translation error:', error);
      return messageKey; // Fallback to key on error
    }
  }

  /**
   * Simplified success response with custom status code
   * @param data - Data to return (object, array, string, etc.)
   * @param statusCode - HTTP status code (uses http-status-codes)
   * @param message - Optional message (defaults to "Success")
   */
  static send<T>(
    data: T,
    statusCode: StatusCodes = StatusCodes.OK,
    message: string = 'Success'
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      statusCode,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Simplified error response with custom status code
   * @param message - Error message
   * @param statusCode - HTTP status code (uses http-status-codes)
   * @param error - Optional error details
   */
  static sendError(
    message: string,
    statusCode: StatusCodes = StatusCodes.BAD_REQUEST,
    error?: string
  ): ErrorResponse {
    return {
      success: false,
      message,
      statusCode,
      error,
      timestamp: new Date().toISOString(),
    };
  }
  /**
   * Success response handler with i18n support
   */
  static successWithKey<T>(
    messageKey: string,
    statusCode: number = StatusCodes.OK,
    data?: T,
    messageArgs?: Record<string, string | number>
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      message: messageKey,
      messageKey,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (messageArgs) {
      response.messageArgs = messageArgs;
    }

    if (data !== undefined) {
      response.data = data;
    }

    return response;
  }

  /**
   * Error response handler with i18n support
   */
  static errorWithKey(
    messageKey: string,
    statusCode: number,
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      message: messageKey,
      messageKey,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (messageArgs) {
      response.messageArgs = messageArgs;
    }

    if (error) {
      response.error = error;
    }

    return response;
  }
  /**
   * Success response handler
   */
  static success<T>(
    message: string,
    statusCode: number = StatusCodes.OK,
    data?: T
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      response.data = data;
    }

    return response;
  }

  /**
   * Error response handler
   */
  static error(
    message: string,
    statusCode: number,
    error?: string
  ): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      response.error = error;
    }

    return response;
  }

  /**
   * Paginated response handler
   */
  static paginated<T>(
    message: string,
    data: T[],
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    },
    statusCode: number = StatusCodes.OK
  ): ApiResponse<{
    items: T[];
    pagination: typeof pagination;
  }> {
    return this.success(message, statusCode, {
      items: data,
      pagination,
    });
  }

  /**
   * Paginated response handler with i18n support
   */
  static paginatedWithKey<T>(
    messageKey: string,
    data: T[],
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    },
    statusCode: number = StatusCodes.OK,
    messageArgs?: Record<string, string | number>
  ): ApiResponse<{
    items: T[];
    pagination: typeof pagination;
  }> {
    return this.successWithKey(
      messageKey,
      statusCode,
      {
        items: data,
        pagination,
      },
      messageArgs
    );
  }

  /**
   * Created response (201)
   */
  static created<T>(message: string, data?: T): ApiResponse<T> {
    return this.success(message, StatusCodes.CREATED, data);
  }

  /**
   * Created response with i18n support (201)
   */
  static createdWithKey<T>(
    messageKey: string,
    data?: T,
    messageArgs?: Record<string, string | number>
  ): ApiResponse<T> {
    return this.successWithKey(
      messageKey,
      StatusCodes.CREATED,
      data,
      messageArgs
    );
  }

  /**
   * No content response (204)
   */
  static noContent(message: string): ApiResponse {
    return this.success(message, StatusCodes.NO_CONTENT);
  }

  /**
   * Bad request error (400)
   */
  static badRequest(message: string, error?: string): ErrorResponse {
    return this.error(message, StatusCodes.BAD_REQUEST, error);
  }

  /**
   * Bad request error with i18n support (400)
   */
  static badRequestWithKey(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.BAD_REQUEST,
      error,
      messageArgs
    );
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(
    message: string = 'Unauthorized',
    error?: string
  ): ErrorResponse {
    return this.error(message, StatusCodes.UNAUTHORIZED, error);
  }

  /**
   * Unauthorized error with i18n support (401)
   */
  static unauthorizedWithKey(
    messageKey: string = 'auth.unauthorized',
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.UNAUTHORIZED,
      error,
      messageArgs
    );
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(
    message: string = 'Forbidden',
    error?: string
  ): ErrorResponse {
    return this.error(message, StatusCodes.FORBIDDEN, error);
  }

  /**
   * Forbidden error with i18n support (403)
   */
  static forbiddenWithKey(
    messageKey: string = 'auth.forbidden',
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.FORBIDDEN,
      error,
      messageArgs
    );
  }

  /**
   * Not found error (404)
   */
  static notFound(
    message: string = 'Not found',
    error?: string
  ): ErrorResponse {
    return this.error(message, StatusCodes.NOT_FOUND, error);
  }

  /**
   * Not found error with i18n support (404)
   */
  static notFoundWithKey(
    messageKey: string = 'common.not_found',
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.NOT_FOUND,
      error,
      messageArgs
    );
  }

  /**
   * Conflict error (409)
   */
  static conflict(message: string, error?: string): ErrorResponse {
    return this.error(message, StatusCodes.CONFLICT, error);
  }

  /**
   * Conflict error with i18n support (409)
   */
  static conflictWithKey(
    messageKey: string = 'common.conflict',
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.CONFLICT,
      error,
      messageArgs
    );
  }

  /**
   * Validation error (422)
   */
  static validationError(message: string, error?: string): ErrorResponse {
    return this.error(message, StatusCodes.UNPROCESSABLE_ENTITY, error);
  }

  /**
   * Validation error with i18n support (422)
   */
  static validationErrorWithKey(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.UNPROCESSABLE_ENTITY,
      error,
      messageArgs
    );
  }

  /**
   * Internal server error (500)
   */
  static internalError(
    message: string = 'Internal server error',
    error?: string
  ): ErrorResponse {
    return this.error(message, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }

  /**
   * Internal server error with i18n support (500)
   */
  static internalErrorWithKey(
    messageKey: string = 'common.internal_error',
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return this.errorWithKey(
      messageKey,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error,
      messageArgs
    );
  }

  /**
   * Async success response with automatic translation
   */
  static async successWithTranslation<T>(
    messageKey: string,
    statusCode: number = StatusCodes.OK,
    data?: T,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ApiResponse<T>> {
    console.log(
      'ResponseHandler.successWithTranslation called with:',
      messageKey,
      'lang:',
      lang
    );
    const translatedMessage = await this.translateMessage(
      messageKey,
      lang
      // messageArgs
    );
    console.log('Translated message:', translatedMessage);

    const response: ApiResponse<T> = {
      success: true,
      message: translatedMessage,
      messageKey,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (messageArgs) {
      response.messageArgs = messageArgs;
    }

    if (data !== undefined) {
      response.data = data;
    }

    console.log('Final response:', response);
    return response;
  }

  /**
   * Async error response with automatic translation
   */
  static async errorWithTranslation(
    messageKey: string,
    statusCode: number,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    const translatedMessage = await this.translateMessage(
      messageKey,
      lang
      // messageArgs
    );

    const response: ErrorResponse = {
      success: false,
      message: translatedMessage,
      messageKey,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    if (messageArgs) {
      response.messageArgs = messageArgs;
    }

    if (error) {
      response.error = error;
    }

    return response;
  }

  /**
   * Async created response with automatic translation (201)
   */
  static async createdWithTranslation<T>(
    messageKey: string,
    data?: T,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ApiResponse<T>> {
    return this.successWithTranslation(
      messageKey,
      StatusCodes.CREATED,
      data,
      messageArgs,
      lang
    );
  }

  /**
   * Async bad request error with automatic translation (400)
   */
  static async badRequestWithTranslation(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.BAD_REQUEST,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async unauthorized error with automatic translation (401)
   */
  static async unauthorizedWithTranslation(
    messageKey: string = 'auth.unauthorized',
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.UNAUTHORIZED,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async forbidden error with automatic translation (403)
   */
  static async forbiddenWithTranslation(
    messageKey: string = 'auth.forbidden',
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.FORBIDDEN,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async not found error with automatic translation (404)
   */
  static async notFoundWithTranslation(
    messageKey: string = 'common.not_found',
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.NOT_FOUND,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async conflict error with automatic translation (409)
   */
  static async conflictWithTranslation(
    messageKey: string = 'common.conflict',
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.CONFLICT,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async validation error with automatic translation (422)
   */
  static async validationErrorWithTranslation(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.UNPROCESSABLE_ENTITY,
      error,
      messageArgs,
      lang
    );
  }

  /**
   * Async internal server error with automatic translation (500)
   */
  static async internalErrorWithTranslation(
    messageKey: string = 'common.internal_error',
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.errorWithTranslation(
      messageKey,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error,
      messageArgs,
      lang
    );
  }
}
