import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsUrl,
} from 'class-validator';

export class CreateExtrasVideoDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  videoUrl: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  videoTitle: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  videoDescription: string;
}

export class UpdateExtrasVideoDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  videoTitle?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  videoDescription?: string;
}

export class ExtrasVideoResponseDto {
  id: string;
  publicId: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  equityId: string;
  createdAt: Date;
  updatedAt: Date;
}
