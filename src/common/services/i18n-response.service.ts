import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';
import { ResponseHandler } from '../utils/response.handler';
import { ApiResponse, ErrorResponse } from '../utils/response.handler';

@Injectable({ scope: Scope.REQUEST })
export class I18nResponseService {
  constructor(
    private readonly i18n: I18nService,
    @Inject(REQUEST)
    private readonly request: Request & { language?: string; i18nLang?: string }
  ) {}

  private getCurrentLanguage(): string {
    return this.request.language || this.request.i18nLang || 'en';
  }

  async translateAndRespond<T = unknown>(
    messageKey: string,
    statusCode: number = 200,
    data?: T,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ApiResponse<T>> {
    const currentLang = lang || this.getCurrentLanguage();
    const translatedMessage = await this.i18n.translate(messageKey, {
      lang: currentLang,
      args: messageArgs || {},
    });

    const message =
      typeof translatedMessage === 'string'
        ? translatedMessage
        : translatedMessage
          ? JSON.stringify(translatedMessage)
          : messageKey;
    return ResponseHandler.success(message, statusCode, data);
  }

  async translateError(
    messageKey: string,
    statusCode: number,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    const currentLang = lang || this.getCurrentLanguage();
    const translatedMessage = await this.i18n.translate(messageKey, {
      lang: currentLang,
      args: messageArgs || {},
    });

    const message =
      typeof translatedMessage === 'string'
        ? translatedMessage
        : translatedMessage
          ? JSON.stringify(translatedMessage)
          : messageKey;
    return ResponseHandler.error(message, statusCode, error);
  }

  success<T = unknown>(messageKey: string, data?: T) {
    return ResponseHandler.successWithKey(messageKey, 200, data);
  }

  created<T = unknown>(messageKey: string, data?: T) {
    return ResponseHandler.createdWithKey(messageKey, data);
  }

  badRequest(messageKey: string, error?: string) {
    return ResponseHandler.badRequestWithKey(messageKey, error);
  }

  unauthorized(
    messageKey: string = 'auth.unauthorized',
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.unauthorizedWithKey(messageKey, error, messageArgs);
  }

  forbidden(
    messageKey: string = 'auth.forbidden',
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.forbiddenWithKey(messageKey, error, messageArgs);
  }

  notFound(
    messageKey: string = 'common.not_found',
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.notFoundWithKey(messageKey, error, messageArgs);
  }

  conflict(
    messageKey: string = 'common.conflict',
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.conflictWithKey(messageKey, error, messageArgs);
  }

  validationError(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.validationErrorWithKey(
      messageKey,
      error,
      messageArgs
    );
  }

  internalError(
    messageKey: string = 'common.internal_error',
    error?: string,
    messageArgs?: Record<string, string | number>
  ) {
    return ResponseHandler.internalErrorWithKey(messageKey, error, messageArgs);
  }

  async translateBadRequest(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    return this.translateError(messageKey, 400, error, messageArgs, lang);
  }
}
