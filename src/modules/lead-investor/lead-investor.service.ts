import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ILeadInvestorRepository,
  LEAD_INVESTOR_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
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
    private readonly leadInvestorRepository: ILeadInvestorRepository
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

      const response = ResponseHandler.success(
        'Lead investors retrieved successfully',
        200,
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

      return ResponseHandler.created(
        'Lead investor created successfully',
        leadInvestor
      );
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
        throw new NotFoundException('Lead investor not found');
      }

      const updatedLeadInvestor = await this.leadInvestorRepository.updateById(
        leadInvestor.id,
        updateLeadInvestorDto
      );

      // Clear related caches
      CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

      this.logger.log(`Lead investor updated successfully: ${id}`);

      return ResponseHandler.success(
        'Lead investor updated successfully',
        200,
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
        throw new NotFoundException('Lead investor not found');
      }

      await this.leadInvestorRepository.deleteById(leadInvestor.id);

      // Clear related caches
      CacheUtil.delPattern(`campaign:${equityId}:leadInvestors`);

      this.logger.log(`Lead investor deleted successfully: ${id}`);

      return ResponseHandler.success('Lead investor deleted successfully');
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
}
