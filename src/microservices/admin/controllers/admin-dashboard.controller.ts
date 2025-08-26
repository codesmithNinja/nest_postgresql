import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { ResponseHandler } from '../../../common/utils/response.handler';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(private adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    const stats = await this.adminDashboardService.getDashboardStats();
    return ResponseHandler.success(
      'Dashboard statistics retrieved successfully',
      200,
      stats
    );
  }

  @Get('recent-activities')
  async getRecentActivities() {
    const activities = await this.adminDashboardService.getRecentActivities();
    return ResponseHandler.success(
      'Recent activities retrieved successfully',
      200,
      activities
    );
  }

  @Get('system-health')
  async getSystemHealth() {
    const health = await this.adminDashboardService.getSystemHealth();
    return ResponseHandler.success(
      'System health retrieved successfully',
      200,
      health
    );
  }
}
