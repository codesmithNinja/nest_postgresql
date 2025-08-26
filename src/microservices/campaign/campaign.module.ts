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

// Campaign-specific controllers and services
import { CampaignController } from './controllers/campaign.controller';
import { CampaignService } from './services/campaign.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, microserviceConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 50, // Moderate limit for campaign operations
      },
    ]),
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [CampaignController],
  providers: [
    CampaignService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CampaignModule {}
