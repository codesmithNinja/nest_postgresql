import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { SettingsModule } from './settings/settings.module';
import { CountriesModule } from './countries/countries.module';
import { LanguagesModule } from './languages/languages.module';
import { ManageDropdownModule } from './manage-dropdown/manage-dropdown.module';
import { CurrenciesModule } from './currencies/currencies.module';

@Module({
  imports: [
    AdminUsersModule,
    SettingsModule,
    CountriesModule,
    LanguagesModule,
    ManageDropdownModule,
    CurrenciesModule,
  ],
  exports: [
    AdminUsersModule,
    SettingsModule,
    CountriesModule,
    LanguagesModule,
    ManageDropdownModule,
    CurrenciesModule,
  ],
})
export class AdminModule {}
