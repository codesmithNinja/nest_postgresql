import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';

// Repositories
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas and Services
import {
  Language,
  LanguageSchema,
} from '../../../database/schemas/language.schema';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
    ]),
    AdminUsersModule,
  ],
  controllers: [LanguagesController],
  providers: [
    LanguagesService,
    PrismaService,
    I18nResponseService,
    {
      provide: LANGUAGES_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        languagesMongodbRepository: LanguagesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        // Default to PostgreSQL
        return new LanguagesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, LanguagesMongodbRepository],
    },
    LanguagesMongodbRepository,
  ],
  exports: [LanguagesService, LANGUAGES_REPOSITORY],
})
export class LanguagesModule {}
