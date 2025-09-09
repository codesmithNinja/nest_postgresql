import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  ICampaignFaqRepository,
  CAMPAIGN_FAQ_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
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
    private readonly campaignFaqRepository: ICampaignFaqRepository
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

      const response = ResponseHandler.success(
        'Campaign FAQs retrieved successfully',
        200,
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
        throw new BadRequestException(
          'Either provide questionID with answer, or customQuestion with customAnswer'
        );
      }

      if (hasStandardFaq && hasCustomFaq) {
        throw new BadRequestException(
          'Cannot provide both standard and custom FAQ data'
        );
      }

      const campaignFaqData: Partial<CampaignFaq> = {
        ...createCampaignFaqDto,
        equityId,
      };

      const campaignFaq =
        await this.campaignFaqRepository.insert(campaignFaqData);

      CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

      this.logger.log(`Campaign FAQ created successfully: ${campaignFaq.id}`);

      return ResponseHandler.created(
        'Campaign FAQ created successfully',
        campaignFaq
      );
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
        throw new NotFoundException('Campaign FAQ not found');
      }

      const updatedCampaignFaq = await this.campaignFaqRepository.updateById(
        campaignFaq.id,
        updateCampaignFaqDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

      this.logger.log(`Campaign FAQ updated successfully: ${id}`);

      return ResponseHandler.success(
        'Campaign FAQ updated successfully',
        200,
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
        throw new NotFoundException('Campaign FAQ not found');
      }

      await this.campaignFaqRepository.deleteById(campaignFaq.id);

      CacheUtil.delPattern(`campaign:${equityId}:campaignFaqs`);

      this.logger.log(`Campaign FAQ deleted successfully: ${id}`);

      return ResponseHandler.success('Campaign FAQ deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting campaign FAQ: ${errorMessage}`);
      throw error;
    }
  }
}
