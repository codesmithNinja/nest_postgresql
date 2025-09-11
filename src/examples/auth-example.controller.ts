import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from '../modules/auth/auth.service';
import {
  RegisterDto,
  LoginDto,
  ActivateAccountDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../modules/auth/dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { I18nResponseService } from '../common/services/i18n-response.service';

// This is an example controller showing how to use i18n with the existing auth controller
// Replace your existing auth controller with this pattern

@Controller('auth')
export class AuthExampleController {
  constructor(
    private authService: AuthService,
    private i18nResponseService: I18nResponseService,
    private i18n: I18nService
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request
  ) {
    try {
      const ipAddress = this.getClientIp(req);
      const result = await this.authService.register(registerDto, ipAddress);

      // Use i18n response service for translated responses
      return this.i18nResponseService.created('auth.register_success', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('already exists')) {
        return this.i18nResponseService.conflict('auth.email_already_exists');
      }
      return this.i18nResponseService.internalError();
    }
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Req() req: Request) {
    try {
      const ipAddress = this.getClientIp(req);
      const result = await this.authService.login(loginDto, ipAddress);

      return this.i18nResponseService.success('auth.login_success', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Invalid credentials')) {
        return this.i18nResponseService.unauthorized(
          'auth.invalid_credentials'
        );
      }
      if (errorMessage.includes('not activated')) {
        return this.i18nResponseService.forbidden('auth.account_not_activated');
      }
      return this.i18nResponseService.internalError();
    }
  }

  @Public()
  @Get('activate')
  async activateAccount(
    @Query(ValidationPipe) activateAccountDto: ActivateAccountDto
  ) {
    try {
      const result = await this.authService.activateAccount(activateAccountDto);
      return this.i18nResponseService.success('auth.account_activated', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('expired')) {
        return this.i18nResponseService.badRequest('auth.token_expired');
      }
      if (errorMessage.includes('invalid')) {
        return this.i18nResponseService.badRequest('auth.token_invalid');
      }
      return this.i18nResponseService.internalError();
    }
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto
  ) {
    try {
      await this.authService.forgotPassword(forgotPasswordDto);
      return this.i18nResponseService.success('auth.password_reset_sent');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('not found')) {
        return this.i18nResponseService.notFound('user.user_not_found');
      }
      return this.i18nResponseService.internalError();
    }
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto
  ) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      return this.i18nResponseService.success(
        'auth.password_reset_success',
        result
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('expired')) {
        return this.i18nResponseService.badRequest('auth.token_expired');
      }
      if (errorMessage.includes('invalid')) {
        return this.i18nResponseService.badRequest('auth.token_invalid');
      }
      return this.i18nResponseService.internalError();
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;

    return (
      forwardedIp?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}
