/*
  Warnings:

  - The `language` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'FR', 'DE', 'ES', 'PT', 'RU', 'JA', 'KO', 'ZH');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN';
