import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ILeadInvestorRepository,
  LEAD_INVESTOR_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateLeadInvestorDto,
  UpdateLeadInvestorDto,
} from './dto/lead-investor.dto';
import { LeadInvestor } from '../../database/entities/lead-investor.entity';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class LeadInvestorService {
  private readonly logger = new Logger(LeadInvestorService.name);

  constructor(
    @Inject(LEAD_INVESTOR_REPOSITORY)
    private readonly leadInvestorRepository: ILeadInvestorRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getLeadInvestorsByEquityId(equityId: string) {
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

  async createLeadInvestor(
    equityId: string,
    createLeadInvestorDto: CreateLeadInvestorDto
  ) {
    try {
      const leadInvestorData: Partial<LeadInvestor> = {
        ...createLeadInvestorDto,
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

  async updateLeadInvestor(
    equityId: string,
    id: string,
    updateLeadInvestorDto: UpdateLeadInvestorDto
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

      const updatedLeadInvestor = await this.leadInvestorRepository.updateById(
        leadInvestor.id,
        updateLeadInvestorDto
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

  async deleteLeadInvestor(equityId: string, id: string) {
    try {
      const leadInvestor =
        await this.leadInvestorRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!leadInvestor) {
        throw new NotFoundException();
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

  async uploadFile(file: Express.Multer.File, prefix: string) {
    try {
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
}
