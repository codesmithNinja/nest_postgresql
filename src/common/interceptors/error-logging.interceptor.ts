import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string; email?: string } }>();
    const method: string = request?.method || '';
    const url: string = request?.url || '';
    const user: { id?: string; email?: string } | undefined = request?.user;
    const ip: string = request?.ip || '';
    const headers: Record<string, string | string[]> = request?.headers || {};

    return next.handle().pipe(
      catchError((error: unknown) => {
        // Log error details for audit trail
        const errorStatus =
          error && typeof error === 'object' && 'status' in error
            ? (error as { status: number }).status
            : 500;
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Unknown error';
        const errorStack =
          error instanceof Error ? error.stack : 'No stack trace available';

        this.logger.error(
          `${method} ${url} - ${errorStatus} - ${errorMessage}`,
          {
            userId: user?.id || null,
            userEmail: user?.email || null,
            ip,
            userAgent: Array.isArray(headers['user-agent'])
              ? headers['user-agent'][0]
              : headers['user-agent'] || '',
            timestamp: new Date().toISOString(),
            stack: errorStack,
          }
        );

        return throwError(() => error);
      })
    );
  }
}
