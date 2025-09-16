import {
  AccountType,
  CampaignStatus,
  TermSlug,
  UploadType,
} from '../../../database/schemas/equity.schema';
import { AdditionalLinkDto } from './equity.dto';

export class EquityResponseDto {
  id?: string;
  publicId?: string;
  companyLogo?: string;
  companyName?: string;
  companySlug?: string;
  companyTagline?: string;
  companyEmail?: string;
  companyPhoneNumber?: string;
  companyAddress?: string;
  yearFounded?: number;
  website?: string;
  companyCategory?: string;
  companyIndustry?: string;
  companyDescription?: string;
  userId?: string;
  status?: CampaignStatus;
  isUpcomingCampaign?: boolean;
  projectTimezone?: string;
  startDate?: Date;
  startTime?: string;
  actualStartDateTime?: Date;
  currencyId?: string;
  goal?: number;
  closingDate?: Date;
  minimumRaise?: number;
  maximumRaise?: number;
  campaignStage?: string;
  industry?: string;
  previouslyRaised?: number;
  estimatedRevenue?: number;
  hasLeadInvestor?: boolean;
  termId?: string;
  termslug?: TermSlug;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export class EquityWithRelationsResponseDto extends EquityResponseDto {
  leadInvestors?: LeadInvestorResponseDto[];
  teamMembers?: TeamMemberResponseDto[];
  campaignFaqs?: CampaignFaqResponseDto[];
  extrasVideos?: ExtrasVideoResponseDto[];
  extrasImages?: ExtrasImageResponseDto[];
  extrasDocuments?: ExtrasDocumentResponseDto[];
}

export class LeadInvestorResponseDto {
  id?: string;
  publicId?: string;
  investorPhoto?: string;
  name?: string;
  investorType?: string;
  bio?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeamMemberResponseDto {
  id?: string;
  publicId?: string;
  memberPhoto?: string;
  name?: string;
  role?: string;
  email?: string;
  bio?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CampaignFaqResponseDto {
  id?: string;
  publicId?: string;
  questionID?: string;
  answer?: string;
  customQuestion?: string;
  customAnswer?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExtrasVideoResponseDto {
  id?: string;
  publicId?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExtrasImageResponseDto {
  id?: string;
  publicId?: string;
  imageUrl?: string;
  imageTitle?: string;
  imageDescription?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExtrasDocumentResponseDto {
  id?: string;
  publicId?: string;
  documentUrl?: string;
  documentTitle?: string;
  equityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
