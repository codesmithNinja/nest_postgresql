import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  IExtrasImageRepository,
  EXTRAS_IMAGE_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileManagementService } from '../../common/services/file-management.service';
import {
  CreateExtrasImageDto,
  UpdateExtrasImageDto,
} from './dto/extras-image.dto';
import { ExtrasImage } from '../../database/entities/extras-image.entity';

@Injectable()
export class ExtrasImageService {
  private readonly logger = new Logger(ExtrasImageService.name);

  constructor(
    @Inject(EXTRAS_IMAGE_REPOSITORY)
    private readonly extrasImageRepository: IExtrasImageRepository,
    private readonly fileManagementService: FileManagementService
  ) {}

  async getExtrasImagesByEquityId(equityId: string) {
    try {
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

      const response = ResponseHandler.success(
        'Extras images retrieved successfully',
        200,
        extrasImages
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting extras images: ${errorMessage}`);
      throw error;
    }
  }

  async createExtrasImage(
    equityId: string,
    createExtrasImageDto: CreateExtrasImageDto
  ) {
    try {
      const extrasImageData: Partial<ExtrasImage> = {
        ...createExtrasImageDto,
        equityId,
      };

      const extrasImage =
        await this.extrasImageRepository.insert(extrasImageData);

      CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

      this.logger.log(`Extras image created successfully: ${extrasImage.id}`);

      return ResponseHandler.created(
        'Extras image created successfully',
        extrasImage
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating extras image: ${errorMessage}`);
      throw error;
    }
  }

  async updateExtrasImage(
    equityId: string,
    id: string,
    updateExtrasImageDto: UpdateExtrasImageDto
  ) {
    try {
      const extrasImage =
        await this.extrasImageRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasImage) {
        throw new NotFoundException('Extras image not found');
      }

      const updatedExtrasImage = await this.extrasImageRepository.updateById(
        extrasImage.id,
        updateExtrasImageDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

      this.logger.log(`Extras image updated successfully: ${id}`);

      return ResponseHandler.success(
        'Extras image updated successfully',
        200,
        updatedExtrasImage
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating extras image: ${errorMessage}`);
      throw error;
    }
  }

  async deleteExtrasImage(equityId: string, id: string) {
    try {
      const extrasImage =
        await this.extrasImageRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasImage) {
        throw new NotFoundException('Extras image not found');
      }

      await this.extrasImageRepository.deleteById(extrasImage.id);

      CacheUtil.delPattern(`campaign:${equityId}:extrasImages`);

      this.logger.log(`Extras image deleted successfully: ${id}`);

      return ResponseHandler.success('Extras image deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting extras image: ${errorMessage}`);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const uploadResult =
        await this.fileManagementService.uploadExtraImage(file);

      this.logger.log(
        `Extra image uploaded successfully: ${uploadResult.filePath}`
      );

      return ResponseHandler.success('File uploaded successfully', 201, {
        filename: uploadResult.filePath,
        url:
          uploadResult.url ||
          this.fileManagementService.getFileUrl(uploadResult.filePath),
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        originalName: uploadResult.originalName,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw error;
    }
  }
}
