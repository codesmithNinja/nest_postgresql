import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AppController } from '../../app.controller';
import { AppService } from '../../app.service';

// Admin controllers (conditionally imported)
import { AdminUsersController } from '../../microservices/admin/controllers/admin-users.controller';
import { AdminDashboardController } from '../../microservices/admin/controllers/admin-dashboard.controller';
import { AdminUsersService } from '../../microservices/admin/services/admin-users.service';
import { AdminDashboardService } from '../../microservices/admin/services/admin-dashboard.service';

// Campaign controllers (conditionally imported)
import { CampaignController } from '../../microservices/campaign/controllers/campaign.controller';
import { CampaignService } from '../../microservices/campaign/services/campaign.service';

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
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [], // Will be populated dynamically
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
    const controllers = [AppController];
    const providers = [AppService];

    // If microservices are disabled, add all controllers to single app
    if (!enableMicroservices) {
      // Add admin controllers
      controllers.push(AdminUsersController, AdminDashboardController);
      providers.push(AdminUsersService, AdminDashboardService);

      // Add campaign controllers
      controllers.push(CampaignController);
      providers.push(CampaignService);

      // Add investment controllers (when created)
      // controllers.push(InvestmentController);
      // providers.push(InvestmentService);
    }

    return {
      module: UnifiedAppModule,
      controllers,
      providers: [
        ...providers,
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseInterceptor,
        },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware).forRoutes('*');
  }
}
