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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
      message = 'Internal server error';
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

    // Send formatted error response
    const errorResponse = ResponseHandler.error(message, status, error);

    response.status(status).json(errorResponse);
  }
}
