import {
  ActiveStatus,
  NotificationStatus,
} from '../../common/enums/database-type.enum';
import { NotificationLanguage, UserType } from '../../common/types/user.types';

export interface OutsideLink {
  title: string;
  url: string;
}

export interface User {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  slug?: string;
  photo?: string;
  coverPhoto?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  userLocation?: string;
  zipcode?: string;
  kycStatus?: string;
  kycReferenceId?: string;
  aboutYourself?: string;
  outsideLinks?: OutsideLink[];
  userTypeId?: string;
  userType?: UserType;
  active: ActiveStatus;
  enableTwoFactorAuth: string;
  appliedBytwoFactorAuth: string;
  twoFactorAuthVerified: string;
  twoFactorSecretKey?: string;
  signupIpAddress?: string;
  loginIpAddress?: string;
  currentLoginDateTime?: Date;
  lastLoginDateTime?: Date;
  uniqueGoogleId?: string;
  uniqueLinkedInId?: string;
  uniqueFacebookId?: string;
  uniqueTwitterId?: string;
  achCustomerId?: string;
  achAccountId?: string;
  achAccountStatus?: string;
  isAdmin?: string;
  accountActivationToken?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  walletId?: string;
  mangoPayOwnerId?: string;
  mangoPayOwnerWalletId?: string;
  plaidDwollaCustomerId?: string;
  plaidDwollFundingSourceId?: string;
  plaidDwollFundingSourceStatus?: string;
  plaidDwollaKYCStatus?: string;
  globalSocketId?: string;
  enableNotification: NotificationStatus;
  notificationLanguageId?: string;
  notificationLanguage?: NotificationLanguage;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
