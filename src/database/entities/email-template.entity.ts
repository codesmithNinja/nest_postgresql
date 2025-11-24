import { Language } from './language.entity';

export interface MinimalLanguage {
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
}

export interface EmailTemplate {
  id: string;
  publicId: string;
  languageId: string | Language | MinimalLanguage;
  language?: Language;
  task: string; // Immutable after creation (e.g., "welcome_email", "password_reset")
  senderEmail: string;
  replyEmail: string;
  senderName: string;
  subject: string;
  message: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateDto {
  languageId?: string; // Optional, defaults to default language
  task: string; // Required during creation, immutable thereafter
  senderEmail: string;
  replyEmail: string;
  senderName: string;
  subject: string;
  message: string;
  status?: boolean; // Optional, defaults to true
}

export interface UpdateEmailTemplateDto {
  // Note: task is excluded because it's immutable after creation
  senderEmail?: string;
  replyEmail?: string;
  senderName?: string;
  subject?: string;
  message?: string;
  status?: boolean;
}

export interface EmailTemplateWithLanguage extends EmailTemplate {
  language: Language;
}

export interface BulkUpdateEmailTemplateDto {
  publicIds: string[];
  status: boolean;
}
