import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FileUploadOptions,
  ProcessedFileUpload,
  FileValidationResult,
  UniversalFileUploadConfig,
} from '../interfaces/file-upload.interface';

@Injectable()
export class UniversalFileProcessingService {
  private readonly logger = new Logger(UniversalFileProcessingService.name);
  private readonly config: UniversalFileUploadConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      defaultOptions: {
        maxFiles: 20,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        preserveFilename: true,
      },
      supportedMethods: ['multipart', 'binary'],
      globalMaxFileSize: 50 * 1024 * 1024, // 50MB
      globalMaxFiles: 50,
    };
  }

  /**
   * Process multipart form data files
   */
  processMultipartFiles(
    files: Express.Multer.File[],
    body: Record<string, string>,
    options?: FileUploadOptions
  ): ProcessedFileUpload {
    this.logger.debug(`Processing ${files?.length || 0} multipart files`);

    const validatedFiles = this.validateFiles(files || [], options);

    return {
      hasFiles: validatedFiles.length > 0,
      files: validatedFiles,
      uploadMethod: 'multipart',
      formData: body || {},
    };
  }

  /**
   * Process binary file data and convert to Express.Multer.File format
   */
  processBinaryFiles(
    buffer: Buffer,
    headers: Record<string, string | string[]>,
    options?: FileUploadOptions
  ): ProcessedFileUpload {
    this.logger.debug(
      `Processing binary file data, size: ${buffer.length} bytes`
    );

    const binaryFile = this.convertBufferToFile(buffer, headers, options);
    const validatedFiles = this.validateFiles([binaryFile], options);

    return {
      hasFiles: validatedFiles.length > 0,
      files: validatedFiles,
      uploadMethod: 'binary',
    };
  }

  /**
   * Convert raw buffer to Express.Multer.File format
   */
  private convertBufferToFile(
    buffer: Buffer,
    headers: Record<string, string | string[]>,
    options?: FileUploadOptions
  ): Express.Multer.File {
    // Extract filename from headers or generate one
    const filename = this.extractFilename(headers) || this.generateFilename();

    // Extract or determine MIME type
    const mimetype =
      this.extractMimeType(headers, buffer) || 'application/octet-stream';

    // Use provided field name or default
    const fieldname = options?.fieldName || 'file';

    const file: Express.Multer.File = {
      fieldname,
      originalname: filename,
      encoding: '7bit',
      mimetype,
      buffer,
      size: buffer.length,
      stream: undefined as unknown as Express.Multer.File['stream'],
      destination: '',
      filename: '',
      path: '',
    };

    this.logger.debug(
      `Converted binary data to file: ${filename}, type: ${mimetype}, size: ${buffer.length}`
    );

    return file;
  }

  /**
   * Extract filename from request headers
   */
  private extractFilename(
    headers: Record<string, string | string[]>
  ): string | null {
    // Check Content-Disposition header
    const contentDisposition =
      headers['content-disposition'] || headers['Content-Disposition'];
    if (typeof contentDisposition === 'string') {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch) {
        return filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Check custom filename header
    const customFilename = headers['x-filename'] || headers['X-Filename'];
    if (typeof customFilename === 'string') {
      return customFilename;
    }

    return null;
  }

  /**
   * Extract MIME type from headers or detect from buffer
   */
  private extractMimeType(
    headers: Record<string, string | string[]>,
    buffer: Buffer
  ): string | null {
    // Check Content-Type header
    const contentType = headers['content-type'] || headers['Content-Type'];
    if (
      typeof contentType === 'string' &&
      contentType !== 'application/octet-stream'
    ) {
      return contentType.split(';')[0].trim();
    }

    // Simple file type detection based on file signature (magic numbers)
    return this.detectMimeTypeFromBuffer(buffer);
  }

  /**
   * Detect MIME type from buffer using file signatures
   */
  private detectMimeTypeFromBuffer(buffer: Buffer): string {
    if (buffer.length < 4) {
      return 'application/octet-stream';
    }

    const signature = buffer.subarray(0, 8);

    // PNG
    if (
      signature[0] === 0x89 &&
      signature[1] === 0x50 &&
      signature[2] === 0x4e &&
      signature[3] === 0x47
    ) {
      return 'image/png';
    }

    // JPEG
    if (signature[0] === 0xff && signature[1] === 0xd8) {
      return 'image/jpeg';
    }

    // GIF
    if (
      signature[0] === 0x47 &&
      signature[1] === 0x49 &&
      signature[2] === 0x46
    ) {
      return 'image/gif';
    }

    // WebP
    if (
      signature[0] === 0x52 &&
      signature[1] === 0x49 &&
      signature[2] === 0x46 &&
      signature[3] === 0x46 &&
      signature[8] === 0x57 &&
      signature[9] === 0x45 &&
      signature[10] === 0x42 &&
      signature[11] === 0x50
    ) {
      return 'image/webp';
    }

    // SVG (simplified check)
    const textStart = buffer.subarray(0, 100).toString('utf8');
    if (textStart.includes('<svg') || textStart.includes('<?xml')) {
      return 'image/svg+xml';
    }

    // PDF
    if (
      signature[0] === 0x25 &&
      signature[1] === 0x50 &&
      signature[2] === 0x44 &&
      signature[3] === 0x46
    ) {
      return 'application/pdf';
    }

    return 'application/octet-stream';
  }

  /**
   * Generate a unique filename when none is provided
   */
  private generateFilename(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `upload_${timestamp}_${random}`;
  }

  /**
   * Validate uploaded files against options and global limits
   */
  private validateFiles(
    files: Express.Multer.File[],
    options?: FileUploadOptions
  ): Express.Multer.File[] {
    const opts = { ...this.config.defaultOptions, ...options };
    const validatedFiles: Express.Multer.File[] = [];

    if (files.length > (opts.maxFiles || this.config.globalMaxFiles)) {
      throw new BadRequestException(
        `Too many files. Maximum allowed: ${opts.maxFiles || this.config.globalMaxFiles}`
      );
    }

    for (const file of files) {
      const validation = this.validateSingleFile(file, opts);
      if (!validation.isValid) {
        throw new BadRequestException(
          `File validation failed: ${validation.error}`
        );
      }
      validatedFiles.push(file);
    }

    return validatedFiles;
  }

  /**
   * Validate a single file
   */
  private validateSingleFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): FileValidationResult {
    // Check file size
    const maxSize = options.maxFileSize || this.config.globalMaxFileSize;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${file.size} exceeds maximum allowed size ${maxSize}`,
        fileDetails: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      };
    }

    // Check MIME type if restrictions are specified
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(file.mimetype)) {
        return {
          isValid: false,
          error: `File type ${file.mimetype} is not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
          fileDetails: {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          },
        };
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
        fileDetails: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      };
    }

    return {
      isValid: true,
      fileDetails: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      },
    };
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): UniversalFileUploadConfig {
    return this.config;
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig: Partial<UniversalFileUploadConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('File upload configuration updated');
  }
}
