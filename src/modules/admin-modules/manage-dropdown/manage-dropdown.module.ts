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

// Schemas and Services
import {
  ManageDropdown,
  ManageDropdownSchema,
} from '../../../database/schemas/manage-dropdown.schema';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ManageDropdown.name, schema: ManageDropdownSchema },
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
        configService: ConfigService,
        prismaService: PrismaService,
        manageDropdownMongodbRepository: ManageDropdownMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');
        if (databaseType === 'mongodb') {
          return manageDropdownMongodbRepository;
        }
        // Default to PostgreSQL
        return new ManageDropdownPostgresRepository(prismaService);
      },
      inject: [ConfigService, PrismaService, ManageDropdownMongodbRepository],
    },
    ManageDropdownMongodbRepository,
  ],
  exports: [ManageDropdownService, MANAGE_DROPDOWN_REPOSITORY],
})
export class ManageDropdownModule {}
