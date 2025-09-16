import { LeadInvestor } from './lead-investor.entity';
import { TeamMember } from './team-member.entity';
import { CampaignFaq } from './campaign-faq.entity';
import { ExtrasVideo } from './extras-video.entity';
import { ExtrasImage } from './extras-image.entity';
import { ExtrasDocument } from './extras-document.entity';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECT = 'REJECT',
  SUCCESSFUL = 'SUCCESSFUL',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  HIDDEN = 'HIDDEN',
  INACTIVE = 'INACTIVE',
}

export enum UploadType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum AccountType {
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  SAVING_ACCOUNT = 'SAVING_ACCOUNT',
}

export enum TermSlug {
  EQUITY_DIVIDEND = 'EQUITY + DIVIDEND',
  EQUITY = 'EQUITY',
  DEBT = 'DEBT',
}

export interface AdditionalLink {
  linkTitle: string;
  linkUrl: string;
}

export interface Equity {
  id: string;
  publicId: string;

  // Step 1: Company Information
  companyLogo: string;
  companyName: string;
  companySlug?: string;
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

  // Step 2: Fundraising Details
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

  // Term-specific fields
  availableShares?: number;
  pricePerShare?: number;
  preMoneyValuation?: number;
  maturityDate?: Date;
  investFrequency?: string;
  IRR?: number;
  equityAvailable?: number;
  interestRate?: number;
  termLength?: number;

  // Step 3: Project Story
  uploadType?: UploadType;
  campaignImageURL?: string;
  campaignVideoURL?: string;
  campaignStory?: string;

  // Step 5: Extras
  googleAnalyticsID?: string;
  additionalLinks?: AdditionalLink[];

  // Step 6: Investment Info
  bankName?: string;
  accountType?: AccountType;
  accountHolderName?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  routingNumber?: string;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  leadInvestors?: LeadInvestor[];
  teamMembers?: TeamMember[];
  campaignFaqs?: CampaignFaq[];
  extrasVideos?: ExtrasVideo[];
  extrasImages?: ExtrasImage[];
  extrasDocuments?: ExtrasDocument[];
}
