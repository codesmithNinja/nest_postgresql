import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentGatewayController } from './payment-gateway.controller';
import {
  PaymentGatewayService,
  PAYMENT_GATEWAY_REPOSITORY,
} from './payment-gateway.service';
import { PaymentGatewayPostgresRepository } from '../../../database/repositories/payment-gateway/payment-gateway-postgres.repository';
import { PaymentGatewayMongoRepository } from '../../../database/repositories/payment-gateway/payment-gateway-mongodb.repository';
import {
  PaymentGateway,
  PaymentGatewaySchema,
} from '../../../database/schemas/payment-gateway.schema';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { DatabaseModule } from '../../../database/database.module';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Database modules
    PrismaModule,
    DatabaseModule,

    // MongoDB setup for PaymentGateway schema
    MongooseModule.forFeature([
      { name: PaymentGateway.name, schema: PaymentGatewaySchema },
    ]),
  ],
  controllers: [PaymentGatewayController],
  providers: [
    PaymentGatewayService,
    I18nResponseService,

    // PaymentGateway repository provider - switches between PostgreSQL and MongoDB based on config
    {
      provide: PAYMENT_GATEWAY_REPOSITORY,
      useFactory: (
        paymentGatewayPostgresRepository: PaymentGatewayPostgresRepository,
        paymentGatewayMongoRepository: PaymentGatewayMongoRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        if (databaseType === 'mongodb') {
          return paymentGatewayMongoRepository;
        }

        // Default to PostgreSQL
        return paymentGatewayPostgresRepository;
      },
      inject: [
        PaymentGatewayPostgresRepository,
        PaymentGatewayMongoRepository,
        ConfigService,
      ],
    },

    // Repository implementations
    PaymentGatewayPostgresRepository,
    PaymentGatewayMongoRepository,
  ],
  exports: [PaymentGatewayService, PAYMENT_GATEWAY_REPOSITORY],
})
export class PaymentGatewayModule {}
