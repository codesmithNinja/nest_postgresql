import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileUploadUtil } from '../utils/file-upload.util';

// Use memory storage when uploading to AWS S3, disk storage for local files (legacy)
const getStorage = () => {
  if (process.env.ASSET_MANAGEMENT_TOOL === 'AWS') {
    return memoryStorage();
  } else {
    return diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const name = file.originalname.split('.')[0];
        const fileExtName = extname(file.originalname);
        const randomName = Array(4)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        callback(null, `${name}-${Date.now()}-${randomName}${fileExtName}`);
      },
    });
  }
};

// Always use memory storage for the new file upload system
const getMemoryStorage = () => {
  return memoryStorage();
};

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void
) => {
  const options = FileUploadUtil.getImageUploadOptions();
  try {
    FileUploadUtil.validateFile(file, options);
    callback(null, true);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File validation failed';
    callback(new BadRequestException(errorMessage), false);
  }
};

const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void
) => {
  const options = FileUploadUtil.getVideoUploadOptions();
  try {
    FileUploadUtil.validateFile(file, options);
    callback(null, true);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File validation failed';
    callback(new BadRequestException(errorMessage), false);
  }
};

const documentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void
) => {
  const options = FileUploadUtil.getDocumentUploadOptions();
  try {
    FileUploadUtil.validateFile(file, options);
    callback(null, true);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File validation failed';
    callback(new BadRequestException(errorMessage), false);
  }
};

export const multerConfig = {
  imageUpload: {
    storage: getStorage(),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: FileUploadUtil.getImageUploadOptions().maxSizeBytes,
    },
  },
  videoUpload: {
    storage: getStorage(),
    fileFilter: videoFileFilter,
    limits: {
      fileSize: FileUploadUtil.getVideoUploadOptions().maxSizeBytes,
    },
  },
  documentUpload: {
    storage: getStorage(),
    fileFilter: documentFileFilter,
    limits: {
      fileSize: FileUploadUtil.getDocumentUploadOptions().maxSizeBytes,
    },
  },
};

// New multer configuration for the new file management system
export const getFileUploadConfig = (maxSizeInMB: number = 10) => {
  return {
    storage: getMemoryStorage(),
    limits: {
      fileSize: maxSizeInMB * 1024 * 1024, // Convert MB to bytes
    },
  };
};
