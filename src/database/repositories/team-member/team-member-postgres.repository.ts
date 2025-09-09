import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgresRepository } from '../base/postgres.repository';
import { ITeamMemberRepository } from '../../../common/interfaces/campaign-repository.interface';
import { TeamMember } from '../../entities/team-member.entity';

@Injectable()
export class TeamMemberPostgresRepository
  extends PostgresRepository<TeamMember>
  implements ITeamMemberRepository
{
  protected modelName = 'teamMember';
  protected selectFields = {
    id: true,
    publicId: true,
    memberPhoto: true,
    name: true,
    role: true,
    email: true,
    bio: true,
    equityId: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEquityId(equityId: string): Promise<TeamMember[]> {
    const results = await this.prisma.teamMember.findMany({
      where: { equityId },
      select: this.selectFields,
      orderBy: { createdAt: 'desc' },
    });
    return results as TeamMember[];
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<TeamMember | null> {
    const result = await this.prisma.teamMember.findFirst({
      where: { equityId, publicId },
      select: this.selectFields,
    });
    return result as TeamMember | null;
  }
}
