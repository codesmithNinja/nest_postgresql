import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({
    description: 'Language name',
    example: 'Spanish',
    minLength: 2,
    maxLength: 50,
    examples: {
      english: {
        summary: 'English Language',
        description: 'Create English language',
        value: 'English',
      },
      spanish: {
        summary: 'Spanish Language',
        description: 'Create Spanish language',
        value: 'Español',
      },
      french: {
        summary: 'French Language',
        description: 'Create French language',
        value: 'Français',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: 'Language code (ISO 639-1 standard)',
    example: 'es',
    minLength: 2,
    maxLength: 5,
    examples: {
      english: {
        summary: 'English Code',
        description: 'ISO code for English',
        value: 'en',
      },
      spanish: {
        summary: 'Spanish Code',
        description: 'ISO code for Spanish',
        value: 'es',
      },
      french: {
        summary: 'French Code',
        description: 'ISO code for French',
        value: 'fr',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  code!: string;

  @ApiPropertyOptional({
    description: 'Text direction (Left-to-Right or Right-to-Left)',
    example: 'ltr',
    enum: ['ltr', 'rtl'],
    default: 'ltr',
    examples: {
      leftToRight: {
        summary: 'Left to Right',
        description: 'Most languages including English, Spanish, French',
        value: 'ltr',
      },
      rightToLeft: {
        summary: 'Right to Left',
        description: 'Languages like Arabic, Hebrew',
        value: 'rtl',
      },
    },
  })
  @IsOptional()
  @IsEnum(['ltr', 'rtl'])
  direction?: string;

  @ApiPropertyOptional({
    description: 'Flag image URL or path',
    example: 'https://flagcdn.com/w320/es.png',
    examples: {
      cdnUrl: {
        summary: 'CDN Flag URL',
        description: 'External CDN flag image',
        value: 'https://flagcdn.com/w320/es.png',
      },
      localPath: {
        summary: 'Local Flag Path',
        description: 'Local server flag image',
        value: '/uploads/flags/spanish-flag.png',
      },
    },
  })
  @IsOptional()
  @IsString()
  flagImage?: string;

  @ApiPropertyOptional({
    description: 'Is this the default language for the system',
    example: 'NO',
    enum: ['YES', 'NO'],
    default: 'NO',
    examples: {
      default: {
        summary: 'Set as Default',
        description: 'Make this the default system language',
        value: 'YES',
      },
      notDefault: {
        summary: 'Not Default',
        description: 'Regular language option',
        value: 'NO',
      },
    },
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'])
  isDefault?: string;

  @ApiPropertyOptional({
    description: 'Language status (active/inactive)',
    example: true,
    default: true,
    examples: {
      active: {
        summary: 'Active Language',
        description: 'Language is available for use',
        value: true,
      },
      inactive: {
        summary: 'Inactive Language',
        description: 'Language is disabled',
        value: false,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({
    description: 'Language name',
    example: 'English',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Language code (ISO 639-1)',
    example: 'en',
    minLength: 2,
    maxLength: 5,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  code?: string;

  @ApiPropertyOptional({
    description: 'Text direction',
    example: 'ltr',
    enum: ['ltr', 'rtl'],
  })
  @IsOptional()
  @IsEnum(['ltr', 'rtl'])
  direction?: string;

  @ApiPropertyOptional({
    description: 'Flag image URL',
    example: 'https://example.com/flags/en.png',
  })
  @IsOptional()
  @IsString()
  flagImage?: string;

  @ApiPropertyOptional({
    description: 'Is default language',
    example: 'NO',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'])
  isDefault?: string;

  @ApiPropertyOptional({
    description: 'Language status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class LanguageResponseDto {
  @ApiProperty({ description: 'Language ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({ description: 'Language name', example: 'English' })
  name!: string;

  @ApiProperty({ description: 'Language code', example: 'en' })
  code!: string;

  @ApiProperty({ description: 'Text direction', example: 'ltr' })
  direction!: string;

  @ApiPropertyOptional({
    description: 'Flag image URL',
    example: 'https://example.com/flags/en.png',
  })
  flagImage?: string;

  @ApiProperty({ description: 'Is default language', example: 'NO' })
  isDefault!: string;

  @ApiProperty({ description: 'Language status', example: true })
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
