import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

import { Admin } from '../../../database/entities/admin.entity';
import {
  IAdminRepository,
  ADMIN_REPOSITORY,
} from '../../../database/repositories/admin/admin.repository.interface';
import { discardUnderscores } from '../../../common/utils/discard-underscores.util';
import { EmailService } from '../../../email/email.service';
import { FileUploadUtil } from '../../../common/utils/file-upload.util';
import { I18nResponseService } from '../../../common/services/i18n-response.service';

import {
  AdminFilterDto,
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
  AdminResponseDto,
  CreateAdminDto,
  UpdateAdminDto,
  UpdatePasswordDto,
} from './dto/admin-user.dto';
import {
  AdminAlreadyExistsException,
  AdminEmailSendException,
  AdminNotFoundException,
  AdminPasswordMismatchException,
  InactiveAdminException,
  InvalidAdminCredentialsException,
  InvalidCurrentPasswordException,
  InvalidResetTokenException,
} from './exceptions/admin.exceptions';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @Inject(ADMIN_REPOSITORY) private adminRepository: IAdminRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private i18nResponse: I18nResponseService,
    private i18n: I18nService
  ) {}

  async validateAdminCreation(createAdminDto: CreateAdminDto): Promise<void> {
    this.logger.log(
      `Validating admin creation for email: ${createAdminDto.email}`
    );

    if (createAdminDto.password !== createAdminDto.passwordConfirm) {
      throw new AdminPasswordMismatchException(
        'Password and confirmation do not match'
      );
    }

    const existingAdmin = await this.adminRepository.findByEmail(
      createAdminDto.email
    );
    if (existingAdmin) {
      throw new AdminAlreadyExistsException(createAdminDto.email);
    }
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    this.logger.log(`Creating admin with email: ${createAdminDto.email}`);

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 12);
    const publicId = uuidv4();

    const { passwordConfirm, ...adminDataInput } = createAdminDto;
    discardUnderscores(passwordConfirm);

    const adminData = {
      ...adminDataInput,
      publicId,
      password: hashedPassword,
      active: createAdminDto.active ?? true,
      twoFactorAuthVerified: createAdminDto.twoFactorAuthVerified ?? false,
    };

    const admin = await this.adminRepository.insert(adminData);

    this.logger.log(`Admin created successfully with ID: ${admin.id}`);
    return this.i18nResponse.adminCreated(this.transformToResponseDto(admin));
  }

  async login(loginDto: AdminLoginDto, loginIp: string) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    const admin = await this.adminRepository.findByEmail(loginDto.email);
    if (!admin) {
      throw new InvalidAdminCredentialsException('Invalid credentials');
    }

    if (!admin.active) {
      throw new InactiveAdminException('Admin account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password
    );
    if (!isPasswordValid) {
      throw new InvalidAdminCredentialsException('Invalid credentials');
    }

    // Update login tracking fields
    const updatedAdmin = await this.adminRepository.update(admin.id, {
      lastLoginDateTime: admin.currentLoginDateTime,
      currentLoginDateTime: new Date(),
      loginIpAddress: loginIp,
    });

    this.logger.log(
      `Admin login tracking updated - IP: ${loginIp}, Previous login: ${admin.currentLoginDateTime?.toISOString() || 'N/A'}`
    );

    const payload = {
      sub: updatedAdmin.id,
      email: updatedAdmin.email,
      type: 'admin',
    };

    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Admin logged in successfully: ${updatedAdmin.email}`);

    return this.i18nResponse.adminLoginSuccess({
      access_token,
      admin: this.transformToResponseDto(updatedAdmin),
    });
  }

  async getProfile(adminId: string) {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }

    return this.i18nResponse.adminProfileRetrieved(
      this.transformToResponseDto(admin)
    );
  }

  async getAllAdmins(filterDto: AdminFilterDto) {
    const { page = 1, limit = 10, ...filters } = filterDto;
    const skip = (page - 1) * limit;

    const options = {
      skip,
      limit,
      sort: { createdAt: -1 as -1 },
    };

    const result = await this.adminRepository.findWithPagination(
      filters,
      options
    );

    return this.i18nResponse.adminsRetrieved({
      admins: result.items.map((admin) => this.transformToResponseDto(admin)),
      total: result.pagination.totalCount,
      page: result.pagination.currentPage,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
    });
  }

  async getAdminByPublicId(publicId: string) {
    const admin = await this.adminRepository.findByPublicId(publicId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }

    return this.i18nResponse.adminProfileRetrieved(
      this.transformToResponseDto(admin)
    );
  }

  // Internal method for getting raw admin data (used internally, not for API responses)
  async getAdminByPublicIdInternal(publicId: string): Promise<Admin> {
    const admin = await this.adminRepository.findByPublicId(publicId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }
    return admin;
  }

  async updateAdmin(publicId: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.findByPublicId(publicId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }

    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingAdmin = await this.adminRepository.findByEmail(
        updateAdminDto.email
      );
      if (existingAdmin && existingAdmin.id !== admin.id) {
        throw new AdminAlreadyExistsException(updateAdminDto.email);
      }
    }

    const updatedAdmin = await this.adminRepository.update(
      admin.id,
      updateAdminDto
    );

    this.logger.log(`Admin updated successfully: ${admin.id}`);
    return this.i18nResponse.adminUpdated(
      this.transformToResponseDto(updatedAdmin)
    );
  }

  async deleteAdmin(publicId: string): Promise<void> {
    const admin = await this.adminRepository.findByPublicId(publicId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }

    // Clean up admin photo if exists
    if (admin.photo) {
      try {
        await FileUploadUtil.deleteFile(admin.photo);
        this.logger.log(`Admin photo deleted: ${admin.photo}`);
      } catch (error) {
        this.logger.warn(`Failed to delete admin photo: ${admin.photo}`, error);
      }
    }

    await this.adminRepository.deleteById(admin.id);
    this.logger.log(`Admin deleted successfully: ${admin.id}`);
  }

  async updatePassword(
    adminId: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<void> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AdminNotFoundException('Admin not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      throw new InvalidCurrentPasswordException(
        'Current password is incorrect'
      );
    }

    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new AdminPasswordMismatchException('New passwords do not match');
    }

    const hashedNewPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      12
    );

    await this.adminRepository.updatePassword(admin.id, hashedNewPassword);
    this.logger.log(`Password updated for admin: ${admin.id}`);
  }

  async forgotPassword(
    forgotPasswordDto: AdminForgotPasswordDto
  ): Promise<void> {
    const admin = await this.adminRepository.findByEmail(
      forgotPasswordDto.email
    );
    if (!admin) {
      // Don't reveal that admin doesn't exist
      this.logger.log(
        `Password reset requested for non-existent admin: ${forgotPasswordDto.email}`
      );
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.adminRepository.update(admin.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry,
    });

    // Send email with reset token
    try {
      await this.emailService.sendPasswordResetEmail(
        admin.email,
        resetToken,
        admin.firstName
      );
      this.logger.log(`Password reset email sent to admin: ${admin.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to: ${admin.email}`,
        error
      );
      throw new AdminEmailSendException('Failed to send password reset email');
    }
  }

  async resetPassword(resetPasswordDto: AdminResetPasswordDto): Promise<void> {
    const admin = await this.adminRepository.findByResetToken(
      resetPasswordDto.token
    );
    if (
      !admin ||
      !admin.passwordResetExpires ||
      admin.passwordResetExpires < new Date()
    ) {
      throw new InvalidResetTokenException('Invalid or expired reset token');
    }

    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new AdminPasswordMismatchException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 12);

    await this.adminRepository.update(admin.id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    this.logger.log(`Password reset successful for admin: ${admin.id}`);
  }

  logout(adminId: string): void {
    // For JWT, we just log the logout action
    // In a real app, you might want to implement token blacklisting
    this.logger.log(`Admin logged out: ${adminId}`);
  }

  private transformToResponseDto(admin: Admin): AdminResponseDto {
    return {
      id: admin.id,
      publicId: admin.publicId,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      photo: admin.photo,
      active: admin.active,
      loginIpAddress: admin.loginIpAddress,
      currentLoginDateTime: admin.currentLoginDateTime,
      lastLoginDateTime: admin.lastLoginDateTime,
      twoFactorAuthVerified: admin.twoFactorAuthVerified,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
