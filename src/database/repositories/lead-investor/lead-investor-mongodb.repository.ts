import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { ILeadInvestorRepository } from '../../../common/interfaces/campaign-repository.interface';
import {
  LeadInvestor,
  LeadInvestorDocument,
} from '../../schemas/lead-investor.schema';
import { LeadInvestor as LeadInvestorEntity } from '../../entities/lead-investor.entity';

@Injectable()
export class LeadInvestorMongoRepository
  extends MongoRepository<LeadInvestorDocument, LeadInvestorEntity>
  implements ILeadInvestorRepository
{
  constructor(
    @InjectModel(LeadInvestor.name)
    protected readonly model: Model<LeadInvestorDocument>
  ) {
    super(model);
  }

  protected toEntity(doc: LeadInvestorDocument): LeadInvestorEntity;
  protected toEntity(doc: LeadInvestorDocument | null): LeadInvestorEntity | null;
  protected toEntity(
    doc: LeadInvestorDocument | null
  ): LeadInvestorEntity | null {
    if (!doc) return null;
    const obj = doc.toObject() as Record<string, unknown>;
    return {
      id:
        (obj._id as { toString: () => string })?.toString() ||
        (obj.id as string) ||
        '',
      publicId: (obj.publicId as string) || '',
      investorPhoto: (obj.investorPhoto as string) || '',
      name: (obj.name as string) || '',
      investorType: (obj.investorType as string) || '',
      bio: (obj.bio as string) || '',
      equityId: (obj.equityId as string) || '',
      createdAt: (obj.createdAt as Date) || new Date(),
      updatedAt: (obj.updatedAt as Date) || new Date(),
    };
  }

  protected toDocument(
    entity: Partial<LeadInvestorEntity>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};
    Object.entries(entity).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        doc[key] = value;
      }
    });
    return doc;
  }

  async findByEquityId(equityId: string): Promise<LeadInvestorEntity[]> {
    const docs = await this.model
      .find({ equityId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc)).filter((entity): entity is LeadInvestorEntity => entity !== null);
  }

  async findByEquityIdAndPublicId(
    equityId: string,
    publicId: string
  ): Promise<LeadInvestorEntity | null> {
    const doc = await this.model.findOne({ equityId, publicId }).exec();
    return this.toEntity(doc);
  }
}
