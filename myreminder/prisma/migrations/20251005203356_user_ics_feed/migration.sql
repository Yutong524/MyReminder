/*
  Warnings:

  - A unique constraint covering the columns `[icsToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "icsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icsIncludeFollowing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icsTimezone" TEXT,
ADD COLUMN     "icsToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_icsToken_key" ON "public"."User"("icsToken");
