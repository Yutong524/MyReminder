-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SecurityEventType" ADD VALUE 'PUBLIC_LINK_CONFIGURED';
ALTER TYPE "public"."SecurityEventType" ADD VALUE 'MEMBER_INVITED';
ALTER TYPE "public"."SecurityEventType" ADD VALUE 'INVITE_ACCEPTED';

-- AlterTable
ALTER TABLE "public"."Folder" ADD COLUMN     "publicExpiresAt" TIMESTAMP(3),
ADD COLUMN     "publicPasswordHash" TEXT;

-- CreateTable
CREATE TABLE "public"."FolderInvite" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."FolderRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,

    CONSTRAINT "FolderInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderInvite_token_key" ON "public"."FolderInvite"("token");

-- CreateIndex
CREATE INDEX "FolderInvite_folderId_email_idx" ON "public"."FolderInvite"("folderId", "email");

-- AddForeignKey
ALTER TABLE "public"."FolderInvite" ADD CONSTRAINT "FolderInvite_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
