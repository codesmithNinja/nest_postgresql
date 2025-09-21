import { Module, Global } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  I18nJsonLoader,
} from 'nestjs-i18n';
import * as path from 'path';
import { I18nResponseService } from '../common/services/i18n-response.service';

@Global()
@Module({
  imports: [
    NestI18nModule.forRootAsync({
      useFactory: () => {
        const localesPath = path.join(__dirname, 'locales/');
        console.log('I18n locales path:', localesPath);

        return {
          fallbackLanguage: 'en',
          loader: I18nJsonLoader,
          loaderOptions: {
            path: localesPath,
            watch: true,
          },
        };
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        { use: HeaderResolver, options: ['x-lang'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
  providers: [I18nResponseService],
  exports: [NestI18nModule, I18nResponseService],
})
export class I18nModule {}
