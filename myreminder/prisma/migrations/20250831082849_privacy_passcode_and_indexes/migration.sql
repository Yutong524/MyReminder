-- AlterTable
ALTER TABLE "public"."Moment" ADD COLUMN     "passcodeHash" TEXT;

-- CreateIndex
CREATE INDEX "Moment_visibility_idx" ON "public"."Moment"("visibility");
