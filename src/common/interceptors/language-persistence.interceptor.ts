import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface RequestWithLanguage extends Request {
  language?: string;
  i18nLang?: string;
}

@Injectable()
export class LanguagePersistenceInterceptor implements NestInterceptor {
  private static languageStore = new Map<string, string>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithLanguage>();

    const sessionId = this.getSessionId(request);
    const queryLang = request.query.lang as string;

    if (queryLang) {
      LanguagePersistenceInterceptor.languageStore.set(sessionId, queryLang);
      request.language = queryLang;
    } else {
      const storedLang =
        LanguagePersistenceInterceptor.languageStore.get(sessionId);
      if (storedLang) {
        request.language = storedLang;
      }
    }

    const finalLang = request.language || 'en';
    request.i18nLang = finalLang;

    return next.handle();
  }

  private getSessionId(request: RequestWithLanguage): string {
    const authHeader = request.headers.authorization;
    const userAgent = request.headers['user-agent'];
    const ip = request.ip || request.connection.remoteAddress || 'unknown';

    return `${ip}-${userAgent}-${authHeader || 'anonymous'}`;
  }
}
