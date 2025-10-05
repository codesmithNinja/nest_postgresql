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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country name', minLength: 2, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'ISO 2-letter country code',
    minLength: 2,
    maxLength: 2,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  iso2!: string;

  @ApiProperty({
    description: 'ISO 3-letter country code',
    minLength: 3,
    maxLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  iso3!: string;

  @ApiProperty({
    description: 'Country flag file',
    type: 'string',
    format: 'binary',
  })
  flag?: string; // This will be set during file upload

  @ApiPropertyOptional({
    description: 'Is default country',
    enum: ['YES', 'NO'],
    default: 'NO',
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO' = 'NO';

  publicId!: string; // Set internally
}

export class UpdateCountryDto {
  @ApiPropertyOptional({
    description: 'Country name',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'ISO 2-letter country code',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  iso2?: string;

  @ApiPropertyOptional({
    description: 'ISO 3-letter country code',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  iso3?: string;

  @ApiPropertyOptional({
    description: 'Country flag file',
    type: 'string',
    format: 'binary',
  })
  flag?: string; // This will be set during file upload

  @ApiPropertyOptional({
    description: 'Is default country',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO';
}

export class CountryFilterDto {
  @ApiPropertyOptional({ description: 'Filter by country name' })
  @IsOptional()
  @IsString()
  name?: string;

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
    description: 'Filter by default status',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO';

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

export class BulkUpdateCountryDto {
  @ApiProperty({
    description: 'Array of country public IDs to update',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  ids!: string[];

  @ApiPropertyOptional({
    description: 'Is default country',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['YES', 'NO'])
  isDefault?: 'YES' | 'NO';
}

export class BulkDeleteCountryDto {
  @ApiProperty({
    description: 'Array of country public IDs to delete',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  ids!: string[];
}

export class CountryResponseDto {
  @ApiProperty({ description: 'Country unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Country public identifier' })
  publicId!: string;

  @ApiProperty({ description: 'Country name' })
  name!: string;

  @ApiProperty({ description: 'ISO 2-letter country code' })
  iso2!: string;

  @ApiProperty({ description: 'ISO 3-letter country code' })
  iso3!: string;

  @ApiProperty({ description: 'Country flag URL' })
  flag!: string;

  @ApiProperty({
    description: 'Is default country',
    enum: ['YES', 'NO'],
  })
  isDefault!: 'YES' | 'NO';

  @ApiProperty({ description: 'Number of times this country is used' })
  useCount!: number;

  @ApiProperty({ description: 'Country creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}

export class CountryPaginationResponseDto {
  @ApiProperty({
    description: 'List of countries',
    type: [CountryResponseDto],
  })
  countries!: CountryResponseDto[];

  @ApiProperty({ description: 'Total number of countries' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Number of countries affected' })
  count!: number;

  @ApiProperty({ description: 'Success message' })
  message!: string;
}
