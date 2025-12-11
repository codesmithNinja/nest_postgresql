import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayNotEmpty,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CreateSliderDto {
  @ApiProperty({
    description: 'Slider title',
    example: 'Discover Amazing Investment Opportunities',
    minLength: 1,
    maxLength: 200,
    examples: {
      investment: {
        summary: 'Investment Slider',
        description: 'Example for investment platform slider',
        value: 'Discover Amazing Investment Opportunities',
      },
      startup: {
        summary: 'Startup Slider',
        description: 'Example for startup showcase',
        value: 'Fund the Next Big Thing',
      },
      technology: {
        summary: 'Technology Slider',
        description: 'Example for technology platform',
        value: 'Innovative Solutions for Tomorrow',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Slider description',
    example:
      'Explore cutting-edge startups and investment opportunities that shape the future. Join thousands of investors who trust our platform.',
    minLength: 1,
    maxLength: 1000,
    examples: {
      investment: {
        summary: 'Investment Description',
        description: 'Example description for investment slider',
        value:
          'Explore cutting-edge startups and investment opportunities that shape the future. Join thousands of investors who trust our platform.',
      },
      startup: {
        summary: 'Startup Description',
        description: 'Example description for startup slider',
        value:
          'Support innovative entrepreneurs and be part of revolutionary ideas that will change the world.',
      },
      technology: {
        summary: 'Technology Description',
        description: 'Example description for technology slider',
        value:
          'Discover breakthrough technologies and solutions that are reshaping industries worldwide.',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description!: string;

  @ApiProperty({
    description: 'Button title/text',
    example: 'Get Started Now',
    minLength: 1,
    maxLength: 100,
    examples: {
      action: {
        summary: 'Action Button',
        description: 'Call-to-action button text',
        value: 'Get Started Now',
      },
      explore: {
        summary: 'Explore Button',
        description: 'Exploration button text',
        value: 'Explore Opportunities',
      },
      learn: {
        summary: 'Learn Button',
        description: 'Learning button text',
        value: 'Learn More',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  buttonTitle!: string;

  @ApiProperty({
    description: 'Button link/URL',
    example: 'https://example.com/opportunities',
    examples: {
      external: {
        summary: 'External Link',
        description: 'Link to external website',
        value: 'https://example.com/opportunities',
      },
      internal: {
        summary: 'Internal Link',
        description: 'Link to internal page',
        value: '/dashboard/investments',
      },
      signup: {
        summary: 'Signup Link',
        description: 'Link to registration page',
        value: '/auth/register',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  buttonLink!: string;

  @ApiPropertyOptional({
    description:
      'Language ID for this slider (optional - defaults to default language if not provided)',
    example: 'clm1234567890',
    examples: {
      english: {
        summary: 'English Language',
        description: 'Create slider in English',
        value: 'clm1234567890',
      },
      spanish: {
        summary: 'Spanish Language',
        description: 'Create slider in Spanish',
        value: 'clm0987654321',
      },
    },
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({
    description: 'Use custom colors for the slider elements',
    example: false,
    default: false,
    examples: {
      default: {
        summary: 'Default Colors',
        description: 'Use system default colors',
        value: false,
      },
      custom: {
        summary: 'Custom Colors',
        description: 'Use custom color scheme',
        value: true,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  customColor?: boolean = false;

  @ApiPropertyOptional({
    description: 'Title text color (hex color code)',
    example: '#000000',
    default: '#000000',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      black: {
        summary: 'Black Title',
        description: 'Black color for title text',
        value: '#000000',
      },
      white: {
        summary: 'White Title',
        description: 'White color for title text',
        value: '#FFFFFF',
      },
      blue: {
        summary: 'Blue Title',
        description: 'Blue color for title text',
        value: '#007BFF',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Title color must be a valid hex color code (e.g., #000000)',
  })
  titleColor?: string = '#000000';

  @ApiPropertyOptional({
    description: 'Description text color (hex color code)',
    example: '#666666',
    default: '#000000',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      gray: {
        summary: 'Gray Description',
        description: 'Gray color for description text',
        value: '#666666',
      },
      black: {
        summary: 'Black Description',
        description: 'Black color for description text',
        value: '#000000',
      },
      darkGray: {
        summary: 'Dark Gray Description',
        description: 'Dark gray color for description text',
        value: '#333333',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Description color must be a valid hex color code (e.g., #666666)',
  })
  descriptionColor?: string = '#000000';

  @ApiPropertyOptional({
    description: 'Button text color (hex color code)',
    example: '#FFFFFF',
    default: '#FFFFFF',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      white: {
        summary: 'White Button Text',
        description: 'White color for button text',
        value: '#FFFFFF',
      },
      black: {
        summary: 'Black Button Text',
        description: 'Black color for button text',
        value: '#000000',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Button title color must be a valid hex color code (e.g., #FFFFFF)',
  })
  buttonTitleColor?: string = '#FFFFFF';

  @ApiPropertyOptional({
    description: 'Button background color (hex color code)',
    example: '#007BFF',
    default: '#007BFF',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      blue: {
        summary: 'Blue Button',
        description: 'Blue background for button',
        value: '#007BFF',
      },
      green: {
        summary: 'Green Button',
        description: 'Green background for button',
        value: '#28A745',
      },
      red: {
        summary: 'Red Button',
        description: 'Red background for button',
        value: '#DC3545',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Button background color must be a valid hex color code (e.g., #007BFF)',
  })
  buttonBackground?: string = '#007BFF';

  // Second set of description and button fields
  @ApiPropertyOptional({
    description: 'Second slider description (optional)',
    example:
      'Additional information about our platform and investment opportunities for experienced investors.',
    minLength: 1,
    maxLength: 1000,
    examples: {
      additional: {
        summary: 'Additional Description',
        description: 'Extra description for more details',
        value:
          'Additional information about our platform and investment opportunities for experienced investors.',
      },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  descriptionTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button title/text (optional)',
    example: 'Learn More',
    minLength: 1,
    maxLength: 100,
    examples: {
      secondary: {
        summary: 'Secondary Button',
        description: 'Secondary call-to-action button text',
        value: 'Learn More',
      },
    },
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  buttonTitleTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button link/URL (optional)',
    example: '/learn-more',
    maxLength: 500,
    examples: {
      secondary: {
        summary: 'Secondary Link',
        description: 'Link for secondary button',
        value: '/learn-more',
      },
    },
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buttonLinkTwo?: string;

  @ApiPropertyOptional({
    description: 'Second description text color (hex color code)',
    example: '#666666',
    default: '#666666',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      gray: {
        summary: 'Gray Second Description',
        description: 'Gray color for second description text',
        value: '#666666',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second description color must be a valid hex color code (e.g., #666666)',
  })
  descriptionTwoColor?: string = '#666666';

  @ApiPropertyOptional({
    description: 'Second button text color (hex color code)',
    example: '#FFFFFF',
    default: '#FFFFFF',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      white: {
        summary: 'White Second Button Text',
        description: 'White color for second button text',
        value: '#FFFFFF',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second button text color must be a valid hex color code (e.g., #FFFFFF)',
  })
  buttonTwoColor?: string = '#FFFFFF';

  @ApiPropertyOptional({
    description: 'Second button background color (hex color code)',
    example: '#28A745',
    default: '#28A745',
    pattern: '^#[0-9A-F]{6}$',
    examples: {
      green: {
        summary: 'Green Second Button',
        description: 'Green background for second button',
        value: '#28A745',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second button background color must be a valid hex color code (e.g., #28A745)',
  })
  buttonBackgroundTwo?: string = '#28A745';

  @ApiPropertyOptional({
    description: 'Slider status (active/inactive)',
    example: true,
    default: true,
    examples: {
      active: {
        summary: 'Active Slider',
        description: 'Slider is visible to users',
        value: true,
      },
      inactive: {
        summary: 'Inactive Slider',
        description: 'Slider is hidden from users',
        value: false,
      },
    },
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status?: boolean = true;

  @ApiProperty({
    description: 'Slider image file',
    type: 'string',
    format: 'binary',
    examples: {
      image: {
        summary: 'Image File',
        description: 'Upload slider image (JPEG, PNG, WebP, SVG)',
      },
    },
  })
  sliderImage?: string; // This will be set during file upload processing
}

export class UpdateSliderDto {
  @ApiPropertyOptional({
    description: 'Slider title',
    example: 'Updated Amazing Investment Opportunities',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Slider description',
    example:
      'Updated description for cutting-edge startups and investment opportunities.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Button title/text',
    example: 'Explore Now',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  buttonTitle?: string;

  @ApiPropertyOptional({
    description: 'Button link/URL',
    example: 'https://example.com/updated-opportunities',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buttonLink?: string;

  @ApiPropertyOptional({
    description: 'Use custom colors for the slider elements',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  customColor?: boolean;

  @ApiPropertyOptional({
    description: 'Title text color (hex color code)',
    example: '#333333',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Title color must be a valid hex color code (e.g., #333333)',
  })
  titleColor?: string;

  @ApiPropertyOptional({
    description: 'Description text color (hex color code)',
    example: '#555555',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Description color must be a valid hex color code (e.g., #555555)',
  })
  descriptionColor?: string;

  @ApiPropertyOptional({
    description: 'Button text color (hex color code)',
    example: '#FFFFFF',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Button title color must be a valid hex color code (e.g., #FFFFFF)',
  })
  buttonTitleColor?: string;

  @ApiPropertyOptional({
    description: 'Button background color (hex color code)',
    example: '#007BFF',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Button background color must be a valid hex color code (e.g., #007BFF)',
  })
  buttonBackground?: string;

  // Second set of description and button fields
  @ApiPropertyOptional({
    description: 'Second slider description (optional)',
    example: 'Updated additional information about our platform.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  descriptionTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button title/text (optional)',
    example: 'Discover More',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  buttonTitleTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button link/URL (optional)',
    example: '/discover-more',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buttonLinkTwo?: string;

  @ApiPropertyOptional({
    description: 'Second description text color (hex color code)',
    example: '#666666',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second description color must be a valid hex color code (e.g., #666666)',
  })
  descriptionTwoColor?: string;

  @ApiPropertyOptional({
    description: 'Second button text color (hex color code)',
    example: '#FFFFFF',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second button text color must be a valid hex color code (e.g., #FFFFFF)',
  })
  buttonTwoColor?: string;

  @ApiPropertyOptional({
    description: 'Second button background color (hex color code)',
    example: '#28A745',
    pattern: '^#[0-9A-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message:
      'Second button background color must be a valid hex color code (e.g., #28A745)',
  })
  buttonBackgroundTwo?: string;

  @ApiPropertyOptional({
    description: 'Slider status (active/inactive)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Slider image file (optional - only if updating image)',
    type: 'string',
    format: 'binary',
  })
  sliderImage?: string; // This will be set during file upload processing
}

export class BulkUpdateSlidersDto {
  @ApiProperty({
    description: 'Array of slider public IDs to update',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];

  @ApiProperty({
    description: 'Slider status (active/inactive)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
  )
  status!: boolean;
}

export class BulkDeleteSlidersDto {
  @ApiProperty({
    description: 'Array of slider public IDs to delete',
    example: ['clm1234567890', 'clm0987654321', 'clm1122334455'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  publicIds!: string[];
}

export class SliderQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Include inactive sliders',
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
  })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({
    description:
      'Search keyword to filter across slider title, description, button titles, and secondary content',
    example: 'investment',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  search?: string;
}

export class SliderResponseDto {
  @ApiProperty({ description: 'Slider ID', example: 'clm1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
  })
  publicId!: string;

  @ApiProperty({ description: 'Unique 10-digit code', example: 1234567890 })
  uniqueCode!: number;

  @ApiProperty({
    description: 'Slider image URL',
    example: 'https://example.com/uploads/sliders/slider-image.jpg',
  })
  sliderImage!: string;

  @ApiProperty({
    description: 'Slider title',
    example: 'Discover Amazing Investment Opportunities',
  })
  title!: string;

  @ApiProperty({
    description: 'Slider description',
    example:
      'Explore cutting-edge startups and investment opportunities that shape the future.',
  })
  description!: string;

  @ApiProperty({
    description: 'Button title/text',
    example: 'Get Started Now',
  })
  buttonTitle!: string;

  @ApiProperty({
    description: 'Button link/URL',
    example: 'https://example.com/opportunities',
  })
  buttonLink!: string;

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
      flagImage: { type: 'string' },
    },
  })
  language?: {
    id: string;
    name: string;
    code: string;
    direction: string;
    flagImage?: string;
  };

  @ApiProperty({
    description: 'Use custom colors for the slider elements',
    example: false,
  })
  customColor!: boolean;

  @ApiProperty({
    description: 'Title text color (hex color code)',
    example: '#000000',
  })
  titleColor!: string;

  @ApiProperty({
    description: 'Description text color (hex color code)',
    example: '#666666',
  })
  descriptionColor!: string;

  @ApiProperty({
    description: 'Button text color (hex color code)',
    example: '#FFFFFF',
  })
  buttonTitleColor!: string;

  @ApiProperty({
    description: 'Button background color (hex color code)',
    example: '#007BFF',
  })
  buttonBackground!: string;

  @ApiPropertyOptional({
    description: 'Second slider description (optional)',
    example:
      'Additional information about our platform and investment opportunities for experienced investors.',
  })
  descriptionTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button title/text (optional)',
    example: 'Learn More',
  })
  buttonTitleTwo?: string;

  @ApiPropertyOptional({
    description: 'Second button link/URL (optional)',
    example: '/learn-more',
  })
  buttonLinkTwo?: string;

  @ApiProperty({
    description: 'Second description text color (hex color code)',
    example: '#666666',
  })
  descriptionTwoColor!: string;

  @ApiProperty({
    description: 'Second button text color (hex color code)',
    example: '#FFFFFF',
  })
  buttonTwoColor!: string;

  @ApiProperty({
    description: 'Second button background color (hex color code)',
    example: '#28A745',
  })
  buttonBackgroundTwo!: string;

  @ApiProperty({ description: 'Slider status', example: true })
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

export class PaginatedSliderResponseDto {
  @ApiProperty({ type: [SliderResponseDto] })
  data!: SliderResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Records per page', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages!: number;
}

export class SliderListResponseDto {
  @ApiProperty({
    description: 'List of sliders',
    type: [SliderResponseDto],
  })
  sliders!: SliderResponseDto[];

  @ApiProperty({
    description: 'Total count of sliders',
    example: 5,
  })
  count!: number;
}

export class SliderErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Slider not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'SLIDER_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}

export class BulkOperationResultDto {
  @ApiProperty({
    description: 'Number of affected records',
    example: 3,
  })
  count!: number;

  @ApiProperty({
    description: 'Success message',
    example: '3 sliders updated successfully',
  })
  message!: string;
}
