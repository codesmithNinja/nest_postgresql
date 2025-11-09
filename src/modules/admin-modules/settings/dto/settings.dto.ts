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
    description:
      'Settings value - supports mixed data types (string, number, boolean)',
    examples: {
      string: {
        value: 'My Website',
        description: 'String value example',
      },
      number: {
        value: 1000,
        description: 'Number value example',
      },
      boolean: {
        value: true,
        description: 'Boolean value example',
      },
      filePath: {
        value: '/uploads/settings/logo.png',
        description: 'File path for uploaded files',
      },
    },
    oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
  })
  value!: string | number | boolean;

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

/**
 * Dynamic Settings DTO - Accepts ANY key-value pairs without validation
 *
 * This DTO is designed to handle completely dynamic settings for any groupType:
 * - site_setting: siteName, sitePrimaryColor, siteSecondaryColor, enableWebNotification, etc.
 * - amount_setting: Custom fields specific to amount configuration
 * - revenue_setting: Custom fields specific to revenue configuration
 * - email_setting: smtpHost, smtpPort, smtpUsername, smtpPassword, etc.
 * - api_setting: stripePublicKey, stripeSecretKey, plaidClientId, etc.
 * - social_setting: facebookAppId, googleClientId, linkedinClientId, etc.
 * - ANY_CUSTOM_GROUPTYPE: anyFieldName1, anyFieldName2, etc.
 *
 * Features:
 * - No validation decorators - accepts everything
 * - Undefined values converted to empty strings
 * - File uploads handled separately via @UploadedFiles()
 * - Mixed text + file uploads in single request
 * - Works with both Postman form-data and React binary uploads
 *
 * Examples:
 * - Text fields: siteName="My Site", customColor="#FF0000", anyField="value"
 * - File fields: siteLogo=[file], darkLogo=[file], customImage=[file]
 * - Edge cases: emptyField="", undefinedField=undefined (→ becomes "")
 */
export class DynamicSettingsDto {
  /**
   * Dynamic key-value pairs for settings - no predefined schema
   *
   * **🚀 DYNAMIC SETTINGS - Accept ANY field names with mixed data types**
   *
   * **✨ Mixed Data Type Support:**
   * - string: "My Website" → stored as string
   * - boolean: true/false → stored as actual boolean
   * - number: 1000 → stored as actual number
   * - undefined: undefined → converted to empty string ""
   *
   * **📂 Examples by groupType:**
   *
   * **site_setting:**
   * - siteName: "My Platform" (string)
   * - enableFeatures: true (boolean)
   * - maxUsers: 1000 (number)
   * - primaryColor: "#FF5722" (string)
   *
   * **amount_setting:**
   * - minimumInvestment: 100 (number)
   * - maximumInvestment: 10000 (number)
   * - defaultCurrency: "USD" (string)
   * - feePercentage: 2.5 (number)
   *
   * **revenue_setting:**
   * - revenueSharePercentage: 15.5 (number)
   * - payoutFrequency: "monthly" (string)
   * - minimumThreshold: 1000 (number)
   * - autoPayouts: true (boolean)
   *
   * **Custom fields:**
   * - customField1: "any value" (string)
   * - special-key-name: 42 (number)
   * - any_field_name_you_want: false (boolean)
   *
   * **📁 File Upload Support:**
   * Files are handled separately via @UploadedFiles() and stored as file paths
   */
  [key: string]: unknown;
}
