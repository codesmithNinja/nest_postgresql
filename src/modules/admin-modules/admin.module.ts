import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [AdminUsersModule, SettingsModule],
  exports: [AdminUsersModule, SettingsModule],
})
export class AdminModule {}
