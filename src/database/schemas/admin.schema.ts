import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({
  timestamps: true,
  collection: 'admins',
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
export class Admin {
  id?: string;

  @Prop({ required: true, unique: true })
  publicId!: string;

  @Prop({ required: true, trim: true, maxlength: 40, minlength: 3 })
  firstName!: string;

  @Prop({ required: true, trim: true, maxlength: 40, minlength: 3 })
  lastName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop()
  photo?: string;

  @Prop({ required: true, trim: true })
  password!: string;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  loginIpAddress?: string;

  @Prop()
  currentLoginDateTime?: Date;

  @Prop()
  lastLoginDateTime?: Date;

  @Prop({ default: false })
  twoFactorAuthVerified!: boolean;

  @Prop()
  twoFactorSecretKey?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Indexes for performance optimization
// Note: email and publicId already have unique indexes from schema definition
AdminSchema.index({ firstName: 1 });
AdminSchema.index({ lastName: 1 });
AdminSchema.index({ active: 1 });
AdminSchema.index({ active: 1, _id: 1 });
AdminSchema.index({
  firstName: 1,
  lastName: 1,
  email: 1,
  _id: 1,
});
