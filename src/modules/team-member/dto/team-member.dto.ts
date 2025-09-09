import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  memberPhoto: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  role: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 2000)
  bio: string;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  memberPhoto?: string;

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
}

export class TeamMemberResponseDto {
  id: string;
  publicId: string;
  memberPhoto: string;
  name: string;
  role: string;
  email: string;
  bio: string;
  equityId: string;
  createdAt: Date;
  updatedAt: Date;
}
