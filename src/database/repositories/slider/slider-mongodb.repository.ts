import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  Slider as SliderSchema,
  SliderDocument,
} from '../../schemas/slider.schema';
import {
  Language as LanguageSchema,
  LanguageDocument,
} from '../../schemas/language.schema';
import {
  Slider,
  CreateSliderDto,
  SliderWithLanguage,
  MinimalLanguage,
} from '../../entities/slider.entity';
import { ISliderRepository, MongoQuery } from './slider.repository.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/repository.interface';
import { v4 as uuidv4 } from 'uuid';

// Helper type for populated language document
interface PopulatedLanguageDocument {
  _id: unknown;
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
  flagImage: string;
  direction: 'ltr' | 'rtl';
  status: boolean;
  isDefault: 'YES' | 'NO';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class SliderMongodbRepository
  extends MongoRepository<SliderDocument, Slider>
  implements ISliderRepository
{
  constructor(
    @InjectModel(SliderSchema.name)
    private sliderModel: Model<SliderDocument>,
    @InjectModel(LanguageSchema.name)
    private languageModel: Model<LanguageDocument>
  ) {
    super(sliderModel);
  }

  protected toEntity(doc: SliderDocument): Slider {
    return {
      id: (doc._id as { toString(): string }).toString(),
      publicId: doc.publicId,
      uniqueCode: doc.uniqueCode || 0,
      sliderImage: doc.sliderImage,
      title: doc.title,
      description: doc.description,
      buttonTitle: doc.buttonTitle,
      buttonLink: doc.buttonLink,
      // languageId should always be the primary key (_id) of the language
      // When populated, we extract the minimal language info for display
      languageId:
        typeof doc.languageId === 'object' &&
        doc.languageId &&
        'publicId' in doc.languageId
          ? ({
              publicId: (doc.languageId as PopulatedLanguageDocument).publicId,
              name: (doc.languageId as PopulatedLanguageDocument).name,
            } as MinimalLanguage)
          : typeof doc.languageId === 'object'
            ? (doc.languageId as { toString(): string }).toString()
            : doc.languageId,
      customColor: doc.customColor || false,
      titleColor: doc.titleColor || '#000000',
      descriptionColor: doc.descriptionColor || '#000000',
      buttonTitleColor: doc.buttonTitleColor || '#FFFFFF',
      buttonBackground: doc.buttonBackground || '#007BFF',
      // Second set of description and button fields
      descriptionTwo: doc.descriptionTwo,
      buttonTitleTwo: doc.buttonTitleTwo,
      buttonLinkTwo: doc.buttonLinkTwo,
      descriptionTwoColor: doc.descriptionTwoColor || '#666666',
      buttonTwoColor: doc.buttonTwoColor || '#FFFFFF',
      buttonBackgroundTwo: doc.buttonBackgroundTwo || '#28A745',
      status: doc.status !== false, // Default to true if undefined
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  protected toDocument(entity: Partial<Slider>): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.uniqueCode !== undefined) doc.uniqueCode = entity.uniqueCode;
    if (entity.sliderImage !== undefined) doc.sliderImage = entity.sliderImage;
    if (entity.title !== undefined) doc.title = entity.title;
    if (entity.description !== undefined) doc.description = entity.description;
    if (entity.buttonTitle !== undefined) doc.buttonTitle = entity.buttonTitle;
    if (entity.buttonLink !== undefined) doc.buttonLink = entity.buttonLink;
    // languageId must be the primary key (_id) of the language, not publicId
    if (entity.languageId !== undefined) {
      doc.languageId =
        typeof entity.languageId === 'string'
          ? new Types.ObjectId(entity.languageId)
          : entity.languageId;
    }
    if (entity.customColor !== undefined) doc.customColor = entity.customColor;
    if (entity.titleColor !== undefined) doc.titleColor = entity.titleColor;
    if (entity.descriptionColor !== undefined)
      doc.descriptionColor = entity.descriptionColor;
    if (entity.buttonTitleColor !== undefined)
      doc.buttonTitleColor = entity.buttonTitleColor;
    if (entity.buttonBackground !== undefined)
      doc.buttonBackground = entity.buttonBackground;
    // Second set of description and button fields
    if (entity.descriptionTwo !== undefined)
      doc.descriptionTwo = entity.descriptionTwo;
    if (entity.buttonTitleTwo !== undefined)
      doc.buttonTitleTwo = entity.buttonTitleTwo;
    if (entity.buttonLinkTwo !== undefined)
      doc.buttonLinkTwo = entity.buttonLinkTwo;
    if (entity.descriptionTwoColor !== undefined)
      doc.descriptionTwoColor = entity.descriptionTwoColor;
    if (entity.buttonTwoColor !== undefined)
      doc.buttonTwoColor = entity.buttonTwoColor;
    if (entity.buttonBackgroundTwo !== undefined)
      doc.buttonBackgroundTwo = entity.buttonBackgroundTwo;
    if (entity.status !== undefined) doc.status = entity.status;
    if (entity.publicId !== undefined) doc.publicId = entity.publicId;

    return doc;
  }

  async insert(createDto: CreateSliderDto): Promise<Slider> {
    const slider = new this.sliderModel({
      publicId: uuidv4(),
      ...createDto,
      languageId: createDto.languageId
        ? new Types.ObjectId(createDto.languageId)
        : undefined,
    });
    const savedSlider = await slider.save();
    return this.toEntity(savedSlider);
  }

  async findForPublic(languageId: string): Promise<SliderWithLanguage[]> {
    const sliders = await this.sliderModel
      .find({
        languageId: new Types.ObjectId(languageId),
        status: true,
      })
      .populate('languageId', '-_id -__v')
      .sort({ createdAt: -1 })
      .exec();

    return sliders.map((slider) =>
      this.toEntity(slider)
    ) as SliderWithLanguage[];
  }

  async findByLanguage(
    languageId: string,
    includeInactive = false
  ): Promise<SliderWithLanguage[]> {
    const whereClause: Record<string, unknown> = {
      languageId: new Types.ObjectId(languageId),
    };
    if (!includeInactive) {
      whereClause.status = true;
    }

    const sliders = await this.sliderModel
      .find(whereClause)
      .populate('languageId', '-_id -__v')
      .sort({ createdAt: -1 })
      .exec();

    return sliders.map((slider) =>
      this.toEntity(slider)
    ) as SliderWithLanguage[];
  }

  async findByPublicId(publicId: string): Promise<SliderWithLanguage | null> {
    const slider = await this.sliderModel
      .findOne({ publicId })
      .populate('languageId', '-_id -__v')
      .exec();

    return slider ? (this.toEntity(slider) as SliderWithLanguage) : null;
  }

  async findByUniqueCode(uniqueCode: number): Promise<SliderWithLanguage[]> {
    const sliders = await this.sliderModel
      .find({ uniqueCode })
      .populate('languageId', '-_id -__v')
      .sort({ createdAt: -1 })
      .exec();

    return sliders.map((slider) =>
      this.toEntity(slider)
    ) as SliderWithLanguage[];
  }

  async findWithPaginationByLanguage(
    page: number,
    limit: number,
    languageId: string,
    includeInactive: boolean
  ): Promise<{
    data: SliderWithLanguage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {
      languageId: new Types.ObjectId(languageId),
    };

    if (!includeInactive) {
      whereClause.status = true;
    }

    const [sliders, total] = await Promise.all([
      this.sliderModel
        .find(whereClause)
        .populate('languageId', '-_id -__v')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.sliderModel.countDocuments(whereClause),
    ]);

    return {
      data: sliders.map((slider) =>
        this.toEntity(slider)
      ) as SliderWithLanguage[],
      total,
      page,
      limit,
    };
  }

  async findWithPaginationAndSearch(
    searchTerm: string,
    searchFields: string[],
    filter?: MongoQuery<Slider>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Slider>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build search conditions using the provided search fields
    const searchConditions = {
      $or: searchFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    };

    // Build additional filters
    const additionalFilters = this.buildAdditionalFilters(filter);
    const mongoFilter = additionalFilters
      ? { $and: [searchConditions, additionalFilters] }
      : searchConditions;

    // Build query
    const query = this.sliderModel.find(mongoFilter);

    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // Execute queries in parallel
    const [documents, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.sliderModel.countDocuments(mongoFilter).exec(),
    ]);

    const items = documents.map((doc) => this.toEntity(doc));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async createMultiLanguage(
    createDto: CreateSliderDto,
    languageIds: string[]
  ): Promise<Slider[]> {
    const sliders = languageIds.map((languageId) => ({
      publicId: uuidv4(),
      ...createDto,
      languageId: new Types.ObjectId(languageId), // Convert string to ObjectId
    }));

    const createdSliders = await this.sliderModel.insertMany(sliders);
    return createdSliders.map((slider) =>
      this.toEntity(slider as unknown as SliderDocument)
    );
  }

  async createMultiLanguageWithFiles(
    createDto: Omit<CreateSliderDto, 'sliderImage' | 'languageId'>,
    languageFilePairs: Array<{ languageId: string; filePath: string }>
  ): Promise<Slider[]> {
    const sliders = languageFilePairs.map(({ languageId, filePath }) => ({
      publicId: uuidv4(),
      ...createDto,
      sliderImage: filePath,
      languageId: new Types.ObjectId(languageId), // Convert string to ObjectId
    }));

    const createdSliders = await this.sliderModel.insertMany(sliders);
    return createdSliders.map((slider) =>
      this.toEntity(slider as unknown as SliderDocument)
    );
  }

  async getAllActiveLanguageCodesWithIds(): Promise<
    Array<{ id: string; folder: string }>
  > {
    const languages = await this.languageModel
      .find({
        status: true,
      })
      .select('_id folder')
      .exec();

    return languages.map((lang) => ({
      id: (lang._id as { toString(): string }).toString(),
      folder: lang.folder,
    }));
  }

  async generateUniqueCode(): Promise<number> {
    // Generate a random 10-digit number
    const min = 1000000000; // 10^9
    const max = 9999999999; // 10^10 - 1

    let uniqueCode: number;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;

      // Check if this code already exists
      const existing = await this.sliderModel.findOne({ uniqueCode }).exec();
      if (!existing) {
        isUnique = true;
        return uniqueCode;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique code after maximum attempts');
  }

  /**
   * Gets the primary key (_id) of the default language, NOT the publicId
   * This is used for foreign key relationships in the database
   * @returns Promise<string> The primary key (_id) of the default language
   */
  async getDefaultLanguageId(): Promise<string> {
    const defaultLanguage = await this.languageModel
      .findOne({
        isDefault: 'YES',
        status: true,
      })
      .exec();

    if (!defaultLanguage) {
      throw new Error('No default language found');
    }

    // Return the primary key (_id), NOT the publicId
    return (defaultLanguage._id as { toString(): string }).toString();
  }

  /**
   * Gets all active language primary keys (_id), NOT the publicIds
   * These are used for foreign key relationships in the database
   * @returns Promise<string[]> Array of primary keys (_id) of active languages
   */
  async getAllActiveLanguageIds(): Promise<string[]> {
    const languages = await this.languageModel
      .find({
        status: true,
      })
      .select('_id')
      .exec();

    // Return primary keys (_id), NOT publicIds
    return languages.map((lang) =>
      (lang._id as { toString(): string }).toString()
    );
  }

  async bulkUpdateByPublicIds(
    publicIds: string[],
    data: Partial<Slider>
  ): Promise<{ count: number; updated: Slider[] }> {
    const updateData = this.toDocument(data);

    const result = await this.sliderModel
      .updateMany({ publicId: { $in: publicIds } }, updateData)
      .exec();

    const updatedSliders = await this.sliderModel
      .find({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: result.modifiedCount || 0,
      updated: updatedSliders.map((doc) => this.toEntity(doc)),
    };
  }

  async bulkDeleteByPublicIds(
    publicIds: string[]
  ): Promise<{ count: number; deleted: Slider[] }> {
    // First get sliders to be deleted for return value
    const slidersToDelete = await this.sliderModel
      .find({ publicId: { $in: publicIds } })
      .exec();

    const deleteResult = await this.sliderModel
      .deleteMany({ publicId: { $in: publicIds } })
      .exec();

    return {
      count: deleteResult.deletedCount || 0,
      deleted: slidersToDelete.map((doc) => this.toEntity(doc)),
    };
  }

  async deleteByUniqueCode(uniqueCode: number): Promise<number> {
    // Delete all language variants of this unique code
    const result = await this.sliderModel.deleteMany({ uniqueCode }).exec();
    return result.deletedCount || 0;
  }

  async isUniqueCodeExists(uniqueCode: number): Promise<boolean> {
    const slider = await this.sliderModel.findOne({ uniqueCode }).exec();
    return !!slider;
  }

  // Base interface implementations
  async getDetail(filter: Partial<Slider>): Promise<Slider | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) {
      mongoFilter.publicId = filter.publicId;
    }
    if (filter.id) {
      mongoFilter._id = filter.id;
    }
    if (filter.uniqueCode !== undefined) {
      mongoFilter.uniqueCode = filter.uniqueCode;
    }
    if (filter.title) {
      mongoFilter.title = filter.title;
    }

    const doc = await this.sliderModel.findOne(mongoFilter);
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(id: string, updateDto: Partial<Slider>): Promise<Slider> {
    const updateData = this.toDocument(updateDto);
    const doc = await this.sliderModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!doc) {
      throw new Error(`Slider with ID ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.sliderModel.findByIdAndUpdate(
        id,
        { status: false },
        { new: true }
      );
      return !!result;
    } catch {
      return false;
    }
  }

  async findWithPagination(
    filter?: Partial<Slider>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Slider>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, unknown> = {};
    if (filter) {
      if (filter.title) {
        mongoFilter.title = { $regex: filter.title, $options: 'i' };
      }
      if (filter.uniqueCode !== undefined) {
        mongoFilter.uniqueCode = filter.uniqueCode;
      }
      if (filter.status !== undefined) {
        mongoFilter.status = filter.status;
      }
      if (filter.languageId) {
        // Handle different languageId formats
        if (typeof filter.languageId === 'string') {
          mongoFilter.languageId = new Types.ObjectId(filter.languageId);
        } else if (
          typeof filter.languageId === 'object' &&
          filter.languageId &&
          'publicId' in filter.languageId
        ) {
          // If it's a MinimalLanguage object, we need to convert it to ObjectId
          // This shouldn't happen in normal operation, but handle gracefully
          mongoFilter.languageId = filter.languageId;
        } else {
          mongoFilter.languageId = filter.languageId;
        }
      }
    }

    const [docs, total] = await Promise.all([
      this.sliderModel
        .find(mongoFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.sliderModel.countDocuments(mongoFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private buildAdditionalFilters(
    filter?: MongoQuery<Slider>
  ): Record<string, unknown> | null {
    if (!filter) return null;

    const mongoFilter: Record<string, unknown> = {};

    Object.entries(filter).forEach(([key, value]) => {
      if (
        key !== 'title' &&
        key !== 'description' &&
        key !== 'buttonTitle' &&
        key !== 'buttonTitleTwo' &&
        key !== 'descriptionTwo'
      ) {
        // Skip search fields, only process additional filters
        if (value !== undefined && value !== null) {
          mongoFilter[key] = value;
        }
      }
    });

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
  }
}
