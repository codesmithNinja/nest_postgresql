import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  IExtrasDocumentRepository,
  EXTRAS_DOCUMENT_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import {
  CreateExtrasDocumentDto,
  UpdateExtrasDocumentDto,
} from './dto/extras-document.dto';
import { ExtrasDocument } from '../../database/entities/extras-document.entity';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class ExtrasDocumentService {
  private readonly logger = new Logger(ExtrasDocumentService.name);

  constructor(
    @Inject(EXTRAS_DOCUMENT_REPOSITORY)
    private readonly extrasDocumentRepository: IExtrasDocumentRepository
  ) {}

  async getExtrasDocumentsByEquityId(equityId: string) {
    try {
      const cacheKey = CacheUtil.getCampaignRelationsKey(
        equityId,
        'extrasDocuments'
      );

      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const extrasDocuments =
        await this.extrasDocumentRepository.findByEquityId(equityId);

      const response = ResponseHandler.success(
        'Extras documents retrieved successfully',
        200,
        extrasDocuments
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting extras documents: ${errorMessage}`);
      throw error;
    }
  }

  async createExtrasDocument(
    equityId: string,
    createExtrasDocumentDto: CreateExtrasDocumentDto
  ) {
    try {
      const extrasDocumentData: Partial<ExtrasDocument> = {
        ...createExtrasDocumentDto,
        equityId,
      };

      const extrasDocument =
        await this.extrasDocumentRepository.insert(extrasDocumentData);

      CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

      this.logger.log(
        `Extras document created successfully: ${extrasDocument.id}`
      );

      return ResponseHandler.created(
        'Extras document created successfully',
        extrasDocument
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating extras document: ${errorMessage}`);
      throw error;
    }
  }

  async updateExtrasDocument(
    equityId: string,
    id: string,
    updateExtrasDocumentDto: UpdateExtrasDocumentDto
  ) {
    try {
      const extrasDocument =
        await this.extrasDocumentRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasDocument) {
        throw new NotFoundException('Extras document not found');
      }

      const updatedExtrasDocument =
        await this.extrasDocumentRepository.updateById(
          extrasDocument.id,
          updateExtrasDocumentDto
        );

      CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

      this.logger.log(`Extras document updated successfully: ${id}`);

      return ResponseHandler.success(
        'Extras document updated successfully',
        200,
        updatedExtrasDocument
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating extras document: ${errorMessage}`);
      throw error;
    }
  }

  async deleteExtrasDocument(equityId: string, id: string) {
    try {
      const extrasDocument =
        await this.extrasDocumentRepository.findByEquityIdAndPublicId(
          equityId,
          id
        );

      if (!extrasDocument) {
        throw new NotFoundException('Extras document not found');
      }

      await this.extrasDocumentRepository.deleteById(extrasDocument.id);

      CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

      this.logger.log(`Extras document deleted successfully: ${id}`);

      return ResponseHandler.success('Extras document deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting extras document: ${errorMessage}`);
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
