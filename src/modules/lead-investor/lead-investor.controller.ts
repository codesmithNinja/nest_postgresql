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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CampaignOwnershipGuard } from '../../common/guards/campaign-ownership.guard';
import { LeadInvestorService } from './lead-investor.service';
import {
  CreateLeadInvestorDto,
  UpdateLeadInvestorDto,
  LeadInvestorResponseDto,
} from './dto/lead-investor.dto';
import { multerConfig } from '../../common/config/multer.config';

@ApiTags('Lead Investors')
@Controller('leadInvestor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadInvestorController {
  constructor(private readonly leadInvestorService: LeadInvestorService) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all lead investors for campaign' })
  @ApiResponse({ type: [LeadInvestorResponseDto] })
  async getLeadInvestors(@Param('equityId') equityId: string) {
    return this.leadInvestorService.getLeadInvestorsByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create lead investor' })
  @ApiResponse({ type: LeadInvestorResponseDto, status: 201 })
  async createLeadInvestor(
    @Param('equityId') equityId: string,
    @Body() createLeadInvestorDto: CreateLeadInvestorDto
  ) {
    return this.leadInvestorService.createLeadInvestor(
      equityId,
      createLeadInvestorDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update lead investor' })
  @ApiResponse({ type: LeadInvestorResponseDto })
  async updateLeadInvestor(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateLeadInvestorDto: UpdateLeadInvestorDto
  ) {
    return this.leadInvestorService.updateLeadInvestor(
      equityId,
      id,
      updateLeadInvestorDto
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
    return this.leadInvestorService.deleteLeadInvestor(equityId, id);
  }

  @Post('upload/photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig.imageUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload investor photo' })
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'Photo file is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      };
    }
    return this.leadInvestorService.uploadFile(file, 'investor-photo');
  }
}
