import { RecordType } from '../../common/enums/database-type.enum';

export interface Settings {
  id: string;
  groupType: string;
  recordType: RecordType;
  key: string;
  value: string | number | boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingsData {
  groupType: string;
  recordType?: RecordType;
  key: string;
  value: string | number | boolean;
}

export interface UpdateSettingsData {
  recordType?: RecordType;
  value?: string | number | boolean;
}

export interface SettingsFilter {
  id?: string;
  groupType?: string;
  recordType?: RecordType;
  key?: string;
}
