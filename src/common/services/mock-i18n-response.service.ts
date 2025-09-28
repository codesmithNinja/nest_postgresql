import { Injectable } from '@nestjs/common';

@Injectable()
export class MockI18nResponseService {
  translateMessage(key: string, options?: any): string {
    // Return the key as fallback until i18n is properly configured
    return key;
  }

  translateValidationErrors(errors: any[]): any[] {
    // Return errors as-is until i18n is properly configured
    return errors;
  }
}

@Injectable()
export class MockI18nService {
  t(key: string, options?: any): string {
    // Return the key as fallback until i18n is properly configured
    return key;
  }

  translate(key: string, options?: any): string {
    // Return the key as fallback until i18n is properly configured
    return key;
  }
}