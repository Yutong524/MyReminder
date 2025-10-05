/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."FolderRole" AS ENUM ('VIEWER', 'EDITOR', 'OWNER');

-- AlterTable
ALTER TABLE "public"."Folder" ADD COLUMN     "publicEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "publicUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."FolderMember" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."FolderRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolderMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FolderMember_userId_role_idx" ON "public"."FolderMember"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "FolderMember_folderId_userId_key" ON "public"."FolderMember"("folderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_publicToken_key" ON "public"."Folder"("publicToken");

-- CreateIndex
CREATE INDEX "Folder_publicEnabled_idx" ON "public"."Folder"("publicEnabled");

-- AddForeignKey
ALTER TABLE "public"."FolderMember" ADD CONSTRAINT "FolderMember_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderMember" ADD CONSTRAINT "FolderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
