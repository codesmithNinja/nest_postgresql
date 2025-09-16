import { StatusCodes } from 'http-status-codes';

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
}
