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
  BadRequestException,
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
import { ExtrasVideoService } from './extras-video.service';
import {
  CreateExtrasVideoDto,
  UpdateExtrasVideoDto,
  ExtrasVideoResponseDto,
} from './dto/extras-video.dto';
import { multerConfig } from '../../common/config/multer.config';

@ApiTags('Extras Videos')
@Controller('extrasVideo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExtrasVideoController {
  constructor(private readonly extrasVideoService: ExtrasVideoService) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all extras videos for campaign' })
  @ApiResponse({ type: [ExtrasVideoResponseDto] })
  async getExtrasVideos(@Param('equityId') equityId: string) {
    return this.extrasVideoService.getExtrasVideosByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create extras video' })
  @ApiResponse({ type: ExtrasVideoResponseDto, status: 201 })
  async createExtrasVideo(
    @Param('equityId') equityId: string,
    @Body() createExtrasVideoDto: CreateExtrasVideoDto
  ) {
    return this.extrasVideoService.createExtrasVideo(
      equityId,
      createExtrasVideoDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update extras video' })
  @ApiResponse({ type: ExtrasVideoResponseDto })
  async updateExtrasVideo(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateExtrasVideoDto: UpdateExtrasVideoDto
  ) {
    return this.extrasVideoService.updateExtrasVideo(
      equityId,
      id,
      updateExtrasVideoDto
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete extras video' })
  @ApiResponse({
    status: 200,
    description: 'Extras video deleted successfully',
  })
  async deleteExtrasVideo(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.extrasVideoService.deleteExtrasVideo(equityId, id);
  }

  @Post('upload/video')
  @UseInterceptors(FileInterceptor('video', multerConfig.videoUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload extras video file' })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    return this.extrasVideoService.uploadFile(file, 'extras-video');
  }
}
