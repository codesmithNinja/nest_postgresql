import { IRepository } from '../../../common/interfaces/repository.interface';
import { LeadInvestor } from '../../entities/lead-investor.entity';

export interface ILeadInvestorRepository extends IRepository<LeadInvestor> {
  findByEquityId(equityId: string): Promise<LeadInvestor[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<LeadInvestor | null>;
}

export const LEAD_INVESTOR_REPOSITORY = 'LEAD_INVESTOR_REPOSITORY';
