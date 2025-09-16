import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ITeamMemberRepository,
  TEAM_MEMBER_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileManagementService } from '../../common/services/file-management.service';
import { I18nResponseService } from '../../common/services/i18n-response.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import { TeamMember } from '../../database/entities/team-member.entity';

@Injectable()
export class TeamMemberService {
  private readonly logger = new Logger(TeamMemberService.name);

  constructor(
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    private i18nResponse: I18nResponseService,
    private fileManagementService: FileManagementService
  ) {}

  async getTeamMembersByEquityId(equityId: string) {
    try {
      const cacheKey = CacheUtil.getCampaignRelationsKey(
        equityId,
        'teamMembers'
      );

      const cachedData = CacheUtil.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const teamMembers =
        await this.teamMemberRepository.findByEquityId(equityId);

      const response = this.i18nResponse.success(
        'team_member.retrieved',
        teamMembers
      );

      CacheUtil.set(cacheKey, response, 300);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting team members: ${errorMessage}`);
      throw error;
    }
  }

  async createTeamMember(
    equityId: string,
    createTeamMemberDto: CreateTeamMemberDto
  ) {
    try {
      const teamMemberData: Partial<TeamMember> = {
        ...createTeamMemberDto,
        equityId,
      };

      const teamMember = await this.teamMemberRepository.insert(teamMemberData);

      CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

      this.logger.log(`Team member created successfully: ${teamMember.id}`);

      return this.i18nResponse.created('team_member.created', teamMember);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error creating team member: ${errorMessage}`);
      throw error;
    }
  }

  async updateTeamMember(
    equityId: string,
    id: string,
    updateTeamMemberDto: UpdateTeamMemberDto
  ) {
    try {
      const teamMember =
        await this.teamMemberRepository.findByEquityIdAndPublicId(equityId, id);

      if (!teamMember) {
        throw new NotFoundException();
      }

      const updatedTeamMember = await this.teamMemberRepository.updateById(
        teamMember.id,
        updateTeamMemberDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

      this.logger.log(`Team member updated successfully: ${id}`);

      return this.i18nResponse.success(
        'team_member.updated',
        updatedTeamMember
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating team member: ${errorMessage}`);
      throw error;
    }
  }

  async deleteTeamMember(equityId: string, id: string) {
    try {
      const teamMember =
        await this.teamMemberRepository.findByEquityIdAndPublicId(equityId, id);

      if (!teamMember) {
        throw new NotFoundException();
      }

      await this.teamMemberRepository.deleteById(teamMember.id);

      CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

      this.logger.log(`Team member deleted successfully: ${id}`);

      return this.i18nResponse.success('team_member.deleted');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting team member: ${errorMessage}`);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const uploadResult =
        await this.fileManagementService.uploadTeamMemberImage(file);

      return this.i18nResponse.success('common.file_uploaded', {
        filename: uploadResult.filePath,
        url:
          uploadResult.url ||
          this.fileManagementService.getFileUrl(uploadResult.filePath),
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw error;
    }
  }
}
