import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Import common modules
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../email/email.module';

// Import feature modules
import { AuthModule } from '../../modules/auth/auth.module';
import { UsersModule } from '../../modules/users/users.module';

// Import configurations
import databaseConfig from '../../common/config/database.config';
import microserviceConfig from '../../common/config/microservice.config';
import appConfig from '../../common/config/app.config';

// Import middleware and interceptors
import { SubdomainMiddleware } from '../../common/middleware/subdomain.middleware';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

// Main-specific controllers

import { AppService } from '../../app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, microserviceConfig, appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // Standard limit for APIs
      },
    ]),
    DatabaseModule.forRoot(),
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class UnifiedAppModule {
  static forRoot(enableMicroservices: boolean) {
    return {
      module: UnifiedAppModule, // ✅ SIMPLIFIED RETURN
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware).forRoutes('*');
  }
}
