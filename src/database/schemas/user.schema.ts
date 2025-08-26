import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  ActiveStatus,
  NotificationStatus,
} from '../../common/enums/database-type.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true, sparse: true })
  slug?: string;

  @Prop()
  photo?: string;

  @Prop()
  coverPhoto?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  userLocation?: string;

  @Prop()
  zipcode?: string;

  @Prop()
  kycStatus?: string;

  @Prop()
  kycReferenceId?: string;

  @Prop()
  aboutYourself?: string;

  @Prop({ type: [{ title: String, url: String }], default: [] })
  outsideLinks?: { title: string; url: string }[];

  @Prop()
  userTypeId?: string;

  @Prop({ enum: ActiveStatus, default: ActiveStatus.PENDING })
  active: ActiveStatus;

  @Prop({ default: 'no' })
  enableTwoFactorAuth: string;

  @Prop({ default: 'no' })
  appliedBytwoFactorAuth: string;

  @Prop({ default: 'yes' })
  twoFactorAuthVerified: string;

  @Prop()
  twoFactorSecretKey?: string;

  @Prop()
  signupIpAddress?: string;

  @Prop()
  loginIpAddress?: string;

  @Prop()
  uniqueGoogleId?: string;

  @Prop()
  uniqueLinkedInId?: string;

  @Prop()
  uniqueFacebookId?: string;

  @Prop()
  uniqueTwitterId?: string;

  @Prop()
  achCustomerId?: string;

  @Prop()
  achAccountId?: string;

  @Prop()
  achAccountStatus?: string;

  @Prop()
  isAdmin?: string;

  @Prop()
  accountActivationToken?: string;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  walletId?: string;

  @Prop()
  mangoPayOwnerId?: string;

  @Prop()
  mangoPayOwnerWalletId?: string;

  @Prop()
  plaidDwollaCustomerId?: string;

  @Prop()
  plaidDwollFundingSourceId?: string;

  @Prop()
  plaidDwollFundingSourceStatus?: string;

  @Prop()
  plaidDwollaKYCStatus?: string;

  @Prop()
  globalSocketId?: string;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.YES })
  enableNotification: NotificationStatus;

  @Prop()
  notificationLanguageId?: string;

  @Prop()
  walletAddress?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ active: 1 });
UserSchema.index({ firstName: 1 });
UserSchema.index({ lastName: 1 });
UserSchema.index({ signupIpAddress: 1 });
UserSchema.index({ userTypeId: 1 });
UserSchema.index({ active: 1, _id: 1 });
UserSchema.index({
  firstName: 1,
  lastName: 1,
  email: 1,
  signupIpAddress: 1,
  _id: 1,
});
