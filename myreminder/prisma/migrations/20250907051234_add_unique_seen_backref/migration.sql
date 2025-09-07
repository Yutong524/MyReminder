-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "uniques" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."ViewDay" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniques" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferrerStat" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferrerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UniqueSeen" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniqueSeen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewDay_momentId_day_idx" ON "public"."ViewDay"("momentId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ViewDay_momentId_day_key" ON "public"."ViewDay"("momentId", "day");

-- CreateIndex
CREATE INDEX "ReferrerStat_momentId_count_idx" ON "public"."ReferrerStat"("momentId", "count");

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerStat_momentId_host_key" ON "public"."ReferrerStat"("momentId", "host");

-- CreateIndex
CREATE INDEX "UniqueSeen_momentId_day_idx" ON "public"."UniqueSeen"("momentId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "UniqueSeen_momentId_day_ipHash_key" ON "public"."UniqueSeen"("momentId", "day", "ipHash");

-- AddForeignKey
ALTER TABLE "public"."ViewDay" ADD CONSTRAINT "ViewDay_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferrerStat" ADD CONSTRAINT "ReferrerStat_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniqueSeen" ADD CONSTRAINT "UniqueSeen_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
