import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { FileUploadModule } from '../../../common/modules/file-upload.module';

// Repositories
import { COUNTRIES_REPOSITORY } from '../../../database/repositories/countries/countries.repository.interface';
import { CountriesPostgresRepository } from '../../../database/repositories/countries/countries-postgres.repository';
import { CountriesMongodbRepository } from '../../../database/repositories/countries/countries-mongodb.repository';

// Schemas and Services
import {
  Country,
  CountrySchema,
} from '../../../database/schemas/country.schema';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Country.name, schema: CountrySchema }]),
    AdminUsersModule,
    FileUploadModule,
  ],
  controllers: [CountriesController],
  providers: [
    CountriesService,
    PrismaService,
    I18nResponseService,
    {
      provide: COUNTRIES_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        countriesMongodbRepository: CountriesMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return countriesMongodbRepository;
        }
        // Default to PostgreSQL
        return new CountriesPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, CountriesMongodbRepository],
    },
    CountriesMongodbRepository,
  ],
  exports: [CountriesService, COUNTRIES_REPOSITORY],
})
export class CountriesModule {}
