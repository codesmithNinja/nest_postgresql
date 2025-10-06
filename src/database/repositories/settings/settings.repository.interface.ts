import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  Settings,
  CreateSettingsData,
  UpdateSettingsData,
} from '../../entities/settings.entity';

export const SETTINGS_REPOSITORY = 'SETTINGS_REPOSITORY';

export interface ISettingsRepository extends IRepository<Settings> {
  findByGroupType(groupType: string): Promise<Settings[]>;
  findByGroupTypeAndKey(
    groupType: string,
    key: string
  ): Promise<Settings | null>;
  upsertByGroupTypeAndKey(
    groupType: string,
    key: string,
    data: CreateSettingsData | UpdateSettingsData
  ): Promise<Settings>;
  deleteByGroupType(groupType: string): Promise<number>;
  deleteByGroupTypeAndKey(groupType: string, key: string): Promise<boolean>;
  bulkUpsert(settings: CreateSettingsData[]): Promise<Settings[]>;
}
