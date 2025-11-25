import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MetaSettingsController } from './meta-settings.controller';
import { MetaSettingsService } from './meta-settings.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { FileUploadModule } from '../../../common/modules/file-upload.module';

// Repositories
import { META_SETTING_REPOSITORY } from '../../../database/repositories/meta-setting/meta-setting.repository.interface';
import { MetaSettingPostgresRepository } from '../../../database/repositories/meta-setting/meta-setting-postgres.repository';
import { MetaSettingMongodbRepository } from '../../../database/repositories/meta-setting/meta-setting-mongodb.repository';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas and Services
import {
  MetaSetting,
  MetaSettingSchema,
} from '../../../database/schemas/meta-setting.schema';
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
      { name: MetaSetting.name, schema: MetaSettingSchema },
      { name: Language.name, schema: LanguageSchema },
    ]),
    AdminUsersModule, // For admin authentication
    FileUploadModule, // For file upload utilities
  ],
  controllers: [MetaSettingsController],
  providers: [
    MetaSettingsService,
    PrismaService,
    I18nResponseService,
    {
      provide: META_SETTING_REPOSITORY,
      useFactory: (
        metaSettingPostgresRepository: MetaSettingPostgresRepository,
        metaSettingMongodbRepository: MetaSettingMongodbRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return metaSettingMongodbRepository;
        }
        return metaSettingPostgresRepository;
      },
      inject: [
        MetaSettingPostgresRepository,
        MetaSettingMongodbRepository,
        ConfigService,
      ],
    },
    {
      provide: LANGUAGES_REPOSITORY,
      useFactory: (
        languagesPostgresRepository: LanguagesPostgresRepository,
        languagesMongodbRepository: LanguagesMongodbRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return languagesMongodbRepository;
        }
        return languagesPostgresRepository;
      },
      inject: [
        LanguagesPostgresRepository,
        LanguagesMongodbRepository,
        ConfigService,
      ],
    },
    // Repository providers (needed for factory functions)
    MetaSettingPostgresRepository,
    MetaSettingMongodbRepository,
    LanguagesPostgresRepository,
    LanguagesMongodbRepository,
  ],
  exports: [
    MetaSettingsService,
    META_SETTING_REPOSITORY,
    // Export these in case other modules need meta settings functionality
  ],
})
export class MetaSettingsModule {}
