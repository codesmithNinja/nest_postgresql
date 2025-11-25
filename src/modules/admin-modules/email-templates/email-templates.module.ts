import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';

// Repositories
import { EMAIL_TEMPLATE_REPOSITORY } from '../../../database/repositories/email-template/email-template.repository.interface';
import { EmailTemplatePostgresRepository } from '../../../database/repositories/email-template/email-template-postgres.repository';
import { EmailTemplateMongodbRepository } from '../../../database/repositories/email-template/email-template-mongodb.repository';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas and Services
import {
  EmailTemplate,
  EmailTemplateSchema,
} from '../../../database/schemas/email-template.schema';
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
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: Language.name, schema: LanguageSchema },
    ]),
    AdminUsersModule, // For admin authentication
  ],
  controllers: [EmailTemplatesController],
  providers: [
    EmailTemplatesService,
    PrismaService,
    I18nResponseService,
    {
      provide: EMAIL_TEMPLATE_REPOSITORY,
      useFactory: (
        emailTemplatePostgresRepository: EmailTemplatePostgresRepository,
        emailTemplateMongodbRepository: EmailTemplateMongodbRepository,
        configService: ConfigService
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return emailTemplateMongodbRepository;
        }
        return emailTemplatePostgresRepository;
      },
      inject: [
        EmailTemplatePostgresRepository,
        EmailTemplateMongodbRepository,
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
    EmailTemplatePostgresRepository,
    EmailTemplateMongodbRepository,
    LanguagesPostgresRepository,
    LanguagesMongodbRepository,
  ],
  exports: [
    EmailTemplatesService,
    EMAIL_TEMPLATE_REPOSITORY,
    // Export these in case other modules need email templates functionality
  ],
})
export class EmailTemplatesModule {}
