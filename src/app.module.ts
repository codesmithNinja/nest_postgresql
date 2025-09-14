import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Import common modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { DatabaseModule } from './database/database.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { I18nModule } from './i18n/i18n.module';
import { TestI18nModule } from './examples/test-i18n.module';

// Import configurations
import databaseConfig from './common/config/database.config';
import appConfig from './common/config/app.config';
import performanceConfig from './common/config/performance.config';
import securityConfig from './common/config/security.config';

// Import interceptors and filters
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { I18nResponseInterceptor } from './common/interceptors/i18n-response.interceptor';
import { LanguagePersistenceInterceptor } from './common/interceptors/language-persistence.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

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
    DatabaseModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CampaignModule, // Add campaign system
    HealthModule,
    MetricsModule,
    TestI18nModule, // Test module for i18n
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
