import { Module, Global } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { I18nResponseService } from '../common/services/i18n-response.service';

@Global()
@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/locales/'),
        watch: false,
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
  providers: [I18nResponseService],
  exports: [I18nResponseService],
})
export class I18nModule {}