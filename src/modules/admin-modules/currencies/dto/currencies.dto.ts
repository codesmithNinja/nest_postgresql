import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CreateCurrencyDto {
  @ApiProperty({
    description: 'Currency name',
    example: 'United States Dollar',
    minLength: 1,
    maxLength: 100,
    examples: {
      usd: {
        summary: 'US Dollar',
        description: 'United States Dollar currency',
        value: 'United States Dollar',
      },
      eur: {
        summary: 'Euro',
        description: 'European Union Euro currency',
        value: 'Euro',
      },
      gbp: {
        summary: 'British Pound',
        description: 'British Pound Sterling',
        value: 'British Pound Sterling',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'ISO currency code (3 letters)',
    example: 'USD',
    minLength: 3,
    maxLength: 3,
    examples: {
      usd: {
        summary: 'US Dollar Code',
        description: 'ISO code for US Dollar',
        value: 'USD',
      },
      eur: {
        summary: 'Euro Code',
        description: 'ISO code for Euro',
        value: 'EUR',
      },
      gbp: {
        summary: 'British Pound Code',
        description: 'ISO code for British Pound',
        value: 'GBP',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be exactly 3 uppercase letters',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value
  )
  code!: string;

  @ApiProperty({
    description: 'Currency symbol',
    example: '$',
    minLength: 1,
    maxLength: 10,
    examples: {
      usd: {
        summary: 'US Dollar Symbol',
        description: 'Symbol for US Dollar',
        value: '$',
      },
      eur: {
        summary: 'Euro Symbol',
        description: 'Symbol for Euro',
        value: '€',
      },
      gbp: {
        summary: 'British Pound Symbol',
        description: 'Symbol for British Pound',
        value: '£',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol!: string;

  @ApiPropertyOptional({
    description: 'Currency status (active/inactive)',
    example: true,
    default: true,
    examples: {
      active: {
        summary: 'Active Currency',
        description: 'Currency is available for use',
        value: true,
      },
      inactive: {
        summary: 'Inactive Currency',
        description: 'Currency is hidden from public view',
        value: false,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateCurrencyDto {
  @ApiPropertyOptional({
    description: 'Currency name',
    example: 'United States Dollar',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'ISO currency code (3 letters)',
    example: 'USD',
    minLength: 3,
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency code must be exactly 3 uppercase letters',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value
  )
  code?: string;

  @ApiPropertyOptional({
    description: 'Currency symbol',
    example: '$',
    minLength: 1,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({
    description: 'Currency status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class BulkCurrencyOperationDto {
  @ApiProperty({
    description: 'Array of public IDs to perform bulk operation on',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
    examples: {
      twoItems: {
        summary: 'Two Items',
        description: 'Bulk operation on two currencies',
        value: ['clm1234567890', 'clm0987654321'],
      },
      multipleItems: {
        summary: 'Multiple Items',
        description: 'Bulk operation on several currencies',
        value: [
          'clm1234567890',
          'clm0987654321',
          'clm1122334455',
          'clm5566778899',
        ],
      },
      singleItem: {
        summary: 'Single Item',
        description: 'Bulk operation on one item (still valid)',
        value: ['clm1234567890'],
      },
    },
  })
  @IsArray()
  @IsString({ each: true })
  publicIds!: string[];

  @ApiProperty({
    description: 'Bulk operation action to perform on selected items',
    example: 'activate',
    enum: ['activate', 'deactivate', 'delete'],
    examples: {
      activate: {
        summary: 'Activate Currencies',
        description: 'Make selected currencies active and visible',
        value: 'activate',
      },
      deactivate: {
        summary: 'Deactivate Currencies',
        description: 'Hide selected currencies from public view',
        value: 'deactivate',
      },
      delete: {
        summary: 'Delete Currencies',
        description: 'Delete selected currencies (only if useCount is 0)',
        value: 'delete',
      },
    },
  })
  @IsEnum(['activate', 'deactivate', 'delete'])
  action!: 'activate' | 'deactivate' | 'delete';
}

export class AdminCurrencyQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Include inactive currencies',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  includeInactive?: boolean = true;
}

export class CurrencyResponseDto {
  @ApiProperty({ description: 'Currency ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Currency name',
    example: 'United States Dollar',
  })
  name!: string;

  @ApiProperty({ description: 'ISO currency code', example: 'USD' })
  code!: string;

  @ApiProperty({ description: 'Currency symbol', example: '$' })
  symbol!: string;

  @ApiProperty({ description: 'Currency status', example: true })
  status!: boolean;

  @ApiProperty({ description: 'Use count', example: 5 })
  useCount!: number;

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

export class PaginatedCurrencyResponseDto {
  @ApiProperty({ type: [CurrencyResponseDto] })
  data!: CurrencyResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit!: number;
}

export class CurrencyListResponseDto {
  @ApiProperty({
    description: 'List of currencies',
    type: [CurrencyResponseDto],
  })
  currencies!: CurrencyResponseDto[];

  @ApiProperty({
    description: 'Total count of currencies',
    example: 5,
  })
  count!: number;
}

export class CurrencyErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Currency not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'CURRENCY_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}
