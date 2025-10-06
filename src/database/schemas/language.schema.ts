import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LanguageDocument = Language & Document;

@Schema({
  timestamps: true,
  collection: 'languages',
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
export class Language {
  id?: string;

  @Prop({ required: true, unique: true })
  publicId!: string;

  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  code!: string;

  @Prop({ default: 'ltr', enum: ['ltr', 'rtl'] })
  direction!: string;

  @Prop()
  flagImage?: string;

  @Prop({ default: 'NO', enum: ['YES', 'NO'] })
  isDefault!: string;

  @Prop({ default: true })
  status!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);

// Indexes for performance optimization
LanguageSchema.index({ code: 1 });
LanguageSchema.index({ isDefault: 1 });
LanguageSchema.index({ status: 1 });
LanguageSchema.index({ status: 1, isDefault: 1 });
LanguageSchema.index({ publicId: 1 }, { unique: true });
