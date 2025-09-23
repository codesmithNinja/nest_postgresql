import slugify from 'slugify';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheUtil } from '../../common/utils/cache.util';
import { DateUtil } from '../../common/utils/date.util';
import { DiscardUnderscores } from '../../common/utils/discard-underscores.util';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiResponse,
  ErrorResponse,
} from '../../common/utils/response.handler';
import {
  FileUploadUtil,
  getBucketName,
} from '../../common/utils/file-upload.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  IEquityRepository,
  EQUITY_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import {
  CampaignStatus,
  Equity,
  TermSlug,
  UploadType,
} from '../../database/entities/equity.entity';

import {
  CreateEquityDto,
  UpdateEquityDto,
  UpdateEquityFormDataDto,
} from './dto/equity.dto';

@Injectable()
export class EquityService {
  private readonly logger = new Logger(EquityService.name);

  constructor(
    @Inject(EQUITY_REPOSITORY)
    private readonly equityRepository: IEquityRepository,
    private i18nResponse: I18nResponseService
  ) {}

  /**
   * Generate company slug from company name
   */
  private generateCompanySlug(companyName: string): string {
    const timeString = new Date().getTime().toString().substr(7, 5);
    return `${slugify(companyName, { lower: true })}-${timeString}`;
  }

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
      // Generate company slug if companyName is provided
      let companySlug: string | undefined;
      if (createEquityDto.companyName) {
        companySlug = this.generateCompanySlug(createEquityDto.companyName);
      }

      const campaignData: Partial<Equity> = {
        ...createEquityDto,
        companySlug,
        userId,
        status: CampaignStatus.DRAFT,
        // Set default values for required fields
        isUpcomingCampaign: false,
        currencyId: 'USD', // Default currency
        goal: 0,
        closingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        minimumRaise: 0,
        maximumRaise: 0,
        campaignStage: 'Pre-seed',
        industry: createEquityDto.companyCategory,
        hasLeadInvestor: false,
        termId: 'default',
        termslug: TermSlug.EQUITY,
      };

      const campaign = await this.equityRepository.insert(campaignData);

      // Clear user's campaign cache
      CacheUtil.delPattern(`campaigns:user:${userId}`);

      this.logger.log(`Campaign created successfully: ${campaign.id}`);

      return this.i18nResponse.created('equity.campaign_created', campaign);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating campaign: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Validate campaign update before file operations
   */
  async validateCampaignUpdate(
    id: string,
    updateEquityDto: UpdateEquityDto | UpdateEquityFormDataDto
  ): Promise<Equity> {
    const existingCampaign = await this.equityRepository.getDetailById(id);

    if (!existingCampaign) {
      throw new NotFoundException();
    }

    // Add any additional validation logic here
    // For example, check if user has permission to update this campaign
    DiscardUnderscores(updateEquityDto);

    return existingCampaign;
  }

