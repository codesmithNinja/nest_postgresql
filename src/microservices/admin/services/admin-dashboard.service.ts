import { Injectable, Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../database/repositories/user/user.repository.interface';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository
  ) {}

  async getDashboardStats() {
    const [totalUsers, activeUsers, pendingUsers, todayRegistrations] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ active: ActiveStatus.ACTIVE }),
        this.userRepository.count({ active: ActiveStatus.PENDING }),
        this.getTodayRegistrations(),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        todayRegistrations,
      },
      campaigns: {
        total: 0, // Placeholder - implement when campaign repository is available
        active: 0,
        completed: 0,
        totalFunded: 0,
      },
      investments: {
        total: 0, // Placeholder - implement when investment repository is available
        totalAmount: 0,
        pending: 0,
        completed: 0,
      },
      revenue: {
        today: 0,
        thisMonth: 0,
        thisYear: 0,
        growth: 0,
      },
    };
  }

  async getRecentActivities() {
    // Placeholder implementation
    // In real implementation, you would fetch from activity log or audit trail
    return {
      activities: [
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered',
          timestamp: new Date(),
          user: 'John Doe',
        },
        // Add more activities...
      ],
    };
  }

  async getSystemHealth() {
    const databaseHealth = await this.checkDatabaseHealth();

    return {
      status: 'healthy',
      database: databaseHealth,
      services: {
        main: 'healthy',
        admin: 'healthy',
        campaign: 'healthy',
        investment: 'healthy',
      },
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage:
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
          100,
      },
      timestamp: new Date(),
    };
  }

  private async getTodayRegistrations(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This is a simplified implementation
    // In real implementation, you would filter by createdAt >= today
    try {
      return await this.userRepository.count();
    } catch (error) {
      return 0;
    }
  }

  private async checkDatabaseHealth(): Promise<{
    status: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      await this.userRepository.count();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    }
  }
}
