import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ILeadInvestorRepository,
  LEAD_INVESTOR_REPOSITORY,
} from '../../database/repositories/lead-investor/lead-investor.repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileManagementService } from '../../common/services/file-management.service';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateLeadInvestorDto,
  UpdateLeadInvestorDto,
} from './dto/lead-investor.dto';
import { LeadInvestor } from '../../database/entities/lead-investor.entity';

@Injectable()
export class LeadInvestorService {
  private readonly logger = new Logger(LeadInvestorService.name);

  constructor(
    @Inject(LEAD_INVESTOR_REPOSITORY)
    private readonly leadInvestorRepository: ILeadInvestorRepository,
    private i18nResponse: I18nResponseService,
    private fileManagementService: FileManagementService
  ) {}

  async findByEquityId(equityId: string) {
    try {
      const cacheKey = CacheUtil.getCampaignRelationsKey(
        equityId,
        'leadInvestors'
      );

      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const leadInvestors =
        await this.leadInvestorRepository.findByEquityId(equityId);

      const response = this.i18nResponse.success(
        'lead_investor.retrieved',
        leadInvestors
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting lead investors: ${errorMessage}`);
      throw error;
    }
  }

  async create(
    equityId: string,
    createLeadInvestorDto: CreateLeadInvestorDto,
    file: Express.Multer.File
  ) {
    try {
      // Upload the file first
      const uploadResult =
        await this.fileManagementService.uploadLeadInvestorImage(file);

      const leadInvestorData: Partial<LeadInvestor> = {
        ...createLeadInvestorDto,
        investorPhoto: uploadResult.filePath,
        equityId,
      };

      const leadInvestor =
        await this.leadInvestorRepository.insert(leadInvestorData);

      // Clear related caches
      CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

      this.logger.log(`Lead investor created successfully: ${leadInvestor.id}`);

      return this.i18nResponse.created('lead_investor.created', leadInvestor);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating lead investor: ${errorMessage}`);
      throw error;
    }
  }

  async update(
    equityId: string,
    id: string,
    updateLeadInvestorDto: UpdateLeadInvestorDto,
    file?: Express.Multer.File
  ) {
    try {
      const leadInvestor =
        await this.leadInvestorRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!leadInvestor) {
        throw new NotFoundException();
      }

      const updateData: Partial<LeadInvestor> = {
        ...updateLeadInvestorDto,
      };

      // Handle file upload if a file is provided - validation first approach
      if (file) {
        // Upload the new file first
        const uploadResult =
          await this.fileManagementService.uploadLeadInvestorImage(file);

        updateData.investorPhoto = uploadResult.filePath;

        // Clean up old file after successful upload and validation
        if (leadInvestor.investorPhoto) {
          try {
            const fileExists = await this.fileManagementService.fileExists(
              leadInvestor.investorPhoto
            );
            if (fileExists) {
              await this.fileManagementService.deleteFile(
                leadInvestor.investorPhoto
              );
              this.logger.log(
                `Old lead investor photo deleted: ${leadInvestor.investorPhoto}`
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to delete old lead investor photo: ${leadInvestor.investorPhoto}. Error: ${errorMessage}`
            );
            // Don't throw here as the main update was successful
          }
        }
      }

      const updatedLeadInvestor = await this.leadInvestorRepository.updateById(
        leadInvestor.id,
        updateData
      );

      // Clear related caches
      CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

      this.logger.log(`Lead investor updated successfully: ${id}`);

      return this.i18nResponse.success(
        'lead_investor.updated',
        updatedLeadInvestor
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating lead investor: ${errorMessage}`);
      throw error;
    }
  }

  async delete(equityId: string, id: string) {
    try {
      const leadInvestor =
        await this.leadInvestorRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!leadInvestor) {
        throw new NotFoundException();
      }

      // Clean up lead investor photo if exists
      if (leadInvestor.investorPhoto) {
        try {
          this.logger.log(
            `Attempting to delete lead investor photo: ${leadInvestor.investorPhoto}`
          );

          // Check if file exists before attempting deletion
          const fileExists = await this.fileManagementService.fileExists(
            leadInvestor.investorPhoto
          );
          if (!fileExists) {
            this.logger.warn(
              `Lead investor photo file does not exist: ${leadInvestor.investorPhoto}`
            );
          } else {
            await this.fileManagementService.deleteFile(
              leadInvestor.investorPhoto
            );
            this.logger.log(
              `Lead investor photo successfully deleted: ${leadInvestor.investorPhoto}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to delete lead investor photo: ${leadInvestor.investorPhoto}. Error: ${errorMessage}`,
            error
          );
          // Continue with record deletion even if file deletion fails
        }
      }

      await this.leadInvestorRepository.deleteById(leadInvestor.id);

      // Clear related caches
      CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

      this.logger.log(`Lead investor deleted successfully: ${id}`);

      return this.i18nResponse.success('lead_investor.deleted');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting lead investor: ${errorMessage}`);
      throw error;
    }
  }
}
