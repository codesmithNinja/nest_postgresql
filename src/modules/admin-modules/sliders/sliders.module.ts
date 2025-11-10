import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { SlidersController } from './sliders.controller';
import { SlidersService } from './sliders.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { FileUploadModule } from '../../../common/modules/file-upload.module';

// Repositories
import { SLIDERS_REPOSITORY } from '../../../database/repositories/slider/slider.repository.interface';
import { SliderPostgresRepository } from '../../../database/repositories/slider/slider-postgres.repository';
import { SliderMongodbRepository } from '../../../database/repositories/slider/slider-mongodb.repository';
import { LANGUAGES_REPOSITORY } from '../../../database/repositories/languages/languages.repository.interface';
import { LanguagesPostgresRepository } from '../../../database/repositories/languages/languages-postgres.repository';
import { LanguagesMongodbRepository } from '../../../database/repositories/languages/languages-mongodb.repository';

// Schemas and Services
import { Slider, SliderSchema } from '../../../database/schemas/slider.schema';
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
      { name: Slider.name, schema: SliderSchema },
      { name: Language.name, schema: LanguageSchema },
    ]),
    AdminUsersModule, // For admin authentication
    FileUploadModule, // For file upload utilities
  ],
  controllers: [SlidersController],
  providers: [
    SlidersService,
    PrismaService,
    I18nResponseService,
    {
      provide: SLIDERS_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        sliderMongodbRepository: SliderMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return sliderMongodbRepository;
        }
        // Default to PostgreSQL
        return new SliderPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, SliderMongodbRepository],
    },
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
    // MongoDB repository providers (needed for factory functions)
    SliderMongodbRepository,
    LanguagesMongodbRepository,
  ],
  exports: [
    SlidersService,
    SLIDERS_REPOSITORY,
    // Export these in case other modules need slider functionality
  ],
})
export class SlidersModule {}
