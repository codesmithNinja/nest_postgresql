import { RecordType } from '../../common/enums/database-type.enum';

export interface Settings {
  id: string;
  groupType: string;
  recordType: RecordType;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSettingsData {
  groupType: string;
  recordType?: RecordType;
  key: string;
  value: string;
}

export interface UpdateSettingsData {
  recordType?: RecordType;
  value?: string;
}

export interface SettingsFilter {
  id?: string;
  groupType?: string;
  recordType?: RecordType;
  key?: string;
}
