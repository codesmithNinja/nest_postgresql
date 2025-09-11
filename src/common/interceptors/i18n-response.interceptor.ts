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
        if (
          response &&
          typeof response === 'object' &&
          'messageKey' in response
        ) {
          const request = context
            .switchToHttp()
            .getRequest<Request & { i18nLang?: string; language?: string }>();
          const lang = request.language || request.i18nLang || 'en';

          if (response.messageKey) {
            try {
              console.log(
                '🔧 Debug - Attempting to translate:',
                response.messageKey,
                'for lang:',
                lang
              );
              const translatedMessage = await this.i18n.translate(
                response.messageKey,
                {
                  lang,
                  args: response.messageArgs || {},
                }
              );

              console.log('🔧 Debug - Translation result:', translatedMessage);
              console.log(
                '🔧 Debug - Translation type:',
                typeof translatedMessage
              );
              console.log(
                '🔧 Debug - Is equal to key?',
                translatedMessage === response.messageKey
              );

              const message =
                typeof translatedMessage === 'string'
                  ? translatedMessage
                  : translatedMessage
                    ? JSON.stringify(translatedMessage)
                    : response.messageKey;

              console.log('🔧 Debug - Final message to send:', message);

              return {
                ...response,
                message,
              } as TranslatedApiResponse | TranslatedErrorResponse;
            } catch (error) {
              console.error('Translation error:', error);
              return response;
            }
          }
        }
        return response;
      })
    );
  }
}
