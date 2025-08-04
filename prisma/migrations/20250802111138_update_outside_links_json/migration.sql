/*
  Warnings:

  - Made the column `outsideLinks` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "outsideLinks" SET NOT NULL,
ALTER COLUMN "outsideLinks" SET DEFAULT '[]';
