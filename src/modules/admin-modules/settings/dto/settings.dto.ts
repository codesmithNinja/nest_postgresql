import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordType } from '../../../../common/enums/database-type.enum';

export class CreateSettingsDto {
  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Group type must contain only letters, numbers, underscores, and hyphens',
  })
  groupType!: string;

  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
    default: RecordType.STRING,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @ApiProperty({
    description: 'Settings key',
    example: 'site_name',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Key must contain only letters, numbers, underscores, and hyphens',
  })
  key!: string;

  @ApiProperty({
    description: 'Settings value',
    example: 'My Website',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @ApiPropertyOptional({
    description: 'Settings value',
    example: 'Updated Website Name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  value?: string;
}

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Settings ID',
    example: 'clxxxxxxxxxxxxxxx',
  })
  id!: string;

  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
  })
  groupType!: string;

  @ApiProperty({
    description: 'Record type',
    enum: RecordType,
    example: RecordType.STRING,
  })
  recordType!: RecordType;

  @ApiProperty({
    description: 'Settings key',
    example: 'site_name',
  })
  key!: string;

  @ApiProperty({
    description: 'Settings value',
    example: 'My Website',
  })
  value!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-01T10:00:00Z',
  })
  updatedAt!: Date;
}

export class GroupTypeParamDto {
  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Group type must contain only letters, numbers, underscores, and hyphens',
  })
  groupType!: string;
}

export class BulkSettingsDto {
  @ApiProperty({
    description: 'Array of settings to create or update',
    type: [CreateSettingsDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSettingsDto)
  settings!: CreateSettingsDto[];
}

export class SettingsListResponseDto {
  @ApiProperty({
    description: 'List of settings',
    type: [SettingsResponseDto],
  })
  settings!: SettingsResponseDto[];

  @ApiProperty({
    description: 'Group type',
    example: 'site_setting',
  })
  groupType!: string;

  @ApiProperty({
    description: 'Total count of settings',
    example: 5,
  })
  count!: number;
}

export class FileUploadSettingsDto {
  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
    default: RecordType.FILE,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;
}

export class SettingsErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Settings not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'SETTINGS_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}

export class CreateUpdateSettingsFormDto {
  // Site Settings
  @ApiPropertyOptional({
    description: 'Site name',
    example: 'Equity Crowdfunding',
  })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Site primary color',
    example: '#5c46ca',
  })
  @IsOptional()
  @IsString()
  sitePrimaryColor?: string;

  @ApiPropertyOptional({
    description: 'Site secondary color',
    example: '#b5ace2',
  })
  @IsOptional()
  @IsString()
  siteSecondaryColor?: string;

  @ApiPropertyOptional({
    description: 'Google Analytics code',
    example: 'GA-XXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  googleAnalyticsCode?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'normal-payment',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Editor type',
    example: 'ckeditorMode',
  })
  @IsOptional()
  @IsString()
  editorType?: string;

  @ApiPropertyOptional({
    description: 'TinyMCE AI URL',
    example: 'https://api.tinymce.com/ai',
  })
  @IsOptional()
  @IsString()
  tinymceAIURL?: string;

  @ApiPropertyOptional({
    description: 'TinyMCE AI Token',
    example: 'tinymceToken',
  })
  @IsOptional()
  @IsString()
  tinymceAIToken?: string;

  @ApiPropertyOptional({
    description: 'Enable secondary market',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  enableSecondaryMarket?: string;

  @ApiPropertyOptional({
    description: 'Enable web notification',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  enableWebNotification?: string;

  @ApiPropertyOptional({
    description: 'Enable share certificate',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  enableShareCertificate?: string;

  @ApiPropertyOptional({
    description: 'Two factor auth required for admin',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  twoFactorAuthRequiredAdmin?: string;

  @ApiPropertyOptional({
    description: 'Two factor auth required for front',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  twoFactorAuthRequiredFront?: string;

  @ApiPropertyOptional({
    description: 'Only admin can create campaign',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  onlyAdminCreateCampaign?: string;

  @ApiPropertyOptional({
    description: 'AI Assistant enabled',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  AIAssintant?: string;

  @ApiPropertyOptional({
    description: 'Enable SSN masking',
    example: 'YES',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['YES', 'NO'])
  enableSSNMasking?: string;

  // Email Settings
  @ApiPropertyOptional({
    description: 'SMTP host',
    example: 'smtp.gmail.com',
  })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({
    description: 'SMTP port',
    example: '587',
  })
  @IsOptional()
  @IsString()
  smtpPort?: string;

  @ApiPropertyOptional({
    description: 'SMTP username',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  smtpUsername?: string;

  @ApiPropertyOptional({
    description: 'SMTP password',
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional({
    description: 'SMTP encryption',
    example: 'tls',
    enum: ['ssl', 'tls', 'none'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ssl', 'tls', 'none'])
  smtpEncryption?: string;

  // API Settings
  @ApiPropertyOptional({
    description: 'Stripe public key',
    example: 'pk_test_xxxxxxxx',
  })
  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @ApiPropertyOptional({
    description: 'Stripe secret key',
    example: 'sk_test_xxxxxxxx',
  })
  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @ApiPropertyOptional({
    description: 'Plaid client ID',
    example: 'plaid_client_id',
  })
  @IsOptional()
  @IsString()
  plaidClientId?: string;

  @ApiPropertyOptional({
    description: 'Plaid secret',
    example: 'plaid_secret',
  })
  @IsOptional()
  @IsString()
  plaidSecret?: string;

  @ApiPropertyOptional({
    description: 'AWS access key',
    example: 'AKIAXXXXXXXXXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  awsAccessKey?: string;

  @ApiPropertyOptional({
    description: 'AWS secret key',
    example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  awsSecretKey?: string;

  @ApiPropertyOptional({
    description: 'AWS region',
    example: 'us-east-1',
  })
  @IsOptional()
  @IsString()
  awsRegion?: string;

  @ApiPropertyOptional({
    description: 'AWS S3 bucket',
    example: 'my-bucket',
  })
  @IsOptional()
  @IsString()
  awsS3Bucket?: string;

  // Social Media Settings
  @ApiPropertyOptional({
    description: 'Facebook app ID',
    example: 'facebook_app_id',
  })
  @IsOptional()
  @IsString()
  facebookAppId?: string;

  @ApiPropertyOptional({
    description: 'Google client ID',
    example: 'google_client_id',
  })
  @IsOptional()
  @IsString()
  googleClientId?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn client ID',
    example: 'linkedin_client_id',
  })
  @IsOptional()
  @IsString()
  linkedinClientId?: string;

  // Other dynamic settings - allow any string fields
  // Note: Index signature allows additional properties for ValidationPipe compatibility
  [key: string]: unknown;
}
