import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../database/repositories/user/user.repository.interface';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const {
      password,
      accountActivationToken,
      passwordResetToken,
      twoFactorSecretKey,
      ...userProfile
    } = user as any;

    return {
      message: 'Profile retrieved successfully',
      user: userProfile,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { email, firstName, lastName, ...rest } = updateProfileDto;

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(email);
      if (emailExists) {
        throw new BadRequestException('Email is already taken');
      }
    }

    // Generate new slug if name is being updated
    let slug = existingUser.slug;
    if (firstName || lastName) {
      const newFirstName = firstName || existingUser.firstName;
      const newLastName = lastName || existingUser.lastName;
      const fullName = `${newFirstName} ${newLastName}`;
      const timeString = new Date().getTime().toString().substr(7, 5);
      slug = `${slugify(fullName, { lower: true })}-${timeString}`;
    }

    // Prepare update data
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (slug !== existingUser.slug) updateData.slug = slug;

    // Handle optional fields
    Object.keys(rest).forEach((key) => {
      if (rest[key] !== undefined) {
        updateData[key] = rest[key];
      }
    });

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    // Remove sensitive data
    const {
      password,
      accountActivationToken,
      passwordResetToken,
      twoFactorSecretKey,
      ...userResponse
    } = updatedUser as any;

    return {
      message: 'Profile updated successfully',
      user: userResponse,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user with password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.updatePassword(userId, hashedNewPassword);

    return {
      message: 'Password changed successfully',
    };
  }

  async getUserBySlug(slug: string) {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  async deactivateAccount(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deactivateUser(userId);

    return {
      message: 'Account deactivated successfully',
    };
  }
}
