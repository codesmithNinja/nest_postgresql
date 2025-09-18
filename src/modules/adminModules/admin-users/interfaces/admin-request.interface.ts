import { Request } from 'express';

export interface AdminUser {
  id: string;
  email: string;
}

export interface RequestWithAdmin extends Request {
  user: AdminUser;
}
