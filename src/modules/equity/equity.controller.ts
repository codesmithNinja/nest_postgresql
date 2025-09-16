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
import { CampaignModificationGuard } from '../../common/guards/campaign-modification.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RequestWithUser } from '../../common/types/user.types';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import { EquityService } from './equity.service';
import {
  CreateEquityDto,
  UpdateEquityDto,
  UpdateEquityFormDataDto,
  EquityResponseDto,
  EquityWithRelationsResponseDto,
} from './dto/equity.dto';
import { FileUploadResponseDto } from '../../common/dto/file-upload.dto';
import { getFileUploadConfig } from '../../common/config/multer.config';

@ApiTags('Equity Campaigns')
@Controller('equity')
export class EquityController {
  constructor(
    private readonly equityService: EquityService,
    private i18nResponse: I18nResponseService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all campaigns of logged-in user' })
  @ApiResponse({ type: [EquityResponseDto] })
  async getUserCampaigns(
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto
  ) {
    return await this.equityService.getUserCampaigns(
      req.user.id,
      paginationDto
    );
  }

  @Get('front')
  @Public()
  @ApiOperation({ summary: 'Get all active campaigns (public)' })
  @ApiResponse({ type: [EquityResponseDto] })
  async getPublicCampaigns(@Query() paginationDto: PaginationDto) {
    return await this.equityService.getPublicCampaigns(paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CampaignOwnershipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single campaign with relations' })
  @ApiResponse({ type: EquityWithRelationsResponseDto })
  async getCampaignById(@Param('id') id: string) {
    return await this.equityService.getCampaignWithRelations(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new campaign (Step 1)' })
  @ApiResponse({ type: EquityResponseDto, status: 201 })
  async createCampaign(
    @Req() req: RequestWithUser,
    @Body() createEquityDto: CreateEquityDto
  ) {
    return await this.equityService.createCampaign(
      req.user.id,
      createEquityDto
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CampaignModificationGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('campaignImageURL', getFileUploadConfig(5)))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Update campaign (Steps 2-6)' })
  @ApiResponse({ type: EquityResponseDto })
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateEquityDto: UpdateEquityDto | UpdateEquityFormDataDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return await this.equityService.updateCampaign(id, updateEquityDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CampaignModificationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete campaign (DRAFT/PENDING only)' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async deleteCampaign(@Param('id') id: string) {
    return await this.equityService.deleteCampaign(id);
  }

  @Post('upload/logo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo', getFileUploadConfig(5)))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiResponse({ type: FileUploadResponseDto })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return this.i18nResponse.badRequest('equity.logo_file_required');
    }
    return await this.equityService.uploadFile(file, 'logo');
  }

  @Post('upload/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', getFileUploadConfig(5)))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload campaign image' })
  @ApiResponse({ type: FileUploadResponseDto })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return this.i18nResponse.badRequest('equity.image_file_required');
    }
    return await this.equityService.uploadFile(file, 'campaign-image');
  }
}
