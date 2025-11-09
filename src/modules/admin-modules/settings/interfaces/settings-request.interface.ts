import { Request } from 'express';
import { RecordType } from '../../../../common/enums/database-type.enum';

export interface SettingsRequest extends Request {
  params: {
    groupType: string;
  };
}

export interface CreateSettingsRequest extends SettingsRequest {
  body: {
    [key: string]: string | number | boolean | Express.Multer.File;
  };
}

export interface FormDataSettingsItem {
  key: string;
  value: string | number | boolean | Express.Multer.File;
  recordType: RecordType;
  originalValue?: string; // For file cleanup in case of update
}

export interface ProcessedFormDataSettings {
  textSettings: Array<{
    key: string;
    value: string | number | boolean;
    recordType: RecordType.STRING | RecordType.NUMBER | RecordType.BOOLEAN;
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
  data: Record<string, string | number | boolean>;
  timestamp: number;
  ttl: number;
}
