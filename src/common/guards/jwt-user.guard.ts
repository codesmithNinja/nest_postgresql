import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class JwtUserGuard extends AuthGuard('jwt') {
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

  handleRequest<TUser = any>(
    err: Error | null,
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | false,
    info: unknown,
    context: ExecutionContext
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }

    // Add additional context to user object
    const request = context.switchToHttp().getRequest<Request>();
    return {
      ...user,
      ip: request.socket.remoteAddress || '',
      userAgent: request.headers['user-agent'] || '',
    } as TUser;
  }
}
