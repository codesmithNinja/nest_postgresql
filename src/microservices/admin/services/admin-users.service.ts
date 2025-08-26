import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
  MongoQuery,
} from '../../../database/repositories/user/user.repository.interface';
import { User } from '../../../database/entities/user.entity';
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

    // Build filter for MongoDB-specific operations
    const mongoFilter: MongoQuery<User> = {};
    // Build filter for standard operations
    const countFilter: Partial<User> = {};

    if (status) {
      mongoFilter.active = status as ActiveStatus;
      countFilter.active = status as ActiveStatus;
    }

    if (search) {
      // MongoDB-specific search
      mongoFilter.email = { $regex: search, $options: 'i' };
      // Basic search for counting
      countFilter.email = search;
    }

    // Build sort options
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };

    const [users, totalCount] = await Promise.all([
      this.userRepository.findMany(mongoFilter, {
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
      this.userRepository.count(countFilter),
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
    const {
      password: _p,
      twoFactorSecretKey: _t,
      ...userWithoutSensitiveData
    } = user;

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
    const {
      password: _p2,
      twoFactorSecretKey: _t2,
      ...userWithoutSensitiveData
    } = updatedUser;

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
    const mongoFilter: MongoQuery<User> = {};
    const countFilter: Partial<User> = {};

    if (query.status) {
      mongoFilter.active = query.status as ActiveStatus;
      countFilter.active = query.status as ActiveStatus;
    }

    if (query.search) {
      mongoFilter.email = { $regex: query.search, $options: 'i' };
      countFilter.email = query.search;
    }

    const users = await this.userRepository.findMany(mongoFilter, {
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
