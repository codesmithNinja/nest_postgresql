import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateCampaignFaqDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  questionID?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  answer?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500)
  customQuestion?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  customAnswer?: string;
}

export class UpdateCampaignFaqDto {
  @IsOptional()
  @IsString()
  questionID?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  answer?: string;

  @IsOptional()
  @IsString()
  @Length(10, 500)
  customQuestion?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  customAnswer?: string;
}

export class CampaignFaqResponseDto {
  id!: string;
  publicId!: string;
  questionID?: string;
  answer?: string;
  customQuestion?: string;
  customAnswer?: string;
  equityId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
