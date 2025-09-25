import { IRepository } from '../../../common/interfaces/repository.interface';
import { TeamMember } from '../../entities/team-member.entity';

export interface ITeamMemberRepository extends IRepository<TeamMember> {
  findByEquityId(equityId: string): Promise<TeamMember[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<TeamMember | null>;
}

export const TEAM_MEMBER_REPOSITORY = 'TEAM_MEMBER_REPOSITORY';
