import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { IExtrasDocumentRepository } from '../../../common/interfaces/campaign-repository.interface';
import {
  ExtrasDocument,
  ExtrasDocumentDocument,
} from '../../schemas/extras-document.schema';
import { ExtrasDocument as ExtrasDocumentEntity } from '../../entities/extras-document.entity';

@Injectable()
export class ExtrasDocumentMongoRepository
  extends MongoRepository<ExtrasDocumentDocument, ExtrasDocumentEntity>
  implements IExtrasDocumentRepository
{
  constructor(
    @InjectModel(ExtrasDocument.name)
    protected readonly model: Model<ExtrasDocumentDocument>
  ) {
    super(model);
  }

  protected toEntity(
    doc: ExtrasDocumentDocument | null
  ): ExtrasDocumentEntity | null {
    if (!doc) return null;
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      documentUrl: (obj.documentUrl as string) || '',
      documentTitle: (obj.documentTitle as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<ExtrasDocumentEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<ExtrasDocumentEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<ExtrasDocumentEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return this.toEntity(doc);
  }
}
