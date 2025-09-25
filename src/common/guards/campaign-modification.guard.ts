import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { RequestWithUser } from '../types/user.types';
import {
  IEquityRepository,
  EQUITY_REPOSITORY,
} from '../../database/repositories/equity/equity.repository.interface';
import { CampaignStatus } from '../../database/entities/equity.entity';

@Injectable()
export class CampaignModificationGuard implements CanActivate {
  constructor(
    @Inject(EQUITY_REPOSITORY)
    private readonly equityRepository: IEquityRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const campaignId = request.params.id || request.params.equityId;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!campaignId) {
      throw new ForbiddenException('Campaign ID required');
    }

    // Check if campaign exists and belongs to user
    const campaign = await this.equityRepository.getDetailById(campaignId);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.userId !== user.id) {
      throw new ForbiddenException('You do not own this campaign');
    }

    // Check if campaign can be modified
    const allowedStatuses = [CampaignStatus.DRAFT, CampaignStatus.PENDING];
    if (!allowedStatuses.includes(campaign.status)) {
      throw new ForbiddenException(
        'Campaign can only be modified when status is DRAFT or PENDING'
      );
    }

    return true;
  }
}
