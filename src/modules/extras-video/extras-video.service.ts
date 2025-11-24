import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  IExtrasVideoRepository,
  EXTRAS_VIDEO_REPOSITORY,
} from '../../database/repositories/extras-video/extras-video.repository.interface';
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
  constructor(
    @Inject(EXTRAS_VIDEO_REPOSITORY)
    private readonly extrasVideoRepository: IExtrasVideoRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getExtrasVideosByEquityId(equityId: string) {
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
      'extras_video.retrieved_successfully',
      extrasVideos
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async createExtrasVideo(
    equityId: string,
    createExtrasVideoDto: CreateExtrasVideoDto
  ) {
    const extrasVideoData: Partial<ExtrasVideo> = {
      ...createExtrasVideoDto,
      equityId,
    };

    const extrasVideo =
      await this.extrasVideoRepository.insert(extrasVideoData);

    CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

    return this.i18nResponse.created(
      'extras_video.created_successfully',
      extrasVideo
    );
  }

  async updateExtrasVideo(
    equityId: string,
    id: string,
    updateExtrasVideoDto: UpdateExtrasVideoDto
  ) {
    const extrasVideo =
      await this.extrasVideoRepository.findByEquityIdAndPublicId(equityId, id);

    if (!extrasVideo) {
      throw new NotFoundException();
    }

    const updatedExtrasVideo = await this.extrasVideoRepository.updateById(
      extrasVideo.id,
      updateExtrasVideoDto
    );

    CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

    return this.i18nResponse.success(
      'extras_video.updated_successfully',
      updatedExtrasVideo
    );
  }

  async deleteExtrasVideo(equityId: string, id: string) {
    const extrasVideo =
      await this.extrasVideoRepository.findByEquityIdAndPublicId(equityId, id);

    if (!extrasVideo) {
      throw new NotFoundException();
    }

    await this.extrasVideoRepository.deleteById(extrasVideo.id);

    CacheUtil.delPattern(`campaign:${equityId}:extrasVideos`);

    return this.i18nResponse.success('extras_video.deleted_successfully');
  }

  async uploadFile(file: Express.Multer.File, prefix: string) {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = FileUploadUtil.generateFileName(file.originalname, prefix);
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, file.buffer);

    return this.i18nResponse.success('common.file_uploaded', {
      filename,
      mimetype: file.mimetype,
      size: file.size,
    });
  }
}
