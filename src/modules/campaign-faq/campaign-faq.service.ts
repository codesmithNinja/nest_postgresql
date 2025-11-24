import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ICampaignFaqRepository,
  CAMPAIGN_FAQ_REPOSITORY,
} from '../../database/repositories/campaign-faq/campaign-faq.repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateCampaignFaqDto,
  UpdateCampaignFaqDto,
} from './dto/campaign-faq.dto';
import { CampaignFaq } from '../../database/entities/campaign-faq.entity';

@Injectable()
export class CampaignFaqService {
  constructor(
    @Inject(CAMPAIGN_FAQ_REPOSITORY)
    private readonly campaignFaqRepository: ICampaignFaqRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getCampaignFaqsByEquityId(equityId: string) {
    const cacheKey = CacheUtil.getCampaignRelationsKey(
      equityId,
      'campaignFaqs'
    );

    const cachedData = CacheUtil.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const campaignFaqs =
      await this.campaignFaqRepository.findByEquityId(equityId);

    const response = this.i18nResponse.success(
      'campaign_faq.retrieved_successfully',
      campaignFaqs
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async createCampaignFaq(
    equityId: string,
    createCampaignFaqDto: CreateCampaignFaqDto
  ) {
    // Validate that either standard FAQ or custom FAQ is provided
    const hasStandardFaq =
      createCampaignFaqDto.questionID && createCampaignFaqDto.answer;
    const hasCustomFaq =
      createCampaignFaqDto.customQuestion && createCampaignFaqDto.customAnswer;

    if (!hasStandardFaq && !hasCustomFaq) {
      return this.i18nResponse.badRequest(
        'campaign_faq.either_standard_or_custom'
      );
    }

    if (hasStandardFaq && hasCustomFaq) {
      return this.i18nResponse.badRequest('campaign_faq.cannot_provide_both');
    }

    const campaignFaqData: Partial<CampaignFaq> = {
      ...createCampaignFaqDto,
      equityId,
    };

    const campaignFaq =
      await this.campaignFaqRepository.insert(campaignFaqData);

    CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

    return this.i18nResponse.created(
      'campaign_faq.created_successfully',
      campaignFaq
    );
  }

  async updateCampaignFaq(
    equityId: string,
    id: string,
    updateCampaignFaqDto: UpdateCampaignFaqDto
  ) {
    const campaignFaq =
      await this.campaignFaqRepository.findByEquityIdAndPublicId(equityId, id);

    if (!campaignFaq) {
      throw new NotFoundException();
    }

    const updatedCampaignFaq = await this.campaignFaqRepository.updateById(
      campaignFaq.id,
      updateCampaignFaqDto
    );

    CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

    return this.i18nResponse.success(
      'campaign_faq.updated_successfully',
      updatedCampaignFaq
    );
  }

  async deleteCampaignFaq(equityId: string, id: string) {
    const campaignFaq =
      await this.campaignFaqRepository.findByEquityIdAndPublicId(equityId, id);

    if (!campaignFaq) {
      throw new NotFoundException();
    }

    await this.campaignFaqRepository.deleteById(campaignFaq.id);

    CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

    return this.i18nResponse.success('campaign_faq.deleted_successfully');
  }
}
