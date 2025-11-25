export enum PaymentMode {
  SANDBOX = 'sandbox',
  LIVE = 'live',
}

export interface PaymentGateway {
  id: string;
  publicId: string;
  title: string;
  paymentSlug: string;
  paymentMode: PaymentMode;
  sandboxDetails: Record<string, unknown>;
  liveDetails: Record<string, unknown>;
  isDefault: boolean;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentGatewayDto {
  title: string;
  paymentMode: PaymentMode;
  sandboxDetails: Record<string, unknown>;
  liveDetails: Record<string, unknown>;
  isDefault?: boolean;
  status?: boolean;
}

export interface UpdatePaymentGatewayDto {
  title?: string;
  paymentMode?: PaymentMode;
  sandboxDetails?: Record<string, unknown>;
  liveDetails?: Record<string, unknown>;
  isDefault?: boolean;
  status?: boolean;
}
