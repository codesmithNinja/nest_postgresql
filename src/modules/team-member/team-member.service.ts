import { Injectable, NotFoundException, Inject } from '@nestjs/common';
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
  constructor(
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    private i18nResponse: I18nResponseService,
    private fileManagementService: FileManagementService
  ) {}

  async findByEquityId(equityId: string) {
    const cacheKey = CacheUtil.getCampaignRelationsKey(equityId, 'teamMembers');

    const cachedData = CacheUtil.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const teamMembers =
      await this.teamMemberRepository.findByEquityId(equityId);

    const response = this.i18nResponse.success(
      'team_member.retrieved_successfully',
      teamMembers
    );

    CacheUtil.set(cacheKey, response, 300);
    return response;
  }

  async create(
    equityId: string,
    createTeamMemberDto: CreateTeamMemberDto,
    file: Express.Multer.File
  ) {
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

    return this.i18nResponse.created(
      'team_member.created_successfully',
      teamMember
    );
  }

  async update(
    equityId: string,
    id: string,
    updateTeamMemberDto: UpdateTeamMemberDto,
    file?: Express.Multer.File
  ) {
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
            await this.fileManagementService.deleteFile(teamMember.memberPhoto);
          }
        } catch {
          // Don't throw here as the main update was successful
        }
      }
    }

    const updatedTeamMember = await this.teamMemberRepository.updateById(
      teamMember.id,
      updateData
    );

    CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

    return this.i18nResponse.success(
      'team_member.updated_successfully',
      updatedTeamMember
    );
  }

  async delete(equityId: string, id: string) {
    const teamMember =
      await this.teamMemberRepository.findByEquityIdAndPublicId(equityId, id);

    if (!teamMember) {
      throw new NotFoundException();
    }

    // Clean up team member photo if exists
    if (teamMember.memberPhoto) {
      // Check if file exists before attempting deletion
      const fileExists = await this.fileManagementService.fileExists(
        teamMember.memberPhoto
      );
      if (fileExists) {
        await this.fileManagementService.deleteFile(teamMember.memberPhoto);
      }
    }

    await this.teamMemberRepository.deleteById(teamMember.id);

    CacheUtil.delPattern(`campaign:${equityId}:teamMembers`);

    return this.i18nResponse.success('team_member.deleted_successfully');
  }
}
