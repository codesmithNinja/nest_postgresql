import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExtrasDocumentDocument = ExtrasDocument & Document;

@Schema({
  timestamps: true,
  collection: 'extras_documents',
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
export class ExtrasDocument {
  id?: string;

  @Prop({
    required: true,
    unique: true,
    default: () => new Types.ObjectId().toString(),
  })
  publicId: string;

  @Prop({ required: true })
  documentUrl: string;

  @Prop({ required: true })
  documentTitle: string;

  @Prop({ required: true })
  equityId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExtrasDocumentSchema =
  SchemaFactory.createForClass(ExtrasDocument);
ExtrasDocumentSchema.index({ equityId: 1 });
