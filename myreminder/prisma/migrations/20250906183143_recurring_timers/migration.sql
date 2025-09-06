-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rrule" TEXT,
ADD COLUMN     "rtime" TEXT;

-- CreateTable
CREATE TABLE "public"."RecurrenceSkip" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "occurrenceUtc" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurrenceSkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurrenceSkip_momentId_occurrenceUtc_idx" ON "public"."RecurrenceSkip"("momentId", "occurrenceUtc");

-- CreateIndex
CREATE INDEX "Moment_rrule_idx" ON "public"."Moment"("rrule");

-- AddForeignKey
ALTER TABLE "public"."RecurrenceSkip" ADD CONSTRAINT "RecurrenceSkip_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
