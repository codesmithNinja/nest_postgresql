import { IRepository, QueryOptions } from './repository.interface';
import { Equity } from '../../database/entities/equity.entity';
import { LeadInvestor } from '../../database/entities/lead-investor.entity';
import { TeamMember } from '../../database/entities/team-member.entity';
import { CampaignFaq } from '../../database/entities/campaign-faq.entity';
import { ExtrasVideo } from '../../database/entities/extras-video.entity';
import { ExtrasImage } from '../../database/entities/extras-image.entity';
import { ExtrasDocument } from '../../database/entities/extras-document.entity';

export interface IEquityRepository extends IRepository<Equity> {
  findByPublicId(publicId: string): Promise<Equity | null>;
  findByUserId(userId: string, options?: QueryOptions): Promise<Equity[]>;
  findActivePublicCampaigns(options?: QueryOptions): Promise<Equity[]>;
  findWithRelations(id: string): Promise<Equity | null>;
  canModify(id: string, userId: string): Promise<boolean>;
}

export interface ILeadInvestorRepository extends IRepository<LeadInvestor> {
  findByEquityId(equityId: string): Promise<LeadInvestor[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<LeadInvestor | null>;
}

export interface ITeamMemberRepository extends IRepository<TeamMember> {
  findByEquityId(equityId: string): Promise<TeamMember[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<TeamMember | null>;
}

export interface ICampaignFaqRepository extends IRepository<CampaignFaq> {
  findByEquityId(equityId: string): Promise<CampaignFaq[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<CampaignFaq | null>;
}

export interface IExtrasVideoRepository extends IRepository<ExtrasVideo> {
  findByEquityId(equityId: string): Promise<ExtrasVideo[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasVideo | null>;
}

export interface IExtrasImageRepository extends IRepository<ExtrasImage> {
  findByEquityId(equityId: string): Promise<ExtrasImage[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasImage | null>;
}

export interface IExtrasDocumentRepository extends IRepository<ExtrasDocument> {
  findByEquityId(equityId: string): Promise<ExtrasDocument[]>;
  findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasDocument | null>;
}

// Repository tokens for dependency injection
export const EQUITY_REPOSITORY = 'EQUITY_REPOSITORY';
export const LEAD_INVESTOR_REPOSITORY = 'LEAD_INVESTOR_REPOSITORY';
export const TEAM_MEMBER_REPOSITORY = 'TEAM_MEMBER_REPOSITORY';
export const CAMPAIGN_FAQ_REPOSITORY = 'CAMPAIGN_FAQ_REPOSITORY';
export const EXTRAS_VIDEO_REPOSITORY = 'EXTRAS_VIDEO_REPOSITORY';
export const EXTRAS_IMAGE_REPOSITORY = 'EXTRAS_IMAGE_REPOSITORY';
export const EXTRAS_DOCUMENT_REPOSITORY = 'EXTRAS_DOCUMENT_REPOSITORY';
