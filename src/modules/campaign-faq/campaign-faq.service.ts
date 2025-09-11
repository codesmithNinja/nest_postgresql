import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ICampaignFaqRepository,
  CAMPAIGN_FAQ_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateCampaignFaqDto,
  UpdateCampaignFaqDto,
} from './dto/campaign-faq.dto';
import { CampaignFaq } from '../../database/entities/campaign-faq.entity';

@Injectable()
export class CampaignFaqService {
  private readonly logger = new Logger(CampaignFaqService.name);

  constructor(
    @Inject(CAMPAIGN_FAQ_REPOSITORY)
    private readonly campaignFaqRepository: ICampaignFaqRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getCampaignFaqsByEquityId(equityId: string) {
    try {
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
        'campaign_faq.retrieved',
        campaignFaqs
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting campaign FAQs: ${errorMessage}`);
      throw error;
    }
  }

  async createCampaignFaq(
    equityId: string,
    createCampaignFaqDto: CreateCampaignFaqDto
  ) {
    try {
      // Validate that either standard FAQ or custom FAQ is provided
      const hasStandardFaq =
        createCampaignFaqDto.questionID && createCampaignFaqDto.answer;
      const hasCustomFaq =
        createCampaignFaqDto.customQuestion &&
        createCampaignFaqDto.customAnswer;

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

      this.logger.log(`Campaign FAQ created successfully: ${campaignFaq.id}`);

      return this.i18nResponse.created('campaign_faq.created', campaignFaq);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating campaign FAQ: ${errorMessage}`);
      throw error;
    }
  }

  async updateCampaignFaq(
    equityId: string,
    id: string,
    updateCampaignFaqDto: UpdateCampaignFaqDto
  ) {
    try {
      const campaignFaq =
        await this.campaignFaqRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!campaignFaq) {
        throw new NotFoundException();
      }

      const updatedCampaignFaq = await this.campaignFaqRepository.updateById(
        campaignFaq.id,
        updateCampaignFaqDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

      this.logger.log(`Campaign FAQ updated successfully: ${id}`);

      return this.i18nResponse.success(
        'campaign_faq.updated',
        updatedCampaignFaq
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating campaign FAQ: ${errorMessage}`);
      throw error;
    }
  }

  async deleteCampaignFaq(equityId: string, id: string) {
    try {
      const campaignFaq =
        await this.campaignFaqRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!campaignFaq) {
        throw new NotFoundException();
      }

      await this.campaignFaqRepository.deleteById(campaignFaq.id);

      CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

      this.logger.log(`Campaign FAQ deleted successfully: ${id}`);

      return this.i18nResponse.success('campaign_faq.deleted');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting campaign FAQ: ${errorMessage}`);
      throw error;
    }
  }
}
