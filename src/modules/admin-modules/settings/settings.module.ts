import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { GroupTypeValidationMiddleware } from './middleware/group-type-validation.middleware';
import { DatabaseModule } from '../../../database/database.module';
import { FileManagementService } from '../../../common/services/file-management.service';
import { I18nModule } from 'nestjs-i18n';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.forRootConditional(),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 20, // Maximum 20 files
      },
    }),
    // I18nModule, // Temporarily disabled
  ],
  controllers: [SettingsController],
  providers: [SettingsService, FileManagementService],
  exports: [SettingsService],
})
export class SettingsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GroupTypeValidationMiddleware)
      .forRoutes(
        { path: 'settings/:groupType/front', method: RequestMethod.GET },
        { path: 'settings/:groupType/admin', method: RequestMethod.GET },
        { path: 'settings/:groupType/admin', method: RequestMethod.POST },
        { path: 'settings/:groupType/admin', method: RequestMethod.DELETE }
      );
  }
}
