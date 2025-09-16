-- CreateEnum
CREATE TYPE "public"."ActiveStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECT', 'SUCCESSFUL', 'UNSUCCESSFUL', 'HIDDEN', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."UploadType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('CURRENT_ACCOUNT', 'SAVING_ACCOUNT');

-- CreateEnum
CREATE TYPE "public"."TermSlug" AS ENUM ('EQUITY_DIVIDEND', 'EQUITY', 'DEBT');

-- CreateTable
CREATE TABLE "public"."user_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "slug" TEXT,
    "photo" TEXT,
    "coverPhoto" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "userLocation" TEXT,
    "zipcode" TEXT,
    "kycStatus" TEXT,
    "kycReferenceId" TEXT,
    "aboutYourself" TEXT,
    "outsideLinks" TEXT,
    "userTypeId" TEXT,
    "active" "public"."ActiveStatus" NOT NULL DEFAULT 'PENDING',
    "enableTwoFactorAuth" TEXT NOT NULL DEFAULT 'no',
    "appliedBytwoFactorAuth" TEXT NOT NULL DEFAULT 'no',
    "twoFactorAuthVerified" TEXT NOT NULL DEFAULT 'yes',
    "twoFactorSecretKey" TEXT,
    "signupIpAddress" TEXT,
    "loginIpAddress" TEXT,
    "uniqueGoogleId" TEXT,
    "uniqueLinkedInId" TEXT,
    "uniqueFacebookId" TEXT,
    "uniqueTwitterId" TEXT,
    "achCustomerId" TEXT,
    "achAccountId" TEXT,
    "achAccountStatus" TEXT,
    "isAdmin" TEXT,
    "accountActivationToken" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "walletId" TEXT,
    "mangoPayOwnerId" TEXT,
    "mangoPayOwnerWalletId" TEXT,
    "plaidDwollaCustomerId" TEXT,
    "plaidDwollFundingSourceId" TEXT,
    "plaidDwollFundingSourceStatus" TEXT,
    "plaidDwollaKYCStatus" TEXT,
    "globalSocketId" TEXT,
    "enableNotification" "public"."NotificationStatus" NOT NULL DEFAULT 'YES',
    "notificationLanguageId" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "companyLogo" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companySlug" TEXT,
    "companyTagline" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyPhoneNumber" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "yearFounded" INTEGER NOT NULL,
    "website" TEXT,
    "companyCategory" TEXT NOT NULL,
    "companyIndustry" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "isUpcomingCampaign" BOOLEAN NOT NULL,
    "projectTimezone" TEXT,
    "startDate" TIMESTAMP(3),
    "startTime" TEXT,
    "actualStartDateTime" TIMESTAMP(3),
    "currencyId" TEXT NOT NULL,
    "goal" DECIMAL(15,2) NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "minimumRaise" DECIMAL(15,2) NOT NULL,
    "maximumRaise" DECIMAL(15,2) NOT NULL,
    "campaignStage" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "previouslyRaised" DECIMAL(15,2),
    "estimatedRevenue" DECIMAL(15,2),
    "hasLeadInvestor" BOOLEAN NOT NULL,
    "termId" TEXT NOT NULL,
    "termslug" "public"."TermSlug" NOT NULL,
    "availableShares" INTEGER,
    "pricePerShare" DECIMAL(10,2),
    "preMoneyValuation" DECIMAL(15,2),
    "maturityDate" TIMESTAMP(3),
    "investFrequency" TEXT,
    "IRR" DECIMAL(5,2),
    "equityAvailable" DECIMAL(5,2),
    "interestRate" DECIMAL(5,2),
    "termLength" INTEGER,
    "uploadType" "public"."UploadType",
    "campaignImageURL" TEXT,
    "campaignVideoURL" TEXT,
    "campaignStory" TEXT,
    "googleAnalyticsID" TEXT,
    "additionalLinks" JSONB,
    "bankName" TEXT,
    "accountType" "public"."AccountType",
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "confirmAccountNumber" TEXT,
    "routingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_investors" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "investorPhoto" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "investorType" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "memberPhoto" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_faqs" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "questionID" TEXT,
    "answer" TEXT,
    "customQuestion" TEXT,
    "customAnswer" TEXT,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."extras_videos" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "videoTitle" TEXT NOT NULL,
    "videoDescription" TEXT NOT NULL,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extras_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."extras_images" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageTitle" TEXT NOT NULL,
    "imageDescription" TEXT NOT NULL,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extras_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."extras_documents" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "equityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extras_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "public"."user_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "public"."languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "public"."languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "public"."users"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "public"."users"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "public"."users"("active");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_firstName_idx" ON "public"."users"("firstName");

