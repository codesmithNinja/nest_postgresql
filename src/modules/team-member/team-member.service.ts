import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ITeamMemberRepository,
  TEAM_MEMBER_REPOSITORY,
} from '../../database/repositories/team-member/team-member.repository.interface';
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

  async findByEquityId(equityId: string) {
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

  async create(
    equityId: string,
    createTeamMemberDto: CreateTeamMemberDto,
    file: Express.Multer.File
  ) {
    try {
      // Upload the file first
      const uploadResult =
        await this.fileManagementService.uploadTeamMemberImage(file);

      const teamMemberData: Partial<TeamMember> = {
        ...createTeamMemberDto,
        memberPhoto: uploadResult.filePath,
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

  async update(
    equityId: string,
    id: string,
    updateTeamMemberDto: UpdateTeamMemberDto,
    file?: Express.Multer.File
  ) {
    try {
      const teamMember =
        await this.teamMemberRepository.findByEquityIdAndPublicId(equityId, id);

      if (!teamMember) {
        throw new NotFoundException();
      }

      const updateData: Partial<TeamMember> = {
        ...updateTeamMemberDto,
      };

      // Handle file upload if a file is provided - validation first approach
      if (file) {
        // Upload the new file first
        const uploadResult =
          await this.fileManagementService.uploadTeamMemberImage(file);

        updateData.memberPhoto = uploadResult.filePath;

        // Clean up old file after successful upload and validation
        if (teamMember.memberPhoto) {
          try {
            const fileExists = await this.fileManagementService.fileExists(
              teamMember.memberPhoto
            );
            if (fileExists) {
              await this.fileManagementService.deleteFile(
                teamMember.memberPhoto
              );
              this.logger.log(
                `Old team member photo deleted: ${teamMember.memberPhoto}`
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to delete old team member photo: ${teamMember.memberPhoto}. Error: ${errorMessage}`
            );
            // Don't throw here as the main update was successful
          }
        }
      }

      const updatedTeamMember = await this.teamMemberRepository.updateById(
        teamMember.id,
        updateData
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

  async delete(equityId: string, id: string) {
    try {
      const teamMember =
        await this.teamMemberRepository.findByEquityIdAndPublicId(equityId, id);

      if (!teamMember) {
        throw new NotFoundException();
      }

      // Clean up team member photo if exists
      if (teamMember.memberPhoto) {
        try {
          this.logger.log(
            `Attempting to delete team member photo: ${teamMember.memberPhoto}`
          );

          // Check if file exists before attempting deletion
          const fileExists = await this.fileManagementService.fileExists(
            teamMember.memberPhoto
          );
          if (!fileExists) {
            this.logger.warn(
              `Team member photo file does not exist: ${teamMember.memberPhoto}`
            );
          } else {
            await this.fileManagementService.deleteFile(teamMember.memberPhoto);
            this.logger.log(
              `Team member photo successfully deleted: ${teamMember.memberPhoto}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to delete team member photo: ${teamMember.memberPhoto}. Error: ${errorMessage}`,
            error
          );
          // Continue with record deletion even if file deletion fails
        }
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
}
