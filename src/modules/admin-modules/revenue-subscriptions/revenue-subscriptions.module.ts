import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers and Services
import { RevenueSubscriptionsController } from './revenue-subscriptions.controller';
import { RevenueSubscriptionsService } from './revenue-subscriptions.service';

// Repository Interfaces and Tokens
import {
  REVENUE_SUBSCRIPTION_REPOSITORY,
  REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY,
} from '../../../database/repositories/revenue-subscription/revenue-subscription.repository.interface';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';

// PostgreSQL Repository Implementations
import { RevenueSubscriptionPostgresRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription-postgres.repository';
import { RevenueSubscriptionLanguagePostgresRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription-language-postgres.repository';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';

// MongoDB Repository Implementations
import { RevenueSubscriptionMongoRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription-mongodb.repository';
import { RevenueSubscriptionLanguageMongoRepository } from '../../../database/repositories/revenue-subscription/revenue-subscription-language-mongodb.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas
import {
  RevenueSubscription,
  RevenueSubscriptionSchema,
} from '../../../database/schemas/revenue-subscription.schema';
import {
  RevenueSubscriptionLanguage,
  RevenueSubscriptionLanguageSchema,
} from '../../../database/schemas/revenue-subscription-language.schema';
import {
  Language,
  LanguageSchema,
} from '../../../database/schemas/language.schema';

// Services
import { PrismaService } from '../../../database/prisma/prisma.service';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

// Modules
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { DatabaseModule } from '../../../database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Database modules
    PrismaModule,
    DatabaseModule,

    // MongoDB setup for Revenue Subscription schemas
    MongooseModule.forFeature([
      { name: RevenueSubscription.name, schema: RevenueSubscriptionSchema },
      {
        name: RevenueSubscriptionLanguage.name,
        schema: RevenueSubscriptionLanguageSchema,
      },
      { name: Language.name, schema: LanguageSchema },
    ]),
  ],
  controllers: [RevenueSubscriptionsController],
  providers: [
    RevenueSubscriptionsService,
    PrismaService,
    I18nResponseService,

    // Revenue Subscription Repository Provider
    {
      provide: REVENUE_SUBSCRIPTION_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        revenueSubscriptionMongoRepository: RevenueSubscriptionMongoRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        if (databaseType === 'mongodb') {
          return revenueSubscriptionMongoRepository;
        }

        // Default to PostgreSQL
        return new RevenueSubscriptionPostgresRepository(prismaService);
      },
      inject: [
        ConfigService,
        PrismaService,
        RevenueSubscriptionMongoRepository,
      ],
    },

    // Revenue Subscription Language Repository Provider
    {
      provide: REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        revenueSubscriptionLanguageMongoRepository: RevenueSubscriptionLanguageMongoRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        if (databaseType === 'mongodb') {
          return revenueSubscriptionLanguageMongoRepository;
        }

        // Default to PostgreSQL
        return new RevenueSubscriptionLanguagePostgresRepository(prismaService);
      },
      inject: [
        ConfigService,
        PrismaService,
        RevenueSubscriptionLanguageMongoRepository,
      ],
    },

    // Language Repository Provider (reused from existing implementation)
    {
      provide: LANGUAGES_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languageMongoRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        if (databaseType === 'mongodb') {
          return languageMongoRepository;
        }

        // Default to PostgreSQL
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },

    // MongoDB Repository Implementations
    RevenueSubscriptionMongoRepository,
    RevenueSubscriptionLanguageMongoRepository,
    LanguagesMongodbRepository,
  ],
  exports: [
    RevenueSubscriptionsService,
    REVENUE_SUBSCRIPTION_REPOSITORY,
    REVENUE_SUBSCRIPTION_LANGUAGE_REPOSITORY,
  ],
})
export class RevenueSubscriptionsModule {}
