import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Logger } from '@nestjs/common';

/**
 * Get bucket name from environment variables with fallback
 * @param bucketKey - The bucket type key (e.g., 'ADMIN', 'CAMPAIGNS')
 * @returns The bucket name from environment or fallback value
 */
export function getBucketName(bucketKey: string): string {
  const bucketMap: Record<string, string> = {
    ADMIN: process.env.ADMIN_BUCKET || 'admins',
    CAMPAIGNS: process.env.CAMPAIGNS_BUCKET || 'campaigns',
    COMPANY: process.env.COMPANY_BUCKET || 'company-profiles',
    CAMPAIGN_CATEGORIES:
      process.env.CAMPAIGN_CATEGORIES_BUCKET || 'campaign-categories',
    CATEGORIES: process.env.CATEGORIES_BUCKET || 'categories',
    COUNTRIES: process.env.COUNTRIES_BUCKET || 'countries',
    EXTRA_DOCUMENTS: process.env.EXTRA_DOCUMENTS_BUCKET || 'extras-documents',
    EXTRA_IMAGES: process.env.EXTRA_IMAGES_BUCKET || 'extras-images',
    LANGUAGES: process.env.LANGUAGES_BUCKET || 'languages',
    LEAD_INVESTOR: process.env.LEAD_INVESTOR_BUCKET || 'lead-investors',
    SETTINGS: process.env.SETTINGS_BUCKET || 'settings',
    SLIDERS: process.env.SLIDERS_BUCKET || 'sliders',
    TEAM_MEMBERS: process.env.TEAM_MEMBERS_BUCKET || 'team-members',
    USER: process.env.USER_BUCKET || 'users',
  };

  return bucketMap[bucketKey] || bucketKey.toLowerCase();
}

