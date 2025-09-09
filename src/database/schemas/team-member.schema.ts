import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamMemberDocument = TeamMember & Document;

@Schema({
  timestamps: true,
  collection: 'team_members',
  toJSON: {
    transform: function (
      _doc: unknown,
      ret: Record<string, unknown>
    ): Record<string, unknown> {
      const result: Record<string, unknown> = {
        ...ret,
        id: (ret._id as { toHexString: () => string }).toHexString(),
      };
      delete result._id;
      delete result.__v;
      return result;
    },
  },
})
export class TeamMember {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId: string;

  @Prop({ required: true })
  memberPhoto: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  bio: string;

  @Prop({ required: true })
  equityId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);
TeamMemberSchema.index({ equityId: 1 });
