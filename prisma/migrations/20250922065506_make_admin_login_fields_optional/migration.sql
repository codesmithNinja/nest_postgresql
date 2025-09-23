-- AlterTable
ALTER TABLE "public"."admins" ALTER COLUMN "loginIpAddress" DROP NOT NULL,
ALTER COLUMN "currentLoginDateTime" DROP NOT NULL,
ALTER COLUMN "lastLoginDateTime" DROP NOT NULL;
