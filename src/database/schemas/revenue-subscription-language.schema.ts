import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RevenueSubscriptionLanguageDocument = RevenueSubscriptionLanguage &
  Document;

@Schema({
  timestamps: true,
  collection: 'revenue_subscription_languages',
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
export class RevenueSubscriptionLanguage {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'RevenueSubscription' })
  mainSubscriptionId!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Language' })
  languageId!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RevenueSubscriptionLanguageSchema = SchemaFactory.createForClass(
  RevenueSubscriptionLanguage
);

// Unique indexes
RevenueSubscriptionLanguageSchema.index({ publicId: 1 }, { unique: true });
RevenueSubscriptionLanguageSchema.index(
  { mainSubscriptionId: 1, languageId: 1 },
  { unique: true }
); // Composite unique constraint

// Additional indexes for performance optimization
RevenueSubscriptionLanguageSchema.index({ mainSubscriptionId: 1 });
RevenueSubscriptionLanguageSchema.index({ languageId: 1 });
RevenueSubscriptionLanguageSchema.index({ createdAt: 1 });
