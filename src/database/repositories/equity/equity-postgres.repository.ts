import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { IEquityRepository } from './equity.repository.interface';
import { Equity } from '../../entities/equity.entity';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class EquityPostgresRepository
  extends PostgresRepository<Equity>
  implements IEquityRepository
{
  protected modelName = 'equity';
  protected selectFields = {
    id: true,
    publicId: true,
    companyLogo: true,
    companyName: true,
    companySlug: true,
    companyTagline: true,
    companyEmail: true,
    companyPhoneNumber: true,
    companyAddress: true,
    yearFounded: true,
    website: true,
    companyCategory: true,
    companyIndustry: true,
    companyDescription: true,
    userId: true,
    status: true,
    isUpcomingCampaign: true,
    projectTimezone: true,
    startDate: true,
    startTime: true,
    actualStartDateTime: true,
    currencyId: true,
    goal: true,
    closingDate: true,
    minimumRaise: true,
    maximumRaise: true,
    campaignStage: true,
    industry: true,
    previouslyRaised: true,
    estimatedRevenue: true,
    hasLeadInvestor: true,
    termId: true,
    termslug: true,
    availableShares: true,
    pricePerShare: true,
    preMoneyValuation: true,
    maturityDate: true,
    investFrequency: true,
    IRR: true,
    equityAvailable: true,
    interestRate: true,
    termLength: true,
    uploadType: true,
    campaignImageURL: true,
    campaignVideoURL: true,
    campaignStory: true,
    googleAnalyticsID: true,
    additionalLinks: true,
    bankName: true,
    accountType: true,
    accountHolderName: true,
    accountNumber: true,
    confirmAccountNumber: true,
    routingNumber: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPublicId(publicId: string): Promise<Equity | null> {
    const result = await this.prisma.equity.findUnique({
      where: { publicId },
      select: this.selectFields,
    });
    return result ? this.transformDecimalFields(result) : null;
  }

  private transformDecimalFields(data: Record<string, unknown>): Equity {
    return {
      ...(data as Omit<
        Equity,
        | 'goal'
        | 'minimumRaise'
        | 'maximumRaise'
        | 'previouslyRaised'
        | 'estimatedRevenue'
        | 'pricePerShare'
        | 'preMoneyValuation'
        | 'IRR'
        | 'equityAvailable'
        | 'interestRate'
      >),
      goal: data.goal ? Number(data.goal) : 0,
      minimumRaise: data.minimumRaise ? Number(data.minimumRaise) : 0,
      maximumRaise: data.maximumRaise ? Number(data.maximumRaise) : 0,
      previouslyRaised: data.previouslyRaised
        ? Number(data.previouslyRaised)
        : undefined,
      estimatedRevenue: data.estimatedRevenue
        ? Number(data.estimatedRevenue)
        : undefined,
      pricePerShare: data.pricePerShare
        ? Number(data.pricePerShare)
        : undefined,
      preMoneyValuation: data.preMoneyValuation
        ? Number(data.preMoneyValuation)
        : undefined,
      IRR: data.IRR ? Number(data.IRR) : undefined,
      equityAvailable: data.equityAvailable
        ? Number(data.equityAvailable)
        : undefined,
      interestRate: data.interestRate ? Number(data.interestRate) : undefined,
    };
  }

  async findByUserId(
    userId: string,
    options?: QueryOptions
  ): Promise<Equity[]> {
    const queryOptions = {
      where: { userId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' as const },
      ...(options?.skip && { skip: options.skip }),
      ...(options?.limit && { take: options.limit }),
    };

    const results = await this.prisma.equity.findMany(queryOptions);
    return results.map((result) => this.transformDecimalFields(result));
  }

  async findActivePublicCampaigns(options?: QueryOptions): Promise<Equity[]> {
    const queryOptions = {
      where: { status: 'ACTIVE' as const },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' as const },
      ...(options?.skip && { skip: options.skip }),
      ...(options?.limit && { take: options.limit }),
    };

    const results = await this.prisma.equity.findMany(queryOptions);
    return results.map((result) => this.transformDecimalFields(result));
  }

  async findRelations(id: string): Promise<Equity | null> {
    const result = await this.prisma.equity.findUnique({
      where: { id },
      select: {
        ...this.selectFields,
        leadInvestors: {
          select: {
            id: true,
            publicId: true,
            investorPhoto: true,
            name: true,
            investorType: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        teamMembers: {
          select: {
            id: true,
            publicId: true,
            memberPhoto: true,
            name: true,
            role: true,
            email: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        campaignFaqs: {
          select: {
            id: true,
            publicId: true,
            questionID: true,
            answer: true,
            customQuestion: true,
            customAnswer: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        extrasVideos: {
          select: {
            id: true,
            publicId: true,
            videoUrl: true,
            videoTitle: true,
            videoDescription: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        extrasImages: {
          select: {
            id: true,
            publicId: true,
            imageUrl: true,
            imageTitle: true,
            imageDescription: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        extrasDocuments: {
          select: {
            id: true,
            publicId: true,
            documentUrl: true,
            documentTitle: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return result ? this.transformDecimalFields(result) : null;
  }

  async canModify(id: string, userId: string): Promise<boolean> {
    const campaign = await this.prisma.equity.findFirst({
      where: {
        id,
        userId,
        status: { in: ['DRAFT', 'PENDING'] },
      },
      select: { id: true },
    });
    return !!campaign;
  }
}
