import type { Request as ExpressRequest } from 'express';
import { memoryStorage } from 'multer';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  FileUploadUtil,
  getBucketName,
} from '../../../common/utils/file-upload.util';
import { IpExtractionUtil } from '../../../common/utils/ip-extraction.util';
import { AdminUsersService } from './admin-users.service';
import { JwtAdminGuard } from '../../../common/guards/jwt-admin.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';
import {
  CreateAdminDto,
  UpdateAdminDto,
  AdminLoginDto,
  UpdatePasswordDto,
  AdminForgotPasswordDto,
  AdminResetPasswordDto,
  AdminFilterDto,
} from './dto/admin-user.dto';

interface RequestWithAdmin extends ExpressRequest {
  user: {
    id: string;
    email: string;
    type?: string;
    iat?: number;
    exp?: number;
  };
}

@Controller('admins')
@UseGuards(JwtAdminGuard)
@UseInterceptors(I18nResponseInterceptor)
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body(ValidationPipe) loginDto: AdminLoginDto,
    @Request() req: RequestWithAdmin
  ) {
    const clientIp = IpExtractionUtil.getSanitizedIp(req);
    const loginResult = await this.adminUsersService.login(loginDto, clientIp);
    return this.i18nResponse.translateAndRespond(
      'admin.login_success',
      HttpStatus.OK,
      loginResult
    );
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: AdminForgotPasswordDto
  ) {
    await this.adminUsersService.forgotPassword(forgotPasswordDto);
    return this.i18nResponse.translateAndRespond(
      'admin.password_reset_sent',
      HttpStatus.OK,
      { message: 'Password reset email sent' }
    );
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: AdminResetPasswordDto
  ) {
    await this.adminUsersService.resetPassword(resetPasswordDto);
    return this.i18nResponse.translateAndRespond(
      'admin.password_reset_success',
      HttpStatus.OK,
      { message: 'Password reset successful' }
    );
  }

  @Get('me')
  async getProfile(@Request() req: RequestWithAdmin) {
    try {
      const profile = await this.adminUsersService.getProfile(req.user.id);
      return this.i18nResponse.translateAndRespond(
        'admin_users.profile_retrieved_successfully',
        HttpStatus.OK,
        profile
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.not_found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get()
  async getAllAdmins(@Query(ValidationPipe) filterDto: AdminFilterDto) {
    try {
      const admins = await this.adminUsersService.getAllAdmins(filterDto);
      return this.i18nResponse.translateAndRespond(
        'admin_users.admins_retrieved_successfully',
        HttpStatus.OK,
        admins
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.fetch_failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':publicId')
  async getAdminByPublicId(@Param('publicId') publicId: string) {
    try {
      const admin = await this.adminUsersService.getAdminByPublicId(publicId);
      return this.i18nResponse.translateAndRespond(
        'admin_users.profile_retrieved_successfully',
        HttpStatus.OK,
        admin
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.not_found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Public()
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAdminDto })
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  async createAdmin(
    @Body(ValidationPipe) createAdminDto: CreateAdminDto,
    @UploadedFile() photo: Express.Multer.File
  ) {
    // Validate business logic FIRST (before file upload)
    await this.adminUsersService.validateAdminCreation(createAdminDto);

    // Only upload file AFTER validation passes
    if (photo) {
      const uploadResult = await FileUploadUtil.uploadFile(photo, {
        bucketName: getBucketName('ADMIN'),
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeInMB: 5,
        fieldName: 'photo',
      });
      createAdminDto.photo = uploadResult.filePath;
    }

    try {
      const newAdmin = await this.adminUsersService.createAdmin(createAdminDto);
      return this.i18nResponse.translateAndRespond(
        'admin_users.created_successfully',
        HttpStatus.CREATED,
        newAdmin
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.creation_failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':publicId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  async updateAdmin(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateAdminDto: UpdateAdminDto,
    @UploadedFile() photo: Express.Multer.File
  ) {
    if (photo) {
      const uploadResult = await FileUploadUtil.uploadFile(photo, {
        bucketName: getBucketName('ADMIN'),
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeInMB: 5,
        fieldName: 'photo',
      });
      updateAdminDto.photo = uploadResult.filePath;
    }

    try {
      const updatedAdmin = await this.adminUsersService.updateAdmin(
        publicId,
        updateAdminDto
      );
      return this.i18nResponse.translateAndRespond(
        'admin_users.updated_successfully',
        HttpStatus.OK,
        updatedAdmin
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.not_found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Delete(':publicId')
  async deleteAdmin(@Param('publicId') publicId: string) {
    try {
      await this.adminUsersService.deleteAdmin(publicId);
      return this.i18nResponse.translateAndRespond(
        'admin_users.deleted_successfully',
        HttpStatus.OK,
        { message: 'Admin deleted successfully' }
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.not_found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch('update-password')
  async updatePassword(
    @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto,
    @Request() req: RequestWithAdmin
  ) {
    try {
      await this.adminUsersService.updatePassword(
        req.user.id,
        updatePasswordDto
      );
      return this.i18nResponse.translateAndRespond(
        'admin_users.password_updated_successfully',
        HttpStatus.OK,
        { message: 'Password updated successfully' }
      );
    } catch {
      return this.i18nResponse.translateError(
        'admin_users.update_failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('logout')
  logout() {
    this.adminUsersService.logout();
    return this.i18nResponse.translateAndRespond(
      'admin.logout_success',
      HttpStatus.OK,
      { message: 'Logout successful' }
    );
  }
}
