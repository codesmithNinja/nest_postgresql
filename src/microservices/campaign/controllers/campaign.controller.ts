import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CampaignService } from '../services/campaign.service';
import { ResponseHandler } from '../../../common/utils/response.handler';

interface CampaignQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

interface CreateCampaignDto {
  title: string;
  description: string;
  targetAmount: number;
  category?: string;
}

@Controller('campaigns')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Get()
  async getAllCampaigns(@Query() query: CampaignQueryDto) {
    const campaigns = await this.campaignService.getAllCampaigns(query);
    return ResponseHandler.success(
      'Campaigns retrieved successfully',
      200,
      campaigns
    );
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string) {
    const campaign = await this.campaignService.getCampaignById(id);
    return ResponseHandler.success(
      'Campaign retrieved successfully',
      200,
      campaign
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCampaign(
    @Body(ValidationPipe) createCampaignDto: CreateCampaignDto,
    @Req() req: any
  ) {
    const campaign = await this.campaignService.createCampaign(
      createCampaignDto,
      req.user.id
    );
    return ResponseHandler.created('Campaign created successfully', campaign);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateCampaign(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateCampaignDto>,
    @Req() req: any
  ) {
    const campaign = await this.campaignService.updateCampaign(
      id,
      updateData,
      req.user.id
    );
    return ResponseHandler.success(
      'Campaign updated successfully',
      200,
      campaign
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCampaign(@Param('id') id: string, @Req() req: any) {
    await this.campaignService.deleteCampaign(id, req.user.id);
    return ResponseHandler.success('Campaign deleted successfully');
  }
}
