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

  translateAndRespond<T = unknown>(
    messageKey: string,
    statusCode: number = 200,
    data?: T,
    messageArgs?: Record<string, string | number>
  ): ApiResponse<T> {
    return ResponseHandler.successWithKey(
      messageKey,
      statusCode,
      data,
      messageArgs
    );
  }

  translateError(
    messageKey: string,
    statusCode: number,
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return ResponseHandler.errorWithKey(
      messageKey,
      statusCode,
      error,
      messageArgs
    );
  }

  success<T = unknown>(messageKey: string, data?: T) {
    return ResponseHandler.successWithKey(messageKey, StatusCodes.OK, data);
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

  translateBadRequest(
    messageKey: string,
    error?: string,
    messageArgs?: Record<string, string | number>
  ): ErrorResponse {
    return ResponseHandler.badRequestWithKey(messageKey, error, messageArgs);
  }

  // Common admin response methods
  adminLoginSuccess<T = unknown>(data?: T) {
    return this.success('admin.login_success', data);
  }

  adminLogoutSuccess() {
    return this.success('admin.logout_success');
  }

  adminCreated<T = unknown>(data?: T) {
    return this.created('admin_users.created_successfully', data);
  }

  adminUpdated<T = unknown>(data?: T) {
    return this.success('admin_users.updated_successfully', data);
  }

  adminDeleted() {
    return this.success('admin_users.deleted_successfully');
  }

  adminNotFound() {
    return this.notFound('admin_users.not_found');
  }

  adminProfileRetrieved<T = unknown>(data?: T) {
    return this.success('admin_users.profile_retrieved_successfully', data);
  }

  adminsRetrieved<T = unknown>(data?: T) {
    return this.success('admin_users.admins_retrieved_successfully', data);
  }

  adminPasswordUpdated() {
    return this.success('admin_users.password_updated_successfully');
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
    return this.success('user.profile_updated_successfully', data);
  }

  userProfileRetrieved<T = unknown>(data?: T) {
    return this.success('user.profile_retrieved_successfully', data);
  }

  userPasswordChanged() {
    return this.success('user.password_changed_successfully');
  }

  userAccountDeactivated() {
    return this.success('user.account_deactivated_successfully');
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
    return this.created(`${entityType}.created_successfully`, data);
  }

  entityUpdated<T = unknown>(entityType: string, data?: T) {
    return this.success(`${entityType}.updated_successfully`, data);
  }

  entityDeleted(entityType: string) {
    return this.success(`${entityType}.deleted_successfully`);
  }

  entityRetrieved<T = unknown>(entityType: string, data?: T) {
    return this.success(`${entityType}.retrieved_successfully`, data);
  }

  entityNotFound(entityType: string) {
    return this.notFound(`${entityType}.not_found`);
  }
}
