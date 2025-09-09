import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  IExtrasVideoRepository,
  EXTRAS_VIDEO_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import {
  CreateExtrasVideoDto,
  UpdateExtrasVideoDto,
} from './dto/extras-video.dto';
import { ExtrasVideo } from '../../database/entities/extras-video.entity';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class ExtrasVideoService {
  private readonly logger = new Logger(ExtrasVideoService.name);

  constructor(
    @Inject(EXTRAS_VIDEO_REPOSITORY)
    private readonly extrasVideoRepository: IExtrasVideoRepository
  ) {}

  async getExtrasVideosByEquityId(equityId: string) {
    try {
      const cacheKey = CacheUtil.getCampaignRelationsKey(
        equityId,
        'extrasVideos'
      );

      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const extrasVideos =
        await this.extrasVideoRepository.findByEquityId(equityId);

      const response = ResponseHandler.success(
        'Extras videos retrieved successfully',
        200,
        extrasVideos
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting extras videos: ${errorMessage}`);
      throw error;
    }
  }

  async createExtrasVideo(
    equityId: string,
    createExtrasVideoDto: CreateExtrasVideoDto
  ) {
    try {
      const extrasVideoData: Partial<ExtrasVideo> = {
        ...createExtrasVideoDto,
        equityId,
      };

      const extrasVideo =
        await this.extrasVideoRepository.insert(extrasVideoData);

      CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

      this.logger.log(`Extras video created successfully: ${extrasVideo.id}`);

      return ResponseHandler.created(
        'Extras video created successfully',
        extrasVideo
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating extras video: ${errorMessage}`);
      throw error;
    }
  }

  async updateExtrasVideo(
    equityId: string,
    id: string,
    updateExtrasVideoDto: UpdateExtrasVideoDto
  ) {
    try {
      const extrasVideo =
        await this.extrasVideoRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasVideo) {
        throw new NotFoundException('Extras video not found');
      }

      const updatedExtrasVideo = await this.extrasVideoRepository.updateById(
        extrasVideo.id,
        updateExtrasVideoDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

      this.logger.log(`Extras video updated successfully: ${id}`);

      return ResponseHandler.success(
        'Extras video updated successfully',
        200,
        updatedExtrasVideo
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating extras video: ${errorMessage}`);
      throw error;
    }
  }

  async deleteExtrasVideo(equityId: string, id: string) {
    try {
      const extrasVideo =
        await this.extrasVideoRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasVideo) {
        throw new NotFoundException('Extras video not found');
      }

      await this.extrasVideoRepository.deleteById(extrasVideo.id);

      CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

      this.logger.log(`Extras video deleted successfully: ${id}`);

      return ResponseHandler.success('Extras video deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting extras video: ${errorMessage}`);
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
