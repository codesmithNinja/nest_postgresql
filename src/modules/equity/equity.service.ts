import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  IEquityRepository,
  EQUITY_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import {
  ErrorResponse,
  ApiResponse,
} from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import { DateUtil } from '../../common/utils/date.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateEquityDto, UpdateEquityDto } from './dto/equity.dto';
import {
  Equity,
  CampaignStatus,
  TermSlug,
} from '../../database/entities/equity.entity';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class EquityService {
  private readonly logger = new Logger(EquityService.name);

  constructor(
    @Inject(EQUITY_REPOSITORY)
    private readonly equityRepository: IEquityRepository,
    private i18nResponse: I18nResponseService
  ) {}

  /**
   * Get all campaigns for a specific user
   */
  async getUserCampaigns(userId: string, paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const cacheKey = CacheUtil.getCampaignListKey(userId, page, limit);

      // Check cache first
      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        this.logger.log(`Cache hit for user campaigns: ${userId}`);
        return cachedData;
      }

      const result = await this.equityRepository.findWithPagination(
        { userId },
        { page, limit, sort: { createdAt: -1 } }
      );

      const response = this.i18nResponse.success(
        'equity.user_campaigns_retrieved',
        {
          data: result.items,
          pagination: result.pagination,
        }
      );

      // Cache the result
      CacheUtil.set(cacheKey, response, 300); // 5 minutes TTL

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting user campaigns: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all active public campaigns
   */
  async getPublicCampaigns(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const cacheKey = CacheUtil.getPublicCampaignsKey(page, limit);

      // Check cache first
      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        this.logger.log('Cache hit for public campaigns');
        return cachedData;
      }

      const campaigns = await this.equityRepository.findActivePublicCampaigns({
        skip: (page - 1) * limit,
        limit,
      });

      const totalCount = await this.equityRepository.count({
        status: CampaignStatus.ACTIVE,
      });
      const totalPages = Math.ceil(totalCount / limit);

      const response = this.i18nResponse.success(
        'equity.public_campaigns_retrieved',
        {
          data: campaigns,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
          },
        }
      );

      // Cache the result
      CacheUtil.set(cacheKey, response, 600); // 10 minutes TTL

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting public campaigns: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get campaign with all relations
   */
  async getCampaignWithRelations(id: string) {
    try {
      const cacheKey = CacheUtil.getCampaignKey(id);

      // Check cache first
      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        this.logger.log(`Cache hit for campaign: ${id}`);
        return cachedData;
      }

      const campaign = await this.equityRepository.findWithRelations(id);

      if (!campaign) {
        throw new NotFoundException();
      }

      const response = this.i18nResponse.success(
        'equity.campaign_relations_retrieved',
        campaign
      );

      // Cache the result
      CacheUtil.set(cacheKey, response, 300); // 5 minutes TTL

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error getting campaign with relations: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Create new campaign (Step 1)
   */
  async createCampaign(userId: string, createEquityDto: CreateEquityDto) {
    try {
      const campaignData: Partial<Equity> = {
        ...createEquityDto,
        userId,
        status: CampaignStatus.DRAFT,
      };

      const campaign = await this.equityRepository.insert(campaignData);

      // Clear user's campaign cache
      CacheUtil.delPattern(`campaigns:user:${userId}`);

      this.logger.log(`Campaign created successfully: ${campaign.id}`);

      return this.i18nResponse.created('campaign.created', campaign);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating campaign: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Update campaign (Steps 2-6)
   */
  async updateCampaign(
    id: string,
    updateEquityDto: UpdateEquityDto
  ): Promise<ApiResponse<Equity> | ErrorResponse> {
    try {
      const existingCampaign = await this.equityRepository.getDetailById(id);

      if (!existingCampaign) {
        throw new NotFoundException();
      }

      // Validate and prepare update data
      const updateData: Partial<Equity> = {};

      if (updateEquityDto.fundraisingDetails) {
        const fundraising = updateEquityDto.fundraisingDetails;

        // Validate term-specific fields
        const validationResult = this.validateTermSpecificFields(
          fundraising.termslug,
          fundraising as unknown as Record<string, unknown>
        );
        if (validationResult) {
          return validationResult;
        }

        // Calculate actual start date time if upcoming campaign
        if (
          fundraising.isUpcomingCampaign &&
          fundraising.startDate &&
          fundraising.startTime &&
          fundraising.projectTimezone
        ) {
          (
            fundraising as unknown as Record<string, unknown>
          ).actualStartDateTime = DateUtil.calculateActualStartDateTime(
            new Date(fundraising.startDate),
            fundraising.startTime,
            fundraising.projectTimezone
          );
        }

        Object.assign(updateData, fundraising);
      }

      if (updateEquityDto.projectStory) {
        Object.assign(updateData, updateEquityDto.projectStory);
      }

      if (updateEquityDto.extras) {
        Object.assign(updateData, updateEquityDto.extras);
      }

      if (updateEquityDto.investmentInfo) {
        // Validate account numbers match
        const investmentInfo = updateEquityDto.investmentInfo;
        if (
          investmentInfo.accountNumber &&
          investmentInfo.confirmAccountNumber
        ) {
          if (
            investmentInfo.accountNumber !== investmentInfo.confirmAccountNumber
          ) {
            return this.i18nResponse.badRequest(
              'equity.account_numbers_must_match'
            );
          }
        }
        Object.assign(updateData, investmentInfo);
      }

      const updatedCampaign = await this.equityRepository.updateById(
        id,
        updateData
      );

      // Clear related caches
      CacheUtil.delPattern(`campaign:${id}`);
      CacheUtil.delPattern(`campaigns:user:${existingCampaign.userId}`);

      this.logger.log(`Campaign updated successfully: ${id}`);

      return this.i18nResponse.success('campaign.updated', updatedCampaign);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating campaign: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Delete campaign (only DRAFT/PENDING allowed)
   */
  async deleteCampaign(id: string): Promise<ApiResponse | ErrorResponse> {
    try {
      const campaign = await this.equityRepository.getDetailById(id);

      if (!campaign) {
        throw new NotFoundException();
      }

      const allowedStatuses = [CampaignStatus.DRAFT, CampaignStatus.PENDING];
      if (!allowedStatuses.includes(campaign.status)) {
        return this.i18nResponse.badRequest(
          'equity.only_draft_pending_can_delete'
        );
      }

      await this.equityRepository.deleteById(id);

      // Clear related caches
      CacheUtil.delPattern(`campaign:${id}`);
      CacheUtil.delPattern(`campaigns:user:${campaign.userId}`);

      this.logger.log(`Campaign deleted successfully: ${id}`);

      return this.i18nResponse.success('campaign.deleted');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting campaign: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Upload file and return URL
   */
  async uploadFile(file: Express.Multer.File, prefix: string) {
    try {
      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filename = FileUploadUtil.generateFileName(
        file.originalname,
        prefix
      );
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, file.buffer);

      const fileUrl = `${process.env.API_URL}/uploads/${filename}`;

      this.logger.log(`File uploaded successfully: ${filename}`);

      return this.i18nResponse.success('common.file_uploaded', {
        filename,
        url: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Validate term-specific fields based on termslug
   */
  private validateTermSpecificFields(
    termslug: TermSlug,
    data: Record<string, unknown>
  ): void | ErrorResponse {
    if (!termslug) return;

    const requiredFields: Record<TermSlug, string[]> = {
      [TermSlug.EQUITY_DIVIDEND]: [
        'availableShares',
        'pricePerShare',
        'preMoneyValuation',
        'maturityDate',
        'investFrequency',
        'IRR',
      ],
      [TermSlug.EQUITY]: [
        'availableShares',
        'pricePerShare',
        'equityAvailable',
        'preMoneyValuation',
      ],
      [TermSlug.DEBT]: [
        'interestRate',
        'maturityDate',
        'investFrequency',
        'termLength',
        'preMoneyValuation',
      ],
    };

    const required = requiredFields[termslug];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      return this.i18nResponse.badRequest(
        'equity.missing_required_fields',
        undefined
      );
    }
  }
}
