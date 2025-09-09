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

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode: number = response?.statusCode || 200;

        // If the response is already formatted (contains success property), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

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
