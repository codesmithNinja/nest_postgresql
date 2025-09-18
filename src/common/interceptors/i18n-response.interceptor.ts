import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';
import {
  TranslatedApiResponse,
  TranslatedErrorResponse,
} from '../interfaces/i18n-response.interface';
import { ApiResponse, ErrorResponse } from '../utils/response.handler';

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse | ErrorResponse> {
    return next.handle().pipe(
      switchMap(async (response: ApiResponse | ErrorResponse) => {
        // Check if response has messageKey OR if message looks like a translation key
        if (
          response &&
          typeof response === 'object' &&
          ('messageKey' in response ||
           (response.message && typeof response.message === 'string' && response.message.includes('.')))
        ) {
          const translationKey = response.messageKey || response.message;

          const request = context
            .switchToHttp()
            .getRequest<Request & { i18nLang?: string; language?: string }>();
          const lang = request.language || request.i18nLang || 'en';

          if (translationKey) {
            try {
              const translatedMessage = await this.i18n.translate(
                translationKey,
                {
                  lang,
                  args: response.messageArgs || {},
                }
              );

              const message =
                typeof translatedMessage === 'string'
                  ? translatedMessage
                  : translatedMessage
                    ? JSON.stringify(translatedMessage)
                    : translationKey;

              delete response.messageKey;
              delete response.messageArgs;

              return {
                ...response,
                message,
              } as TranslatedApiResponse | TranslatedErrorResponse;
            } catch (error) {
              console.error('I18nResponseInterceptor - Translation error:', error);
              return response;
            }
          }
        }
        return response;
      })
    );
  }
}
