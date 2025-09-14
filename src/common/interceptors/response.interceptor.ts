import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { ResponseHandler } from '../utils/response.handler';
import { DiscardUnderscores } from '../utils/discard-underscores.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();

        // If the response is already formatted (contains success property), use its statusCode
        if (data && typeof data === 'object' && 'success' in data) {
          const formattedResponse = data as {
            statusCode?: number;
            [key: string]: unknown;
          };
          if (formattedResponse.statusCode !== undefined) {
            // Set HTTP status based on the statusCode in response
            response.status(formattedResponse.statusCode);
          }
          // Always remove statusCode from response body since it should only be in HTTP status
          const { statusCode, ...responseWithoutStatusCode } =
            formattedResponse;
          DiscardUnderscores(statusCode);
          return responseWithoutStatusCode;
        }

        const statusCode: number = response?.statusCode || 200;

        // If it's a simple message string
        if (typeof data === 'string') {
          return ResponseHandler.success(data, statusCode);
        }

        // If it has message and data properties
        if (data && typeof data === 'object' && 'message' in data) {
          const messageData = data as { message: string; data?: unknown };
          return ResponseHandler.success(
            messageData.message,
            statusCode,
            messageData.data || data
          );
        }

        // Default success response
        return ResponseHandler.success(
          'Operation completed successfully',
          statusCode,
          data
        );
      })
    );
  }
}
