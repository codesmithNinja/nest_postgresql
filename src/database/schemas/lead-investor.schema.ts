import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadInvestorDocument = LeadInvestor & Document;

@Schema({
  timestamps: true,
  collection: 'lead_investors',
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
export class LeadInvestor {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId!: string;

  @Prop({ required: true })
  investorPhoto!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  investorType!: string;

  @Prop({ required: true })
  bio!: string;

  @Prop({ required: true })
  equityId!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadInvestorSchema = SchemaFactory.createForClass(LeadInvestor);
LeadInvestorSchema.index({ equityId: 1 });
