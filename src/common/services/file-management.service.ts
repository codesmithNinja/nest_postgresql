import { Injectable, Logger } from '@nestjs/common';
import {
  FileUploadUtil,
  getBucketName,
  FileUploadOptions,
  FileUploadResult,
} from '../utils/file-upload.util';

@Injectable()
export class FileManagementService {
  private readonly logger = new Logger(FileManagementService.name);

  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): Promise<FileUploadResult> {
    this.logger.log(
      `Uploading file: ${file.originalname} to bucket: ${options.bucketName}`
    );
    return await FileUploadUtil.uploadFile(file, options);
  }

  async uploadImage(
    file: Express.Multer.File,
    bucketName: string,
    maxSizeInMB: number = 5
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketName,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSizeInMB,
    };
    return await this.uploadFile(file, options);
  }

  async uploadVideo(
    file: Express.Multer.File,
    bucketName: string,
    maxSizeInMB: number = 100
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketName,
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSizeInMB,
    };
    return await this.uploadFile(file, options);
  }

  async uploadDocument(
    file: Express.Multer.File,
    bucketName: string,
    maxSizeInMB: number = 10
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketName,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
      maxSizeInMB,
    };
    return await this.uploadFile(file, options);
  }

  async generateSignedUrl(filePath: string): Promise<string> {
    this.logger.log(`Generating signed URL for: ${filePath}`);
    return await FileUploadUtil.generateSignedUrl(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    this.logger.log(`Deleting file: ${filePath}`);
    return await FileUploadUtil.deleteFile(filePath);
  }

  getFileUrl(filePath: string): string {
    return FileUploadUtil.getFileUrl(filePath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return await FileUploadUtil.fileExists(filePath);
  }

  // Bucket-specific upload methods
  async uploadUserAvatar(file: Express.Multer.File): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('USER'), 5);
  }

  async uploadCampaignImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('CAMPAIGNS'), 10);
  }

  async uploadCampaignDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(file, getBucketName('CAMPAIGNS'), 20);
  }

  async uploadExtraDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(
      file,
      getBucketName('EXTRA_DOCUMENTS'),
      20
    );
  }

  async uploadExtraImage(file: Express.Multer.File): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('EXTRA_IMAGES'), 10);
  }

  async uploadTeamMemberImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('TEAM_MEMBERS'), 5);
  }

  async uploadLeadInvestorImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('LEAD_INVESTOR'), 5);
  }

  async uploadCompanyDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(file, getBucketName('COMPANY'), 20);
  }

  async uploadCategoryImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, getBucketName('CATEGORIES'), 5);
  }

  async uploadCampaignCategoryImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(
      file,
      getBucketName('CAMPAIGN_CATEGORIES'),
      5
    );
  }
}
