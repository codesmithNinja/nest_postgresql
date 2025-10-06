import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ICampaignFaqRepository } from './campaign-faq.repository.interface';
import { CampaignFaq } from '../../entities/campaign-faq.entity';

@Injectable()
export class CampaignFaqPostgresRepository
  extends PostgresRepository<CampaignFaq>
  implements ICampaignFaqRepository
{
  protected modelName = 'campaignFaq';
  protected selectFields = {
    id: true,
    publicId: true,
    questionID: true,
    answer: true,
    customQuestion: true,
    customAnswer: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<CampaignFaq[]> {
    const results = await this.prisma.campaignFaq.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as CampaignFaq[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<CampaignFaq | null> {
    const result = await this.prisma.campaignFaq.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as CampaignFaq | null;
  }
}
