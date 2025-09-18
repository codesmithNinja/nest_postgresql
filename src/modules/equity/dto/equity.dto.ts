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
import { ApiProperty } from '@nestjs/swagger';
import {
  CampaignStatus,
  UploadType,
  AccountType,
  TermSlug,
} from '../../../database/entities/equity.entity';
import { LeadInvestor } from '../../../database/entities/lead-investor.entity';
import { TeamMember } from '../../../database/entities/team-member.entity';
import { CampaignFaq } from '../../../database/entities/campaign-faq.entity';
import { ExtrasVideo } from '../../../database/entities/extras-video.entity';
import { ExtrasImage } from '../../../database/entities/extras-image.entity';
import { ExtrasDocument } from '../../../database/entities/extras-document.entity';

export class AdditionalLinkDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  linkTitle!: string;

  @IsUrl()
  @IsNotEmpty()
  linkUrl!: string;
}

// Step 1: Company Information DTO
export class CreateEquityDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  companyLogo!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  companySlug?: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 200)
  companyTagline!: string;

  @IsEmail()
  @IsNotEmpty()
  companyEmail!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[1-9][\d]{0,15}$/, { message: 'Invalid phone number format' })
  companyPhoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  companyAddress!: string;

  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear())
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value)
  )
  yearFounded!: number;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyCategory!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyIndustry!: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 5000)
  companyDescription!: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus = CampaignStatus.DRAFT;
}

// Step 2: Fundraising Details DTO
export class UpdateFundraisingDetailsDto {
  @IsBoolean()
  isUpcomingCampaign!: boolean;

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
  currencyId!: string;

  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  goal!: number;

  @IsDateString()
  closingDate!: string;

  @IsNumber()
  @Min(500)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  minimumRaise!: number;

  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  maximumRaise!: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  campaignStage!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  industry!: string;

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
  hasLeadInvestor!: boolean;

  @IsString()
  @IsNotEmpty()
  termId!: string;

  @IsEnum(TermSlug)
  termslug!: TermSlug;

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

  // Direct fundraising fields (for backward compatibility and ease of use)
  @IsOptional()
  @IsBoolean()
  isUpcomingCampaign?: boolean;

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

  @IsOptional()
  @IsString()
  currencyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  goal?: number;

  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  minimumRaise?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : Number(value)
  )
  maximumRaise?: number;

  @IsOptional()
  @IsString()
  campaignStage?: string;

  @IsOptional()
  @IsString()
  industry?: string;

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

  @IsOptional()
  @IsBoolean()
  hasLeadInvestor?: boolean;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsEnum(TermSlug)
  termslug?: TermSlug;

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

  // Direct project story fields
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

  // Direct extras fields
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

  // Direct company fields
  @IsOptional()
  @IsString()
  @Length(2, 100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  companySlug?: string;

  // Direct investment info fields
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

// Response DTOs
export class EquityResponseDto {
  id!: string;
  publicId!: string;
  companyLogo!: string;
  companyName!: string;
  companySlug?: string;
  companyTagline!: string;
  companyEmail!: string;
  companyPhoneNumber!: string;
  companyAddress!: string;
  yearFounded!: number;
  website?: string;
  companyCategory!: string;
  companyIndustry!: string;
  companyDescription!: string;
  userId!: string;
  status!: CampaignStatus;
  isUpcomingCampaign!: boolean;
  projectTimezone?: string;
  startDate?: Date;
  startTime?: string;
  actualStartDateTime?: Date;
  currencyId!: string;
  goal!: number;
  closingDate!: Date;
  minimumRaise!: number;
  maximumRaise!: number;
  campaignStage!: string;
  industry!: string;
  previouslyRaised?: number;
  estimatedRevenue?: number;
  hasLeadInvestor!: boolean;
  termId!: string;
  termslug!: TermSlug;
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
  createdAt!: Date;
  updatedAt!: Date;
}

export class EquityWithRelationsResponseDto extends EquityResponseDto {
  leadInvestors?: LeadInvestor[];
  teamMembers?: TeamMember[];
  campaignFaqs?: CampaignFaq[];
  extrasVideos?: ExtrasVideo[];
  extrasImages?: ExtrasImage[];
  extrasDocuments?: ExtrasDocument[];
}

// Form-data DTO for file uploads
export class UpdateEquityFormDataDto {
  // All fields from UpdateEquityDto but as strings (since form-data sends everything as strings)

  // Direct fundraising fields
  @IsOptional()
  @Transform(({ value }): boolean => value === 'true' || value === true)
  @IsBoolean()
  isUpcomingCampaign?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  projectTimezone?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format (HH:MM)',
  })
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  startTime?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  currencyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  goal?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  closingDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  minimumRaise?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  maximumRaise?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  campaignStage?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  previouslyRaised?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  estimatedRevenue?: number;

  @IsOptional()
  @Transform(({ value }): boolean => value === 'true' || value === true)
  @IsBoolean()
  hasLeadInvestor?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  termId?: string;

  @IsOptional()
  @IsEnum(TermSlug)
  termslug?: TermSlug;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseInt(value, 10) : Number(value);
  })
  availableShares?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  pricePerShare?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  preMoneyValuation?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  maturityDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  investFrequency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  IRR?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  equityAvailable?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  @Transform(({ value }): number | undefined => {
    if (!value || value === '') return undefined;
    return typeof value === 'string' ? parseInt(value, 10) : Number(value);
  })
  termLength?: number;

  // Direct project story fields
  @IsOptional()
  @IsEnum(UploadType)
  uploadType?: UploadType;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  campaignImageURL?: Express.Multer.File; // This will be handled by multer

  @IsOptional()
  @IsString()
  @IsUrl()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  campaignVideoURL?: string;

  @IsOptional()
  @IsString()
  @Length(100, 10000)
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  campaignStory?: string;

  // Direct extras fields
  @IsOptional()
  @IsString()
  @Matches(/^UA-\d{4,9}-\d{1,4}$/, {
    message: 'Invalid Google Analytics ID format',
  })
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  googleAnalyticsID?: string;

  // Direct investment info fields
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  bankName?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8,20}$/, { message: 'Invalid account number format' })
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8,20}$/, { message: 'Invalid account number format' })
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  confirmAccountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Invalid routing number format' })
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value
  )
  routingNumber?: string;
}
