import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SlidersService } from './sliders.service';
import {
  CreateSliderDto,
  UpdateSliderDto,
  BulkUpdateSlidersDto,
  BulkDeleteSlidersDto,
  SliderQueryDto,
  SliderResponseDto,
  PaginatedSliderResponseDto,
  SliderListResponseDto,
  SliderErrorResponseDto,
  BulkOperationResultDto,
} from './dto/sliders.dto';
import { AdminJwtUserGuard } from '../admin-users/guards/admin-jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { UploadSingleFile } from '../../../common/decorators/upload-files.decorator';
import {
  SliderNotFoundException,
  SlidersNotFoundException,
} from './exceptions/sliders.exceptions';
import { I18nResponseService } from '../../../common/services/i18n-response.service';
import { I18nResponseInterceptor } from '../../../common/interceptors/i18n-response.interceptor';

@ApiTags('Sliders Management')
@Controller('sliders')
@UseGuards(AdminJwtUserGuard)
@UseInterceptors(I18nResponseInterceptor)
@ApiBearerAuth()
export class SlidersController {
  private readonly logger = new Logger(SlidersController.name);

  constructor(
    private readonly slidersService: SlidersService,
    private readonly i18nResponse: I18nResponseService
  ) {}

  @Get('front')
  @Public()
  @ApiOperation({
    summary: 'Get active sliders for frontend (Public)',
    description:
      'Retrieve all active sliders for public/frontend use without authentication. Returns sliders in the specified language or default language.',
    tags: ['Public APIs'],
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description:
      'Language code for filtering (optional - defaults to default language)',
    example: 'en',
    examples: {
      english: {
        summary: 'English Language',
        description: 'Get sliders in English',
        value: 'en',
      },
      spanish: {
        summary: 'Spanish Language',
        description: 'Get sliders in Spanish',
        value: 'es',
      },
      french: {
        summary: 'French Language',
        description: 'Get sliders in French',
        value: 'fr',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sliders retrieved successfully',
    type: SliderListResponseDto,
    examples: {
      success: {
        summary: 'Successful Response',
        value: {
          sliders: [
            {
              id: 'clm1234567890',
              publicId: 'clm1234567890',
              uniqueCode: 1234567890,
              sliderImage: 'https://example.com/uploads/sliders/slider1.jpg',
              title: 'Discover Amazing Investment Opportunities',
              description:
                'Explore cutting-edge startups and investment opportunities that shape the future.',
              buttonTitle: 'Get Started Now',
              buttonLink: 'https://example.com/opportunities',
              languageId: 'clm1234567890',
              customColor: false,
              titleColor: '#000000',
              descriptionColor: '#666666',
              buttonTitleColor: '#FFFFFF',
              buttonLinkColor: '#007BFF',
              status: true,
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z',
            },
          ],
          count: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active sliders found',
    type: SliderErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid language code',
    type: SliderErrorResponseDto,
  })
  async getActiveSliders(@Query('lang') languageCode?: string) {
    try {
      this.logger.log(
        `Fetching active sliders for language: ${languageCode || 'default'}`
      );

      const result = await this.slidersService.getActiveSliders(languageCode);

      return this.i18nResponse.translateAndRespond(
        'sliders.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch active sliders for language: ${languageCode}`,
        (error as Error).stack
      );

      if (error instanceof SlidersNotFoundException) {
        return this.i18nResponse.translateError(
          'sliders.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all sliders with pagination (Admin)',
    description:
      'Admin endpoint to retrieve all sliders with pagination, filtering, and language support.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive sliders (default: true)',
    example: true,
  })
  @ApiQuery({
    name: 'languageId',
    required: false,
    description: 'Language ID for filtering (optional)',
    example: 'clm1234567890',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by title (partial match)',
    example: 'investment',
  })
  @ApiQuery({
    name: 'uniqueCode',
    required: false,
    description: 'Filter by unique code',
    example: 1234567890,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sliders retrieved successfully',
    type: PaginatedSliderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    type: SliderErrorResponseDto,
  })
  async getAllSliders(@Query(ValidationPipe) queryDto: SliderQueryDto) {
    try {
      this.logger.log('Fetching sliders for admin with pagination');

      const result = await this.slidersService.getAllSliders(queryDto);

      return this.i18nResponse.translateAndRespond(
        'sliders.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch sliders for admin',
        (error as Error).stack
      );
      throw error;
    }
  }

  @Patch('bulk-update')
  @ApiOperation({
    summary: 'Bulk update sliders status (Admin)',
    description:
      'Admin endpoint to update the status of multiple sliders at once.',
  })
  @ApiBody({
    type: BulkUpdateSlidersDto,
    description: 'Bulk update data with array of slider public IDs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sliders updated successfully',
    type: BulkOperationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk update data',
    type: SliderErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more sliders not found',
    type: SliderErrorResponseDto,
  })
  async bulkUpdateSliders(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateSlidersDto
  ) {
    try {
      this.logger.log(
        `Bulk updating ${bulkUpdateDto.publicIds.length} sliders`
      );

      const result = await this.slidersService.bulkUpdateSliders(bulkUpdateDto);

      return this.i18nResponse.translateAndRespond(
        'sliders.bulk_updated_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        'Failed to bulk update sliders',
        (error as Error).stack
      );
      throw error;
    }
  }

  @Patch('bulk-delete')
  @ApiOperation({
    summary: 'Bulk delete sliders (Admin)',
    description: `Admin endpoint to delete multiple sliders at once.

    **Bulk Delete Behavior:**
    - Deletes ALL specified sliders and their language variants
    - Removes all associated image files
    - Cannot be undone`,
  })
  @ApiBody({
    type: BulkDeleteSlidersDto,
    description: 'Bulk delete data with array of slider public IDs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sliders deleted successfully',
    type: BulkOperationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk delete data',
    type: SliderErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more sliders not found',
    type: SliderErrorResponseDto,
  })
  async bulkDeleteSliders(
    @Body(ValidationPipe) bulkDeleteDto: BulkDeleteSlidersDto
  ) {
    try {
      this.logger.log(
        `Bulk deleting ${bulkDeleteDto.publicIds.length} sliders`
      );

      const result = await this.slidersService.bulkDeleteSliders(bulkDeleteDto);

      return this.i18nResponse.translateAndRespond(
        'sliders.bulk_deleted_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        'Failed to bulk delete sliders',
        (error as Error).stack
      );
      throw error;
    }
  }

  @Get(':publicId')
  @ApiOperation({
    summary: 'Get slider by public ID (Admin)',
    description: 'Admin endpoint to retrieve a single slider by its public ID.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the slider to retrieve',
    type: 'string',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Slider retrieved successfully',
    type: SliderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Slider not found',
    type: SliderErrorResponseDto,
  })
  async getSliderByPublicId(@Param('publicId') publicId: string) {
    try {
      this.logger.log(`Fetching slider by public ID: ${publicId}`);

      const result = await this.slidersService.getSliderByPublicId(publicId);

      return this.i18nResponse.translateAndRespond(
        'sliders.retrieved_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch slider by public ID: ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof SliderNotFoundException) {
        return this.i18nResponse.translateError(
          'sliders.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create new slider (Admin)',
    description: `Admin endpoint to create a new slider with image upload and multi-language support.

    **File Upload Requirements:**
    - Maximum file size: 5MB
    - Allowed formats: JPEG, PNG, WebP, SVG
    - Field name: sliderImage

    **Multi-language Behavior:**
    - Creates slider entries for ALL active languages
    - Uses same unique code across all languages
    - Uploads separate images for each language variant`,
  })
  @ApiConsumes('multipart/form-data')
  @UploadSingleFile('sliderImage', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ],
  })
  @ApiBody({
    type: CreateSliderDto,
    description: 'Slider data with image file upload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Slider created successfully',
    type: SliderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid slider data or file upload error',
    type: SliderErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Slider with similar data already exists',
    type: SliderErrorResponseDto,
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async createSlider(
    @Body(ValidationPipe) createSliderDto: CreateSliderDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      this.logger.log('Creating new slider with image upload');

      // Extract slider image file from files array
      const sliderImage = files && files.length > 0 ? files[0] : undefined;

      const result = await this.slidersService.createSlider(
        createSliderDto,
        sliderImage
      );

      return this.i18nResponse.translateAndRespond(
        'sliders.created_successfully',
        HttpStatus.CREATED,
        result
      );
    } catch (error) {
      this.logger.error('Failed to create slider', (error as Error).stack);
      throw error;
    }
  }

  @Patch(':publicId')
  @ApiOperation({
    summary: 'Update slider (Admin)',
    description: `Admin endpoint to update an existing slider with optional image upload.

    **File Upload (Optional):**
    - Maximum file size: 5MB
    - Allowed formats: JPEG, PNG, WebP, SVG
    - Field name: sliderImage
    - If provided, replaces existing image

    **Update Behavior:**
    - Updates only the specific language version
    - Maintains unique code consistency
    - Validates color codes and URLs`,
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the slider to update',
    type: 'string',
    example: 'clm1234567890',
  })
  @ApiConsumes('multipart/form-data')
  @UploadSingleFile('sliderImage', {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ],
  })
  @ApiBody({
    type: UpdateSliderDto,
    description: 'Slider update data with optional image file upload',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Slider updated successfully',
    type: SliderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Slider not found',
    type: SliderErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or file upload error',
    type: SliderErrorResponseDto,
  })
  async updateSlider(
    @Param('publicId') publicId: string,
    @Body(ValidationPipe) updateSliderDto: UpdateSliderDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      this.logger.log(`Updating slider: ${publicId}`);

      // Extract slider image file from files array (optional for update)
      const sliderImage = files && files.length > 0 ? files[0] : undefined;

      const result = await this.slidersService.updateSlider(
        publicId,
        updateSliderDto,
        sliderImage
      );

      return this.i18nResponse.translateAndRespond(
        'sliders.updated_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to update slider: ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof SliderNotFoundException) {
        return this.i18nResponse.translateError(
          'sliders.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete slider (Admin)',
    description: `Admin endpoint to delete a slider and all its language variants.

    **Delete Behavior:**
    - Deletes ALL language variants (same unique code)
    - Removes associated image files
    - Cannot be undone`,
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID of the slider to delete',
    type: 'string',
    example: 'clm1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Slider deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Slider deleted successfully (4 variants removed)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Slider not found',
    type: SliderErrorResponseDto,
  })
  async deleteSlider(@Param('publicId') publicId: string) {
    try {
      this.logger.log(`Deleting slider: ${publicId}`);

      const result = await this.slidersService.deleteSlider(publicId);

      return this.i18nResponse.translateAndRespond(
        'sliders.deleted_successfully',
        HttpStatus.OK,
        result
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete slider: ${publicId}`,
        (error as Error).stack
      );

      if (error instanceof SliderNotFoundException) {
        return this.i18nResponse.translateError(
          'sliders.not_found',
          HttpStatus.NOT_FOUND
        );
      }

      throw error;
    }
  }
}
