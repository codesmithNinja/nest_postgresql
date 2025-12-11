import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEmail,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateEmailTemplateDto {
  @ApiPropertyOptional({
    description:
      'Language ID for this email template (optional - defaults to default language)',
    example: 'clm1234567890',
    examples: {
      english: {
        summary: 'English Language',
        description: 'Create email template for English language',
        value: 'clm1234567890',
      },
      spanish: {
        summary: 'Spanish Language',
        description: 'Create email template for Spanish language',
        value: 'clm0987654321',
      },
      default: {
        summary: 'Default Language',
        description: 'Use default language when languageId is not specified',
        value: undefined,
      },
    },
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => {
    // Handle empty strings by converting to undefined for default fallback
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value as string | undefined;
  })
  languageId?: string;

  @ApiProperty({
    description: 'Email template task identifier (immutable after creation)',
    example: 'welcome_email',
    minLength: 1,
    maxLength: 100,
    examples: {
      welcome: {
        summary: 'Welcome Email',
        description: 'Email template for user welcome messages',
        value: 'welcome_email',
      },
      password_reset: {
        summary: 'Password Reset',
        description: 'Email template for password reset notifications',
        value: 'password_reset',
      },
      account_verification: {
        summary: 'Account Verification',
        description: 'Email template for account verification',
        value: 'account_verification',
      },
      investment_confirmation: {
        summary: 'Investment Confirmation',
        description: 'Email template for investment confirmations',
        value: 'investment_confirmation',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  task!: string;

  @ApiProperty({
    description: 'Sender email address',
    example: 'noreply@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
    examples: {
      noreply: {
        summary: 'No-Reply Email',
        description: 'Standard no-reply email address',
        value: 'noreply@equitycrowd.com',
      },
      support: {
        summary: 'Support Email',
        description: 'Support team email address',
        value: 'support@equitycrowd.com',
      },
      notifications: {
        summary: 'Notifications Email',
        description: 'Notifications email address',
        value: 'notifications@equitycrowd.com',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Sender email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  senderEmail!: string;

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'support@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
    examples: {
      support: {
        summary: 'Support Email',
        description: 'Support team email for replies',
        value: 'support@equitycrowd.com',
      },
      contact: {
        summary: 'Contact Email',
        description: 'General contact email for replies',
        value: 'contact@equitycrowd.com',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Reply email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  replyEmail!: string;

  @ApiProperty({
    description: 'Sender name displayed in email',
    example: 'EquityCrowd Team',
    minLength: 1,
    maxLength: 200,
    examples: {
      team: {
        summary: 'Team Name',
        description: 'General team name',
        value: 'EquityCrowd Team',
      },
      support: {
        summary: 'Support Team',
        description: 'Support team name',
        value: 'EquityCrowd Support',
      },
      notifications: {
        summary: 'Notifications',
        description: 'Automated notifications name',
        value: 'EquityCrowd Notifications',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  senderName!: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to EquityCrowd - Start Your Investment Journey',
    minLength: 1,
    maxLength: 500,
    examples: {
      welcome: {
        summary: 'Welcome Subject',
        description: 'Welcome email subject',
        value: 'Welcome to EquityCrowd - Start Your Investment Journey',
      },
      password_reset: {
        summary: 'Password Reset Subject',
        description: 'Password reset email subject',
        value: 'Reset Your EquityCrowd Password',
      },
      verification: {
        summary: 'Verification Subject',
        description: 'Account verification email subject',
        value: 'Verify Your EquityCrowd Account',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject!: string;

  @ApiProperty({
    description: 'Email message content (HTML supported)',
    example: `<html>
<body>
  <h1>Welcome to EquityCrowd!</h1>
  <p>Thank you for joining our investment platform. Start exploring opportunities today.</p>
  <a href="{{verification_link}}">Verify Your Account</a>
</body>
</html>`,
    examples: {
      welcome: {
        summary: 'Welcome Email Content',
        description: 'HTML content for welcome email',
        value: `<html><body><h1>Welcome!</h1><p>Thank you for joining EquityCrowd.</p></body></html>`,
      },
      password_reset: {
        summary: 'Password Reset Content',
        description: 'HTML content for password reset email',
        value: `<html><body><h1>Password Reset</h1><p>Click the link to reset your password: <a href="{{reset_link}}">Reset Password</a></p></body></html>`,
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({
    description: 'Email template status (active/inactive)',
    default: true,
    examples: {
      active: {
        summary: 'Active Template',
        description: 'Template is active and can be used',
        value: true,
      },
      inactive: {
        summary: 'Inactive Template',
        description: "Template is inactive and won't be used",
        value: false,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1';
    }
    return Boolean(value);
  })
  status?: boolean = true;
}

export class UpdateEmailTemplateDto {
  // Note: languageId and task are excluded because they are immutable after creation

  @ApiPropertyOptional({
    description: 'Sender email address',
    example: 'updated-noreply@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Sender email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  senderEmail?: string;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'updated-support@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Reply email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  replyEmail?: string;

  @ApiPropertyOptional({
    description: 'Sender name displayed in email',
    example: 'Updated EquityCrowd Team',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  senderName?: string;

  @ApiPropertyOptional({
    description: 'Email subject line',
    example: 'Updated - Welcome to EquityCrowd',
    minLength: 1,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Email message content (HTML supported)',
    example:
      '<html><body><h1>Updated Welcome!</h1><p>Thank you for joining EquityCrowd.</p></body></html>',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;

  @ApiPropertyOptional({
    description: 'Email template status (active/inactive)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1';
    }
    return Boolean(value);
  })
  status?: boolean;
}

export class EmailTemplateFilterDto {
  @ApiPropertyOptional({
    description:
      'Search keyword to filter across task, subject, and sender name',
    example: 'welcome',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by language ID.',
    example: 'clm1234567890',
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by language public ID. Cannot be used with languageId.',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'Language public ID must be a valid UUID v4' })
  publicId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (active/inactive)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1';
    }
    return Boolean(value);
  })
  status?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class BulkUpdateEmailTemplateDto {
  @ApiProperty({
    description: 'Array of email template public IDs to update',
    type: [String],
    example: [
      '627a5038-e5be-4135-9569-404d50c836c1',
      'e4113de7-5388-4f24-a58c-a22fb77d00a8',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];

  @ApiProperty({
    description: 'Email template status (active/inactive)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  status!: boolean;
}

export class BulkDeleteEmailTemplateDto {
  @ApiProperty({
    description: 'Array of email template public IDs to delete',
    type: [String],
    example: [
      '627a5038-e5be-4135-9569-404d50c836c1',
      'e4113de7-5388-4f24-a58c-a22fb77d00a8',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];
}

export class EmailTemplateResponseDto {
  @ApiProperty({
    description: 'Email template unique identifier',
    example: 'clm1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Email template public identifier',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Language ID or Language Object',
    oneOf: [
      { type: 'string', example: 'clm1234567890' },
      {
        type: 'object',
        properties: {
          publicId: {
            type: 'string',
            example: '017905f4-5c07-4e6e-969b-7394eb71efa9',
          },
          name: { type: 'string', example: 'English' },
        },
      },
    ],
  })
  languageId!: string | { publicId: string; name: string };

  @ApiProperty({
    description: 'Email template task identifier',
    example: 'welcome_email',
  })
  task!: string;

  @ApiProperty({
    description: 'Sender email address',
    example: 'noreply@equitycrowd.com',
  })
  senderEmail!: string;

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'support@equitycrowd.com',
  })
  replyEmail!: string;

  @ApiProperty({
    description: 'Sender name displayed in email',
    example: 'EquityCrowd Team',
  })
  senderName!: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to EquityCrowd - Start Your Investment Journey',
  })
  subject!: string;

  @ApiProperty({
    description: 'Email message content',
    example:
      '<html><body><h1>Welcome!</h1><p>Thank you for joining EquityCrowd.</p></body></html>',
  })
  message!: string;

  @ApiProperty({
    description: 'Email template status',
    example: true,
  })
  status!: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

export class EmailTemplatePaginationResponseDto {
  @ApiProperty({
    description: 'List of email templates',
    type: [EmailTemplateResponseDto],
  })
  emailTemplates!: EmailTemplateResponseDto[];

  @ApiProperty({ description: 'Total number of email templates' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

export class EmailTemplateListResponseDto {
  @ApiProperty({
    description: 'Email template data',
    type: EmailTemplateResponseDto,
  })
  emailTemplate!: EmailTemplateResponseDto;
}

export class EmailTemplateErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Email template not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'EMAIL_TEMPLATE_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}

export class CreateEmailTemplateForAllLanguagesDto {
  @ApiProperty({
    description: 'Email template task identifier (immutable after creation)',
    example: 'welcome_email',
    minLength: 1,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  task!: string;

  @ApiProperty({
    description: 'Sender email address',
    example: 'noreply@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Sender email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  senderEmail!: string;

  @ApiProperty({
    description: 'Reply-to email address',
    example: 'support@equitycrowd.com',
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Reply email must be a valid email address' })
  @MinLength(5)
  @MaxLength(255)
  replyEmail!: string;

  @ApiProperty({
    description: 'Sender name displayed in email',
    example: 'EquityCrowd Team',
    minLength: 1,
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  senderName!: string;

  @ApiProperty({
    description: 'Email subject line',
    example: 'Welcome to EquityCrowd - Start Your Investment Journey',
    minLength: 1,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject!: string;

  @ApiProperty({
    description: 'Email message content (HTML supported)',
    example:
      '<html><body><h1>Welcome!</h1><p>Thank you for joining EquityCrowd.</p></body></html>',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({
    description: 'Email template status (active/inactive)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1';
    }
    return Boolean(value);
  })
  status?: boolean = true;
}

export class AdminEmailTemplateQueryDto extends EmailTemplateFilterDto {
  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'task', 'subject', 'senderName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'task' | 'subject' | 'senderName' =
    'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class LanguageCodeParamDto {
  @ApiProperty({
    description: 'Language code (ISO 2-letter code)',
    example: 'en',
    minLength: 2,
    maxLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  languageCode!: string;
}

export class PublicEmailTemplateQueryDto {
  @ApiPropertyOptional({
    description:
      'Language code for filtering (optional - defaults to default language). Use 2-letter ISO codes like "en", "es", "fr", "ar". Cannot be used with publicId.',
    example: 'en',
    minLength: 2,
    maxLength: 2,
    examples: {
      english: {
        summary: 'English Templates',
        description: 'Get email templates for English language',
        value: 'en',
      },
      spanish: {
        summary: 'Spanish Templates',
        description: 'Get email templates for Spanish language',
        value: 'es',
      },
      french: {
        summary: 'French Templates',
        description: 'Get email templates for French language',
        value: 'fr',
      },
      arabic: {
        summary: 'Arabic Templates',
        description: 'Get email templates for Arabic language',
        value: 'ar',
      },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Language code must be at least 2 characters' })
  @MaxLength(2, { message: 'Language code must be at most 2 characters' })
  @Transform(({ value }: { value: unknown }) => {
    // Handle empty strings by converting to undefined for fallback
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return typeof value === 'string' ? value.toLowerCase() : undefined;
  })
  languageCode?: string;

  @ApiPropertyOptional({
    description:
      'Language public ID for filtering (optional - defaults to default language). Use full UUID format. Cannot be used with languageCode.',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
    examples: {
      english: {
        summary: 'English Language by PublicId',
        description: 'Get email templates for English language using publicId',
        value: '627a5038-e5be-4135-9569-404d50c836c1',
      },
      spanish: {
        summary: 'Spanish Language by PublicId',
        description: 'Get email templates for Spanish language using publicId',
        value: 'e4113de7-5388-4f24-a58c-a22fb77d00a8',
      },
    },
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'Language public ID must be a valid UUID v4' })
  @Transform(({ value }: { value: unknown }) => {
    // Handle empty strings by converting to undefined for fallback
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value as string | undefined;
  })
  publicId?: string;
}

export class PublicIdParamDto {
  @ApiProperty({
    description: 'Email template public ID',
    example: '627a5038-e5be-4135-9569-404d50c836c1',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID(4)
  publicId!: string;
}

export class EmailTemplateAdminQueryDto extends EmailTemplateFilterDto {
  @ApiPropertyOptional({
    description: 'Include inactive email templates',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  includeInactive?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Language ID for filtering (optional - Filter by defaults languages if not provided)',
    example: 'clm1234567890',
    examples: {
      specific: {
        summary: 'Specific Language',
        description: 'Filter for specific language ID',
        value: 'clm1234567890',
      },
      all: {
        summary: 'All Languages',
        description: 'Show all templates from default languages',
        value: undefined,
      },
    },
  })
  @IsOptional()
  @IsString()
  languageId?: string;
}

export class EmailTemplatePaginatedResponseDto {
  @ApiProperty({
    description: 'Array of email templates',
    type: [EmailTemplateResponseDto],
  })
  data!: EmailTemplateResponseDto[];

  @ApiProperty({
    description: 'Total number of email templates',
    example: 8,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit!: number;
}
