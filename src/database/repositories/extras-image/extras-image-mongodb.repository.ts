import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { IExtrasImageRepository } from '../../../common/interfaces/campaign-repository.interface';
import {
  ExtrasImage,
  ExtrasImageDocument,
} from '../../schemas/extras-image.schema';
import { ExtrasImage as ExtrasImageEntity } from '../../entities/extras-image.entity';

@Injectable()
export class ExtrasImageMongoRepository
  extends MongoRepository<ExtrasImageDocument, ExtrasImageEntity>
  implements IExtrasImageRepository
{
  constructor(
    @InjectModel(ExtrasImage.name)
    protected readonly model: Model<ExtrasImageDocument>
  ) {
    super(model);
  }

  protected toEntity(doc: ExtrasImageDocument): ExtrasImageEntity {
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      imageUrl: (obj.imageUrl as string) || '',
      imageTitle: (obj.imageTitle as string) || '',
      imageDescription: (obj.imageDescription as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<ExtrasImageEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<ExtrasImageEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasImageEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return doc ? this.toEntity(doc) : null;
  }
}
