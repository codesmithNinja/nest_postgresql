import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailTemplateDocument = EmailTemplate & Document;

@Schema({
  timestamps: true,
  collection: 'email_templates',
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
export class EmailTemplate {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Language' })
  languageId!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  task!: string; // Immutable after creation (e.g., "welcome_email", "password_reset")

  @Prop({ required: true, trim: true, maxlength: 255 })
  senderEmail!: string;

  @Prop({ required: true, trim: true, maxlength: 255 })
  replyEmail!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  senderName!: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  subject!: string;

  @Prop({ required: true, type: String })
  message!: string; // HTML content allowed, no maxlength for flexibility

  @Prop({ required: true, default: true })
  status!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

// Indexes for performance optimization
EmailTemplateSchema.index({ task: 1, languageId: 1 }, { unique: true }); // One email template per task per language
EmailTemplateSchema.index({ publicId: 1 }, { unique: true });
EmailTemplateSchema.index({ task: 1 });
EmailTemplateSchema.index({ status: 1 });
EmailTemplateSchema.index({ status: 1, languageId: 1 });
EmailTemplateSchema.index({ createdAt: 1 });
