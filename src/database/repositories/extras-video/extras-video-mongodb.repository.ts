import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { IExtrasVideoRepository } from '../../../common/interfaces/campaign-repository.interface';
import {
  ExtrasVideo,
  ExtrasVideoDocument,
} from '../../schemas/extras-video.schema';
import { ExtrasVideo as ExtrasVideoEntity } from '../../entities/extras-video.entity';

@Injectable()
export class ExtrasVideoMongoRepository
  extends MongoRepository<ExtrasVideoDocument, ExtrasVideoEntity>
  implements IExtrasVideoRepository
{
  constructor(
    @InjectModel(ExtrasVideo.name)
    protected readonly model: Model<ExtrasVideoDocument>
  ) {
    super(model);
  }

  protected toEntity(
    doc: ExtrasVideoDocument | null
  ): ExtrasVideoEntity | null {
    if (!doc) return null;
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      videoUrl: (obj.videoUrl as string) || '',
      videoTitle: (obj.videoTitle as string) || '',
      videoDescription: (obj.videoDescription as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<ExtrasVideoEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<ExtrasVideoEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasVideoEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return this.toEntity(doc);
  }
}
