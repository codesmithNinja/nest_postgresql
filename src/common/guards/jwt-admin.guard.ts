import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Admin } from '../../database/entities/admin.entity';

@Injectable()
export class JwtAdminGuard extends AuthGuard('admin-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<
    TAdmin = Pick<Admin, 'id' | 'email' | 'firstName' | 'lastName'> & {
      ip: string;
      userAgent: string;
    },
  >(
    err: Error | null,
    admin: Pick<Admin, 'id' | 'email' | 'firstName' | 'lastName'> | false,
    info: unknown,
    context: ExecutionContext
  ): TAdmin {
    if (err || !admin) {
      throw err || new UnauthorizedException('Unauthorized');
    }

    // Add additional context to admin object
    const request = context.switchToHttp().getRequest<Request>();
    return {
      ...admin,
      ip: request.socket.remoteAddress || '',
      userAgent: request.headers['user-agent'] || '',
    } as TAdmin;
  }
}
