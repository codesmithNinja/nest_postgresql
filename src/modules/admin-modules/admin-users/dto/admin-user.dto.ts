import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateAdminDto {
  @ApiProperty({ description: 'Admin first name', minLength: 3, maxLength: 40 })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  firstName!: string;

  @ApiProperty({ description: 'Admin last name', minLength: 3, maxLength: 40 })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  lastName!: string;

  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    description: 'Admin photo file',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ description: 'Admin password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Password confirmation', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  passwordConfirm!: string;

  @ApiPropertyOptional({ description: 'Admin active status', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Two factor auth verified status',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  twoFactorAuthVerified?: boolean;

  publicId!: string;
}

export class UpdateAdminDto {
  @ApiPropertyOptional({
    description: 'Admin first name',
    minLength: 3,
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Admin last name',
    minLength: 3,
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Admin email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Admin photo URL' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ description: 'Admin active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Two factor auth verified status' })
  @IsOptional()
  @IsBoolean()
  twoFactorAuthVerified?: boolean;

  @ApiPropertyOptional({ description: 'Two factor secret key' })
  @IsOptional()
  @IsString()
  twoFactorSecretKey?: string;
}

export class AdminLoginDto {
  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Admin password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ description: 'Confirm new password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

export class AdminForgotPasswordDto {
  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class AdminResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Confirm new password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

export class AdminFilterDto {
  @ApiPropertyOptional({
    description:
      'Search keyword to filter across first name, last name, and email',
    example: 'john',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class AdminResponseDto {
  @ApiProperty({ description: 'Admin unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Admin public identifier' })
  publicId!: string;

  @ApiProperty({ description: 'Admin first name' })
  firstName!: string;

  @ApiProperty({ description: 'Admin last name' })
  lastName!: string;

  @ApiProperty({ description: 'Admin email address' })
  email!: string;

  @ApiPropertyOptional({ description: 'Admin photo URL' })
  photo?: string;

  @ApiProperty({ description: 'Admin active status' })
  active!: boolean;

  @ApiProperty({ description: 'Login IP address' })
  loginIpAddress?: string;

  @ApiProperty({ description: 'Current login date time' })
  currentLoginDateTime?: Date;

  @ApiProperty({ description: 'Last login date time' })
  lastLoginDateTime?: Date;

  @ApiProperty({ description: 'Two factor auth verified status' })
  twoFactorAuthVerified!: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}

export class AdminLoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token!: string;

  @ApiProperty({ description: 'Admin information', type: AdminResponseDto })
  admin!: AdminResponseDto;
}

export class AdminPaginationResponseDto {
  @ApiProperty({ description: 'List of admins', type: [AdminResponseDto] })
  admins!: AdminResponseDto[];

  @ApiProperty({ description: 'Total number of admins' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}
