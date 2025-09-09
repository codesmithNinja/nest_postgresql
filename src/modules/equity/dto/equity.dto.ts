import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUrl,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  CampaignStatus,
  UploadType,
  AccountType,
  TermSlug,
} from '../../../database/entities/equity.entity';

export class AdditionalLinkDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  linkTitle: string;

  @IsUrl()
  @IsNotEmpty()
  linkUrl: string;
}

// Step 1: Company Information DTO
export class CreateEquityDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  companyLogo: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 200)
  companyTagline: string;

  @IsEmail()
  @IsNotEmpty()
  companyEmail: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[1-9][\d]{0,15}$/, { message: 'Invalid phone number format' })
  companyPhoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  companyAddress: string;

  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear())
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value)
  )
  yearFounded: number;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyCategory: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyIndustry: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 5000)
  companyDescription: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus = CampaignStatus.DRAFT;
}

// Step 2: Fundraising Details DTO
export class UpdateFundraisingDetailsDto {
  @IsBoolean()
  isUpcomingCampaign: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectTimezone?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  startTime?: string;

  @IsString()
  @IsNotEmpty()
  currencyId: string;

  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  goal: number;

  @IsDateString()
  closingDate: string;

  @IsNumber()
  @Min(500)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  minimumRaise: number;

  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  maximumRaise: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  campaignStage: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  industry: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  previouslyRaised?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  estimatedRevenue?: number;

  @IsBoolean()
  hasLeadInvestor: boolean;

  @IsString()
  @IsNotEmpty()
  termId: string;

  @IsEnum(TermSlug)
  termslug: TermSlug;

  // Term-specific fields (conditional validation handled in service)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseInt(value, 10)
        : Number(value)
      : undefined
  )
  availableShares?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  pricePerShare?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  preMoneyValuation?: number;

  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  investFrequency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  IRR?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  equityAvailable?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseFloat(value)
        : Number(value)
      : undefined
  )
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  @Transform(({ value }) =>
    value
      ? typeof value === 'string'
        ? parseInt(value, 10)
        : Number(value)
      : undefined
  )
  termLength?: number;
}

// Step 3: Project Story DTO
export class UpdateProjectStoryDto {
  @IsOptional()
  @IsEnum(UploadType)
  uploadType?: UploadType;

  @IsOptional()
  @IsString()
  @IsUrl()
  campaignImageURL?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  campaignVideoURL?: string;

  @IsOptional()
  @IsString()
  @Length(100, 10000)
  campaignStory?: string;
}

// Step 5: Extras DTO
export class UpdateExtrasDto {
  @IsOptional()
  @IsString()
  @Matches(/^UA-\d{4,9}-\d{1,4}$/, {
    message: 'Invalid Google Analytics ID format',
  })
  googleAnalyticsID?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalLinkDto)
  additionalLinks?: AdditionalLinkDto[];
}

// Step 6: Investment Info DTO
export class UpdateInvestmentInfoDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  bankName?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8,20}$/, { message: 'Invalid account number format' })
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8,20}$/, { message: 'Invalid account number format' })
  confirmAccountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Invalid routing number format' })
  routingNumber?: string;
}

// Combined update DTO for PATCH operations
export class UpdateEquityDto {
  // Step 2: Fundraising Details
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFundraisingDetailsDto)
  fundraisingDetails?: UpdateFundraisingDetailsDto;

  // Step 3: Project Story
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProjectStoryDto)
  projectStory?: UpdateProjectStoryDto;

  // Step 5: Extras
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateExtrasDto)
  extras?: UpdateExtrasDto;

  // Step 6: Investment Info
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateInvestmentInfoDto)
  investmentInfo?: UpdateInvestmentInfoDto;
}

// Response DTOs
export class EquityResponseDto {
  id: string;
  publicId: string;
  companyLogo: string;
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyPhoneNumber: string;
  companyAddress: string;
  yearFounded: number;
  website?: string;
  companyCategory: string;
  companyIndustry: string;
  companyDescription: string;
  userId: string;
  status: CampaignStatus;
  isUpcomingCampaign: boolean;
  projectTimezone?: string;
  startDate?: Date;
  startTime?: string;
  actualStartDateTime?: Date;
  currencyId: string;
  goal: number;
  closingDate: Date;
  minimumRaise: number;
  maximumRaise: number;
  campaignStage: string;
  industry: string;
  previouslyRaised?: number;
  estimatedRevenue?: number;
  hasLeadInvestor: boolean;
  termId: string;
  termslug: TermSlug;
  availableShares?: number;
  pricePerShare?: number;
  preMoneyValuation?: number;
  maturityDate?: Date;
  investFrequency?: string;
  IRR?: number;
  equityAvailable?: number;
  interestRate?: number;
  termLength?: number;
  uploadType?: UploadType;
  campaignImageURL?: string;
  campaignVideoURL?: string;
  campaignStory?: string;
  googleAnalyticsID?: string;
  additionalLinks?: AdditionalLinkDto[];
  bankName?: string;
  accountType?: AccountType;
  accountHolderName?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  routingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EquityWithRelationsResponseDto extends EquityResponseDto {
  leadInvestors?: any[];
  teamMembers?: any[];
  campaignFaqs?: any[];
  extrasVideos?: any[];
  extrasImages?: any[];
  extrasDocuments?: any[];
}
