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

  @Prop({ required: true, trim: true, maxlength: 100, unique: true })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  folder!: string;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 2,
    unique: true,
  })
  iso2!: string;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 3,
    unique: true,
  })
  iso3!: string;

  @Prop({ required: true })
  flagImage!: string;

  @Prop({
    required: true,
    enum: ['ltr', 'rtl'],
    default: 'ltr',
    trim: true,
  })
  direction!: 'ltr' | 'rtl';

  @Prop({ required: true, default: true })
  status!: boolean;

  @Prop({
    required: true,
    enum: ['YES', 'NO'],
    default: 'YES',
  })
  isDefault!: 'YES' | 'NO';

  createdAt?: Date;
  updatedAt?: Date;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);

// Additional composite indexes for performance optimization
LanguageSchema.index({ folder: 1 });
LanguageSchema.index({ direction: 1 });
LanguageSchema.index({ status: 1 });
LanguageSchema.index({ isDefault: 1 });
LanguageSchema.index({ createdAt: -1 });
LanguageSchema.index({ name: 1, iso2: 1, iso3: 1 });
