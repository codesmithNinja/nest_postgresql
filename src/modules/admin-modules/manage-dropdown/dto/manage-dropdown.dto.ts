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
    description:
      'Language ID for this dropdown option (optional - defaults to default language if not provided)',
    example: 'clm1234567890',
    examples: {
      specific: {
        summary: 'Specific Language',
        description: 'Create for this specific language',
        value: 'clm1234567890',
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
    description:
      'Language ID for filtering (optional - defaults to default language if not provided)',
    example: 'clm1234567890',
    examples: {
      specific: {
        summary: 'Specific Language',
        description: 'Filter for specific language ID',
        value: 'clm1234567890',
      },
    },
  })
  @IsOptional()
  @IsString()
  languageId?: string;
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

  @ApiProperty({ description: 'Unique 10-digit code', example: 1234567890 })
  uniqueCode!: number;

  @ApiProperty({ description: 'Dropdown type', example: 'industry' })
  dropdownType!: string;

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

  @ApiPropertyOptional({
    description: 'Language details',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      code: { type: 'string' },
      direction: { type: 'string' },
      flag: { type: 'string' },
    },
  })
  language?: {
    id: string;
    name: string;
    code: string;
    direction: string;
    flag?: string;
  };

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

// DTOs to match settings pattern exactly
export class DropdownTypeParamDto {
  @ApiProperty({
    description: 'Dropdown type',
    example: 'industry',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Dropdown type must contain only letters, numbers, underscores, and hyphens',
  })
  dropdownType!: string;
}

export class DropdownTypeQueryDto {
  @ApiProperty({
    description: 'Dropdown type',
    example: 'industry',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Dropdown type must contain only letters, numbers, underscores, and hyphens',
  })
  dropdownType!: string;
}

export class ManageDropdownListResponseDto {
  @ApiProperty({
    description: 'List of dropdown options',
    type: [ManageDropdownResponseDto],
  })
  dropdowns!: ManageDropdownResponseDto[];

  @ApiProperty({
    description: 'Total count of dropdown options',
    example: 5,
  })
  count!: number;
}

export class ManageDropdownErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Dropdown options not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'DROPDOWN_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}
