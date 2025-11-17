import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MetaSettingDocument = MetaSetting & Document;

@Schema({
  timestamps: true,
  collection: 'meta_settings',
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
export class MetaSetting {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Language' })
  languageId!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  siteName!: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  metaTitle!: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  metaDescription!: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  metaKeyword!: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  ogTitle!: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  ogDescription!: string;

  @Prop({ required: true, trim: true })
  ogImage!: string;

  @Prop({
    required: true,
    enum: ['YES', 'NO'],
    default: 'NO',
  })
  isAIGeneratedImage!: 'YES' | 'NO';

  createdAt?: Date;
  updatedAt?: Date;
}

export const MetaSettingSchema = SchemaFactory.createForClass(MetaSetting);

// Indexes for performance optimization
MetaSettingSchema.index({ languageId: 1 }, { unique: true }); // One meta setting per language
MetaSettingSchema.index({ publicId: 1 }, { unique: true });
MetaSettingSchema.index({ createdAt: 1 });
