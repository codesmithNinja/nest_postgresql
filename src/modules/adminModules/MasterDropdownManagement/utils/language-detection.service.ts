import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithLanguage extends Request {
  language?: string;
  i18nLang?: string;
  detectedLanguageCode?: string;
}

@Injectable()
export class LanguageDetectionService {
  private readonly logger = new Logger(LanguageDetectionService.name);

  detectLanguageFromRequest(request: RequestWithLanguage): string {
    try {
      // Priority order for language detection:
      // 1. Explicit language parameter from query
      // 2. Custom language header
      // 3. Accept-Language header
      // 4. Request.language (from existing interceptor)
      // 5. Request.i18nLang (from existing interceptor)
      // 6. Default to 'en'

      const queryLang = request.query.lang as string;
      if (queryLang && this.isValidLanguageCode(queryLang)) {
        this.logger.debug(`Language detected from query: ${queryLang}`);
        return queryLang.toLowerCase();
      }

      const customLangHeader = request.headers['x-language'] as string;
      if (customLangHeader && this.isValidLanguageCode(customLangHeader)) {
        this.logger.debug(
          `Language detected from X-Language header: ${customLangHeader}`
        );
        return customLangHeader.toLowerCase();
      }

      const acceptLanguage = request.headers['accept-language'];
      if (acceptLanguage) {
        const detectedLang = this.parseAcceptLanguageHeader(acceptLanguage);
        if (detectedLang) {
          this.logger.debug(
            `Language detected from Accept-Language header: ${detectedLang}`
          );
          return detectedLang;
        }
      }

      if (request.language && this.isValidLanguageCode(request.language)) {
        this.logger.debug(
          `Language detected from request.language: ${request.language}`
        );
        return request.language.toLowerCase();
      }

      if (request.i18nLang && this.isValidLanguageCode(request.i18nLang)) {
        this.logger.debug(
          `Language detected from request.i18nLang: ${request.i18nLang}`
        );
        return request.i18nLang.toLowerCase();
      }

      this.logger.debug('No language detected, defaulting to English');
      return 'en';
    } catch (error) {
      this.logger.warn('Error detecting language from request:', error);
      return 'en';
    }
  }

  private parseAcceptLanguageHeader(
    acceptLanguageHeader: string
  ): string | null {
    try {
      // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
      const languages = acceptLanguageHeader
        .split(',')
        .map((lang) => {
          const [code, qValue] = lang.trim().split(';');
          const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1;
          return {
            code: this.normalizeLanguageCode(code),
            quality,
          };
        })
        .filter((lang) => lang.code && this.isValidLanguageCode(lang.code))
        .sort((a, b) => b.quality - a.quality);

      return languages.length > 0 ? languages[0].code : null;
    } catch (error) {
      this.logger.warn('Error parsing Accept-Language header:', error);
      return null;
    }
  }

  private normalizeLanguageCode(code: string): string {
    if (!code) return '';

    // Extract primary language code (e.g., "en-US" -> "en")
    const primaryCode = code.split('-')[0].toLowerCase();
    return primaryCode;
  }

  private isValidLanguageCode(code: string): boolean {
    if (!code || typeof code !== 'string') return false;

    // Basic validation for ISO 639-1 language codes (2-3 characters)
    const cleanCode = code.trim().toLowerCase();
    return /^[a-z]{2,3}$/.test(cleanCode);
  }

  setLanguageInRequest(
    request: RequestWithLanguage,
    languageCode: string
  ): void {
    try {
      request.detectedLanguageCode = languageCode;
      request.language = languageCode;
      request.i18nLang = languageCode;
    } catch (error) {
      this.logger.warn('Error setting language in request:', error);
    }
  }

  getLanguageFromRequest(request: RequestWithLanguage): string {
    return (
      request.detectedLanguageCode ||
      request.language ||
      request.i18nLang ||
      'en'
    );
  }

  getSupportedLanguages(): string[] {
    return [
      'en', // English
      'es', // Spanish
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'ru', // Russian
      'zh', // Chinese
      'ja', // Japanese
      'ko', // Korean
      'ar', // Arabic
      'hi', // Hindi
      'tr', // Turkish
      'nl', // Dutch
      'sv', // Swedish
      'no', // Norwegian
      'da', // Danish
      'fi', // Finnish
      'pl', // Polish
      'cs', // Czech
      'hu', // Hungarian
      'ro', // Romanian
      'bg', // Bulgarian
      'hr', // Croatian
      'sk', // Slovak
      'sl', // Slovenian
      'et', // Estonian
      'lv', // Latvian
      'lt', // Lithuanian
      'el', // Greek
      'he', // Hebrew
      'th', // Thai
      'vi', // Vietnamese
      'id', // Indonesian
      'ms', // Malay
      'tl', // Filipino
      'uk', // Ukrainian
      'be', // Belarusian
      'mk', // Macedonian
      'sq', // Albanian
      'sr', // Serbian
      'bs', // Bosnian
      'me', // Montenegrin
    ];
  }

  isLanguageSupported(languageCode: string): boolean {
    const supportedLanguages = this.getSupportedLanguages();
    return supportedLanguages.includes(languageCode.toLowerCase());
  }

  getLanguageFallbackChain(languageCode: string): string[] {
    const normalizedCode = languageCode.toLowerCase();
    const fallbackChain = [normalizedCode];

    // Add common fallbacks
    if (normalizedCode !== 'en') {
      fallbackChain.push('en'); // English as universal fallback
    }

    return fallbackChain;
  }

  validateDropdownType(dropdownType: string): boolean {
    if (!dropdownType || typeof dropdownType !== 'string') return false;

    // Dropdown type validation - removed specific type list in favor of pattern matching

    const normalizedType = dropdownType.toLowerCase().trim();
    return (
      /^[a-z][a-z0-9_-]*$/.test(normalizedType) &&
      normalizedType.length >= 2 &&
      normalizedType.length <= 50
    );
  }

  normalizeDropdownType(dropdownType: string): string {
    return dropdownType.toLowerCase().trim();
  }
}
