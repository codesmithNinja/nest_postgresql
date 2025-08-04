-- CreateEnum
CREATE TYPE "public"."ActiveStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('YES', 'NO');

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
    "outsideLinks" JSONB,
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

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "public"."user_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "public"."languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "public"."languages"("code");

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
CREATE INDEX "users_active_id_idx" ON "public"."users"("active", "id");

-- CreateIndex
CREATE INDEX "users_firstName_lastName_email_signupIpAddress_id_idx" ON "public"."users"("firstName", "lastName", "email", "signupIpAddress", "id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "public"."user_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_notificationLanguageId_fkey" FOREIGN KEY ("notificationLanguageId") REFERENCES "public"."languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
