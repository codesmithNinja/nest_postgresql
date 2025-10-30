import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrencyDocument = Currency & Document;

@Schema({
  timestamps: true,
  collection: 'currencies',
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
export class Currency {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    uppercase: true,
    maxlength: 3,
    trim: true,
  })
  code!: string;

  @Prop({ required: true, trim: true })
  symbol!: string;

  @Prop({ default: true })
  status!: boolean;

  @Prop({ default: 0, min: 0 })
  useCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);

// Unique indexes
CurrencySchema.index({ publicId: 1 }, { unique: true });
CurrencySchema.index({ name: 1 }, { unique: true });
CurrencySchema.index({ code: 1 }, { unique: true });

// Additional indexes for performance optimization
CurrencySchema.index({ symbol: 1 });
CurrencySchema.index({ status: 1 });
CurrencySchema.index({ useCount: 1 });
CurrencySchema.index({ createdAt: 1 });

// Compound indexes for performance
CurrencySchema.index({ status: 1, createdAt: -1 });
