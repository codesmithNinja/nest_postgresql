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
import { ExtrasDocumentService } from './extras-document.service';
import {
  CreateExtrasDocumentDto,
  UpdateExtrasDocumentDto,
  ExtrasDocumentResponseDto,
} from './dto/extras-document.dto';
import { multerConfig } from '../../common/config/multer.config';
import { I18nResponseService } from '../../common/services/i18n-response.service';

@ApiTags('Extras Documents')
@Controller('extrasDocument')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExtrasDocumentController {
  constructor(
    private readonly extrasDocumentService: ExtrasDocumentService,
    private i18nResponse: I18nResponseService
  ) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all extras documents for campaign' })
  @ApiResponse({ type: [ExtrasDocumentResponseDto] })
  async getExtrasDocuments(@Param('equityId') equityId: string) {
    return this.extrasDocumentService.getExtrasDocumentsByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create extras document' })
  @ApiResponse({ type: ExtrasDocumentResponseDto, status: 201 })
  async createExtrasDocument(
    @Param('equityId') equityId: string,
    @Body() createExtrasDocumentDto: CreateExtrasDocumentDto
  ) {
    return this.extrasDocumentService.createExtrasDocument(
      equityId,
      createExtrasDocumentDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update extras document' })
  @ApiResponse({ type: ExtrasDocumentResponseDto })
  async updateExtrasDocument(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateExtrasDocumentDto: UpdateExtrasDocumentDto
  ) {
    return this.extrasDocumentService.updateExtrasDocument(
      equityId,
      id,
      updateExtrasDocumentDto
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete extras document' })
  @ApiResponse({
    status: 200,
    description: 'Extras document deleted successfully',
  })
  async deleteExtrasDocument(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.extrasDocumentService.deleteExtrasDocument(equityId, id);
  }

  @Post('upload/document')
  @UseInterceptors(FileInterceptor('document', multerConfig.documentUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload extras document file' })
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return this.i18nResponse.badRequest(
        'extras_document.document_file_required'
      );
    }
    return this.extrasDocumentService.uploadFile(file, 'extras-document');
  }
}
