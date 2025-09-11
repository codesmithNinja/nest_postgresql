import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { I18nResponseService } from '../common/services/i18n-response.service';

@Controller('test-i18n')
export class TestI18nController {
  constructor(private readonly i18nResponseService: I18nResponseService) {}

  @Public()
  @Get('success')
  testSuccess(@Query('key') key: string = 'common.success') {
    return this.i18nResponseService.success(key);
  }

  @Public()
  @Get('error')
  testError(@Query('key') key: string = 'common.error') {
    return this.i18nResponseService.badRequest(key);
  }

  @Public()
  @Get('auth-success')
  testAuthSuccess() {
    return this.i18nResponseService.success('auth.login_success', {
      user: { id: 1, name: 'Test User' },
      token: 'sample-jwt-token',
    });
  }

  @Public()
  @Get('auth-error')
  testAuthError() {
    return this.i18nResponseService.unauthorized('auth.invalid_credentials');
  }

  @Public()
  @Get('validation-error')
  testValidationError() {
    return this.i18nResponseService.validationError(
      'validation.required_field',
      undefined,
      {
        field: 'email',
      }
    );
  }

  @Public()
  @Get('user-not-found')
  testUserNotFound() {
    return this.i18nResponseService.notFound('user.user_not_found');
  }

  @Public()
  @Get('all-languages')
  async testAllLanguages() {
    const languages = ['en', 'es', 'fr'];
    const testKey = 'auth.login_success';

    const results: Record<string, string> = {};
    for (const lang of languages) {
      const translatedMessage =
        await this.i18nResponseService.translateAndRespond(
          testKey,
          200,
          { test: true },
          {},
          lang
        );
      results[lang] = translatedMessage.message;
    }

    return this.i18nResponseService.success('common.success', results);
  }
}
