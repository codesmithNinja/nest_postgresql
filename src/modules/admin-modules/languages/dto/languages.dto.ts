import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  Length,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language name', minLength: 2, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Language folder name',
    minLength: 2,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  folder!: string;

  @ApiProperty({
    description: 'ISO 2-letter language code',
    minLength: 2,
    maxLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  iso2!: string;

  @ApiProperty({
    description: 'ISO 3-letter language code',
    minLength: 3,
    maxLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  iso3!: string;

  @ApiProperty({
    description: 'Language flag image file',
    type: 'string',
    format: 'binary',
  })
  flagImage?: string; // This will be set during file upload

  @ApiPropertyOptional({
    description: 'Text direction',
    enum: ['ltr', 'rtl'],
    default: 'ltr',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ltr', 'rtl'])
  direction?: 'ltr' | 'rtl' = 'ltr';

  @ApiPropertyOptional({
    description: 'Language status (active/inactive)',
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
      const result = lowerValue === 'true' || lowerValue === '1';
      return result;
    }
    const result = Boolean(value);
    return result;
  })
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Is default language',
    enum: ['YES', 'NO'],
    default: 'YES',
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO' = 'YES';

  publicId!: string; // Set internally
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({
    description: 'Language name',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Language folder name',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  folder?: string;

  @ApiPropertyOptional({
    description: 'ISO 2-letter language code',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  iso2?: string;

  @ApiPropertyOptional({
    description: 'ISO 3-letter language code',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  iso3?: string;

  @ApiPropertyOptional({
    description: 'Language flag image file',
    type: 'string',
    format: 'binary',
  })
  flagImage?: string; // This will be set during file upload

  @ApiPropertyOptional({
    description: 'Text direction',
    enum: ['ltr', 'rtl'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ltr', 'rtl'])
  direction?: 'ltr' | 'rtl';

  @ApiPropertyOptional({
    description: 'Language status (active/inactive)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined; // don't change existing value for update
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1';
    }
    return Boolean(value);
  })
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Is default language',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO';
}

export class LanguageFilterDto {
  @ApiPropertyOptional({ description: 'Filter by language name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by folder name' })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ description: 'Filter by ISO 2-letter code' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  iso2?: string;

  @ApiPropertyOptional({ description: 'Filter by ISO 3-letter code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  iso3?: string;

  @ApiPropertyOptional({
    description: 'Filter by text direction',
    enum: ['ltr', 'rtl'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ltr', 'rtl'])
  direction?: 'ltr' | 'rtl';

  @ApiPropertyOptional({
    description: 'Filter by default status',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO';

  @ApiPropertyOptional({
    description: 'Filter by status (active/inactive)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined; // no filter if not provided
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

export class BulkUpdateLanguageDto {
  @ApiProperty({
    description: 'Array of language public IDs to update',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  ids!: string[];

  @ApiProperty({
    description: 'Language status (active/inactive)',
  })
  @IsNotEmpty()
  @IsBoolean()
  status!: boolean;
}

export class BulkDeleteLanguageDto {
  @ApiProperty({
    description: 'Array of language public IDs to delete',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  ids!: string[];
}

export class LanguageResponseDto {
  @ApiProperty({ description: 'Language unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Language public identifier' })
  publicId!: string;

  @ApiProperty({ description: 'Language name' })
  name!: string;

  @ApiProperty({ description: 'Language folder name' })
  folder!: string;

  @ApiProperty({ description: 'ISO 2-letter language code' })
  iso2!: string;

  @ApiProperty({ description: 'ISO 3-letter language code' })
  iso3!: string;

  @ApiProperty({ description: 'Language flag image URL' })
  flagImage!: string;

  @ApiProperty({
    description: 'Text direction',
    enum: ['ltr', 'rtl'],
  })
  direction!: 'ltr' | 'rtl';

  @ApiProperty({ description: 'Language status (active/inactive)' })
  status!: boolean;

  @ApiProperty({
    description: 'Is default language',
    enum: ['YES', 'NO'],
  })
  isDefault!: 'YES' | 'NO';

  @ApiProperty({ description: 'Language creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}

export class LanguagePaginationResponseDto {
  @ApiProperty({
    description: 'List of languages',
    type: [LanguageResponseDto],
  })
  languages!: LanguageResponseDto[];

  @ApiProperty({ description: 'Total number of languages' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}
