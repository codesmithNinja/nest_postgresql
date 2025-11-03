import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileUploadOptions } from '../interfaces/file-upload.interface';
import { UniversalFileUploadInterceptor } from '../interceptors/universal-file-upload.interceptor';

/**
 * Decorator for universal file upload support
 * Handles both multipart/form-data and binary uploads automatically
 */
export function UploadFiles(options?: FileUploadOptions) {
  return applyDecorators(
    UseInterceptors(UniversalFileUploadInterceptor),
    ApiConsumes('multipart/form-data', 'application/octet-stream', 'image/*'),
    ApiBody({
      description: `File upload endpoint supporting both multipart/form-data and binary formats.

**Multipart/form-data (Postman style):**
- Send files as form fields with proper field names
- Include text data as additional form fields
- Content-Type: multipart/form-data

**Binary upload (React style):**
- Send raw file data directly
- Include filename in X-Filename header
- Content-Type: application/octet-stream or specific MIME type

**Options:**
- Max files: ${options?.maxFiles || 20}
- Max file size: ${Math.round((options?.maxFileSize || 10 * 1024 * 1024) / 1024 / 1024)}MB
- Field name (binary): ${options?.fieldName || 'file'}`,
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'File to upload (binary format)',
          },
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: 'Multiple files to upload (multipart format)',
          },
        },
      },
    })
  );
}

/**
 * Specific decorator for single file upload
 */
export function UploadSingleFile(
  fieldName: string,
  options?: Omit<FileUploadOptions, 'maxFiles'>
) {
  return UploadFiles({
    ...options,
    maxFiles: 1,
    fieldName,
  });
}

/**
 * Specific decorator for image uploads with validation
 */
export function UploadImages(options?: FileUploadOptions) {
  const imageOptions: FileUploadOptions = {
    ...options,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      ...(options?.allowedMimeTypes || []),
    ],
  };

  return UploadFiles(imageOptions);
}

/**
 * Specific decorator for document uploads
 */
export function UploadDocuments(options?: FileUploadOptions) {
  const documentOptions: FileUploadOptions = {
    ...options,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      ...(options?.allowedMimeTypes || []),
    ],
  };

  return UploadFiles(documentOptions);
}