  /**
   * Update campaign (Steps 2-6)
   */
  async updateCampaign(
    id: string,
    updateEquityDto: UpdateEquityDto | UpdateEquityFormDataDto,
    file?: Express.Multer.File
  ): Promise<ApiResponse<Equity> | ErrorResponse> {
    try {
      // Note: validation should be done in controller before calling this method
      const existingCampaign = await this.equityRepository.getDetailById(id);

      if (!existingCampaign) {
        throw new NotFoundException();
      }

      // Handle file upload if provided
      if (file) {
        // Only process file upload if uploadType is IMAGE or if uploadType is not specified
        const shouldUploadImage =
          !updateEquityDto.uploadType ||
          updateEquityDto.uploadType === UploadType.IMAGE;

        if (shouldUploadImage) {
          try {
            // Get the old image path for cleanup
            const oldImagePath = existingCampaign.campaignImageURL;

            const uploadResult = await FileUploadUtil.uploadFile(
              file,
              {
                bucketName: getBucketName('CAMPAIGNS'),
                allowedMimeTypes: [
                  'image/jpeg',
                  'image/png',
                  'image/webp',
                  'image/gif',
                ],
                maxSizeInMB: 5,
                fieldName: 'campaignImageURL',
              },
              oldImagePath
            );

            // Get the file URL
            const fileUrl = uploadResult.filePath;

            // Set the uploaded file URL in the update data
            updateEquityDto.campaignImageURL = fileUrl;

            // Also set uploadType if it wasn't provided
            if (!updateEquityDto.uploadType) {
              updateEquityDto.uploadType = UploadType.IMAGE;
            }

            this.logger.log(
              `Campaign image uploaded successfully: ${uploadResult.filePath}${oldImagePath ? ` (old image ${oldImagePath} cleaned up)` : ''}`
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Error uploading campaign image: ${errorMessage}`
            );
            return this.i18nResponse.badRequest(
              'equity.image_upload_failed',
              errorMessage
            );
          }
        }
      }

      // Type guard to check if it's UpdateEquityDto
      const isUpdateEquityDto = (
        dto: UpdateEquityDto | UpdateEquityFormDataDto
      ): dto is UpdateEquityDto => {
        return (
          'companyName' in dto ||
          'fundraisingDetails' in dto ||
          'projectStory' in dto ||
          'extras' in dto ||
          'investmentInfo' in dto
        );
      };

      // Generate company slug if companyName is being updated
      if (isUpdateEquityDto(updateEquityDto) && updateEquityDto.companyName) {
        updateEquityDto.companySlug = this.generateCompanySlug(
          updateEquityDto.companyName
        );
      }

      // Validate and prepare update data
      const updateData: Partial<Equity> = {};

      // Handle nested structure (original format)
      if (
        isUpdateEquityDto(updateEquityDto) &&
        updateEquityDto.fundraisingDetails
      ) {
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

      if (isUpdateEquityDto(updateEquityDto) && updateEquityDto.projectStory) {
        Object.assign(updateData, updateEquityDto.projectStory);
      }

      if (isUpdateEquityDto(updateEquityDto) && updateEquityDto.extras) {
        Object.assign(updateData, updateEquityDto.extras);
      }

      if (
        isUpdateEquityDto(updateEquityDto) &&
        updateEquityDto.investmentInfo
      ) {
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

      // Handle direct fields (for backward compatibility and ease of use)
      const directFields = [
        'companyName',
        'companySlug',
        'isUpcomingCampaign',
        'projectTimezone',
        'startDate',
        'startTime',
        'currencyId',
        'goal',
        'closingDate',
        'minimumRaise',
        'maximumRaise',
        'campaignStage',
        'industry',
        'previouslyRaised',
        'estimatedRevenue',
        'hasLeadInvestor',
        'termId',
        'termslug',
        'availableShares',
        'pricePerShare',
        'preMoneyValuation',
        'maturityDate',
        'investFrequency',
        'IRR',
        'equityAvailable',
        'interestRate',
        'termLength',
        'uploadType',
        'campaignImageURL',
        'campaignVideoURL',
        'campaignStory',
        'googleAnalyticsID',
        'additionalLinks',
        'bankName',
        'accountType',
        'accountHolderName',
        'accountNumber',
        'confirmAccountNumber',
        'routingNumber',
        'status',
      ];

      const directUpdateData: Record<string, unknown> = {};
      let hasDirectFields = false;

      for (const field of directFields) {
        if (
          updateEquityDto[field as keyof typeof updateEquityDto] !== undefined
        ) {
          directUpdateData[field] =
            updateEquityDto[field as keyof typeof updateEquityDto];
          hasDirectFields = true;
        }
      }

      if (hasDirectFields) {
        // Validate term-specific fields for direct fields
        if (directUpdateData.termslug) {
          const validationResult = this.validateTermSpecificFields(
            directUpdateData.termslug as TermSlug,
            directUpdateData
          );
          if (validationResult) {
            return validationResult;
          }
        }

        // Calculate actual start date time if upcoming campaign for direct fields
        if (
          directUpdateData.isUpcomingCampaign &&
          directUpdateData.startDate &&
          directUpdateData.startTime &&
          directUpdateData.projectTimezone
        ) {
          directUpdateData.actualStartDateTime =
            DateUtil.calculateActualStartDateTime(
              new Date(directUpdateData.startDate as string),
              directUpdateData.startTime as string,
              directUpdateData.projectTimezone as string
            );
        }

        // Validate account numbers match for direct fields
        if (
          directUpdateData.accountNumber &&
          directUpdateData.confirmAccountNumber
        ) {
          if (
            directUpdateData.accountNumber !==
            directUpdateData.confirmAccountNumber
          ) {
            return this.i18nResponse.badRequest(
              'equity.account_numbers_must_match'
            );
          }
        }

        Object.assign(updateData, directUpdateData);
      }

      const updatedCampaign = await this.equityRepository.updateById(
        id,
        updateData
      );

      // Clear related caches
      CacheUtil.delPattern(`campaign:${id}`);
      CacheUtil.delPattern(`campaigns:user:${existingCampaign.userId}`);

      this.logger.log(`Campaign updated successfully: ${id}`);

      return this.i18nResponse.success(
        'equity.campaign_updated',
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

      return this.i18nResponse.success('equity.campaign_deleted');
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
      // Determine bucket name based on prefix
      let bucketName: string;
      let allowedMimeTypes: string[];
      let maxSizeInMB: number;

      switch (prefix) {
        case 'logo':
          bucketName = getBucketName('COMPANY');
          allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ];
          maxSizeInMB = 5;
          break;
        case 'campaign-image':
          bucketName = getBucketName('CAMPAIGNS');
          allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ];
          maxSizeInMB = 5;
          break;
        default:
          bucketName = getBucketName('CAMPAIGNS');
          allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ];
          maxSizeInMB = 5;
      }

      const uploadResult = await FileUploadUtil.uploadFile(file, {
        bucketName,
        allowedMimeTypes,
        maxSizeInMB,
        fieldName: prefix,
      });

      const fileUrl = uploadResult.filePath;

      this.logger.log(`File uploaded successfully: ${uploadResult.filePath}`);

      return this.i18nResponse.success('common.file_uploaded', {
        filename: uploadResult.filePath,
        url: fileUrl,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
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
