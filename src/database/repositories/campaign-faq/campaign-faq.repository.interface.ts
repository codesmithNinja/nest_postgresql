import { IRepository } from '../../../common/interfaces/repository.interface';
import { CampaignFaq } from '../../entities/campaign-faq.entity';

export interface ICampaignFaqRepository extends IRepository<CampaignFaq> {
  findByEquityId(equityId: string): Promise<CampaignFaq[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<CampaignFaq | null>;
}

export const CAMPAIGN_FAQ_REPOSITORY = 'CAMPAIGN_FAQ_REPOSITORY';
