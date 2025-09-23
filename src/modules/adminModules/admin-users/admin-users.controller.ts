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
    return this.adminUsersService.login(loginDto, clientIp);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: AdminForgotPasswordDto
  ) {
    await this.adminUsersService.forgotPassword(forgotPasswordDto);
    return this.i18nResponse.success('admin.password_reset_sent');
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: AdminResetPasswordDto
  ) {
    await this.adminUsersService.resetPassword(resetPasswordDto);
    return this.i18nResponse.success('admin.password_reset_success');
  }

  @Get('me')
  async getProfile(@Request() req: RequestWithAdmin) {
    return this.adminUsersService.getProfile(req.user.id);
  }

  @Get()
  async getAllAdmins(@Query(ValidationPipe) filterDto: AdminFilterDto) {
    return this.adminUsersService.getAllAdmins(filterDto);
  }

  @Get(':publicId')
  async getAdminByPublicId(@Param('publicId') publicId: string) {
    return this.adminUsersService.getAdminByPublicId(publicId);
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
      createAdminDto.photo = uploadResult.url || uploadResult.filePath;
    }

    return this.adminUsersService.createAdmin(createAdminDto);
  }

  @Patch(':publicId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  async updateAdmin(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateAdminDto: UpdateAdminDto,
    @UploadedFile() photo: Express.Multer.File
  ) {
    let oldFilePath: string | undefined;

    if (photo) {
      // Get the existing admin to find old photo path for cleanup
      try {
        const existingAdmin =
          await this.adminUsersService.getAdminByPublicIdInternal(publicId);
        oldFilePath = existingAdmin.photo;
      } catch {
        // Admin not found will be handled by updateAdmin method
      }

      const uploadResult = await FileUploadUtil.uploadFile(
        photo,
        {
          bucketName: getBucketName('ADMIN'),
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maxSizeInMB: 5,
          fieldName: 'photo',
        },
        oldFilePath
      );
      updateAdminDto.photo = uploadResult.url || uploadResult.filePath;
    }

    return this.adminUsersService.updateAdmin(publicId, updateAdminDto);
  }

  @Delete(':publicId')
  async deleteAdmin(@Param('publicId') publicId: string) {
    await this.adminUsersService.deleteAdmin(publicId);
    return this.i18nResponse.adminDeleted();
  }

  @Patch('update-password')
  async updatePassword(
    @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto,
    @Request() req: RequestWithAdmin
  ) {
    await this.adminUsersService.updatePassword(req.user.id, updatePasswordDto);
    return this.i18nResponse.adminPasswordUpdated();
  }

  @Post('logout')
  logout(@Request() req: RequestWithAdmin) {
    this.adminUsersService.logout(req.user.id);
    return this.i18nResponse.adminLogoutSuccess();
  }
}
