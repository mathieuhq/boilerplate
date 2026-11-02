-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "data_export" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" "DataExportStatus" NOT NULL DEFAULT 'PENDING',
    "file_key" TEXT,
    "size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_export_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_export_user_id_created_at_idx" ON "data_export"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "data_export_expires_at_idx" ON "data_export"("expires_at");

-- AddForeignKey
ALTER TABLE "data_export" ADD CONSTRAINT "data_export_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

