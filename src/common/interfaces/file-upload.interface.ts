export interface FileUploadOptions {
  /**
   * Maximum number of files allowed
   */
  maxFiles?: number;

  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number;

  /**
   * Allowed file types (MIME types)
   */
  allowedMimeTypes?: string[];

  /**
   * Field name for file uploads (used for binary uploads)
   */
  fieldName?: string;

  /**
   * Whether to preserve original filename
   */
  preserveFilename?: boolean;
}

export interface BinaryFileData {
  /**
   * File buffer data
   */
  buffer: Buffer;

  /**
   * Original filename (extracted from headers or generated)
   */
  originalname: string;

  /**
   * Field name for the file
   */
  fieldname: string;

  /**
   * MIME type
   */
  mimetype: string;

  /**
   * File size in bytes
   */
  size: number;
}

export interface ProcessedFileUpload {
  /**
   * Whether the request contained files
   */
  hasFiles: boolean;

  /**
   * Processed files in Express.Multer.File format
   */
  files: Express.Multer.File[];

  /**
   * Upload method used (multipart or binary)
   */
  uploadMethod: 'multipart' | 'binary';

  /**
   * Any additional form data (for multipart uploads)
   */
  formData?: Record<string, string>;
}

export interface FileValidationResult {
  /**
   * Whether the file is valid
   */
  isValid: boolean;

  /**
   * Validation error message if invalid
   */
  error?: string;

  /**
   * File details
   */
  fileDetails: {
    name: string;
    size: number;
    type: string;
  };
}

export interface UniversalFileUploadConfig {
  /**
   * Default options for file uploads
   */
  defaultOptions: FileUploadOptions;

  /**
   * Supported upload methods
   */
  supportedMethods: ('multipart' | 'binary')[];

  /**
   * Global file size limit in bytes
   */
  globalMaxFileSize: number;

  /**
   * Global max files limit
   */
  globalMaxFiles: number;
}
