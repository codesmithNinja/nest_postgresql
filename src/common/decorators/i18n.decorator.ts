import { createParamDecorator } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

export const CurrentLanguage = createParamDecorator((): string => {
  const i18n = I18nContext.current();
  return i18n?.lang || 'en';
});

export const I18nLang = createParamDecorator(() => {
  return I18nContext.current();
});
