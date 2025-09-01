import { Request } from 'express';
import { User } from '../../database/entities/user.entity';

export interface UserType {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationLanguage {
  id: string;
  name: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RequestWithUser extends Request {
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> & {
    [key: string]: string | undefined;
  };
}
