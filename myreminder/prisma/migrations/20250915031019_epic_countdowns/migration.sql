-- CreateEnum
CREATE TYPE "public"."EpicApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "epicFeaturedAt" TIMESTAMP(3),
ADD COLUMN     "epicTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isEpic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."EpicApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."EpicApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "EpicApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpicApplication_status_createdAt_idx" ON "public"."EpicApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EpicApplication_userId_momentId_key" ON "public"."EpicApplication"("userId", "momentId");

-- CreateIndex
CREATE INDEX "Moment_isEpic_epicFeaturedAt_idx" ON "public"."Moment"("isEpic", "epicFeaturedAt");

-- AddForeignKey
ALTER TABLE "public"."EpicApplication" ADD CONSTRAINT "EpicApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EpicApplication" ADD CONSTRAINT "EpicApplication_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
