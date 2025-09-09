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
import { ExtrasImageService } from './extras-image.service';
import {
  CreateExtrasImageDto,
  UpdateExtrasImageDto,
  ExtrasImageResponseDto,
} from './dto/extras-image.dto';
import { multerConfig } from '../../common/config/multer.config';

@ApiTags('Extras Images')
@Controller('extrasImage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExtrasImageController {
  constructor(private readonly extrasImageService: ExtrasImageService) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all extras images for campaign' })
  @ApiResponse({ type: [ExtrasImageResponseDto] })
  async getExtrasImages(@Param('equityId') equityId: string) {
    return this.extrasImageService.getExtrasImagesByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create extras image' })
  @ApiResponse({ type: ExtrasImageResponseDto, status: 201 })
  async createExtrasImage(
    @Param('equityId') equityId: string,
    @Body() createExtrasImageDto: CreateExtrasImageDto
  ) {
    return this.extrasImageService.createExtrasImage(
      equityId,
      createExtrasImageDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update extras image' })
  @ApiResponse({ type: ExtrasImageResponseDto })
  async updateExtrasImage(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateExtrasImageDto: UpdateExtrasImageDto
  ) {
    return this.extrasImageService.updateExtrasImage(
      equityId,
      id,
      updateExtrasImageDto
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete extras image' })
  @ApiResponse({
    status: 200,
    description: 'Extras image deleted successfully',
  })
  async deleteExtrasImage(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.extrasImageService.deleteExtrasImage(equityId, id);
  }

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('image', multerConfig.imageUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload extras image file' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.extrasImageService.uploadFile(file);
  }
}
