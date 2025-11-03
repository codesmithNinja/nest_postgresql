import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { GroupTypeValidationMiddleware } from './middleware/group-type-validation.middleware';
import { DatabaseModule } from '../../../database/database.module';
import { FileManagementService } from '../../../common/services/file-management.service';
import { FileUploadModule } from '../../../common/modules/file-upload.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.forRootConditional(),
    FileUploadModule,
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
