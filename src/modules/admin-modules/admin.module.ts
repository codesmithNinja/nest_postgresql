import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { SettingsModule } from './settings/settings.module';
import { CountriesModule } from './countries/countries.module';
import { LanguagesModule } from './languages/languages.module';
import { ManageDropdownModule } from './manage-dropdown/manage-dropdown.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { SlidersModule } from './sliders/sliders.module';
import { RevenueSubscriptionsModule } from './revenue-subscriptions/revenue-subscriptions.module';
import { MetaSettingsModule } from './meta-settings/meta-settings.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { PaymentGatewayModule } from './payment-gateway/payment-gateway.module';

@Module({
  imports: [
    AdminUsersModule,
    SettingsModule,
    CountriesModule,
    LanguagesModule,
    ManageDropdownModule,
    CurrenciesModule,
    SlidersModule,
    RevenueSubscriptionsModule,
    MetaSettingsModule,
    EmailTemplatesModule,
    PaymentGatewayModule,
  ],
  exports: [
    AdminUsersModule,
    SettingsModule,
    CountriesModule,
    LanguagesModule,
    ManageDropdownModule,
    CurrenciesModule,
    SlidersModule,
    RevenueSubscriptionsModule,
    MetaSettingsModule,
    EmailTemplatesModule,
    PaymentGatewayModule,
  ],
})
export class AdminModule {}
