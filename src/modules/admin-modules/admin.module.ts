import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { SettingsModule } from './settings/settings.module';
import { CountriesModule } from './countries/countries.module';

@Module({
  imports: [AdminUsersModule, SettingsModule, CountriesModule],
  exports: [AdminUsersModule, SettingsModule, CountriesModule],
})
export class AdminModule {}
