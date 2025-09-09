import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import {
  ITeamMemberRepository,
  TEAM_MEMBER_REPOSITORY,
} from '../../common/interfaces/campaign-repository.interface';
import { ResponseHandler } from '../../common/utils/response.handler';
import { CacheUtil } from '../../common/utils/cache.util';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import { TeamMember } from '../../database/entities/team-member.entity';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class TeamMemberService {
  private readonly logger = new Logger(TeamMemberService.name);

  constructor(
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository
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

      const response = ResponseHandler.success(
        'Team members retrieved successfully',
        200,
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

      return ResponseHandler.created(
        'Team member created successfully',
        teamMember
      );
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
        throw new NotFoundException('Team member not found');
      }

      const updatedTeamMember = await this.teamMemberRepository.updateById(
        teamMember.id,
        updateTeamMemberDto
      );

      CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

      this.logger.log(`Team member updated successfully: ${id}`);

      return ResponseHandler.success(
        'Team member updated successfully',
        200,
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
        throw new NotFoundException('Team member not found');
      }

      await this.teamMemberRepository.deleteById(teamMember.id);

      CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

      this.logger.log(`Team member deleted successfully: ${id}`);

      return ResponseHandler.success('Team member deleted successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting team member: ${errorMessage}`);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File, prefix: string) {
    try {
      const uploadDir = join(process.cwd(), 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filename = FileUploadUtil.generateFileName(
        file.originalname,
        prefix
      );
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, file.buffer);

      const fileUrl = `${process.env.API_URL}/uploads/${filename}`;

      return ResponseHandler.success('File uploaded successfully', 201, {
        filename,
        url: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw error;
    }
  }
}
