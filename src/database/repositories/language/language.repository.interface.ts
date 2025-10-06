import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  Language,
  CreateLanguageDto,
  UpdateLanguageDto,
} from '../../entities/language.entity';

export interface ILanguageRepository extends IRepository<Language> {
  findByCode(code: string): Promise<Language | null>;
  findByIsDefault(isDefault: string): Promise<Language | null>;
  findAllActive(): Promise<Language[]>;
  setAsDefault(id: string): Promise<Language>;
  unsetAllDefaults(): Promise<void>;
  findWithDropdowns(id: string): Promise<Language | null>;
  findActiveLanguages(): Promise<Language[]>;
  bulkUpdateStatus(ids: string[], status: boolean): Promise<number>;
}

export const LANGUAGE_REPOSITORY = 'LANGUAGE_REPOSITORY';
