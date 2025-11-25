import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentGatewayDocument = PaymentGateway & Document;

export enum PaymentMode {
  SANDBOX = 'sandbox',
  LIVE = 'live',
}

@Schema({
  timestamps: true,
  collection: 'payment_gateways',
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
export class PaymentGateway {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  paymentSlug!: string;

  @Prop({
    required: true,
    enum: PaymentMode,
  })
  paymentMode!: PaymentMode;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  sandboxDetails!: Record<string, unknown>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  liveDetails!: Record<string, unknown>;

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ default: true })
  status!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentGatewaySchema =
  SchemaFactory.createForClass(PaymentGateway);

// Unique indexes
PaymentGatewaySchema.index({ publicId: 1 }, { unique: true });
// Note: paymentSlug unique index is automatically created by @Prop({ unique: true })

// Additional indexes for performance optimization
PaymentGatewaySchema.index({ title: 1 });
PaymentGatewaySchema.index({ status: 1 });
PaymentGatewaySchema.index({ isDefault: 1 });
PaymentGatewaySchema.index({ paymentMode: 1 });
PaymentGatewaySchema.index({ createdAt: 1 });

// Compound indexes for performance
PaymentGatewaySchema.index({ status: 1, isDefault: 1 });
PaymentGatewaySchema.index({ paymentSlug: 1, status: 1 });
PaymentGatewaySchema.index({ status: 1, createdAt: -1 });
