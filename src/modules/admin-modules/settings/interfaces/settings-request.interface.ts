import { Request } from 'express';
import { RecordType } from '../../../../common/enums/database-type.enum';

export interface SettingsRequest extends Request {
  params: {
    groupType: string;
  };
}

export interface CreateSettingsRequest extends SettingsRequest {
  body: {
    [key: string]: string | Express.Multer.File;
  };
}

export interface FormDataSettingsItem {
  key: string;
  value: string | Express.Multer.File;
  recordType: RecordType;
  originalValue?: string; // For file cleanup in case of update
}

export interface ProcessedFormDataSettings {
  textSettings: Array<{
    key: string;
    value: string;
    recordType: RecordType.STRING;
  }>;
  fileSettings: Array<{
    key: string;
    file: Express.Multer.File;
    recordType: RecordType.FILE;
    oldFilePath?: string;
  }>;
}

export interface SettingsServiceOptions {
  includeFiles?: boolean;
  useCache?: boolean;
  cacheTTL?: number;
}

export interface CacheKey {
  groupType: string;
  key?: string;
  isPublic: boolean;
}

export interface SettingsCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}
