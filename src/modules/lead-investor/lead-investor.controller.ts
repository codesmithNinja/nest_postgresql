import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtUserGuard } from '../../common/guards/jwt-user.guard';
import { CampaignOwnershipGuard } from '../../common/guards/campaign-ownership.guard';
import { LeadInvestorService } from './lead-investor.service';
import {
  CreateLeadInvestorDto,
  UpdateLeadInvestorDto,
  LeadInvestorResponseDto,
} from './dto/lead-investor.dto';
import { multerConfig } from '../../common/config/multer.config';
import { I18nResponseService } from '../../common/services/i18n-response.service';

@ApiTags('Lead Investors')
@Controller('lead-investor')
@UseGuards(JwtUserGuard)
@ApiBearerAuth()
export class LeadInvestorController {
  constructor(
    private readonly leadInvestorService: LeadInvestorService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all lead investors for campaign' })
  @ApiResponse({ type: [LeadInvestorResponseDto] })
  async getLeadInvestors(@Param('equityId') equityId: string) {
    return this.leadInvestorService.findByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @UseInterceptors(FileInterceptor('investorPhoto', multerConfig.imageUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create lead investor with photo upload' })
  @ApiResponse({ type: LeadInvestorResponseDto, status: 201 })
  async createLeadInvestor(
    @Param('equityId') equityId: string,
    @Body() createLeadInvestorDto: CreateLeadInvestorDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      return this.i18nResponse.badRequest('lead_investor.photo_file_required');
    }
    return this.leadInvestorService.create(
      equityId,
      createLeadInvestorDto,
      file
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @UseInterceptors(FileInterceptor('investorPhoto', multerConfig.imageUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update lead investor with optional photo upload' })
  @ApiResponse({ type: LeadInvestorResponseDto })
  async updateLeadInvestor(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateLeadInvestorDto: UpdateLeadInvestorDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.leadInvestorService.update(
      equityId,
      id,
      updateLeadInvestorDto,
      file
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete lead investor' })
  @ApiResponse({
    status: 200,
    description: 'Lead investor deleted successfully',
  })
  async deleteLeadInvestor(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.leadInvestorService.delete(equityId, id);
  }
}
