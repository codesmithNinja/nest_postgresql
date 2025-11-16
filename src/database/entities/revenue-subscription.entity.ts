export interface RevenueSubscription {
  id: string;
  publicId: string;
  subscriptionType: 'INVESTOR' | 'SPONSOR';
  amount: number;
  maxInvestmentAllowed?: number;
  maxProjectAllowed?: number;
  maxProjectGoalLimit?: number;
  allowRefund: boolean;
  allowRefundDays?: number;
  allowCancel: boolean;
  allowCancelDays?: number;
  secondaryMarketAccess?: boolean;
  earlyBirdAccess: boolean;
  useCount: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueSubscriptionLanguage {
  id: string;
  publicId: string;
  mainSubscriptionId: string;
  title: string;
  description: string;
  languageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueSubscriptionWithLanguage extends RevenueSubscription {
  title: string;
  description: string;
  language?: {
    publicId: string;
    name: string;
  };
}

export interface CreateRevenueSubscriptionDto {
  subscriptionType: 'INVESTOR' | 'SPONSOR';
  amount: number;
  maxInvestmentAllowed?: number;
  maxProjectAllowed?: number;
  maxProjectGoalLimit?: number;
  allowRefund?: boolean;
  allowRefundDays?: number;
  allowCancel?: boolean;
  allowCancelDays?: number;
  secondaryMarketAccess?: boolean;
  earlyBirdAccess?: boolean;
  status?: boolean;
  title: string;
  description: string;
  languageId?: string;
}

export interface UpdateRevenueSubscriptionDto {
  subscriptionType?: 'INVESTOR' | 'SPONSOR';
  amount?: number;
  maxInvestmentAllowed?: number;
  maxProjectAllowed?: number;
  maxProjectGoalLimit?: number;
  allowRefund?: boolean;
  allowRefundDays?: number;
  allowCancel?: boolean;
  allowCancelDays?: number;
  secondaryMarketAccess?: boolean;
  earlyBirdAccess?: boolean;
  status?: boolean;
  title?: string;
  description?: string;
  languageId?: string;
}

export interface CreateRevenueSubscriptionLanguageDto {
  mainSubscriptionId: string;
  title: string;
  description: string;
  languageId: string;
}

export interface UpdateRevenueSubscriptionLanguageDto {
  title?: string;
  description?: string;
}
