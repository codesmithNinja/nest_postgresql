import { IRepository } from '../../../common/interfaces/repository.interface';
import {
  PaymentGateway,
  CreatePaymentGatewayDto,
} from '../../entities/payment-gateway.entity';

export interface IPaymentGatewayRepository
  extends Omit<IRepository<PaymentGateway>, 'insert'> {
  /**
   * Find payment gateway for public display (active only) by payment slug
   */
  findByPaymentSlug(paymentSlug: string): Promise<PaymentGateway | null>;

  /**
   * Find active payment gateway by payment slug for public access
   */
  findActiveByPaymentSlug(paymentSlug: string): Promise<PaymentGateway | null>;

  /**
   * Find payment gateway by payment slug for admin (includes inactive)
   */
  findByPaymentSlugForAdmin(
    paymentSlug: string
  ): Promise<PaymentGateway | null>;

  /**
   * Find payment gateway by public ID
   */
  findByPublicId(publicId: string): Promise<PaymentGateway | null>;

  /**
   * Check if payment slug already exists
   */
  existsByPaymentSlug(paymentSlug: string): Promise<boolean>;

  /**
   * Create a new payment gateway
   */
  createPaymentGateway(
    paymentSlug: string,
    createDto: CreatePaymentGatewayDto
  ): Promise<PaymentGateway>;

  /**
   * Update payment gateway by payment slug
   */
  updateByPaymentSlug(
    paymentSlug: string,
    updateDto: Partial<PaymentGateway>
  ): Promise<PaymentGateway>;

  /**
   * Delete payment gateway by payment slug and public ID
   */
  deleteByPaymentSlugAndPublicId(
    paymentSlug: string,
    publicId: string
  ): Promise<boolean>;

  /**
   * Set default payment gateway
   */
  setDefaultGateway(paymentSlug: string): Promise<PaymentGateway>;

  /**
   * Get default payment gateway
   */
  getDefaultGateway(): Promise<PaymentGateway | null>;

  /**
   * Unset all default gateways
   */
  unsetAllDefaults(): Promise<void>;
}
