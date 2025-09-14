import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { ITeamMemberRepository } from '../../../common/interfaces/campaign-repository.interface';
import {
  TeamMember,
  TeamMemberDocument,
} from '../../schemas/team-member.schema';
import { TeamMember as TeamMemberEntity } from '../../entities/team-member.entity';

@Injectable()
export class TeamMemberMongoRepository
  extends MongoRepository<TeamMemberDocument, TeamMemberEntity>
  implements ITeamMemberRepository
{
  constructor(
    @InjectModel(TeamMember.name)
    protected readonly model: Model<TeamMemberDocument>
  ) {
    super(model);
  }

  // Method overloads to handle both nullable and non-nullable cases
  protected toEntity(doc: TeamMemberDocument): TeamMemberEntity;
  protected toEntity(doc: TeamMemberDocument | null): TeamMemberEntity | null;
  protected toEntity(doc: TeamMemberDocument | null): TeamMemberEntity | null {
    if (!doc) return null;
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      memberPhoto: (obj.memberPhoto as string) || '',
      name: (obj.name as string) || '',
      role: (obj.role as string) || '',
      email: (obj.email as string) || '',
      bio: (obj.bio as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<TeamMemberEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<TeamMemberEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs
      .map((doc) => this.toEntity(doc))
      .filter((entity): entity is TeamMemberEntity => entity !== null);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<TeamMemberEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return this.toEntity(doc);
  }
}
