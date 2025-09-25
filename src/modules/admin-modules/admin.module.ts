import { Module } from '@nestjs/common';
import { AdminUsersModule } from './admin-users/admin-users.module';

@Module({
  imports: [AdminUsersModule],
  exports: [AdminUsersModule],
})
export class AdminModule {}
