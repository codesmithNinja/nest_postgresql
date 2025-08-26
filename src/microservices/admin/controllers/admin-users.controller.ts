import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminUsersService } from '../services/admin-users.service';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

interface AdminQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UpdateUserStatusDto {
  status: ActiveStatus; // ✅ USE PROPER ENUM TYPE
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  @Get()
  async getAllUsers(@Query() query: AdminQueryDto) {
    return this.adminUsersService.getAllUsers(query);
  }

  @Get('stats')
  async getUserStats() {
    return this.adminUsersService.getUserStats();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStatusDto: UpdateUserStatusDto
  ) {
    return this.adminUsersService.updateUserStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  @Post(':id/send-activation')
  async sendActivationEmail(@Param('id') id: string) {
    return this.adminUsersService.sendActivationEmail(id);
  }

  @Get('export/csv')
  async exportUsers(@Query() query: AdminQueryDto) {
    return this.adminUsersService.exportUsers(query);
  }
}
