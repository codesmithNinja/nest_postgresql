import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/response.handler';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n?: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { language?: string; i18nLang?: string }
    >();

    // Set up i18n service for ResponseHandler if available
    if (this.i18n) {
      ResponseHandler.setI18nService(this.i18n);
    }

    // Get current language from request
    const getCurrentLanguage = (): string => {
      return request.language || request.i18nLang || 'en';
    };

    let status: number;
    let message: string;
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        error = Array.isArray(responseObj.message)
          ? (responseObj.message as string[]).join(', ')
          : (responseObj.error as string);
      } else {
        message = exceptionResponse;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'common.internal_error';
      error =
        exception instanceof Error
          ? exception.message
          : typeof exception === 'string'
            ? exception
            : 'Unknown error';
    }

    // Log the error
    const errorDetails =
      exception instanceof Error
        ? exception.stack
        : typeof exception === 'string'
          ? exception
          : 'Unknown error';
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      errorDetails
    );

    // Send formatted error response without statusCode in body
    let errorResponse;
    if (this.i18n && message.includes('.')) {
      // If message looks like a translation key (contains dots) and i18n is available
      errorResponse = await ResponseHandler.errorWithTranslation(
        message,
        status,
        error,
        undefined,
        getCurrentLanguage()
      );
    } else {
      // Fallback to regular error response
      errorResponse = ResponseHandler.error(message, status, error);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { statusCode, ...responseWithoutStatusCode } = errorResponse;

    response.status(status).json(responseWithoutStatusCode);
  }
}
