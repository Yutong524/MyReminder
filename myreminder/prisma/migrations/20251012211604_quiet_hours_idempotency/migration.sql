/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `ReminderJob` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."ReminderJob" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "quietDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "quietEndMin" INTEGER,
ADD COLUMN     "quietStartMin" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ReminderJob_idempotencyKey_key" ON "public"."ReminderJob"("idempotencyKey");
