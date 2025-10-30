import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService, CURRENCY_REPOSITORY } from './currencies.service';
import { CurrencyPostgresRepository } from '../../../database/repositories/currencies/currency-postgres.repository';
import { CurrencyMongoRepository } from '../../../database/repositories/currencies/currency-mongodb.repository';
import {
  Currency,
  CurrencySchema,
} from '../../../database/schemas/currency.schema';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { DatabaseModule } from '../../../database/database.module';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Database modules
    PrismaModule,
    DatabaseModule,

    // MongoDB setup for Currency schema
    MongooseModule.forFeature([
      { name: Currency.name, schema: CurrencySchema },
    ]),
  ],
  controllers: [CurrenciesController],
  providers: [
    CurrenciesService,
    I18nResponseService,

    // Currency repository provider - switches between PostgreSQL and MongoDB based on config
    {
      provide: CURRENCY_REPOSITORY,
      useFactory: (
        currencyPostgresRepository: CurrencyPostgresRepository,
        currencyMongoRepository: CurrencyMongoRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        if (databaseType === 'mongodb') {
          return currencyMongoRepository;
        }

        // Default to PostgreSQL
        return currencyPostgresRepository;
      },
      inject: [
        CurrencyPostgresRepository,
        CurrencyMongoRepository,
        ConfigService,
      ],
    },

    // Repository implementations
    CurrencyPostgresRepository,
    CurrencyMongoRepository,
  ],
  exports: [CurrenciesService, CURRENCY_REPOSITORY],
})
export class CurrenciesModule {}
