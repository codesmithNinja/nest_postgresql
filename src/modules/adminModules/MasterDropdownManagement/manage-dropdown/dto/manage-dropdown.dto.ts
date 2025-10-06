import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../../common/dto/pagination.dto';
import { LanguageResponseDto } from '../../language/dto/language.dto';

export class CreateManageDropdownDto {
  @ApiProperty({
    description: 'Dropdown option name',
    example: 'Artificial Intelligence',
    minLength: 1,
    maxLength: 100,
    examples: {
      technology: {
        summary: 'Technology Industry',
        description: 'Example for industry dropdown',
        value: 'Artificial Intelligence',
      },
      healthcare: {
        summary: 'Healthcare Industry',
        description: 'Example for medical industry',
        value: 'Biotechnology',
      },
      finance: {
        summary: 'Finance Industry',
        description: 'Example for financial services',
        value: 'Cryptocurrency',
      },
      category: {
        summary: 'Category Option',
        description: 'Example for category dropdown',
        value: 'Premium',
      },
      status: {
        summary: 'Status Option',
        description: 'Example for status dropdown',
        value: 'Active',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Unique numeric code for the dropdown option',
    example: 1001,
    examples: {
      sequential: {
        summary: 'Sequential Code',
        description: 'Simple sequential numbering',
        value: 1001,
      },
      categorized: {
        summary: 'Categorized Code',
        description: 'Code based on category (1000s for industries)',
        value: 1050,
      },
    },
  })
  @IsOptional()
  @IsNumber()
  uniqueCode?: number;

  @ApiPropertyOptional({
    description: 'Is this the default option for this dropdown type',
    example: 'NO',
    enum: ['YES', 'NO'],
    examples: {
      default: {
        summary: 'Set as Default',
        description: 'Make this the default selection for this dropdown type',
        value: 'YES',
      },
      notDefault: {
        summary: 'Regular Option',
        description: 'Regular dropdown option',
        value: 'NO',
      },
    },
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'])
  isDefault?: string;

  @ApiPropertyOptional({
    description:
      'Language ID (if not provided, will create for ALL active languages automatically)',
    example: 'clm1234567890',
    examples: {
      specific: {
        summary: 'Specific Language',
        description: 'Create only for this language',
        value: 'clm1234567890',
      },
      autoDetect: {
        summary: 'Auto-Detect (Recommended)',
        description: 'Leave empty to create for all active languages',
        value: null,
      },
    },
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Dropdown option status (active/inactive)',
    example: true,
    default: true,
    examples: {
      active: {
        summary: 'Active Option',
        description: 'Option is available for selection',
        value: true,
      },
      inactive: {
        summary: 'Inactive Option',
        description: 'Option is hidden from public view',
        value: false,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateManageDropdownDto {
  @ApiPropertyOptional({
    description: 'Dropdown option name',
    example: 'Technology',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique code for the dropdown option',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  uniqueCode?: number;

  @ApiPropertyOptional({
    description: 'Is default option for this type',
    example: 'NO',
    enum: ['YES', 'NO'],
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'])
  isDefault?: string;

  @ApiPropertyOptional({
    description: 'Dropdown option status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class BulkOperationDto {
  @ApiProperty({
    description: 'Array of public IDs to perform bulk operation on',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
    examples: {
      twoItems: {
        summary: 'Two Items',
        description: 'Bulk operation on two dropdown options',
        value: ['clm1234567890', 'clm0987654321'],
      },
      multipleItems: {
        summary: 'Multiple Items',
        description: 'Bulk operation on several dropdown options',
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
        summary: 'Activate Options',
        description: 'Make selected dropdown options active and visible',
        value: 'activate',
      },
      deactivate: {
        summary: 'Deactivate Options',
        description: 'Hide selected dropdown options from public view',
        value: 'deactivate',
      },
      delete: {
        summary: 'Delete Options',
        description:
          'Soft delete selected dropdown options (sets status to false)',
        value: 'delete',
      },
    },
  })
  @IsEnum(['activate', 'deactivate', 'delete'])
  action!: 'activate' | 'deactivate' | 'delete';
}

export class AdminQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Include inactive options',
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
    description: 'Language code for filtering',
    example: 'en',
    examples: {
      english: {
        summary: 'English',
        description: 'Filter for English language options',
        value: 'en',
      },
      spanish: {
        summary: 'Spanish',
        description: 'Filter for Spanish language options',
        value: 'es',
      },
      french: {
        summary: 'French',
        description: 'Filter for French language options',
        value: 'fr',
      },
    },
  })
  @IsOptional()
  @IsString()
  lang?: string;
}

export class ManageDropdownResponseDto {
  @ApiProperty({ description: 'Dropdown ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({ description: 'Dropdown option name', example: 'Technology' })
  name!: string;

  @ApiPropertyOptional({ description: 'Unique code', example: 123 })
  uniqueCode?: number;

  @ApiProperty({ description: 'Dropdown type', example: 'industry' })
  dropdownType!: string;

  @ApiPropertyOptional({ description: 'Is default option', example: 'NO' })
  isDefault?: string;

  @ApiProperty({ description: 'Language details', type: LanguageResponseDto })
  languageId!: LanguageResponseDto;

  @ApiProperty({ description: 'Dropdown option status', example: true })
  status!: boolean;

  @ApiProperty({ description: 'Use count', example: 0 })
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

export class PaginatedManageDropdownResponseDto {
  @ApiProperty({ type: [ManageDropdownResponseDto] })
  data!: ManageDropdownResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit!: number;
}