export interface FileUploadResult {
  filePath: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface FileUploadOptions {
  bucketName: string;
  allowedMimeTypes?: string[];
  maxSizeInMB?: number;
  fieldName?: string;
  customFileName?: string;
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
      const region = process.env.AWS_REGION;
      const accessKeyId = process.env.AWS_ID;
      const secretAccessKey = process.env.AWS_SECRET;

      if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error(
          'AWS configuration is missing. Please set AWS_REGION, AWS_ID, and AWS_SECRET environment variables.'
        );
      }

      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload file to AWS S3 or local storage
   * Returns relative file path for database storage
   */
  static async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): Promise<FileUploadResult> {
    this.validateFileNew(file, options);

    let fileName: string;
    if (options.customFileName) {
      fileName = options.customFileName;
    } else {
      const prefix = options.fieldName ? `${options.fieldName}-` : '';
      fileName = this.generateFileName(file.originalname, prefix);
    }
    const filePath = `${options.bucketName}/${fileName}`;

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

    if (!file.buffer) {
      throw new BadRequestException(
        'File buffer is missing. Please ensure multer is configured with memory storage.'
      );
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

      this.logger.log(`File uploaded to S3: ${filePath}`);

      return {
        filePath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
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

  /**
   * Extracts the relative file path from a stored URL
   * Handles both local URLs and S3 URLs to get the correct file path for deletion
   * @param urlOrPath - The stored URL or path (e.g., "http://localhost:3000/uploads/lead_investor/file.png")
   * @returns The relative file path (e.g., "lead_investor/file.png")
   */
  static extractFilePathFromUrl(urlOrPath: string): string {
    if (!urlOrPath) {
      throw new BadRequestException('URL or path is required');
    }

    try {
      // If it's already a relative path (no protocol), return as is
      if (!urlOrPath.includes('://')) {
        return urlOrPath;
      }

      // For local URLs (http://localhost:3000/uploads/...)
      if (urlOrPath.includes('/uploads/')) {
        const pathParts = urlOrPath.split('/uploads/');
        if (pathParts.length > 1) {
          return pathParts[1]; // Return everything after '/uploads/'
        }
      }

      // For S3 URLs (https://bucket.s3.region.amazonaws.com/...)
      if (urlOrPath.includes('.s3.') || urlOrPath.includes('cloudfront.net')) {
        const url = new URL(urlOrPath);
        // Remove leading slash from pathname
        return url.pathname.substring(1);
      }

      // If we can't parse the URL, try to extract filename and assume it's in the root
      const url = new URL(urlOrPath);
      return url.pathname.substring(1); // Remove leading slash
    } catch {
      this.logger.error(`Failed to extract file path from URL: ${urlOrPath}`);
      throw new BadRequestException('Invalid file URL format');
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

  /**
   * Generate language-specific file name
   * @param originalName - Original file name
   * @param uniqueCode - Unique identifier for the content
   * @param languageCode - Language code (e.g., 'en', 'es', 'fr')
   * @param prefix - Optional prefix
   * @returns Language-specific file name
   */
  static generateLanguageFileName(
    originalName: string,
    uniqueCode: number,
    languageCode: string,
    prefix: string = ''
  ): string {
    const extension = originalName.split('.').pop();
    return `${prefix}-${uniqueCode}_${languageCode}.${extension}`;
  }

  /**
   * Upload file and create language-specific copies
   * @param file - The uploaded file
   * @param options - Upload options
   * @param uniqueCode - Unique identifier for the content
   * @param languageCodes - Array of language codes to create copies for
   * @returns Array of FileUploadResult with language-specific file paths
   */
  static async uploadFileForLanguages(
    file: Express.Multer.File,
    options: FileUploadOptions,
    uniqueCode: number,
    languageCodes: string[]
  ): Promise<FileUploadResult[]> {
    this.validateFileNew(file, options);

    const results: FileUploadResult[] = [];
    const prefix = options.fieldName ? `${options.fieldName}` : '';

    for (const languageCode of languageCodes) {
      const fileName = this.generateLanguageFileName(
        file.originalname,
        uniqueCode,
        languageCode,
        prefix
      );
      const filePath = `${options.bucketName}/${fileName}`;

      if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
        const result = await this.uploadToS3(file, filePath);
        results.push({ ...result, filePath });
      } else {
        const result = this.uploadToLocal(file, filePath);
        results.push({ ...result, filePath });
      }
    }

    this.logger.log(
      `File uploaded for ${languageCodes.length} languages: ${languageCodes.join(', ')}`
    );

    return results;
  }

  /**
   * Copy existing file for multiple languages
   * @param existingFilePath - Path to existing file
   * @param originalFileName - Original file name for extension
   * @param uniqueCode - Unique identifier for the content
   * @param languageCodes - Array of language codes to create copies for
   * @param bucketName - Target bucket name
   * @returns Array of new file paths for each language
   */
  static async copyFileForLanguages(
    existingFilePath: string,
    originalFileName: string,
    uniqueCode: number,
    languageCodes: string[],
    bucketName: string
  ): Promise<string[]> {
    const filePaths: string[] = [];
    const extension = originalFileName.split('.').pop();

    for (const languageCode of languageCodes) {
      const fileName = `slider-${uniqueCode}_${languageCode}.${extension}`;
      const newFilePath = `${bucketName}/${fileName}`;

      if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
        await this.copyFileOnS3(existingFilePath, newFilePath);
      } else {
        this.copyFileLocally(existingFilePath, newFilePath);
      }

      filePaths.push(newFilePath);
    }

    this.logger.log(
      `File copied for ${languageCodes.length} languages: ${languageCodes.join(', ')}`
    );

    return filePaths;
  }

  /**
   * Copy file on S3
   * @param sourceFilePath - Source file path on S3
   * @param destinationFilePath - Destination file path on S3
   */
  private static async copyFileOnS3(
    sourceFilePath: string,
    destinationFilePath: string
  ): Promise<void> {
    try {
      const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
      const copyCommand = new CopyObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        CopySource: `${process.env.AWS_BUCKET_NAME}/${sourceFilePath}`,
        Key: destinationFilePath,
      });

      await this.s3Client.send(copyCommand);
      this.logger.log(
        `File copied on S3: ${sourceFilePath} -> ${destinationFilePath}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to copy file on S3: ${errorMessage}`);
      throw new BadRequestException('Failed to copy file on S3');
    }
  }

  /**
   * Copy file locally
   * @param sourceFilePath - Source file path
   * @param destinationFilePath - Destination file path
   */
  private static copyFileLocally(
    sourceFilePath: string,
    destinationFilePath: string
  ): void {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const sourcePath = path.join(uploadDir, sourceFilePath);
      const destinationPath = path.join(uploadDir, destinationFilePath);

      // Create destination directory if it doesn't exist
      const destinationDir = path.dirname(destinationPath);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      // Copy the file
      fs.copyFileSync(sourcePath, destinationPath);

      this.logger.log(
        `File copied locally: ${sourceFilePath} -> ${destinationFilePath}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to copy file locally: ${errorMessage}`);
      throw new BadRequestException('Failed to copy file locally');
    }
  }

  /**
   * Delete language-specific files by unique code
   * @param bucketName - Bucket name containing the files
   * @param uniqueCode - Unique identifier for the content
   * @param languageCodes - Array of language codes to delete files for
   * @param fileExtension - File extension (e.g., 'jpg', 'png')
   */
  static async deleteLanguageFiles(
    bucketName: string,
    uniqueCode: number,
    languageCodes: string[],
    fileExtension: string
  ): Promise<void> {
    const deletePromises = languageCodes.map((languageCode) => {
      const fileName = `slider-${uniqueCode}_${languageCode}.${fileExtension}`;
      const filePath = `${bucketName}/${fileName}`;
      return this.deleteFile(filePath);
    });

    await Promise.all(deletePromises);

    this.logger.log(
      `Deleted language-specific files for uniqueCode ${uniqueCode}: ${languageCodes.join(', ')}`
    );
  }

  /**
   * Extract language code from language-specific file path
   * @param filePath - File path (e.g., "sliders/slider-123456_en.jpg")
   * @returns Language code or null if not found
   */
  static extractLanguageFromFilePath(filePath: string): string | null {
    const fileName = path.basename(filePath);
    const match = fileName.match(/slider-\d+_([a-z]{2,3})\./);
    return match ? match[1] : null;
  }

  /**
   * Extract unique code from language-specific file path
   * @param filePath - File path (e.g., "sliders/slider-123456_en.jpg")
   * @returns Unique code or null if not found
   */
  static extractUniqueCodeFromFilePath(filePath: string): number | null {
    const fileName = path.basename(filePath);
    const match = fileName.match(/slider-(\d+)_[a-z]{2,3}\./);
    return match ? parseInt(match[1], 10) : null;
  }
}
