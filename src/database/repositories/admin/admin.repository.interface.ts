import {
  IRepository,
  QueryOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { Admin } from '../../entities/admin.entity';

export type MongoQuery<T> = {
  [P in keyof T]?: T[P] | { $regex: string; $options: string };
};

export interface IAdminRepository extends IRepository<Admin> {
  findById(id: string): Promise<Admin | null>;
  findMany(
    filter?: MongoQuery<Admin>,
    options?: QueryOptions
  ): Promise<Admin[]>;
  update(id: string, data: Partial<Admin>): Promise<Admin>;
  findByEmail(email: string): Promise<Admin | null>;
  findByPublicId(publicId: string): Promise<Admin | null>;
  findByResetToken(token: string): Promise<Admin | null>;
  updatePassword(id: string, hashedPassword: string): Promise<Admin>;
  findWithPagination(
    filter?: MongoQuery<Admin>,
    options?: QueryOptions
  ): Promise<PaginatedResult<Admin>>;
}

export const ADMIN_REPOSITORY = 'ADMIN_REPOSITORY';
