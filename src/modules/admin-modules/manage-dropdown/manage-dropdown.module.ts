import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ManageDropdownController } from './manage-dropdown.controller';
import { ManageDropdownService } from './manage-dropdown.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';

// Repositories
import { MANAGE_DROPDOWN_REPOSITORY } from '../../../database/repositories/manage-dropdown/manage-dropdown.repository.interface';
import { ManageDropdownPostgresRepository } from '../../../database/repositories/manage-dropdown/manage-dropdown-postgres.repository';
import { ManageDropdownMongodbRepository } from '../../../database/repositories/manage-dropdown/manage-dropdown-mongodb.repository';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas and Services
import {
  ManageDropdown,
  ManageDropdownSchema,
} from '../../../database/schemas/manage-dropdown.schema';
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
      { name: ManageDropdown.name, schema: ManageDropdownSchema },
      { name: Language.name, schema: LanguageSchema },
    ]),
    AdminUsersModule,
  ],
  controllers: [ManageDropdownController],
  providers: [
    ManageDropdownService,
    PrismaService,
    I18nResponseService,
    {
      provide: MANAGE_DROPDOWN_REPOSITORY,
      useFactory: (
        manageDropdownPostgresRepository: ManageDropdownPostgresRepository,
        manageDropdownMongodbRepository: ManageDropdownMongodbRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return manageDropdownMongodbRepository;
        }
        return manageDropdownPostgresRepository;
      },
      inject: [
        ManageDropdownPostgresRepository,
        ManageDropdownMongodbRepository,
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
    ManageDropdownPostgresRepository,
    ManageDropdownMongodbRepository,
    LanguagesPostgresRepository,
    LanguagesMongodbRepository,
  ],
  exports: [ManageDropdownService, MANAGE_DROPDOWN_REPOSITORY],
})
export class ManageDropdownModule {}
