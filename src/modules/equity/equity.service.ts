import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  IEquityRepository,
  EQUITY_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
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
    private readonly equityRepository: IEquityRepository
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

      const response = ResponseHandler.paginated(
        'User campaigns retrieved successfully',
        result.items,
        result.pagination
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

      const response = ResponseHandler.paginated(
        'Public campaigns retrieved successfully',
        campaigns,
        {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
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
        throw new NotFoundException('Campaign not found');
      }

      const response = ResponseHandler.success(
        'Campaign with relations retrieved successfully',
        200,
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

      return ResponseHandler.created('Campaign created successfully', campaign);
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
  async updateCampaign(id: string, updateEquityDto: UpdateEquityDto) {
    try {
      const existingCampaign = await this.equityRepository.getDetailById(id);

      if (!existingCampaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Validate and prepare update data
      const updateData: Partial<Equity> = {};

      if (updateEquityDto.fundraisingDetails) {
        const fundraising = updateEquityDto.fundraisingDetails;

        // Validate term-specific fields
        this.validateTermSpecificFields(
          fundraising.termslug,
          fundraising as unknown as Record<string, unknown>
        );

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
            throw new BadRequestException('Account numbers must match');
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

      return ResponseHandler.success(
        'Campaign updated successfully',
        200,
        updatedCampaign
      );
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
  async deleteCampaign(id: string) {
    try {
      const campaign = await this.equityRepository.getDetailById(id);

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      const allowedStatuses = [CampaignStatus.DRAFT, CampaignStatus.PENDING];
      if (!allowedStatuses.includes(campaign.status)) {
        throw new BadRequestException(
          'Only campaigns with DRAFT or PENDING status can be deleted'
        );
      }

      await this.equityRepository.deleteById(id);

      // Clear related caches
      CacheUtil.delPattern(`campaign:${id}`);
      CacheUtil.delPattern(`campaigns:user:${campaign.userId}`);

      this.logger.log(`Campaign deleted successfully: ${id}`);

      return ResponseHandler.success('Campaign deleted successfully');
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

      return ResponseHandler.success('File uploaded successfully', 201, {
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
  ): void {
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
      throw new BadRequestException(
        `Missing required fields for ${termslug}: ${missing.join(', ')}`
      );
    }
  }
}
