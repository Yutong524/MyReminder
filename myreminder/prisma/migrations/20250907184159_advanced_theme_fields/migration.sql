-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "bgBlend" TEXT,
ADD COLUMN     "bgFilters" JSONB,
ADD COLUMN     "bgImageUrl" TEXT,
ADD COLUMN     "bgOpacity" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "bgPosition" TEXT,
ADD COLUMN     "bgSize" TEXT,
ADD COLUMN     "timeColor" TEXT,
ADD COLUMN     "titleColor" TEXT;
