-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "bgmLoop" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bgmUrl" TEXT,
ADD COLUMN     "bgmVolume" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "endSoundKey" TEXT,
ADD COLUMN     "endSoundUrl" TEXT,
ADD COLUMN     "endSoundVolume" INTEGER NOT NULL DEFAULT 80;
