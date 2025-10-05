import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CountryDocument = Country & Document;

@Schema({
  timestamps: true,
  collection: 'countries',
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
export class Country {
  id?: string;

  @Prop({ required: true, unique: true })
  publicId!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name!: string;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 2,
  })
  iso2!: string;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 3,
  })
  iso3!: string;

  @Prop({ required: true })
  flag!: string;

  @Prop({
    required: true,
    enum: ['YES', 'NO'],
    default: 'NO',
  })
  isDefault!: 'YES' | 'NO';

  @Prop({ required: true, default: true })
  status!: boolean;

  @Prop({ required: true, default: 0, min: 0 })
  useCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CountrySchema = SchemaFactory.createForClass(Country);

// Indexes for performance optimization
CountrySchema.index({ name: 1 });
CountrySchema.index({ iso2: 1 }, { unique: true });
CountrySchema.index({ iso3: 1 }, { unique: true });
CountrySchema.index({ isDefault: 1 });
CountrySchema.index({ status: 1 });
CountrySchema.index({ useCount: 1 });
CountrySchema.index({ createdAt: -1 });
CountrySchema.index({ name: 1, iso2: 1, iso3: 1 });
