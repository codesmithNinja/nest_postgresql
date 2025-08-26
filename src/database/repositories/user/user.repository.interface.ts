import { IRepository } from '../../../common/interfaces/repository.interface';
import { User } from '../../entities/user.entity';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

// MongoDB specific filter type that allows regex operators
export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface IUserRepository extends IRepository<User> {
  findById(id: string): Promise<User | null>;
  findMany(filter?: MongoQuery<User>, options?: QueryOptions): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findBySlug(slug: string): Promise<User | null>;
  findByActivationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  activateUser(id: string): Promise<User>;
  deactivateUser(id: string): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
