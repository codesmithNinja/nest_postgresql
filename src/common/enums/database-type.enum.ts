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
  IMAGE = 'Image',
  VIDEO = 'Video',
}

export enum AccountType {
  CURRENT_ACCOUNT = 'Current Account',
  SAVING_ACCOUNT = 'Saving Account',
}

export enum TermSlug {
  EQUITY_DIVIDEND = 'EQUITY + DIVIDEND',
  EQUITY = 'EQUITY',
  DEBT = 'DEBT',
}
