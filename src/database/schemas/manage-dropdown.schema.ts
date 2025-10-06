import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ManageDropdownDocument = ManageDropdown & Document;

@Schema({
  timestamps: true,
  collection: 'manage_dropdowns',
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
export class ManageDropdown {
  id?: string;

  @Prop({ required: true, unique: true })
  publicId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  uniqueCode?: number;

  @Prop({ required: true, lowercase: true, trim: true })
  dropdownType!: string;

  @Prop({ trim: true })
  countryShortCode?: string;

  @Prop({ enum: ['YES', 'NO'] })
  isDefault?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Language' })
  languageId!: string;

  @Prop({ default: true })
  status!: boolean;

  @Prop({ default: 0 })
  useCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ManageDropdownSchema =
  SchemaFactory.createForClass(ManageDropdown);

// Indexes for performance optimization
ManageDropdownSchema.index({ dropdownType: 1 });
ManageDropdownSchema.index({ languageId: 1 });
ManageDropdownSchema.index({ status: 1 });
ManageDropdownSchema.index({ dropdownType: 1, languageId: 1 });
ManageDropdownSchema.index({ dropdownType: 1, status: 1 });
ManageDropdownSchema.index({ countryShortCode: 1 });
ManageDropdownSchema.index({ publicId: 1 }, { unique: true });
