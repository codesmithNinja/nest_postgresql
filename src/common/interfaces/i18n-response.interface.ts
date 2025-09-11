export interface I18nResponseOptions {
  key: string;
  args?: Record<string, string | number>;
  lang?: string;
}

export interface TranslatedApiResponse<T = unknown> {
  success: boolean;
  message: string;
  messageKey?: string;
  statusCode: number;
  data?: T;
  timestamp: string;
}

export interface TranslatedErrorResponse {
  success: false;
  message: string;
  messageKey?: string;
  statusCode: number;
  timestamp: string;
  error?: string;
}
