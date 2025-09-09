import { Module } from '@nestjs/common';
import { EquityModule } from '../equity/equity.module';
import { LeadInvestorModule } from '../lead-investor/lead-investor.module';
import { TeamMemberModule } from '../team-member/team-member.module';
import { CampaignFaqModule } from '../campaign-faq/campaign-faq.module';
import { ExtrasVideoModule } from '../extras-video/extras-video.module';
import { ExtrasImageModule } from '../extras-image/extras-image.module';
import { ExtrasDocumentModule } from '../extras-document/extras-document.module';

@Module({
  imports: [
    EquityModule,
    LeadInvestorModule,
    TeamMemberModule,
    CampaignFaqModule,
    ExtrasVideoModule,
    ExtrasImageModule,
    ExtrasDocumentModule,
  ],
  exports: [
    EquityModule,
    LeadInvestorModule,
    TeamMemberModule,
    CampaignFaqModule,
    ExtrasVideoModule,
    ExtrasImageModule,
    ExtrasDocumentModule,
  ],
})
export class CampaignModule {}
