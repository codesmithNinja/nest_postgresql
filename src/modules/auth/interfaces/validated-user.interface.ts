import { User } from '../../../database/entities/user.entity';

export type ValidatedUser = Omit<User, 'password'>;
