import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';

import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { discardUnderscores } from '../../common/utils/discard-underscores.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import { User } from '../../database/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../database/repositories/user/user.repository.interface';

import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import {
  UserProfileResponse,
  UserResponse,
} from './interfaces/user-response.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException();
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
    discardUnderscores(_p);
    discardUnderscores(_act);
    discardUnderscores(_prt);
    discardUnderscores(_tfsk);

    return this.i18nResponse.success('user.profile_retrieved', userProfile);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { email, firstName, lastName, ...rest } = updateProfileDto;

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException();
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(email);
      if (emailExists) {
        return this.i18nResponse.badRequest('user.email_already_taken');
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
          discardUnderscores(key);
          return value !== undefined;
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    // Remove sensitive data by picking non-sensitive fields
    const userResponse: UserProfileResponse = {
      id: updatedUser.id,
      publicId: updatedUser.publicId,
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

    return this.i18nResponse.success('user.profile_updated', userResponse);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user with password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException();
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.updatePassword(userId, hashedNewPassword);

    return this.i18nResponse.success('user.password_changed');
  }

  async getUserBySlug(slug: string): Promise<UserResponse> {
    const user = await this.userRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException();
    }

    // Remove sensitive data
    const userResponse: UserProfileResponse = {
      id: user.id,
      publicId: user.publicId,
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

    return this.i18nResponse.success('user.user_retrieved', userResponse);
  }

  async deactivateAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }

    await this.userRepository.deactivateUser(userId);

    return this.i18nResponse.success('user.account_deactivated');
  }
}