-- CreateIndex
CREATE INDEX "users_lastName_idx" ON "public"."users"("lastName");

-- CreateIndex
CREATE INDEX "users_signupIpAddress_idx" ON "public"."users"("signupIpAddress");

-- CreateIndex
CREATE INDEX "users_userTypeId_idx" ON "public"."users"("userTypeId");

-- CreateIndex
CREATE INDEX "users_publicId_idx" ON "public"."users"("publicId");

-- CreateIndex
CREATE INDEX "users_active_id_idx" ON "public"."users"("active", "id");

-- CreateIndex
CREATE INDEX "users_firstName_lastName_email_signupIpAddress_id_idx" ON "public"."users"("firstName", "lastName", "email", "signupIpAddress", "id");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_publicId_key" ON "public"."campaigns"("publicId");

-- CreateIndex
CREATE INDEX "campaigns_userId_idx" ON "public"."campaigns"("userId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "public"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_publicId_idx" ON "public"."campaigns"("publicId");

-- CreateIndex
CREATE INDEX "campaigns_companySlug_idx" ON "public"."campaigns"("companySlug");

-- CreateIndex
CREATE INDEX "campaigns_userId_status_idx" ON "public"."campaigns"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lead_investors_publicId_key" ON "public"."lead_investors"("publicId");

-- CreateIndex
CREATE INDEX "lead_investors_equityId_idx" ON "public"."lead_investors"("equityId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_publicId_key" ON "public"."team_members"("publicId");

-- CreateIndex
CREATE INDEX "team_members_equityId_idx" ON "public"."team_members"("equityId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_faqs_publicId_key" ON "public"."campaign_faqs"("publicId");

-- CreateIndex
CREATE INDEX "campaign_faqs_equityId_idx" ON "public"."campaign_faqs"("equityId");

-- CreateIndex
CREATE UNIQUE INDEX "extras_videos_publicId_key" ON "public"."extras_videos"("publicId");

-- CreateIndex
CREATE INDEX "extras_videos_equityId_idx" ON "public"."extras_videos"("equityId");

-- CreateIndex
CREATE UNIQUE INDEX "extras_images_publicId_key" ON "public"."extras_images"("publicId");

-- CreateIndex
CREATE INDEX "extras_images_equityId_idx" ON "public"."extras_images"("equityId");

-- CreateIndex
CREATE UNIQUE INDEX "extras_documents_publicId_key" ON "public"."extras_documents"("publicId");

-- CreateIndex
CREATE INDEX "extras_documents_equityId_idx" ON "public"."extras_documents"("equityId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "public"."user_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_notificationLanguageId_fkey" FOREIGN KEY ("notificationLanguageId") REFERENCES "public"."languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_investors" ADD CONSTRAINT "lead_investors_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_faqs" ADD CONSTRAINT "campaign_faqs_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."extras_videos" ADD CONSTRAINT "extras_videos_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."extras_images" ADD CONSTRAINT "extras_images_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."extras_documents" ADD CONSTRAINT "extras_documents_equityId_fkey" FOREIGN KEY ("equityId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
