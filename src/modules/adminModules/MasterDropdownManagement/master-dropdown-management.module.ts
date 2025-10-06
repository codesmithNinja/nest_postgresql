import { Module } from '@nestjs/common';
import { LanguageModule } from './language/language.module';
import { ManageDropdownModule } from './manage-dropdown/manage-dropdown.module';

@Module({
  imports: [LanguageModule, ManageDropdownModule],
  exports: [LanguageModule, ManageDropdownModule],
})
export class MasterDropdownManagementModule {}
