import { Injectable, Logger } from '@nestjs/common';
import {
  FileUploadUtil,
  BucketType,
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
      `Uploading file: ${file.originalname} to bucket: ${options.bucketType}`
    );
    return await FileUploadUtil.uploadFile(file, options);
  }

  async uploadImage(
    file: Express.Multer.File,
    bucketType: BucketType,
    maxSizeInMB: number = 5
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketType,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSizeInMB,
    };
    return await this.uploadFile(file, options);
  }

  async uploadVideo(
    file: Express.Multer.File,
    bucketType: BucketType,
    maxSizeInMB: number = 100
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketType,
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSizeInMB,
    };
    return await this.uploadFile(file, options);
  }

  async uploadDocument(
    file: Express.Multer.File,
    bucketType: BucketType,
    maxSizeInMB: number = 10
  ): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      bucketType,
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
    return await this.uploadImage(file, BucketType.USER, 5);
  }

  async uploadCampaignImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, BucketType.CAMPAIGNS, 10);
  }

  async uploadCampaignDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(file, BucketType.CAMPAIGNS, 20);
  }

  async uploadExtraDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(file, BucketType.EXTRA_DOCUMENTS, 20);
  }

  async uploadExtraImage(file: Express.Multer.File): Promise<FileUploadResult> {
    return await this.uploadImage(file, BucketType.EXTRA_IMAGES, 10);
  }

  async uploadTeamMemberImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, BucketType.TEAM_MEMBERS, 5);
  }

  async uploadCompanyDocument(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadDocument(file, BucketType.COMPANY, 20);
  }

  async uploadCategoryImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, BucketType.CATEGORIES, 5);
  }

  async uploadCampaignCategoryImage(
    file: Express.Multer.File
  ): Promise<FileUploadResult> {
    return await this.uploadImage(file, BucketType.CAMPAIGN_CATEGORIES, 5);
  }
}
