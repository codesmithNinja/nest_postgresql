import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMetaSettingDto {
  @ApiProperty({
    description: 'Site name for meta settings',
    example: 'EquityCrowd - Investment Platform',
    minLength: 1,
    maxLength: 200,
    examples: {
      main: {
        summary: 'Main Site Name',
        description: 'Primary site name for the platform',
        value: 'EquityCrowd - Investment Platform',
      },
      business: {
        summary: 'Business Site Name',
        description: 'Business-focused site name',
        value: 'EquityCrowd Business - Investment Solutions',
      },
      startup: {
        summary: 'Startup Site Name',
        description: 'Startup-focused site name',
        value: 'EquityCrowd Startup Hub',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  siteName!: string;

  @ApiProperty({
    description:
      'Meta title for SEO (appears in browser tab and search results)',
    example:
      'EquityCrowd - Discover Investment Opportunities | Crowdfunding Platform',
    minLength: 1,
    maxLength: 300,
    examples: {
      homepage: {
        summary: 'Homepage Meta Title',
        description: 'Meta title for the homepage',
        value:
          'EquityCrowd - Discover Investment Opportunities | Crowdfunding Platform',
      },
      investors: {
        summary: 'Investors Meta Title',
        description: 'Meta title for investor-focused content',
        value: 'Invest in Startups - EquityCrowd Investment Platform',
      },
      entrepreneurs: {
        summary: 'Entrepreneurs Meta Title',
        description: 'Meta title for entrepreneur-focused content',
        value: 'Raise Capital for Your Startup - EquityCrowd Funding Platform',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  metaTitle!: string;

  @ApiProperty({
    description: 'Meta description for SEO (appears in search results)',
    example:
      'Join thousands of investors and entrepreneurs on EquityCrowd. Discover innovative startups, invest in promising ventures, or raise capital for your business. Secure, regulated, and trusted investment platform.',
    minLength: 1,
    maxLength: 500,
    examples: {
      homepage: {
        summary: 'Homepage Meta Description',
        description: 'Meta description for the homepage',
        value:
          'Join thousands of investors and entrepreneurs on EquityCrowd. Discover innovative startups, invest in promising ventures, or raise capital for your business. Secure, regulated, and trusted investment platform.',
      },
      investors: {
        summary: 'Investors Meta Description',
        description: 'Meta description for investor-focused content',
        value:
          'Explore vetted startup investment opportunities. Diversify your portfolio with equity crowdfunding on EquityCrowd. Minimum investments from $100. Join our community of smart investors today.',
      },
      entrepreneurs: {
        summary: 'Entrepreneurs Meta Description',
        description: 'Meta description for entrepreneur-focused content',
        value:
          'Raise capital for your startup through equity crowdfunding. Access thousands of investors, get expert support, and grow your business with EquityCrowd funding platform.',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  metaDescription!: string;

  @ApiProperty({
    description: 'Meta keywords for SEO (comma-separated list)',
    example:
      'equity crowdfunding, startup investment, venture capital, fundraising, investment platform, startup funding, angel investors, crowdfunding, equity investment, business investment',
    minLength: 1,
    maxLength: 1000,
    examples: {
      general: {
        summary: 'General Keywords',
        description: 'General keywords for the platform',
        value:
          'equity crowdfunding, startup investment, venture capital, fundraising, investment platform, startup funding, angel investors, crowdfunding, equity investment, business investment',
      },
      investors: {
        summary: 'Investor Keywords',
        description: 'Keywords targeting investors',
        value:
          'startup investment, equity investment, angel investors, venture capital, investment opportunities, portfolio diversification, investment platform, crowdfunding investments',
      },
      entrepreneurs: {
        summary: 'Entrepreneur Keywords',
        description: 'Keywords targeting entrepreneurs',
        value:
          'startup funding, raise capital, equity crowdfunding, fundraising platform, venture funding, business funding, startup investment, entrepreneur funding',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  metaKeyword!: string;

  @ApiProperty({
    description: 'OpenGraph title for social media sharing',
    example: 'EquityCrowd - The Future of Startup Investment',
    minLength: 1,
    maxLength: 300,
    examples: {
      engaging: {
        summary: 'Engaging OG Title',
        description: 'Engaging title for social media',
        value: 'EquityCrowd - The Future of Startup Investment',
      },
      informative: {
        summary: 'Informative OG Title',
        description: 'Informative title for social media',
        value: "Invest in Tomorrow's Success Stories Today - EquityCrowd",
      },
      call_to_action: {
        summary: 'Call-to-Action OG Title',
        description: 'Action-oriented title for social media',
        value: 'Start Your Investment Journey - Join EquityCrowd Now',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  ogTitle!: string;

  @ApiProperty({
    description: 'OpenGraph description for social media sharing',
    example:
      'Discover the next unicorn startup or raise capital for your innovative business. EquityCrowd connects visionary entrepreneurs with smart investors in a secure, regulated environment.',
    minLength: 1,
    maxLength: 500,
    examples: {
      investors: {
        summary: 'Investor-focused OG Description',
        description: 'Description targeting investors on social media',
        value:
          'Discover the next unicorn startup or raise capital for your innovative business. EquityCrowd connects visionary entrepreneurs with smart investors in a secure, regulated environment.',
      },
      entrepreneurs: {
        summary: 'Entrepreneur-focused OG Description',
        description: 'Description targeting entrepreneurs on social media',
        value:
          'Turn your startup vision into reality. Raise capital from a community of investors who believe in innovation. Join hundreds of successful campaigns on EquityCrowd.',
      },
      general: {
        summary: 'General OG Description',
        description: 'General description for social media',
        value:
          'The leading equity crowdfunding platform where innovation meets investment. Join thousands of investors and entrepreneurs building the future together.',
      },
    },
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  ogDescription!: string;

  @ApiPropertyOptional({
    description: 'Whether the OG image is AI-generated',
    enum: ['YES', 'NO'],
    example: 'NO',
    default: 'NO',
    examples: {
      manual: {
        summary: 'Manual Image',
        description: 'Image created manually or uploaded by user',
        value: 'NO',
      },
      ai_generated: {
        summary: 'AI Generated Image',
        description: 'Image generated using AI tools',
        value: 'YES',
      },
    },
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'], {
    message: 'isAIGeneratedImage must be either YES or NO',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : 'NO'
  )
  isAIGeneratedImage?: 'YES' | 'NO' = 'NO';

  @ApiProperty({
    description: 'OpenGraph image file for social media sharing',
    type: 'string',
    format: 'binary',
    examples: {
      image: {
        summary: 'OG Image File',
        description:
          'Upload OpenGraph image for social media (JPEG, PNG, WebP, SVG)',
      },
    },
  })
  ogImage?: string; // This will be set during file upload processing

  @ApiPropertyOptional({
    description:
      'Language ID for this meta setting (optional - defaults to default language if not provided)',
    example: 'clm1234567890',
    examples: {
      english: {
        summary: 'English Language',
        description: 'Create meta setting for English language',
        value: 'clm1234567890',
      },
      spanish: {
        summary: 'Spanish Language',
        description: 'Create meta setting for Spanish language',
        value: 'clm0987654321',
      },
    },
  })
  @IsOptional()
  @IsString()
  languageId?: string;
}

export class UpdateMetaSettingDto {
  @ApiPropertyOptional({
    description: 'Site name for meta settings',
    example: 'EquityCrowd Updated - Investment Platform',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Meta title for SEO',
    example: 'Updated EquityCrowd - Discover Investment Opportunities',
    minLength: 1,
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Meta description for SEO',
    example: 'Updated description for EquityCrowd investment platform.',
    minLength: 1,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Meta keywords for SEO',
    example: 'updated keywords, equity crowdfunding, startup investment',
    minLength: 1,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  metaKeyword?: string;

  @ApiPropertyOptional({
    description: 'OpenGraph title for social media sharing',
    example: 'Updated EquityCrowd - The Future of Investment',
    minLength: 1,
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  ogTitle?: string;

  @ApiPropertyOptional({
    description: 'OpenGraph description for social media sharing',
    example: 'Updated description for social media sharing.',
    minLength: 1,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  ogDescription?: string;

  @ApiPropertyOptional({
    description: 'Whether the OG image is AI-generated',
    enum: ['YES', 'NO'],
    example: 'YES',
  })
  @IsOptional()
  @IsEnum(['YES', 'NO'], {
    message: 'isAIGeneratedImage must be either YES or NO',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : 'NO'
  )
  isAIGeneratedImage?: 'YES' | 'NO';

  @ApiPropertyOptional({
    description: 'OpenGraph image file (optional - only if updating image)',
    type: 'string',
    format: 'binary',
  })
  ogImage?: string; // This will be set during file upload processing
}

export class MetaSettingResponseDto {
  @ApiProperty({
    description: 'Meta setting ID',
    example: 'clm1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Public ID for API access',
    example: 'clm1234567890',
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
          folder: { type: 'string', example: 'en' },
          iso2: { type: 'string', example: 'EN' },
          iso3: { type: 'string', example: 'ENG' },
        },
      },
    ],
  })
  languageId!:
    | string
    | {
        publicId: string;
        name: string;
      };

  @ApiPropertyOptional({
    description: 'Language details',
    properties: {
      publicId: { type: 'string' },
      name: { type: 'string' },
    },
  })
  language?: {
    publicId: string;
    name: string;
  };

  @ApiProperty({
    description: 'Site name',
    example: 'EquityCrowd - Investment Platform',
  })
  siteName!: string;

  @ApiProperty({
    description: 'Meta title for SEO',
    example:
      'EquityCrowd - Discover Investment Opportunities | Crowdfunding Platform',
  })
  metaTitle!: string;

  @ApiProperty({
    description: 'Meta description for SEO',
    example: 'Join thousands of investors and entrepreneurs on EquityCrowd.',
  })
  metaDescription!: string;

  @ApiProperty({
    description: 'Meta keywords for SEO',
    example: 'equity crowdfunding, startup investment, venture capital',
  })
  metaKeyword!: string;

  @ApiProperty({
    description: 'OpenGraph title',
    example: 'EquityCrowd - The Future of Startup Investment',
  })
  ogTitle!: string;

  @ApiProperty({
    description: 'OpenGraph description',
    example:
      'Discover the next unicorn startup or raise capital for your innovative business.',
  })
  ogDescription!: string;

  @ApiProperty({
    description: 'OpenGraph image URL',
    example: 'https://example.com/uploads/meta-settings/og-image.jpg',
  })
  ogImage!: string;

  @ApiProperty({
    description: 'Whether the OG image is AI-generated',
    enum: ['YES', 'NO'],
    example: 'NO',
  })
  isAIGeneratedImage!: 'YES' | 'NO';

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

export class MetaSettingListResponseDto {
  @ApiProperty({
    description: 'Meta setting data',
    type: MetaSettingResponseDto,
  })
  metaSetting!: MetaSettingResponseDto;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
  })
  language!: string;
}

export class MetaSettingErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Meta setting not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'META_SETTING_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}
