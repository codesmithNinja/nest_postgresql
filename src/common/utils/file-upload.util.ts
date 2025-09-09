import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Logger } from '@nestjs/common';

export enum BucketType {
  CAMPAIGN_CATEGORIES = 'campaign-categories',
  CATEGORIES = 'categories',
  COMPANY = 'company-profiles',
  CAMPAIGNS = 'campaigns',
  EXTRA_DOCUMENTS = 'extras-documents',
  EXTRA_IMAGES = 'extras-images',
  TEAM_MEMBERS = 'team-members',
  USER = 'users',
}

export interface FileUploadResult {
  filePath: string;
  originalName: string;
  size: number;
  mimetype: string;
  url?: string;
}

export interface FileUploadOptions {
  bucketType: BucketType;
  allowedMimeTypes?: string[];
  maxSizeInMB?: number;
  fieldName?: string;
}

// Legacy interface for backward compatibility
export interface LegacyFileUploadOptions {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  fieldName: string;
}

export class FileUploadUtil {
  private static logger = new Logger(FileUploadUtil.name);
  private static s3Client: S3Client;

  static {
    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ID,
          secretAccessKey: process.env.AWS_SECRET,
        },
      });
    }
  }

  /**
   * New file upload method with AWS S3 and local support
   */
  static async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): Promise<FileUploadResult> {
    this.validateFileNew(file, options);

    const fileName = this.generateFileName(file.originalname);
    const filePath = `${options.bucketType}/${fileName}`;

    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      return await this.uploadToS3(file, filePath);
    } else {
      return this.uploadToLocal(file, filePath);
    }
  }

  private static validateFileNew(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`
      );
    }

    const maxSizeInBytes = (options.maxSizeInMB || 10) * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException(
        `File size exceeds ${options.maxSizeInMB || 10}MB limit`
      );
    }
  }

  private static async uploadToS3(
    file: Express.Multer.File,
    filePath: string
  ): Promise<FileUploadResult> {
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      });

      await this.s3Client.send(uploadCommand);

      const fileUrl = process.env.AWS_CLOUDFRONT_URL
        ? `${process.env.AWS_CLOUDFRONT_URL}/${filePath}`
        : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;

      this.logger.log(`File uploaded to S3: ${filePath}`);

      return {
        filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file to S3: ${errorMessage}`);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  private static uploadToLocal(
    file: Express.Multer.File,
    filePath: string
  ): FileUploadResult {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const bucketPath = path.dirname(filePath);
      const fullDir = path.join(uploadDir, bucketPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }

      const fullPath = path.join(uploadDir, filePath);

      // Write file to disk
      fs.writeFileSync(fullPath, file.buffer);

      this.logger.log(`File uploaded locally: ${filePath}`);

      return {
        filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file locally: ${errorMessage}`);
      throw new BadRequestException('Failed to upload file locally');
    }
  }

  static async generateSignedUrl(filePath: string): Promise<string> {
    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: filePath,
        });

        const expiryTimeInSeconds =
          parseInt(process.env.SIGNED_URL_EXPIRY_TIME_IN_MIN || '60') * 60;

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: expiryTimeInSeconds,
        });

        return signedUrl;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to generate signed URL: ${errorMessage}`);
        throw new BadRequestException('Failed to generate signed URL');
      }
    } else {
      // For local files, return the file path (adjust based on your static file serving setup)
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${filePath}`;
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: filePath,
        });

        await this.s3Client.send(deleteCommand);
        this.logger.log(`File deleted from S3: ${filePath}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to delete file from S3: ${errorMessage}`);
        throw new BadRequestException('Failed to delete file from S3');
      }
    } else {
      try {
        const fullPath = path.join(process.cwd(), 'uploads', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          this.logger.log(`File deleted locally: ${filePath}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to delete file locally: ${errorMessage}`);
        throw new BadRequestException('Failed to delete file locally');
      }
    }
  }

  static getFileUrl(filePath: string): string {
    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      return process.env.AWS_CLOUDFRONT_URL
        ? `${process.env.AWS_CLOUDFRONT_URL}/${filePath}`
        : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
    } else {
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${filePath}`;
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
      try {
        const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: filePath,
        });

        await this.s3Client.send(headCommand);
        return true;
      } catch {
        return false;
      }
    } else {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      return fs.existsSync(fullPath);
    }
  }

  // Legacy methods for backward compatibility
  static getImageUploadOptions(): LegacyFileUploadOptions {
    return {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      fieldName: 'image',
    };
  }

  static getVideoUploadOptions(): LegacyFileUploadOptions {
    return {
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSizeBytes: 100 * 1024 * 1024, // 100MB
      fieldName: 'video',
    };
  }

  static getDocumentUploadOptions(): LegacyFileUploadOptions {
    return {
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      fieldName: 'document',
    };
  }

  static validateFile(
    file: Express.Multer.File,
    options: LegacyFileUploadOptions
  ): void {
    if (!file) {
      throw new BadRequestException(`${options.fieldName} is required`);
    }

    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid ${options.fieldName} type. Allowed types: ${options.allowedMimeTypes.join(', ')}`
      );
    }

    if (file.size > options.maxSizeBytes) {
      throw new BadRequestException(
        `${options.fieldName} size too large. Maximum size: ${options.maxSizeBytes / (1024 * 1024)}MB`
      );
    }
  }

  static generateFileName(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${prefix}${timestamp}_${random}.${extension}`;
  }
}
