import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { PrismaModule } from '../../../../database/prisma/prisma.module';
import { MongoDBModule } from '../../../../database/mongodb/mongodb.module';
import { DatabaseType } from '../../../../common/enums/database-type.enum';
import { LANGUAGE_REPOSITORY } from '../../../../database/repositories/language/language.repository.interface';
import { LanguagePostgresRepository } from '../../../../database/repositories/language/language-postgres.repository';
import { LanguageMongodbRepository } from '../../../../database/repositories/language/language-mongodb.repository';
import {
  Language,
  LanguageSchema,
} from '../../../../database/schemas/language.schema';
import { MasterDropdownCacheService } from '../utils/cache.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MongoDBModule.forRoot(),
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
    ]),
  ],
  controllers: [LanguageController],
  providers: [
    LanguageService,
    MasterDropdownCacheService,
    {
      provide: LANGUAGE_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        languagePostgresRepository: LanguagePostgresRepository,
        languageMongodbRepository: LanguageMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        switch (databaseType) {
          case DatabaseType.POSTGRES:
            return languagePostgresRepository;
          case DatabaseType.MONGODB:
            return languageMongodbRepository;
          default:
            throw new Error(`Unsupported database type: ${databaseType}`);
        }
      },
      inject: [
        ConfigService,
        LanguagePostgresRepository,
        LanguageMongodbRepository,
      ],
    },
    LanguagePostgresRepository,
    LanguageMongodbRepository,
  ],
  exports: [LanguageService, MasterDropdownCacheService, LANGUAGE_REPOSITORY],
})
export class LanguageModule {}
