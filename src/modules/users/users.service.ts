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
import {
  UserResponse,
  UserProfileResponse,
} from './interfaces/user-response.interface';
import { User } from '../../database/entities/user.entity';
import { DiscardUnderscores } from '../../common/utils/discard-underscores.util';
import { ResponseHandler } from '../../common/utils/response.handler';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository
  ) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const {
      password: _p,
      accountActivationToken: _act,
      passwordResetToken: _prt,
      twoFactorSecretKey: _tfsk,
      ...userProfile
    } = user;

    // Discard unused variables to satisfy linting
    DiscardUnderscores(_p);
    DiscardUnderscores(_act);
    DiscardUnderscores(_prt);
    DiscardUnderscores(_tfsk);

    return ResponseHandler.success(
      'Profile retrieved successfully',
      200,
      userProfile
    );
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
    const updateData: Partial<User> = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(slug !== existingUser.slug && { slug }),
      ...Object.entries(rest)
        .filter(([key, value]) => {
          DiscardUnderscores(key);
          return value !== undefined;
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    // Remove sensitive data by picking non-sensitive fields
    const userResponse: UserProfileResponse = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      slug: updatedUser.slug,
      photo: updatedUser.photo,
      coverPhoto: updatedUser.coverPhoto,
      phoneNumber: updatedUser.phoneNumber,
      userLocation: updatedUser.userLocation,
      zipcode: updatedUser.zipcode,
      kycStatus: updatedUser.kycStatus,
      kycReferenceId: updatedUser.kycReferenceId,
      aboutYourself: updatedUser.aboutYourself,
      outsideLinks: updatedUser.outsideLinks,
      userTypeId: updatedUser.userTypeId,
      userType: updatedUser.userType,
      active: updatedUser.active,
      enableTwoFactorAuth: updatedUser.enableTwoFactorAuth,
      appliedBytwoFactorAuth: updatedUser.appliedBytwoFactorAuth,
      twoFactorAuthVerified: updatedUser.twoFactorAuthVerified,
      signupIpAddress: updatedUser.signupIpAddress,
      loginIpAddress: updatedUser.loginIpAddress,
      uniqueGoogleId: updatedUser.uniqueGoogleId,
      uniqueLinkedInId: updatedUser.uniqueLinkedInId,
      uniqueFacebookId: updatedUser.uniqueFacebookId,
      uniqueTwitterId: updatedUser.uniqueTwitterId,
      achCustomerId: updatedUser.achCustomerId,
      achAccountId: updatedUser.achAccountId,
      achAccountStatus: updatedUser.achAccountStatus,
      isAdmin: updatedUser.isAdmin,
      walletId: updatedUser.walletId,
      mangoPayOwnerId: updatedUser.mangoPayOwnerId,
      mangoPayOwnerWalletId: updatedUser.mangoPayOwnerWalletId,
      plaidDwollaCustomerId: updatedUser.plaidDwollaCustomerId,
      plaidDwollFundingSourceId: updatedUser.plaidDwollFundingSourceId,
      plaidDwollFundingSourceStatus: updatedUser.plaidDwollFundingSourceStatus,
      plaidDwollaKYCStatus: updatedUser.plaidDwollaKYCStatus,
      globalSocketId: updatedUser.globalSocketId,
      enableNotification: updatedUser.enableNotification,
      notificationLanguageId: updatedUser.notificationLanguageId,
      notificationLanguage: updatedUser.notificationLanguage,
      walletAddress: updatedUser.walletAddress,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return ResponseHandler.success(
      'Profile updated successfully',
      200,
      userResponse
    );
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
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

    return ResponseHandler.success('Password changed successfully', 200);
  }

  async getUserBySlug(slug: string): Promise<UserResponse> {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const userResponse: UserProfileResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      slug: user.slug,
      photo: user.photo,
      coverPhoto: user.coverPhoto,
      phoneNumber: user.phoneNumber,
      userLocation: user.userLocation,
      zipcode: user.zipcode,
      kycStatus: user.kycStatus,
      kycReferenceId: user.kycReferenceId,
      aboutYourself: user.aboutYourself,
      outsideLinks: user.outsideLinks,
      userTypeId: user.userTypeId,
      userType: user.userType,
      active: user.active,
      enableTwoFactorAuth: user.enableTwoFactorAuth,
      appliedBytwoFactorAuth: user.appliedBytwoFactorAuth,
      twoFactorAuthVerified: user.twoFactorAuthVerified,
      signupIpAddress: user.signupIpAddress,
      loginIpAddress: user.loginIpAddress,
      uniqueGoogleId: user.uniqueGoogleId,
      uniqueLinkedInId: user.uniqueLinkedInId,
      uniqueFacebookId: user.uniqueFacebookId,
      uniqueTwitterId: user.uniqueTwitterId,
      achCustomerId: user.achCustomerId,
      achAccountId: user.achAccountId,
      achAccountStatus: user.achAccountStatus,
      isAdmin: user.isAdmin,
      walletId: user.walletId,
      mangoPayOwnerId: user.mangoPayOwnerId,
      mangoPayOwnerWalletId: user.mangoPayOwnerWalletId,
      plaidDwollaCustomerId: user.plaidDwollaCustomerId,
      plaidDwollFundingSourceId: user.plaidDwollFundingSourceId,
      plaidDwollFundingSourceStatus: user.plaidDwollFundingSourceStatus,
      plaidDwollaKYCStatus: user.plaidDwollaKYCStatus,
      globalSocketId: user.globalSocketId,
      enableNotification: user.enableNotification,
      notificationLanguageId: user.notificationLanguageId,
      notificationLanguage: user.notificationLanguage,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return ResponseHandler.success(
      'User retrieved successfully',
      200,
      userResponse
    );
  }

  async deactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deactivateUser(userId);

    return ResponseHandler.success('Account deactivated successfully', 200);
  }
}
