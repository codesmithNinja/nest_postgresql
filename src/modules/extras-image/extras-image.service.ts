import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  IExtrasImageRepository,
  EXTRAS_IMAGE_REPOSITORY,
} from '../../database/repositories/extras-image/extras-image.repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileManagementService } from '../../common/services/file-management.service';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateExtrasImageDto,
  UpdateExtrasImageDto,
} from './dto/extras-image.dto';
import { ExtrasImage } from '../../database/entities/extras-image.entity';

@Injectable()
export class ExtrasImageService {
  constructor(
    @Inject(EXTRAS_IMAGE_REPOSITORY)
    private readonly extrasImageRepository: IExtrasImageRepository,
    private readonly fileManagementService: FileManagementService,
    private i18nResponse: I18nResponseService
  ) {}

  async getExtrasImagesByEquityId(equityId: string) {
    const cacheKey = CacheUtil.getCampaignRelationsKey(
      equityId,
      'extrasImages'
    );

    const cachedData = CacheUtil.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const extrasImages =
      await this.extrasImageRepository.findByEquityId(equityId);

    const response = this.i18nResponse.success(
      'extras_image.retrieved',
      extrasImages
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async createExtrasImage(
    equityId: string,
    createExtrasImageDto: CreateExtrasImageDto
  ) {
    const extrasImageData: Partial<ExtrasImage> = {
      ...createExtrasImageDto,
      equityId,
    };

    const extrasImage =
      await this.extrasImageRepository.insert(extrasImageData);

    CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

    return this.i18nResponse.created('extras_image.created', extrasImage);
  }

  async updateExtrasImage(
    equityId: string,
    id: string,
    updateExtrasImageDto: UpdateExtrasImageDto
  ) {
    const extrasImage =
      await this.extrasImageRepository.findByEquityIdAndPublicId(equityId, id);

    if (!extrasImage) {
      throw new NotFoundException();
    }

    const updatedExtrasImage = await this.extrasImageRepository.updateById(
      extrasImage.id,
      updateExtrasImageDto
    );

    CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

    return this.i18nResponse.success(
      'extras_image.updated',
      updatedExtrasImage
    );
  }

  async deleteExtrasImage(equityId: string, id: string) {
    const extrasImage =
      await this.extrasImageRepository.findByEquityIdAndPublicId(equityId, id);

    if (!extrasImage) {
      throw new NotFoundException();
    }

    await this.extrasImageRepository.deleteById(extrasImage.id);

    CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

    return this.i18nResponse.success('extras_image.deleted');
  }

  async uploadFile(file: Express.Multer.File) {
    const uploadResult =
      await this.fileManagementService.uploadExtraImage(file);

    return this.i18nResponse.success('common.file_uploaded', {
      filename: uploadResult.filePath,
      mimetype: uploadResult.mimetype,
      size: uploadResult.size,
      originalName: uploadResult.originalName,
    });
  }
}
