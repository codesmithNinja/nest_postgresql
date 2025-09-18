import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { ResponseHandler } from '../utils/response.handler';
import { DiscardUnderscores } from '../utils/discard-underscores.util';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      mergeMap(async (data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context
          .switchToHttp()
          .getRequest<Request & { language?: string; i18nLang?: string }>();

        // Set up i18n service for ResponseHandler
        ResponseHandler.setI18nService(this.i18n);

        // Get current language from request
        const getCurrentLanguage = (): string => {
          return request.language || request.i18nLang || 'en';
        };

        // Check if response has statusCode property regardless of success property
        if (data && typeof data === 'object' && 'statusCode' in data) {
          const responseWithStatusCode = data as {
            statusCode?: number;
            [key: string]: unknown;
          };
          if (responseWithStatusCode.statusCode !== undefined) {
            // Set HTTP status based on the statusCode in response
            response.status(responseWithStatusCode.statusCode);
          }
          // Always remove statusCode from response body since it should only be in HTTP status
          const { statusCode, ...responseWithoutStatusCode } =
            responseWithStatusCode;
          DiscardUnderscores(statusCode);

          // If it's already a formatted response (has success property), return as is
          if ('success' in responseWithoutStatusCode) {
            return responseWithoutStatusCode;
          }

          // Otherwise, continue with normal processing below
          data = responseWithoutStatusCode;
        }

        // If the response is already formatted (contains success property), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const statusCode: number = response?.statusCode || 200;

        // If it's a simple message string
        if (typeof data === 'string') {
          const result = ResponseHandler.success(data, statusCode);
          // Remove statusCode from the final result since we're setting HTTP status
          const { statusCode: _statusCode, ...finalResult } = result;
          DiscardUnderscores(_statusCode);
          return finalResult;
        }

        // If it has message and data properties
        if (data && typeof data === 'object' && 'message' in data) {
          const messageData = data as { message: string; data?: unknown };
          const result = ResponseHandler.success(
            messageData.message,
            statusCode,
            messageData.data || data
          );
          // Remove statusCode from the final result since we're setting HTTP status
          const { statusCode: _statusCode, ...finalResult } = result;
          DiscardUnderscores(_statusCode);
          return finalResult;
        }

        // Default success response with translation
        const result = await ResponseHandler.successWithTranslation(
          'common.success',
          statusCode,
          data,
          undefined,
          getCurrentLanguage()
        );
        // Remove statusCode from the final result since we're setting HTTP status
        const { statusCode: _statusCode, ...finalResult } = result;
        DiscardUnderscores(_statusCode);
        return finalResult;
      })
    );
  }
}
