import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { ICampaignFaqRepository } from './campaign-faq.repository.interface';
import {
  CampaignFaq,
  CampaignFaqDocument,
} from '../../schemas/campaign-faq.schema';
import { CampaignFaq as CampaignFaqEntity } from '../../entities/campaign-faq.entity';

@Injectable()
export class CampaignFaqMongoRepository
  extends MongoRepository<CampaignFaqDocument, CampaignFaqEntity>
  implements ICampaignFaqRepository
{
  constructor(
    @InjectModel(CampaignFaq.name)
    protected readonly model: Model<CampaignFaqDocument>
  ) {
    super(model);
  }

  protected toEntity(doc: CampaignFaqDocument): CampaignFaqEntity {
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      questionID: (obj.questionID as string) || '',
      answer: (obj.answer as string) || '',
      customQuestion: (obj.customQuestion as string) || '',
      customAnswer: (obj.customAnswer as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<CampaignFaqEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<CampaignFaqEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc)).filter(Boolean);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<CampaignFaqEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return doc ? this.toEntity(doc) : null;
  }
}
