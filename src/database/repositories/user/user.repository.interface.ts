import { IRepository } from '../../../common/interfaces/repository.interface';
import { User } from '../../entities/user.entity';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findBySlug(slug: string): Promise<User | null>;
  findByActivationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  activateUser(id: string): Promise<User>;
  deactivateUser(id: string): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
