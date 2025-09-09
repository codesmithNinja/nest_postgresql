export interface CampaignFaq {
  id: string;
  publicId: string;
  questionID?: string;
  answer?: string;
  customQuestion?: string;
  customAnswer?: string;
  equityId: string;
  createdAt: Date;
  updatedAt: Date;
}
