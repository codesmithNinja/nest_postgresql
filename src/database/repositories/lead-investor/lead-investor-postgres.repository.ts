import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ILeadInvestorRepository } from '../../../common/interfaces/campaign-repository.interface';
import { LeadInvestor } from '../../entities/lead-investor.entity';

@Injectable()
export class LeadInvestorPostgresRepository
  extends PostgresRepository<LeadInvestor>
  implements ILeadInvestorRepository
{
  protected modelName = 'leadInvestor';
  protected selectFields = {
    id: true,
    publicId: true,
    investorPhoto: true,
    name: true,
    investorType: true,
    bio: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<LeadInvestor[]> {
    const results = await this.prisma.leadInvestor.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as LeadInvestor[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<LeadInvestor | null> {
    const result = await this.prisma.leadInvestor.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as LeadInvestor | null;
  }
}
