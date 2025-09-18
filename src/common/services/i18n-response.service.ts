import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';
import { ResponseHandler } from '../utils/response.handler';
import { ApiResponse, ErrorResponse } from '../utils/response.handler';
import { StatusCodes } from 'http-status-codes';

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
    ResponseHandler.setI18nService(this.i18n);
    return ResponseHandler.successWithTranslation(
      messageKey,
      statusCode,
      data,
      messageArgs,
      currentLang
    );
  }

  async translateError(
    messageKey: string,
    statusCode: number,
    error?: string,
    messageArgs?: Record<string, string | number>,
    lang?: string
  ): Promise<ErrorResponse> {
    const currentLang = lang || this.getCurrentLanguage();
    ResponseHandler.setI18nService(this.i18n);
    return ResponseHandler.errorWithTranslation(
      messageKey,
      statusCode,
      error,
      messageArgs,
      currentLang
    );
  }

  async success<T = unknown>(messageKey: string, data?: T) {
    const currentLang = this.getCurrentLanguage();
    ResponseHandler.setI18nService(this.i18n);
    return ResponseHandler.successWithTranslation(
      messageKey,
      StatusCodes.OK,
      data,
      undefined,
      currentLang
    );
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

  // Common admin response methods
  adminLoginSuccess<T = unknown>(data?: T) {
    return this.success('admin.login_success', data);
  }

  adminLogoutSuccess() {
    return this.success('admin.logout_success');
  }

  adminCreated<T = unknown>(data?: T) {
    return this.created('admin.created', data);
  }

  adminUpdated<T = unknown>(data?: T) {
    return this.success('admin.updated', data);
  }

  adminDeleted() {
    return this.success('admin.deleted');
  }

  adminNotFound() {
    return this.notFound('admin.not_found');
  }

  adminProfileRetrieved<T = unknown>(data?: T) {
    return this.success('admin.profile_retrieved', data);
  }

  adminsRetrieved<T = unknown>(data?: T) {
    return this.success('admin.admins_retrieved', data);
  }

  adminPasswordUpdated() {
    return this.success('admin.password_updated');
  }

  // Common user response methods
  userLoginSuccess<T = unknown>(data?: T) {
    return this.success('auth.login_success', data);
  }

  userLogoutSuccess() {
    return this.success('auth.logout_success');
  }

  userRegistered<T = unknown>(data?: T) {
    return this.success('auth.register_success_check_email', data);
  }

  userProfileUpdated<T = unknown>(data?: T) {
    return this.success('user.profile_updated', data);
  }

  userProfileRetrieved<T = unknown>(data?: T) {
    return this.success('user.profile_retrieved', data);
  }

  userPasswordChanged() {
    return this.success('user.password_changed');
  }

  userAccountDeactivated() {
    return this.success('user.account_deactivated');
  }

  // Common error response methods
  invalidCredentials() {
    return this.unauthorized('auth.invalid_credentials');
  }

  adminInvalidCredentials() {
    return this.unauthorized('admin.invalid_credentials');
  }

  emailAlreadyExists() {
    return this.conflict('auth.email_already_exists');
  }

  adminEmailAlreadyExists() {
    return this.conflict('admin.email_already_exists');
  }

  // Generic CRUD response methods
  entityCreated<T = unknown>(entityType: string, data?: T) {
    return this.created(`${entityType}.created`, data);
  }

  entityUpdated<T = unknown>(entityType: string, data?: T) {
    return this.success(`${entityType}.updated`, data);
  }

  entityDeleted(entityType: string) {
    return this.success(`${entityType}.deleted`);
  }

  entityRetrieved<T = unknown>(entityType: string, data?: T) {
    return this.success(`${entityType}.retrieved`, data);
  }

  entityNotFound(entityType: string) {
    return this.notFound(`${entityType}.not_found`);
  }
}
