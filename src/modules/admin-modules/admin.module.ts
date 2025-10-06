import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { SettingsModule } from './settings/settings.module';
import { CountriesModule } from './countries/countries.module';
import { LanguagesModule } from './languages/languages.module';

@Module({
  imports: [AdminUsersModule, SettingsModule, CountriesModule, LanguagesModule],
  exports: [AdminUsersModule, SettingsModule, CountriesModule, LanguagesModule],
})
export class AdminModule {}
