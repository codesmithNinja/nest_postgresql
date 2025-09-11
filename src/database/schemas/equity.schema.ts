import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EquityDocument = Equity & Document;

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
  IMAGE = 'Image',
  VIDEO = 'Video',
}

export enum AccountType {
  CURRENT_ACCOUNT = 'Current Account',
  SAVING_ACCOUNT = 'Saving Account',
}

export enum TermSlug {
  EQUITY_DIVIDEND = 'EQUITY + DIVIDEND',
  EQUITY = 'EQUITY',
  DEBT = 'DEBT',
}

@Schema({
  timestamps: true,
  collection: 'equity_campaigns',
  toJSON: {
    transform: function (
      _doc: unknown,
      ret: Record<string, unknown>
    ): Record<string, unknown> {
      const result: Record<string, unknown> = {
        ...ret,
        id: (ret._id as { toHexString: () => string }).toHexString(),
      };
      delete result._id;
      delete result.__v;
      return result;
    },
  },
})
export class Equity {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId!: string;

  // Step 1: Company Information
  @Prop({ required: true })
  companyLogo!: string;

  @Prop({ required: true })
  companyName!: string;

  @Prop({ required: true })
  companyTagline!: string;

  @Prop({ required: true })
  companyEmail!: string;

  @Prop({ required: true })
  companyPhoneNumber!: string;

  @Prop({ required: true })
  companyAddress!: string;

  @Prop({ required: true })
  yearFounded!: number;

  @Prop()
  website?: string;

  @Prop({ required: true })
  companyCategory!: string;

  @Prop({ required: true })
  companyIndustry!: string;

  @Prop({ required: true })
  companyDescription!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status!: CampaignStatus;

  // Step 2: Fundraising Details
  @Prop({ required: true })
  isUpcomingCampaign!: boolean;

  @Prop()
  projectTimezone?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  startTime?: string;

  @Prop()
  actualStartDateTime?: Date;

  @Prop({ required: true })
  currencyId!: string;

  @Prop({ required: true })
  goal!: number;

  @Prop({ required: true })
  closingDate!: Date;

  @Prop({ required: true })
  minimumRaise!: number;

  @Prop({ required: true })
  maximumRaise!: number;

  @Prop({ required: true })
  campaignStage!: string;

  @Prop({ required: true })
  industry!: string;

  @Prop()
  previouslyRaised?: number;

  @Prop()
  estimatedRevenue?: number;

  @Prop({ required: true })
  hasLeadInvestor!: boolean;

  @Prop({ required: true })
  termId!: string;

  @Prop({ enum: TermSlug, required: true })
  termslug!: TermSlug;

  // Term-specific fields
  @Prop()
  availableShares?: number;

  @Prop()
  pricePerShare?: number;

  @Prop()
  preMoneyValuation?: number;

  @Prop()
  maturityDate?: Date;

  @Prop()
  investFrequency?: string;

  @Prop()
  IRR?: number;

  @Prop()
  equityAvailable?: number;

  @Prop()
  interestRate?: number;

  @Prop()
  termLength?: number;

  // Step 3: Project Story
  @Prop({ enum: UploadType })
  uploadType?: UploadType;

  @Prop()
  campaignImageURL?: string;

  @Prop()
  campaignVideoURL?: string;

  @Prop()
  campaignStory?: string;

  // Step 5: Extras
  @Prop()
  googleAnalyticsID?: string;

  @Prop({ type: [{ linkTitle: String, linkUrl: String }], default: [] })
  additionalLinks?: { linkTitle: string; linkUrl: string }[];

  // Step 6: Investment Info
  @Prop()
  bankName?: string;

  @Prop({ enum: AccountType })
  accountType?: AccountType;

  @Prop()
  accountHolderName?: string;

  @Prop()
  accountNumber?: string;

  @Prop()
  confirmAccountNumber?: string;

  @Prop()
  routingNumber?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EquitySchema = SchemaFactory.createForClass(Equity);

// Indexes
EquitySchema.index({ userId: 1 });
EquitySchema.index({ status: 1 });
EquitySchema.index({ userId: 1, status: 1 });
