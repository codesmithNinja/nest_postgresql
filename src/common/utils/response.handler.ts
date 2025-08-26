export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
  error?: string;
}

export class ResponseHandler {
  /**
   * Success response handler
   */
  static success<T>(
    message: string,
    statusCode: number = 200,
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
    statusCode: number = 200
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
   * Created response (201)
   */
  static created<T>(message: string, data?: T): ApiResponse<T> {
    return this.success(message, 201, data);
  }

  /**
   * No content response (204)
   */
  static noContent(message: string): ApiResponse {
    return this.success(message, 204);
  }

  /**
   * Bad request error (400)
   */
  static badRequest(message: string, error?: string): ErrorResponse {
    return this.error(message, 400, error);
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(
    message: string = 'Unauthorized',
    error?: string
  ): ErrorResponse {
    return this.error(message, 401, error);
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(
    message: string = 'Forbidden',
    error?: string
  ): ErrorResponse {
    return this.error(message, 403, error);
  }

  /**
   * Not found error (404)
   */
  static notFound(
    message: string = 'Not found',
    error?: string
  ): ErrorResponse {
    return this.error(message, 404, error);
  }

  /**
   * Conflict error (409)
   */
  static conflict(message: string, error?: string): ErrorResponse {
    return this.error(message, 409, error);
  }

  /**
   * Validation error (422)
   */
  static validationError(message: string, error?: string): ErrorResponse {
    return this.error(message, 422, error);
  }

  /**
   * Internal server error (500)
   */
  static internalError(
    message: string = 'Internal server error',
    error?: string
  ): ErrorResponse {
    return this.error(message, 500, error);
  }
}
