import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SliderDocument = Slider & Document;

@Schema({
  timestamps: true,
  collection: 'sliders',
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
export class Slider {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, unique: false })
  uniqueCode!: number;

  @Prop({ required: true, trim: true })
  sliderImage!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  buttonTitle!: string;

  @Prop({ required: true, trim: true })
  buttonLink!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Language' })
  languageId!: string;

  @Prop({ default: false })
  customColor!: boolean;

  @Prop({ required: true, default: '#000000', trim: true })
  titleColor!: string;

  @Prop({ required: true, default: '#000000', trim: true })
  descriptionColor!: string;

  @Prop({ required: true, default: '#FFFFFF', trim: true })
  buttonTitleColor!: string;

  @Prop({ required: true, default: '#007BFF', trim: true })
  buttonBackground!: string;

  // Second set of description and button fields
  @Prop({ required: false, trim: true })
  descriptionTwo!: string;

  @Prop({ required: false, trim: true })
  buttonTitleTwo!: string;

  @Prop({ required: false, trim: true })
  buttonLinkTwo!: string;

  @Prop({ required: true, default: '#666666', trim: true })
  descriptionTwoColor!: string;

  @Prop({ required: true, default: '#FFFFFF', trim: true })
  buttonTwoColor!: string;

  @Prop({ required: true, default: '#28A745', trim: true })
  buttonBackgroundTwo!: string;

  @Prop({ default: true })
  status!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SliderSchema = SchemaFactory.createForClass(Slider);

// Indexes for performance optimization
SliderSchema.index({ uniqueCode: 1 });
SliderSchema.index({ languageId: 1 });
SliderSchema.index({ status: 1 });
SliderSchema.index({ uniqueCode: 1, languageId: 1 }, { unique: true }); // Composite unique constraint
SliderSchema.index({ languageId: 1, status: 1 });
SliderSchema.index({ publicId: 1 }, { unique: true });
SliderSchema.index({ createdAt: 1 });
