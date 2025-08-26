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

// Investment-specific controllers and services
import { InvestmentController } from './controllers/investment.controller';
import { InvestmentService } from './services/investment.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, microserviceConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // Moderate limit for investment operations
      },
    ]),
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [InvestmentController],
  providers: [
    InvestmentService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class InvestmentModule {}
