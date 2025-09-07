-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "cheerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notifyOnCheer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnNote" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Cheer" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cheer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuestbookEntry" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "name" TEXT,
    "message" TEXT NOT NULL,
    "ipHash" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cheer_momentId_ipHash_createdAt_idx" ON "public"."Cheer"("momentId", "ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "GuestbookEntry_momentId_createdAt_idx" ON "public"."GuestbookEntry"("momentId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Cheer" ADD CONSTRAINT "Cheer_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuestbookEntry" ADD CONSTRAINT "GuestbookEntry_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
