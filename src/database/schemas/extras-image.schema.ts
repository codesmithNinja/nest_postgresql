import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExtrasImageDocument = ExtrasImage & Document;

@Schema({
  timestamps: true,
  collection: 'extras_images',
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
export class ExtrasImage {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  imageTitle: string;

  @Prop({ required: true })
  imageDescription: string;

  @Prop({ required: true })
  equityId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExtrasImageSchema = SchemaFactory.createForClass(ExtrasImage);
ExtrasImageSchema.index({ equityId: 1 });
