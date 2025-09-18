-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "photo" TEXT,
    "password" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "loginIpAddress" TEXT NOT NULL,
    "currentLoginDateTime" TIMESTAMP(3) NOT NULL,
    "lastLoginDateTime" TIMESTAMP(3) NOT NULL,
    "twoFactorAuthVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_publicId_key" ON "public"."admins"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "admins_firstName_idx" ON "public"."admins"("firstName");

-- CreateIndex
CREATE INDEX "admins_lastName_idx" ON "public"."admins"("lastName");

-- CreateIndex
CREATE INDEX "admins_active_idx" ON "public"."admins"("active");

-- CreateIndex
CREATE INDEX "admins_publicId_idx" ON "public"."admins"("publicId");

-- CreateIndex
CREATE INDEX "admins_active_id_idx" ON "public"."admins"("active", "id");

-- CreateIndex
CREATE INDEX "admins_firstName_lastName_email_id_idx" ON "public"."admins"("firstName", "lastName", "email", "id");
