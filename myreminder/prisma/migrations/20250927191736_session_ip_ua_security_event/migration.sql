/*
  Warnings:

  - You are about to drop the column `reviewedAt` on the `EpicApplication` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `EpicApplication` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `EpicApplication` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EpicApplication` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EpicApplication` table. All the data in the column will be lost.
  - The `status` column on the `EpicApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `applicantId` to the `EpicApplication` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."EpicStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."SecurityEventType" AS ENUM ('SIGN_IN', 'SIGN_OUT', 'SESSION_REVOKED', 'TWOFA_ENABLED', 'TWOFA_DISABLED', 'EMAIL_CHANGED', 'BACKUP_CODES_VIEWED', 'BACKUP_CODE_USED', 'LINKED_GOOGLE', 'UNLINKED_GOOGLE');

-- DropForeignKey
ALTER TABLE "public"."EpicApplication" DROP CONSTRAINT "EpicApplication_userId_fkey";

-- DropIndex
DROP INDEX "public"."EpicApplication_userId_momentId_key";

-- AlterTable
ALTER TABLE "public"."EpicApplication" DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "tags",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "applicantId" TEXT NOT NULL,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedById" TEXT,
ADD COLUMN     "note" TEXT,
ALTER COLUMN "reason" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."EpicStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "epicCategory" TEXT;

-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- CreateTable
CREATE TABLE "public"."SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SecurityEventType" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "public"."SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EpicApplication_status_createdAt_idx" ON "public"."EpicApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EpicApplication_momentId_status_idx" ON "public"."EpicApplication"("momentId", "status");

-- CreateIndex
CREATE INDEX "Moment_isEpic_epicCategory_idx" ON "public"."Moment"("isEpic", "epicCategory");

-- CreateIndex
CREATE INDEX "Session_userId_lastSeenAt_idx" ON "public"."Session"("userId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "public"."EpicApplication" ADD CONSTRAINT "EpicApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EpicApplication" ADD CONSTRAINT "EpicApplication_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
