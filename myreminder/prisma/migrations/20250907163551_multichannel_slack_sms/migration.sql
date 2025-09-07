-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Channel" ADD VALUE 'SLACK';
ALTER TYPE "public"."Channel" ADD VALUE 'SMS';

-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "slackWebhookUrl" TEXT,
ADD COLUMN     "smsPhone" TEXT;

-- AlterTable
ALTER TABLE "public"."ReminderJob" ADD COLUMN     "channel" "public"."Channel" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "recipientSlackWebhook" TEXT,
ALTER COLUMN "recipientEmail" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ReminderJob_channel_status_scheduledAt_idx" ON "public"."ReminderJob"("channel", "status", "scheduledAt");
