import { Injectable, NotFoundException, Inject } from '@nestjs/common';
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
  constructor(
    @Inject(LEAD_INVESTOR_REPOSITORY)
    private readonly leadInvestorRepository: ILeadInvestorRepository,
    private i18nResponse: I18nResponseService,
    private fileManagementService: FileManagementService
  ) {}

  async findByEquityId(equityId: string) {
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
      'lead_investor.retrieved_successfully',
      leadInvestors
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async create(
    equityId: string,
    createLeadInvestorDto: CreateLeadInvestorDto,
    file: Express.Multer.File
  ) {
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

    return this.i18nResponse.created(
      'lead_investor.created_successfully',
      leadInvestor
    );
  }

  async update(
    equityId: string,
    id: string,
    updateLeadInvestorDto: UpdateLeadInvestorDto,
    file?: Express.Multer.File
  ) {
    const leadInvestor =
      await this.leadInvestorRepository.findByEquityIdAndPublicId(equityId, id);

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
          }
        } catch {
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

    return this.i18nResponse.success(
      'lead_investor.updated_successfully',
      updatedLeadInvestor
    );
  }

  async delete(equityId: string, id: string) {
    const leadInvestor =
      await this.leadInvestorRepository.findByEquityIdAndPublicId(equityId, id);

    if (!leadInvestor) {
      throw new NotFoundException();
    }

    // Clean up lead investor photo if exists
    if (leadInvestor.investorPhoto) {
      try {
        // Check if file exists before attempting deletion
        const fileExists = await this.fileManagementService.fileExists(
          leadInvestor.investorPhoto
        );
        if (fileExists) {
          await this.fileManagementService.deleteFile(
            leadInvestor.investorPhoto
          );
        }
      } catch {
        // Continue with record deletion even if file deletion fails
      }
    }

    await this.leadInvestorRepository.deleteById(leadInvestor.id);

    // Clear related caches
    CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

    return this.i18nResponse.success('lead_investor.deleted_successfully');
  }
}
