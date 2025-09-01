import { User } from '../../../database/entities/user.entity';

export type UserProfileResponse = Omit<
  User,
  | 'password'
  | 'accountActivationToken'
  | 'passwordResetToken'
  | 'twoFactorSecretKey'
>;

export interface UserResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: UserProfileResponse;
  timestamp: string;
}
