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
import { TeamMemberService } from './team-member.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  TeamMemberResponseDto,
} from './dto/team-member.dto';
import { multerConfig } from '../../common/config/multer.config';

@ApiTags('Team Members')
@Controller('teamMember')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Get(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Get all team members for campaign' })
  @ApiResponse({ type: [TeamMemberResponseDto] })
  async getTeamMembers(@Param('equityId') equityId: string) {
    return this.teamMemberService.getTeamMembersByEquityId(equityId);
  }

  @Post(':equityId')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Create team member' })
  @ApiResponse({ type: TeamMemberResponseDto, status: 201 })
  async createTeamMember(
    @Param('equityId') equityId: string,
    @Body() createTeamMemberDto: CreateTeamMemberDto
  ) {
    return this.teamMemberService.createTeamMember(
      equityId,
      createTeamMemberDto
    );
  }

  @Patch(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Update team member' })
  @ApiResponse({ type: TeamMemberResponseDto })
  async updateTeamMember(
    @Param('equityId') equityId: string,
    @Param('id') id: string,
    @Body() updateTeamMemberDto: UpdateTeamMemberDto
  ) {
    return this.teamMemberService.updateTeamMember(
      equityId,
      id,
      updateTeamMemberDto
    );
  }

  @Delete(':equityId/:id')
  @UseGuards(CampaignOwnershipGuard)
  @ApiOperation({ summary: 'Delete team member' })
  @ApiResponse({ status: 200, description: 'Team member deleted successfully' })
  async deleteTeamMember(
    @Param('equityId') equityId: string,
    @Param('id') id: string
  ) {
    return this.teamMemberService.deleteTeamMember(equityId, id);
  }

  @Post('upload/photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig.imageUpload))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload member photo' })
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'Photo file is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      };
    }
    return this.teamMemberService.uploadFile(file, 'member-photo');
  }
}
