-- AlterEnum
ALTER TYPE "public"."Channel" ADD VALUE 'DISCORD';

-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "discordWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."ReminderJob" ADD COLUMN     "recipientDiscordWebhook" TEXT;
