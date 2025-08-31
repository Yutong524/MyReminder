-- CreateEnum
CREATE TYPE "public"."Channel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELED', 'SKIPPED');

-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "ownerEmail" TEXT;

-- CreateTable
CREATE TABLE "public"."ReminderRule" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "channel" "public"."Channel" NOT NULL DEFAULT 'EMAIL',
    "offsetMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReminderJob" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryLog" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderJob_status_scheduledAt_idx" ON "public"."ReminderJob"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "public"."ReminderRule" ADD CONSTRAINT "ReminderRule_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderJob" ADD CONSTRAINT "ReminderJob_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderJob" ADD CONSTRAINT "ReminderJob_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."ReminderRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLog" ADD CONSTRAINT "DeliveryLog_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLog" ADD CONSTRAINT "DeliveryLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."ReminderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
