import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  IExtrasDocumentRepository,
  EXTRAS_DOCUMENT_REPOSITORY,
} from '../../database/repositories/extras-document/extras-document.repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { I18nResponseService } from '../../common/services/i18n-response.service';
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
  constructor(
    @Inject(EXTRAS_DOCUMENT_REPOSITORY)
    private readonly extrasDocumentRepository: IExtrasDocumentRepository,
    private i18nResponse: I18nResponseService
  ) {}

  async getExtrasDocumentsByEquityId(equityId: string) {
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

    const response = this.i18nResponse.success(
      'extras_document.retrieved_successfully',
      extrasDocuments
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async createExtrasDocument(
    equityId: string,
    createExtrasDocumentDto: CreateExtrasDocumentDto
  ) {
    const extrasDocumentData: Partial<ExtrasDocument> = {
      ...createExtrasDocumentDto,
      equityId,
    };

    const extrasDocument =
      await this.extrasDocumentRepository.insert(extrasDocumentData);

    CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

    return this.i18nResponse.created(
      'extras_document.created_successfully',
      extrasDocument
    );
  }

  async updateExtrasDocument(
    equityId: string,
    id: string,
    updateExtrasDocumentDto: UpdateExtrasDocumentDto
  ) {
    const extrasDocument =
      await this.extrasDocumentRepository.findByEquityIdAndPublicId(
        equityId,
        id
      );

    if (!extrasDocument) {
      throw new NotFoundException();
    }

    const updatedExtrasDocument =
      await this.extrasDocumentRepository.updateById(
        extrasDocument.id,
        updateExtrasDocumentDto
      );

    CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

    return this.i18nResponse.success(
      'extras_document.updated_successfully',
      updatedExtrasDocument
    );
  }

  async deleteExtrasDocument(equityId: string, id: string) {
    const extrasDocument =
      await this.extrasDocumentRepository.findByEquityIdAndPublicId(
        equityId,
        id
      );

    if (!extrasDocument) {
      throw new NotFoundException();
    }

    await this.extrasDocumentRepository.deleteById(extrasDocument.id);

    CacheUtil.delPattern(`campaign:${equityId}:extrasDocuments`);

    return this.i18nResponse.success('extras_document.deleted_successfully');
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
