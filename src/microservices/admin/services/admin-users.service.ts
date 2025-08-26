import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../database/repositories/user/user.repository.interface';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

interface AdminQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository
  ) {}

  async getAllUsers(query: AdminQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (status) {
      filter.active = status;
    }

    if (search) {
      // This would need to be implemented differently for MongoDB vs Postgres
      // For now, implementing a basic email search
      filter.email = { $regex: search, $options: 'i' }; // MongoDB syntax
    }

    // Build sort options
    const sort = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };

    const [users, totalCount] = await Promise.all([
      this.userRepository.findMany(filter, {
        skip,
        limit,
        sort,
        select: [
          'id',
          'firstName',
          'lastName',
          'email',
          'active',
          'userType',
          'signupIpAddress',
          'loginIpAddress',
          'createdAt',
          'updatedAt',
        ],
      }),
      this.userRepository.count(filter),
    ]);

    return {
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
    };
  }

  async getUserStats() {
    const [totalUsers, activeUsers, pendingUsers, inactiveUsers, deletedUsers] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ active: ActiveStatus.ACTIVE }),
        this.userRepository.count({ active: ActiveStatus.PENDING }),
        this.userRepository.count({ active: ActiveStatus.INACTIVE }),
        this.userRepository.count({ active: ActiveStatus.DELETED }),
      ]);

    return {
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        pendingUsers,
        inactiveUsers,
        deletedUsers,
        percentages: {
          active: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          pending: totalUsers > 0 ? (pendingUsers / totalUsers) * 100 : 0,
          inactive: totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0,
          deleted: totalUsers > 0 ? (deletedUsers / totalUsers) * 100 : 0,
        },
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data for admin view
    const { password, twoFactorSecretKey, ...userWithoutSensitiveData } =
      user as any;

    return {
      message: 'User retrieved successfully',
      data: { user: userWithoutSensitiveData },
    };
  }

  async updateUserStatus(id: string, status: ActiveStatus) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userRepository.update(id, {
      active: status,
    });

    // Remove sensitive data
    const { password, twoFactorSecretKey, ...userWithoutSensitiveData } =
      updatedUser as any;

    return {
      message: `User status updated to ${status} successfully`,
      data: { user: userWithoutSensitiveData },
    };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by updating status
    await this.userRepository.update(id, { active: ActiveStatus.DELETED });

    return {
      message: 'User deleted successfully',
    };
  }

  async sendActivationEmail(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.active === ActiveStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    // TODO: Implement email sending logic
    // await this.emailService.sendAccountActivationEmail(user.email, token, user.firstName);

    return {
      message: 'Activation email sent successfully',
    };
  }

  async exportUsers(query: AdminQueryDto) {
    // Get all users based on filters (without pagination)
    const filter: any = {};

    if (query.status) {
      filter.active = query.status;
    }

    if (query.search) {
      filter.email = { $regex: query.search, $options: 'i' };
    }

    const users = await this.userRepository.findMany(filter, {
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'active',
        'phoneNumber',
        'userLocation',
        'signupIpAddress',
        'createdAt',
      ],
    });

    return {
      message: 'Users export data retrieved successfully',
      data: { users },
    };
  }
}
