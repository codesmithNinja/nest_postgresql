import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';
import {
  TranslatedApiResponse,
  TranslatedErrorResponse,
} from '../interfaces/i18n-response.interface';
import { ApiResponse, ErrorResponse } from '../utils/response.handler';
import * as fs from 'fs';
import * as path from 'path';

interface RequestWithLanguage extends Request {
  language?: string;
  i18nLang?: string;
}

interface TranslationCache {
  [lang: string]: {
    [key: string]: string;
  };
}

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  private static translationCache: TranslationCache = {};

  constructor(private readonly i18n: I18nService) {
    this.loadTranslations();
  }

  private loadTranslations() {
    if (Object.keys(I18nResponseInterceptor.translationCache).length > 0) {
      return; // Already loaded
    }

    const languages = ['en', 'es', 'fr', 'ar'];
    const basePath = path.join(__dirname, '../../i18n/locales');

    languages.forEach((lang) => {
      try {
        const filePath = path.join(basePath, lang, 'translations.json');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const translations = JSON.parse(content) as Record<string, unknown>;
          I18nResponseInterceptor.translationCache[lang] =
            this.flattenTranslations(translations);
        }
      } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
      }
    });
  }

  private flattenTranslations(
    obj: Record<string, unknown>,
    prefix = ''
  ): { [key: string]: string } {
    const flattened: { [key: string]: string } = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          Object.assign(
            flattened,
            this.flattenTranslations(value as Record<string, unknown>, newKey)
          );
        } else {
          flattened[newKey] = value as string;
        }
      }
    }

    return flattened;
  }

  private manualTranslate(key: string, lang: string): string {
    const translations = I18nResponseInterceptor.translationCache[lang];
    return translations?.[key] || key;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse | ErrorResponse> {
    const request = context.switchToHttp().getRequest<RequestWithLanguage>();

    return next.handle().pipe(
      mergeMap((response: ApiResponse | ErrorResponse) => {
        // Check if response has messageKey OR if message looks like a translation key
        if (
          response &&
          typeof response === 'object' &&
          ('messageKey' in response ||
            (response.message &&
              typeof response.message === 'string' &&
              response.message.includes('.')))
        ) {
          const translationKey = response.messageKey || response.message;

          // Get language from request (set by LanguagePersistenceInterceptor)
          const lang = request.language || request.i18nLang || 'en';

          if (translationKey) {
            try {
              // Use manual translation method for reliability
              const message = this.manualTranslate(translationKey, lang);

              delete response.messageKey;
              delete response.messageArgs;

              return of({
                ...response,
                message,
              } as TranslatedApiResponse | TranslatedErrorResponse);
            } catch (error) {
              console.error(
                'I18nResponseInterceptor - Translation error:',
                error
              );
              return of(response);
            }
          }
        }
        return of(response);
      })
    );
  }
}
