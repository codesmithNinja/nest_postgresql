import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileUploadUtil } from '../utils/file-upload.util';

// Always use memory storage for new file management system
const getStorage = () => {
  return memoryStorage();
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
