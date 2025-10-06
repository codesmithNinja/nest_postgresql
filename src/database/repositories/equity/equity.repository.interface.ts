import {
  IRepository,
  QueryOptions,
} from '../../../common/interfaces/repository.interface';
import { Equity } from '../../entities/equity.entity';

export interface IEquityRepository extends IRepository<Equity> {
  findByPublicId(publicId: string): Promise<Equity | null>;
  findByUserId(userId: string, options?: QueryOptions): Promise<Equity[]>;
  findActivePublicCampaigns(options?: QueryOptions): Promise<Equity[]>;
  findRelations(id: string): Promise<Equity | null>;
  canModify(id: string, userId: string): Promise<boolean>;
}

export const EQUITY_REPOSITORY = 'EQUITY_REPOSITORY';
