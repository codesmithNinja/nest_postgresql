import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  userLocation?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  aboutYourself?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutsideLinkDto)
  outsideLinks?: OutsideLinkDto[];

  @IsOptional()
  @IsString()
  userTypeId?: string;

  slug!: string;
  signupIpAddress!: string;
  accountActivationToken!: string;
}

export class OutsideLinkDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class ActivateAccountDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}
