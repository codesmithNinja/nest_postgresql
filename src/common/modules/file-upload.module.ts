import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UniversalFileProcessingService } from '../services/universal-file-processing.service';
import { UniversalFileUploadInterceptor } from '../interceptors/universal-file-upload.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [UniversalFileProcessingService, UniversalFileUploadInterceptor],
  exports: [UniversalFileProcessingService, UniversalFileUploadInterceptor],
})
export class FileUploadModule {}
