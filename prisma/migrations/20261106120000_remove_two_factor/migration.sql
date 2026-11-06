-- DropForeignKey
ALTER TABLE "two_factor" DROP CONSTRAINT "two_factor_user_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "two_factor_enabled";

-- DropTable
DROP TABLE "two_factor";

