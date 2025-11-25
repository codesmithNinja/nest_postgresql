import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import {
  PaymentGateway,
  CreatePaymentGatewayDto,
} from '../../entities/payment-gateway.entity';
import {
  PaymentGateway as PaymentGatewaySchema,
  PaymentGatewayDocument,
} from '../../schemas/payment-gateway.schema';
import { IPaymentGatewayRepository } from './payment-gateway.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentGatewayMongoRepository
  extends MongoRepository<PaymentGatewayDocument, PaymentGateway>
  implements IPaymentGatewayRepository
{
  constructor(
    @InjectModel(PaymentGatewaySchema.name)
    paymentGatewayModel: Model<PaymentGatewayDocument>
  ) {
    super(paymentGatewayModel);
  }

  protected toEntity(document: PaymentGatewayDocument): PaymentGateway {
    const entity: PaymentGateway = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: document.id ?? document._id?.toString() ?? '',
      publicId: document.publicId,
      title: document.title,
      paymentSlug: document.paymentSlug,
      paymentMode: document.paymentMode,
      sandboxDetails: document.sandboxDetails,
      liveDetails: document.liveDetails,
      isDefault: document.isDefault,
      status: document.status,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
    };
    return entity;
  }

  protected toDocument(
    entity: Partial<PaymentGateway>
  ): Record<string, unknown> {
    const doc: Record<string, unknown> = {};

    if (entity.publicId !== undefined) doc.publicId = entity.publicId;
    if (entity.title !== undefined) doc.title = entity.title;
    if (entity.paymentSlug !== undefined)
      doc.paymentSlug = entity.paymentSlug.toLowerCase();
    if (entity.paymentMode !== undefined) doc.paymentMode = entity.paymentMode;
    if (entity.sandboxDetails !== undefined)
      doc.sandboxDetails = entity.sandboxDetails;
    if (entity.liveDetails !== undefined) doc.liveDetails = entity.liveDetails;
    if (entity.isDefault !== undefined) doc.isDefault = entity.isDefault;
    if (entity.status !== undefined) doc.status = entity.status;

    return doc;
  }

  async findByPaymentSlug(paymentSlug: string): Promise<PaymentGateway | null> {
    const document = await this.model
      .findOne({ paymentSlug: paymentSlug.toLowerCase() })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async findActiveByPaymentSlug(
    paymentSlug: string
  ): Promise<PaymentGateway | null> {
    const document = await this.model
      .findOne({
        paymentSlug: paymentSlug.toLowerCase(),
        status: true,
      })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async findByPaymentSlugForAdmin(
    paymentSlug: string
  ): Promise<PaymentGateway | null> {
    return this.findByPaymentSlug(paymentSlug);
  }

  async findByPublicId(publicId: string): Promise<PaymentGateway | null> {
    const document = await this.model.findOne({ publicId }).exec();
    return document ? this.toEntity(document) : null;
  }

  async existsByPaymentSlug(paymentSlug: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      paymentSlug: paymentSlug.toLowerCase(),
    });
    return count > 0;
  }

  async createPaymentGateway(
    paymentSlug: string,
    createDto: CreatePaymentGatewayDto
  ): Promise<PaymentGateway> {
    // If setting as default, unset all others first
    if (createDto.isDefault) {
      await this.unsetAllDefaults();
    }

    const docData = this.toDocument({
      publicId: uuidv4(),
      paymentSlug: paymentSlug.toLowerCase(),
      ...createDto,
    });

    const document = new this.model(docData);
    const savedDocument = await document.save();
    return this.toEntity(savedDocument);
  }

  async updateByPaymentSlug(
    paymentSlug: string,
    updateDto: Partial<PaymentGateway>
  ): Promise<PaymentGateway> {
    // Handle isDefault specially - if setting to true, unset all others first
    if (updateDto.isDefault) {
      await this.unsetAllDefaults();
    }

    const updateDoc = this.toDocument(updateDto);
    const document = await this.model
      .findOneAndUpdate({ paymentSlug: paymentSlug.toLowerCase() }, updateDoc, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!document) {
      throw new Error(`Payment gateway with slug '${paymentSlug}' not found`);
    }

    return this.toEntity(document);
  }

  async deleteByPaymentSlugAndPublicId(
    paymentSlug: string,
    publicId: string
  ): Promise<boolean> {
    try {
      const result = await this.model
        .deleteOne({
          paymentSlug: paymentSlug.toLowerCase(),
          publicId,
        })
        .exec();
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async setDefaultGateway(paymentSlug: string): Promise<PaymentGateway> {
    // First unset all defaults
    await this.unsetAllDefaults();

    // Set the specified gateway as default
    const document = await this.model
      .findOneAndUpdate(
        { paymentSlug: paymentSlug.toLowerCase() },
        { isDefault: true },
        { new: true, runValidators: true }
      )
      .exec();

    if (!document) {
      throw new Error(`Payment gateway with slug '${paymentSlug}' not found`);
    }

    return this.toEntity(document);
  }

  async getDefaultGateway(): Promise<PaymentGateway | null> {
    const document = await this.model
      .findOne({
        isDefault: true,
        status: true,
      })
      .exec();
    return document ? this.toEntity(document) : null;
  }

  async unsetAllDefaults(): Promise<void> {
    await this.model
      .updateMany({ isDefault: true }, { isDefault: false })
      .exec();
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<PaymentGateway>
  ): Promise<PaymentGateway | null> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter.publicId) mongoFilter.publicId = filter.publicId;
    if (filter.id) mongoFilter._id = filter.id;
    if (filter.paymentSlug)
      mongoFilter.paymentSlug = filter.paymentSlug.toLowerCase();
    if (filter.title) mongoFilter.title = filter.title;

    const document = await this.model.findOne(mongoFilter).exec();
    return document ? this.toEntity(document) : null;
  }

  async updateById(
    id: string,
    updateDto: Partial<PaymentGateway>
  ): Promise<PaymentGateway> {
    const updateDoc = this.toDocument(updateDto);
    const document = await this.model
      .findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true })
      .exec();

    if (!document) {
      throw new Error(`Payment gateway with id '${id}' not found`);
    }

    return this.toEntity(document);
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id).exec();
      return result !== null;
    } catch {
      return false;
    }
  }
}
