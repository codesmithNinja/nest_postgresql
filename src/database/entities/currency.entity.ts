export interface Currency {
  id: string;
  publicId: string;
  name: string;
  code: string;
  symbol: string;
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCurrencyDto {
  name: string;
  code: string;
  symbol: string;
  status?: boolean;
}

export interface UpdateCurrencyDto {
  name?: string;
  code?: string;
  symbol?: string;
  status?: boolean;
}

export interface BulkCurrencyOperationDto {
  publicIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
}
