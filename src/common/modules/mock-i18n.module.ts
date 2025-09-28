import { Module, Global } from '@nestjs/common';
import { MockI18nResponseService, MockI18nService } from '../services/mock-i18n-response.service';
import { I18nResponseService } from '../services/i18n-response.service';
import { I18nService } from 'nestjs-i18n';

@Global()
@Module({
  providers: [
    {
      provide: I18nResponseService,
      useClass: MockI18nResponseService,
    },
    {
      provide: I18nService,
      useClass: MockI18nService,
    },
  ],
  exports: [I18nResponseService, I18nService],
})
export class MockI18nModule {}