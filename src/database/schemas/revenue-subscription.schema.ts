import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RevenueSubscriptionDocument = RevenueSubscription & Document;

@Schema({
  timestamps: true,
  collection: 'revenue_subscriptions',
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
export class RevenueSubscription {
  id?: string;

  @Prop({ required: true })
  publicId!: string;

  @Prop({
    required: true,
    enum: ['INVESTOR', 'SPONSOR'],
    uppercase: true,
    trim: true,
  })
  subscriptionType!: 'INVESTOR' | 'SPONSOR';

  @Prop({
    required: true,
    type: Number,
    min: 0,
  })
  amount!: number;

  @Prop({
    required: false,
    type: Number,
    min: 0,
  })
  maxInvestmentAllowed?: number;

  @Prop({
    required: false,
    type: Number,
    min: 0,
  })
  maxProjectAllowed?: number;

  @Prop({
    required: false,
    type: Number,
    min: 0,
  })
  maxProjectGoalLimit?: number;

  @Prop({ required: true, default: true })
  allowRefund!: boolean;

  @Prop({
    required: false,
    type: Number,
    min: 0,
  })
  allowRefundDays?: number;

  @Prop({ required: true, default: true })
  allowCancel!: boolean;

  @Prop({
    required: false,
    type: Number,
    min: 0,
  })
  allowCancelDays?: number;

  @Prop({
    required: false,
  })
  secondaryMarketAccess?: boolean;

  @Prop({ required: true, default: true })
  earlyBirdAccess!: boolean;

  @Prop({ required: true, default: 0, min: 0 })
  useCount!: number;

  @Prop({ required: true, default: true })
  status!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RevenueSubscriptionSchema =
  SchemaFactory.createForClass(RevenueSubscription);

// Unique indexes
RevenueSubscriptionSchema.index({ publicId: 1 }, { unique: true });

// Additional indexes for performance optimization
RevenueSubscriptionSchema.index({ subscriptionType: 1 });
RevenueSubscriptionSchema.index({ status: 1 });
RevenueSubscriptionSchema.index({ useCount: 1 });
RevenueSubscriptionSchema.index({ createdAt: 1 });

// Compound indexes for performance
RevenueSubscriptionSchema.index({ subscriptionType: 1, status: 1 });
RevenueSubscriptionSchema.index({ status: 1, createdAt: -1 });
