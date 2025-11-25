import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../base/postgres.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaymentGateway,
  CreatePaymentGatewayDto,
} from '../../entities/payment-gateway.entity';
import { IPaymentGatewayRepository } from './payment-gateway.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentGatewayPostgresRepository
  extends PostgresRepository<PaymentGateway>
  implements IPaymentGatewayRepository
{
  protected modelName = 'paymentGateway';
  protected selectFields = {
    id: true,
    publicId: true,
    title: true,
    paymentSlug: true,
    paymentMode: true,
    sandboxDetails: true,
    liveDetails: true,
    isDefault: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPaymentSlug(paymentSlug: string): Promise<PaymentGateway | null> {
    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.findUnique({
      where: { paymentSlug: paymentSlug.toLowerCase() },
    });
    return paymentGateway as PaymentGateway | null;
  }

  async findActiveByPaymentSlug(
    paymentSlug: string
  ): Promise<PaymentGateway | null> {
    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.findFirst({
      where: {
        paymentSlug: paymentSlug.toLowerCase(),
        status: true,
      },
    });
    return paymentGateway as PaymentGateway | null;
  }

  async findByPaymentSlugForAdmin(
    paymentSlug: string
  ): Promise<PaymentGateway | null> {
    return this.findByPaymentSlug(paymentSlug);
  }

  async findByPublicId(publicId: string): Promise<PaymentGateway | null> {
    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.findUnique({
      where: { publicId },
    });
    return paymentGateway as PaymentGateway | null;
  }

  async existsByPaymentSlug(paymentSlug: string): Promise<boolean> {
    const delegate = this.getModelDelegate();
    const count = await delegate.count({
      where: { paymentSlug: paymentSlug.toLowerCase() },
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

    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.create({
      data: {
        publicId: uuidv4(),
        paymentSlug: paymentSlug.toLowerCase(),
        ...createDto,
      },
    });
    return paymentGateway as PaymentGateway;
  }

  async updateByPaymentSlug(
    paymentSlug: string,
    updateDto: Partial<PaymentGateway>
  ): Promise<PaymentGateway> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.paymentMode !== undefined)
      updateData.paymentMode = updateDto.paymentMode;
    if (updateDto.sandboxDetails !== undefined)
      updateData.sandboxDetails = updateDto.sandboxDetails;
    if (updateDto.liveDetails !== undefined)
      updateData.liveDetails = updateDto.liveDetails;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    // Handle isDefault specially - if setting to true, unset all others first
    if (updateDto.isDefault !== undefined) {
      if (updateDto.isDefault) {
        await this.unsetAllDefaults();
      }
      updateData.isDefault = updateDto.isDefault;
    }

    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.update({
      where: { paymentSlug: paymentSlug.toLowerCase() },
      data: updateData,
    });
    return paymentGateway as PaymentGateway;
  }

  async deleteByPaymentSlugAndPublicId(
    paymentSlug: string,
    publicId: string
  ): Promise<boolean> {
    try {
      const delegate = this.getModelDelegate();
      // Find the record with both conditions first
      const paymentGateway = await delegate.findFirst({
        where: {
          paymentSlug: paymentSlug.toLowerCase(),
          publicId,
        },
      });

      if (!paymentGateway) {
        return false;
      }

      // Delete by ID since we found a match
      await delegate.delete({
        where: { id: (paymentGateway as PaymentGateway).id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async setDefaultGateway(paymentSlug: string): Promise<PaymentGateway> {
    // First unset all defaults
    await this.unsetAllDefaults();

    // Set the specified gateway as default
    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.update({
      where: { paymentSlug: paymentSlug.toLowerCase() },
      data: { isDefault: true },
    });
    return paymentGateway as PaymentGateway;
  }

  async getDefaultGateway(): Promise<PaymentGateway | null> {
    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.findFirst({
      where: {
        isDefault: true,
        status: true,
      },
    });
    return paymentGateway as PaymentGateway | null;
  }

  async unsetAllDefaults(): Promise<void> {
    const delegate = this.getModelDelegate();
    await delegate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  // Base interface implementations
  async getDetail(
    filter: Partial<PaymentGateway>
  ): Promise<PaymentGateway | null> {
    const whereClause: Record<string, unknown> = {};

    if (filter.publicId) {
      whereClause.publicId = filter.publicId;
    }
    if (filter.id) {
      whereClause.id = filter.id;
    }
    if (filter.paymentSlug) {
      whereClause.paymentSlug = filter.paymentSlug.toLowerCase();
    }
    if (filter.title) {
      whereClause.title = filter.title;
    }

    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.findFirst({
      where: whereClause,
    });
    return paymentGateway as PaymentGateway | null;
  }

  async updateById(
    id: string,
    updateDto: Partial<PaymentGateway>
  ): Promise<PaymentGateway> {
    const updateData: Record<string, unknown> = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.paymentMode !== undefined)
      updateData.paymentMode = updateDto.paymentMode;
    if (updateDto.sandboxDetails !== undefined)
      updateData.sandboxDetails = updateDto.sandboxDetails;
    if (updateDto.liveDetails !== undefined)
      updateData.liveDetails = updateDto.liveDetails;
    if (updateDto.isDefault !== undefined)
      updateData.isDefault = updateDto.isDefault;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    const delegate = this.getModelDelegate();
    const paymentGateway = await delegate.update({
      where: { id },
      data: updateData,
    });
    return paymentGateway as PaymentGateway;
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const delegate = this.getModelDelegate();
      await delegate.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  protected convertFilterToPrisma(
    filter: Partial<PaymentGateway>
  ): Record<string, unknown> {
    const prismaFilter: Record<string, unknown> = {};

    if (filter.title) {
      prismaFilter.title = { contains: filter.title, mode: 'insensitive' };
    }
    if (filter.paymentSlug) {
      prismaFilter.paymentSlug = filter.paymentSlug.toLowerCase();
    }
    if (filter.paymentMode) {
      prismaFilter.paymentMode = filter.paymentMode;
    }
    if (filter.status !== undefined) {
      prismaFilter.status = filter.status;
    }
    if (filter.isDefault !== undefined) {
      prismaFilter.isDefault = filter.isDefault;
    }

    return prismaFilter;
  }
}
