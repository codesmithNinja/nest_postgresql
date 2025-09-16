export enum DatabaseType {
  POSTGRES = 'postgres',
  MONGODB = 'mongodb',
}

export enum ActiveStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export enum NotificationStatus {
  YES = 'YES',
  NO = 'NO',
}

// Campaign-specific enums
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECT = 'REJECT',
  SUCCESSFUL = 'SUCCESSFUL',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  HIDDEN = 'HIDDEN',
  INACTIVE = 'INACTIVE',
}

export enum UploadType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum AccountType {
  CURRENT_ACCOUNT = 'CURRENT_ACCOUNT',
  SAVING_ACCOUNT = 'SAVING_ACCOUNT',
}

export enum TermSlug {
  EQUITY_DIVIDEND = 'EQUITY + DIVIDEND',
  EQUITY = 'EQUITY',
  DEBT = 'DEBT',
}
