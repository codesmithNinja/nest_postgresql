import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  IExtrasVideoRepository,
  EXTRAS_VIDEO_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
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
    private readonly extrasVideoRepository: IExtrasVideoRepository,
    private i18nResponse: I18nResponseService
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

      const response = this.i18nResponse.success(
        'extras_video.retrieved',
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

      return this.i18nResponse.created('extras_video.created', extrasVideo);
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
        throw new NotFoundException();
      }

      const updatedExtrasVideo = await this.extrasVideoRepository.updateById(
        extrasVideo.id,
        updateExtrasVideoDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

      this.logger.log(`Extras video updated successfully: ${id}`);

      return this.i18nResponse.success(
        'extras_video.updated',
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
        throw new NotFoundException();
      }

      await this.extrasVideoRepository.deleteById(extrasVideo.id);

      CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

      this.logger.log(`Extras video deleted successfully: ${id}`);

      return this.i18nResponse.success('extras_video.deleted');
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
