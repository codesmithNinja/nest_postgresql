import { Module } from '@nestjs/common';
import { TestI18nController } from './test-i18n.controller';
import { I18nResponseService } from '../common/services/i18n-response.service';

@Module({
  controllers: [TestI18nController],
  providers: [I18nResponseService],
})
export class TestI18nModule {}
