import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { MasterDropdownManagementModule } from './MasterDropdownManagement/master-dropdown-management.module';

@Module({
  imports: [AdminUsersModule, MasterDropdownManagementModule],
  exports: [AdminUsersModule, MasterDropdownManagementModule],
})
export class AdminModulesModule {}
