import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ManageDropdownController } from './manage-dropdown.controller';
import { ManageDropdownService } from './manage-dropdown.service';
import { PrismaModule } from '../../../../database/prisma/prisma.module';
import { MongoDBModule } from '../../../../database/mongodb/mongodb.module';
import { DatabaseType } from '../../../../common/enums/database-type.enum';
import { MANAGE_DROPDOWN_REPOSITORY } from '../../../../database/repositories/manage-dropdown/manage-dropdown.repository.interface';
import { ManageDropdownPostgresRepository } from '../../../../database/repositories/manage-dropdown/manage-dropdown-postgres.repository';
import { ManageDropdownMongodbRepository } from '../../../../database/repositories/manage-dropdown/manage-dropdown-mongodb.repository';
import {
  ManageDropdown,
  ManageDropdownSchema,
} from '../../../../database/schemas/manage-dropdown.schema';
import { LanguageModule } from '../language/language.module';
import { MasterDropdownCacheService } from '../utils/cache.service';
import { LanguageDetectionService } from '../utils/language-detection.service';
import { EnhancedLanguageDetectionMiddleware } from '../middleware/enhanced-language-detection.middleware';
import { DropdownTypeValidationMiddleware } from '../middleware/dropdown-type-validation.middleware';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MongoDBModule.forRoot(),
    LanguageModule,
    MongooseModule.forFeature([
      { name: ManageDropdown.name, schema: ManageDropdownSchema },
    ]),
  ],
  controllers: [ManageDropdownController],
  providers: [
    ManageDropdownService,
    MasterDropdownCacheService,
    LanguageDetectionService,
    EnhancedLanguageDetectionMiddleware,
    DropdownTypeValidationMiddleware,
    {
      provide: MANAGE_DROPDOWN_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        manageDropdownPostgresRepository: ManageDropdownPostgresRepository,
        manageDropdownMongodbRepository: ManageDropdownMongodbRepository
      ) => {
        const databaseType = configService.get<string>('DATABASE_TYPE');

        switch (databaseType) {
          case DatabaseType.POSTGRES:
            return manageDropdownPostgresRepository;
          case DatabaseType.MONGODB:
            return manageDropdownMongodbRepository;
          default:
            throw new Error(`Unsupported database type: ${databaseType}`);
        }
      },
      inject: [
        ConfigService,
        ManageDropdownPostgresRepository,
        ManageDropdownMongodbRepository,
      ],
    },
    ManageDropdownPostgresRepository,
    ManageDropdownMongodbRepository,
  ],
  exports: [
    ManageDropdownService,
    MasterDropdownCacheService,
    LanguageDetectionService,
    MANAGE_DROPDOWN_REPOSITORY,
  ],
})
export class ManageDropdownModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        EnhancedLanguageDetectionMiddleware,
        DropdownTypeValidationMiddleware
      )
      .forRoutes(ManageDropdownController);
  }
}
