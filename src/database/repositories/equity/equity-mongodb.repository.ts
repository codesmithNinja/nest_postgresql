import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { IEquityRepository } from '../../../common/interfaces/campaign-repository.interface';
import { Equity, EquityDocument } from '../../schemas/equity.schema';
import {
  Equity as EquityEntity,
  CampaignStatus,
  TermSlug,
  UploadType,
  AccountType,
  AdditionalLink,
} from '../../entities/equity.entity';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class EquityMongoRepository
  extends MongoRepository<EquityDocument, EquityEntity>
  implements IEquityRepository
{
  constructor(
    @InjectModel(Equity.name)
    protected readonly model: Model<EquityDocument>
  ) {
    super(model);
  }

  protected toEntity(doc: EquityDocument | null): EquityEntity | null {
    if (!doc) return null;
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      companyLogo: (obj.companyLogo as string) || '',
      companyName: (obj.companyName as string) || '',
      companyTagline: (obj.companyTagline as string) || '',
      companyEmail: (obj.companyEmail as string) || '',
      companyPhoneNumber: (obj.companyPhoneNumber as string) || '',
      companyAddress: (obj.companyAddress as string) || '',
      yearFounded: (obj.yearFounded as number) || 0,
      website: (obj.website as string) || '',
      companyCategory: (obj.companyCategory as string) || '',
      companyIndustry: (obj.companyIndustry as string) || '',
      companyDescription: (obj.companyDescription as string) || '',
      userId: (obj.userId as string) || '',
      status: (obj.status as CampaignStatus) || CampaignStatus.DRAFT,
      isUpcomingCampaign: (obj.isUpcomingCampaign as boolean) || false,
      projectTimezone: (obj.projectTimezone as string) || '',
      startDate: (obj.startDate as Date) || undefined,
      startTime: (obj.startTime as string) || '',
      actualStartDateTime: (obj.actualStartDateTime as Date) || undefined,
      currencyId: (obj.currencyId as string) || '',
      goal: (obj.goal as number) || 0,
      closingDate: (obj.closingDate as Date) || undefined,
      minimumRaise: (obj.minimumRaise as number) || 0,
      maximumRaise: (obj.maximumRaise as number) || 0,
      campaignStage: (obj.campaignStage as string) || '',
      industry: (obj.industry as string) || '',
      previouslyRaised: (obj.previouslyRaised as number) || 0,
      estimatedRevenue: (obj.estimatedRevenue as number) || 0,
      hasLeadInvestor: (obj.hasLeadInvestor as boolean) || false,
      termId: (obj.termId as string) || '',
      termslug: (obj.termslug as TermSlug) || TermSlug.EQUITY,
      availableShares: (obj.availableShares as number) || 0,
      pricePerShare: (obj.pricePerShare as number) || 0,
      preMoneyValuation: (obj.preMoneyValuation as number) || 0,
      maturityDate: (obj.maturityDate as Date) || undefined,
      investFrequency: (obj.investFrequency as string) || '',
      IRR: (obj.IRR as number) || 0,
      equityAvailable: (obj.equityAvailable as number) || 0,
      interestRate: (obj.interestRate as number) || 0,
      termLength: (obj.termLength as number) || 0,
      uploadType: (obj.uploadType as UploadType) || UploadType.IMAGE,
      campaignImageURL: (obj.campaignImageURL as string) || '',
      campaignVideoURL: (obj.campaignVideoURL as string) || '',
      campaignStory: (obj.campaignStory as string) || '',
      googleAnalyticsID: obj.googleAnalyticsID
        ? typeof obj.googleAnalyticsID === 'string'
          ? obj.googleAnalyticsID
          : typeof obj.googleAnalyticsID !== 'object'
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(obj.googleAnalyticsID)
            : ''
        : '',
      additionalLinks:
        (obj.additionalLinks
          ? typeof obj.additionalLinks === 'string'
            ? (JSON.parse(obj.additionalLinks) as AdditionalLink[])
            : (obj.additionalLinks as AdditionalLink[])
          : []) || [],
      bankName: (obj.bankName as string) || '',
      accountType:
        (obj.accountType as AccountType) || AccountType.CURRENT_ACCOUNT,
      accountHolderName: (obj.accountHolderName as string) || '',
      accountNumber: (obj.accountNumber as string) || '',
      confirmAccountNumber: (obj.confirmAccountNumber as string) || '',
      routingNumber: (obj.routingNumber as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(entity: Partial<EquityEntity>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByPublicId(publicId: string): Promise<EquityEntity | null> {
    const doc = await this.model.findOne({ publicId }).exec();
    return this.toEntity(doc);
  }

  async findByUserId(
    userId: string,
    options?: QueryOptions
  ): Promise<EquityEntity[]> {
    const query = this.model.find({ userId }).sort({ createdAt: -1 });
    const docs = await this.applyQueryOptions(query, options).exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findActivePublicCampaigns(
    options?: QueryOptions
  ): Promise<EquityEntity[]> {
    const query = this.model.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    const docs = await this.applyQueryOptions(query, options).exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findWithRelations(id: string): Promise<EquityEntity | null> {
    const doc = await this.model.findById(id).exec();
    return this.toEntity(doc);
  }

  async canModify(id: string, userId: string): Promise<boolean> {
    const doc = await this.model
      .findOne({
        _id: id,
        userId,
        status: { $in: ['DRAFT', 'PENDING'] },
      })
      .exec();
    return !!doc;
  }
}
