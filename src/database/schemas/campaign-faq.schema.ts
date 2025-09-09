import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignFaqDocument = CampaignFaq & Document;

@Schema({
  timestamps: true,
  collection: 'campaign_faqs',
  toJSON: {
    transform: function (
      _doc: unknown,
      ret: Record<string, unknown>
    ): Record<string, unknown> {
      if (ret._id) {
        ret.id = (ret._id as { toString: () => string }).toString();
        delete ret._id;
      }
      if (ret.__v !== undefined) {
        delete ret.__v;
      }
      return ret;
    },
  },
})
export class CampaignFaq {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId: string;

  @Prop()
  questionID?: string;

  @Prop()
  answer?: string;

  @Prop()
  customQuestion?: string;

  @Prop()
  customAnswer?: string;

  @Prop({ required: true })
  equityId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CampaignFaqSchema = SchemaFactory.createForClass(CampaignFaq);
CampaignFaqSchema.index({ equityId: 1 });
