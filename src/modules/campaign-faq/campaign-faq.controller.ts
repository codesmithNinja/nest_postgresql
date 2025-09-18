import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtUserGuard } from '../../common/guards/jwt-user.guard';
import { CampaignOwnershipGuard } from '../../common/guards/campaign-ownership.guard';
import { CampaignFaqService } from './campaign-faq.service';
import {
  CreateCampaignFaqDto,
  UpdateCampaignFaqDto,
  CampaignFaqResponseDto,
} from './dto/campaign-faq.dto';

@ApiTags('Campaign FAQs')
@Controller('campaignFaq')
@UseGuards(JwtUserGuard)
@ApiBearerAuth()
export class CampaignFaqController {
  constructor(private readonly campaignFaqService: CampaignFaqService) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all FAQs for campaign' })
  @ApiResponse({ type: [CampaignFaqResponseDto] })
  async getCampaignFaqs(@Param('equityId') equityId: string) {
    return this.campaignFaqService.getCampaignFaqsByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create campaign FAQ' })
  @ApiResponse({ type: CampaignFaqResponseDto, status: 201 })
  async createCampaignFaq(
    @Param('equityId') equityId: string,
    @Body() createCampaignFaqDto: CreateCampaignFaqDto
  ) {
    return this.campaignFaqService.createCampaignFaq(
      equityId,
      createCampaignFaqDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update campaign FAQ' })
  @ApiResponse({ type: CampaignFaqResponseDto })
  async updateCampaignFaq(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateCampaignFaqDto: UpdateCampaignFaqDto
  ) {
    return this.campaignFaqService.updateCampaignFaq(
      equityId,
      id,
      updateCampaignFaqDto
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete campaign FAQ' })
  @ApiResponse({
    status: 200,
    description: 'Campaign FAQ deleted successfully',
  })
  async deleteCampaignFaq(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.campaignFaqService.deleteCampaignFaq(equityId, id);
  }
}
