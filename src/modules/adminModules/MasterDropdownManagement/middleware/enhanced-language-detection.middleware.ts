import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LanguageDetectionService } from '../utils/language-detection.service';

interface RequestWithLanguage extends Request {
  language?: string;
  i18nLang?: string;
  detectedLanguageCode?: string;
  detectedLanguageFallbacks?: string[];
}

@Injectable()
export class EnhancedLanguageDetectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(
    EnhancedLanguageDetectionMiddleware.name
  );

  constructor(
    private readonly languageDetectionService: LanguageDetectionService
  ) {}

  use(req: RequestWithLanguage, res: Response, next: NextFunction): void {
    try {
      // Detect language from request
      const detectedLanguageCode =
        this.languageDetectionService.detectLanguageFromRequest(req);

      // Set detected language in request
      this.languageDetectionService.setLanguageInRequest(
        req,
        detectedLanguageCode
      );

      // Generate fallback chain
      const fallbackChain =
        this.languageDetectionService.getLanguageFallbackChain(
          detectedLanguageCode
        );
      req.detectedLanguageFallbacks = fallbackChain;

      // Log detection for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Language detected: ${detectedLanguageCode}, fallbacks: ${fallbackChain.join(', ')}`
        );
      }

      next();
    } catch (error) {
      this.logger.warn('Error in language detection middleware:', error);

      // Set default values on error
      req.detectedLanguageCode = 'en';
      req.language = 'en';
      req.i18nLang = 'en';
      req.detectedLanguageFallbacks = ['en'];

      next();
    }
  }
}
