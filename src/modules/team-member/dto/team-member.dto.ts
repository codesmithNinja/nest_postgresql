import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  role!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(50, 2000)
  bio!: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  memberPhoto!: string;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  role?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(50, 2000)
  bio?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  memberPhoto?: string;
}

export class TeamMemberResponseDto {
  id!: string;
  publicId!: string;
  memberPhoto!: string;
  name!: string;
  role!: string;
  email!: string;
  bio!: string;
  equityId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
