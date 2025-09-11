import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateLeadInvestorDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  investorPhoto!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  investorType!: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 2000)
  bio!: string;
}

export class UpdateLeadInvestorDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  investorPhoto?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  investorType?: string;

  @IsOptional()
  @IsString()
  @Length(50, 2000)
  bio?: string;
}

export class LeadInvestorResponseDto {
  id!: string;
  publicId!: string;
  investorPhoto!: string;
  name!: string;
  investorType!: string;
  bio!: string;
  equityId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
