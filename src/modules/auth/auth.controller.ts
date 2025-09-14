import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ActivateAccountDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request
  ) {
    const ipAddress = this.getClientIp(req);
    return this.authService.register(registerDto, ipAddress);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // Force 200 status for login
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = this.getClientIp(req);
    return this.authService.login(loginDto, ipAddress);
  }

  @Public()
  @Get('activate')
  async activateAccount(
    @Query(ValidationPipe) activateAccountDto: ActivateAccountDto
  ) {
    return this.authService.activateAccount(activateAccountDto);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto
  ) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto
  ) {
    return this.authService.resetPassword(resetPasswordDto);
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
