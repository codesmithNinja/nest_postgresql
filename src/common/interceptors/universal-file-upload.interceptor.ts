import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import multer from 'multer';
import {
  FileUploadOptions,
  ProcessedFileUpload,
} from '../interfaces/file-upload.interface';
import { UniversalFileProcessingService } from '../services/universal-file-processing.service';

@Injectable()
export class UniversalFileUploadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UniversalFileUploadInterceptor.name);
  private multerInstance: multer.Multer;
  private readonly defaultOptions: FileUploadOptions = {
    maxFiles: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  constructor(
    private readonly fileProcessingService: UniversalFileProcessingService
  ) {
    // Initialize multer for multipart handling
    const multerOptions: multer.Options = {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.defaultOptions.maxFileSize,
        files: this.defaultOptions.maxFiles,
      },
    };

    this.multerInstance = multer(multerOptions);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const contentType = request.headers['content-type'] || '';

    this.logger.debug(
      `Processing file upload request with Content-Type: ${contentType}`
    );

    try {
      let processedUpload: ProcessedFileUpload;

      if (contentType.startsWith('multipart/form-data')) {
        // Handle multipart/form-data uploads (existing Postman behavior)
        processedUpload = await this.handleMultipartUpload(request);
      } else if (this.isBinaryUpload(contentType)) {
        // Handle binary uploads (React binary format)
        processedUpload = await this.handleBinaryUpload(request);
      } else {
        // No file upload detected, proceed normally
        return next.handle();
      }

      // Attach processed files to request for controller access
      this.attachFilesToRequest(request, processedUpload);

      this.logger.debug(
        `Successfully processed ${processedUpload.files.length} files using ${processedUpload.uploadMethod} method`
      );

      return next.handle();
    } catch (error) {
      this.logger.error(
        'File upload processing failed',
        (error as Error).stack
      );
      throw new BadRequestException(
        `File upload failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Handle multipart/form-data uploads
   */
  private async handleMultipartUpload(
    request: ExpressRequest
  ): Promise<ProcessedFileUpload> {
    return new Promise((resolve, reject) => {
      const upload = this.multerInstance.any();

      upload(request, {} as ExpressResponse, (error: unknown) => {
        if (error) {
          this.logger.error('Multer processing failed', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          reject(new Error(`Multer processing failed: ${errorMessage}`));
          return;
        }

        try {
          const requestWithFiles = request as Express.Request & {
            files?: Express.Multer.File[];
          };
          const files = requestWithFiles.files || [];
          const body = (request.body as Record<string, string>) || {};

          const processedUpload =
            this.fileProcessingService.processMultipartFiles(
              files,
              body,
              this.defaultOptions
            );

          resolve(processedUpload);
        } catch (processingError) {
          reject(
            new Error(
              `File processing failed: ${(processingError as Error).message}`
            )
          );
        }
      });
    });
  }

  /**
   * Handle binary uploads
   */
  private async handleBinaryUpload(
    request: ExpressRequest
  ): Promise<ProcessedFileUpload> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      // Collect request body chunks
      request.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      request.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);

          if (buffer.length === 0) {
            reject(new Error('No file data received in binary upload'));
            return;
          }

          const processedUpload = this.fileProcessingService.processBinaryFiles(
            buffer,
            request.headers as Record<string, string | string[]>,
            this.defaultOptions
          );

          resolve(processedUpload);
        } catch (processingError) {
          reject(
            new Error(
              `Binary file processing failed: ${(processingError as Error).message}`
            )
          );
        }
      });

      request.on('error', (error: Error) => {
        reject(new Error(`Binary upload error: ${error.message}`));
      });

      // Set a timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        reject(new Error('Binary upload timeout'));
      }, 30000); // 30 seconds timeout

      request.on('end', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Check if the request is a binary upload
   */
  private isBinaryUpload(contentType: string): boolean {
    const binaryTypes = [
      'application/octet-stream',
      'image/',
      'video/',
      'audio/',
      'application/pdf',
    ];

    // Check for known binary content types
    return (
      binaryTypes.some((type) => contentType.startsWith(type)) ||
      // Also check if Content-Type is not form-data and has content
      (!contentType.startsWith('multipart/') &&
        !contentType.startsWith('application/x-www-form-urlencoded'))
    );
  }

  /**
   * Attach processed files to request object for controller access
   */
  private attachFilesToRequest(
    request: ExpressRequest,
    processedUpload: ProcessedFileUpload
  ): void {
    // Attach files in the format expected by @UploadedFiles() decorator
    const requestWithFiles = request as ExpressRequest & {
      files?: Express.Multer.File[];
      uploadMethod?: string;
      hasFiles?: boolean;
    };

    requestWithFiles.files = processedUpload.files;

    // CRITICAL FIX: Remove file field names from request.body to prevent ValidationPipe errors
    if (processedUpload.files && processedUpload.files.length > 0) {
      const currentBody = (request.body as Record<string, unknown>) || {};
      const cleanedBody: Record<string, unknown> = {};

      // Get all file field names that should be removed from body
      const fileFieldNames = new Set(
        processedUpload.files.map((file) => file.fieldname)
      );

      // Only keep non-file fields in the body
      Object.entries(currentBody).forEach(([key, value]) => {
        if (!fileFieldNames.has(key)) {
          cleanedBody[key] = value;
        }
      });

      request.body = cleanedBody;

      this.logger.debug(
        `Cleaned ${fileFieldNames.size} file field names from request body: ${Array.from(fileFieldNames).join(', ')}`
      );
    }

    // For binary uploads, also attach form data if any (non-file data only)
    if (processedUpload.formData) {
      request.body = {
        ...((request.body as Record<string, unknown>) || {}),
        ...processedUpload.formData,
      };
    }

    // Add metadata about the upload method for debugging
    requestWithFiles.uploadMethod = processedUpload.uploadMethod;
    requestWithFiles.hasFiles = processedUpload.hasFiles;
  }
}
