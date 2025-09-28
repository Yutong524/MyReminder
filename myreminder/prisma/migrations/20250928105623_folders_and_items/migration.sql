-- CreateTable
CREATE TABLE "public"."Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolderItem" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "alias" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Folder_userId_parentId_idx" ON "public"."Folder"("userId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_parentId_key" ON "public"."Folder"("userId", "name", "parentId");

-- CreateIndex
CREATE INDEX "FolderItem_folderId_sortOrder_idx" ON "public"."FolderItem"("folderId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FolderItem_folderId_momentId_key" ON "public"."FolderItem"("folderId", "momentId");

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderItem" ADD CONSTRAINT "FolderItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderItem" ADD CONSTRAINT "FolderItem_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "public"."Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
