import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Import common modules
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../email/email.module';

// Import feature modules
import { AuthModule } from '../../modules/auth/auth.module';
import { UsersModule } from '../../modules/users/users.module';

// Import configurations
import databaseConfig from '../../common/config/database.config';
import microserviceConfig from '../../common/config/microservice.config';

// Admin-specific controllers and services
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUsersService } from './services/admin-users.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, microserviceConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // Higher limit for admin operations
      },
    ]),
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AdminUsersController, AdminDashboardController],
  providers: [
    AdminUsersService,
    AdminDashboardService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AdminModule {}
