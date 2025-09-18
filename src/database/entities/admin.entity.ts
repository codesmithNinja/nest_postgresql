export interface Admin {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  password: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active: boolean;
  loginIpAddress?: string;
  currentLoginDateTime?: Date;
  lastLoginDateTime?: Date;
  twoFactorAuthVerified: boolean;
  twoFactorSecretKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
