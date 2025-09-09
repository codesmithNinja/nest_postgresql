import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExtrasVideoDocument = ExtrasVideo & Document;

@Schema({
  timestamps: true,
  collection: 'extras_videos',
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
export class ExtrasVideo {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  videoTitle: string;

  @Prop({ required: true })
  videoDescription: string;

  @Prop({ required: true })
  equityId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExtrasVideoSchema = SchemaFactory.createForClass(ExtrasVideo);
ExtrasVideoSchema.index({ equityId: 1 });
