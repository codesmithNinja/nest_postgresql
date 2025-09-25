import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import performanceConfig from './common/config/performance.config';
import securityConfig from './common/config/security.config';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { I18nResponseInterceptor } from './common/interceptors/i18n-response.interceptor';
import { LanguagePersistenceInterceptor } from './common/interceptors/language-persistence.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { I18nModule } from './i18n/i18n.module';
import { MetricsModule } from './metrics/metrics.module';
import { AdminModule } from './modules/admin-modules/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignFaqModule } from './modules/campaign-faq/campaign-faq.module';
import { EquityModule } from './modules/equity/equity.module';
import { ExtrasDocumentModule } from './modules/extras-document/extras-document.module';
import { ExtrasImageModule } from './modules/extras-image/extras-image.module';
import { ExtrasVideoModule } from './modules/extras-video/extras-video.module';
import { LeadInvestorModule } from './modules/lead-investor/lead-investor.module';
import { TeamMemberModule } from './modules/team-member/team-member.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, performanceConfig, securityConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 50, // Moderate limit for all operations
      },
    ]),
    I18nModule,
    DatabaseModule.forRootConditional(),
    EmailModule,
    AuthModule,
    UsersModule,
    AdminModule,
    EquityModule.register(),
    CampaignFaqModule.register(),
    LeadInvestorModule.register(),
    TeamMemberModule.register(),
    ExtrasDocumentModule.register(),
    ExtrasImageModule.register(),
    ExtrasVideoModule.register(),
    HealthModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LanguagePersistenceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
