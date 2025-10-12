-- CreateEnum
CREATE TYPE "LanguageDirection" AS ENUM ('ltr', 'rtl');
CREATE TYPE "DefaultOption" AS ENUM ('YES', 'NO');

-- AlterTable for Languages
ALTER TABLE "languages"
ADD COLUMN "publicId" TEXT,
ADD COLUMN "direction" TEXT DEFAULT 'ltr',
ADD COLUMN "flagImage" TEXT,
ADD COLUMN "isDefault" TEXT DEFAULT 'NO',
ADD COLUMN "status" BOOLEAN DEFAULT true;

-- Update existing languages to have publicIds
UPDATE "languages" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

-- Make publicId not null and unique
ALTER TABLE "languages" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "languages_publicId_key" ON "languages"("publicId");

-- Create indexes for languages
CREATE INDEX "languages_code_idx" ON "languages"("code");
CREATE INDEX "languages_isDefault_idx" ON "languages"("isDefault");
CREATE INDEX "languages_status_idx" ON "languages"("status");
CREATE INDEX "languages_status_isDefault_idx" ON "languages"("status", "isDefault");

-- CreateTable for ManageDropdowns
CREATE TABLE "manage_dropdowns" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uniqueCode" INTEGER,
    "dropdownType" TEXT NOT NULL,
    "countryShortCode" TEXT,
    "isDefault" TEXT,
    "languageId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manage_dropdowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for ManageDropdowns
CREATE UNIQUE INDEX "manage_dropdowns_publicId_key" ON "manage_dropdowns"("publicId");
CREATE INDEX "manage_dropdowns_dropdownType_idx" ON "manage_dropdowns"("dropdownType");
CREATE INDEX "manage_dropdowns_languageId_idx" ON "manage_dropdowns"("languageId");
CREATE INDEX "manage_dropdowns_status_idx" ON "manage_dropdowns"("status");
CREATE INDEX "manage_dropdowns_dropdownType_languageId_idx" ON "manage_dropdowns"("dropdownType", "languageId");
CREATE INDEX "manage_dropdowns_dropdownType_status_idx" ON "manage_dropdowns"("dropdownType", "status");
CREATE INDEX "manage_dropdowns_countryShortCode_idx" ON "manage_dropdowns"("countryShortCode");
CREATE INDEX "manage_dropdowns_publicId_idx" ON "manage_dropdowns"("publicId");

-- AddForeignKey for ManageDropdowns
ALTER TABLE "manage_dropdowns" ADD CONSTRAINT "manage_dropdowns_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Set default language if none exists
INSERT INTO "languages" ("id", "publicId", "name", "code", "direction", "isDefault", "status", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    'English',
    'en',
    'ltr',
    'YES',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "languages" WHERE "isDefault" = 'YES');

-- Sample dropdown data
INSERT INTO "manage_dropdowns" ("id", "publicId", "name", "uniqueCode", "dropdownType", "languageId", "isDefault", "status", "useCount", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    'Technology',
    1,
    'industry',
    l.id,
    'YES',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "languages" l
WHERE l.code = 'en' AND l.status = true
ON CONFLICT DO NOTHING;

INSERT INTO "manage_dropdowns" ("id", "publicId", "name", "uniqueCode", "dropdownType", "languageId", "isDefault", "status", "useCount", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    'Healthcare',
    2,
    'industry',
    l.id,
    'NO',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "languages" l
WHERE l.code = 'en' AND l.status = true
ON CONFLICT DO NOTHING;

INSERT INTO "manage_dropdowns" ("id", "publicId", "name", "uniqueCode", "dropdownType", "languageId", "isDefault", "status", "useCount", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    'Finance',
    3,
    'industry',
    l.id,
    'NO',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "languages" l
WHERE l.code = 'en' AND l.status = true
ON CONFLICT DO NOTHING;