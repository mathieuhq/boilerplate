-- Drop existing foreign key constraints
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_fkey";

-- Drop existing indexes on User table
DROP INDEX IF EXISTS "user_stripeCustomerId_idx";
DROP INDEX IF EXISTS "user_resendContactId_idx";
DROP INDEX IF EXISTS "user_deletedAt_idx";

-- Drop existing indexes on Session table
DROP INDEX IF EXISTS "session_userId_idx";
DROP INDEX IF EXISTS "session_userId_expiresAt_idx";

-- Drop existing indexes on Account table
DROP INDEX IF EXISTS "account_userId_idx";
DROP INDEX IF EXISTS "account_providerId_accountId_idx";
DROP INDEX IF EXISTS "account_userId_providerId_accountId_key";

-- Drop existing indexes on Verification table
DROP INDEX IF EXISTS "verification_identifier_idx";
DROP INDEX IF EXISTS "verification_identifier_expiresAt_idx";

-- Rename User table columns to snake_case
ALTER TABLE "user" RENAME COLUMN "emailVerified" TO "email_verified";
ALTER TABLE "user" RENAME COLUMN "birthDate" TO "birth_date";
ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "user" RENAME COLUMN "stripeCustomerId" TO "stripe_customer_id";
ALTER TABLE "user" RENAME COLUMN "resendContactId" TO "resend_contact_id";
ALTER TABLE "user" RENAME COLUMN "communicationEmails" TO "communication_emails";
ALTER TABLE "user" RENAME COLUMN "marketingEmails" TO "marketing_emails";
ALTER TABLE "user" RENAME COLUMN "socialEmails" TO "social_emails";
ALTER TABLE "user" RENAME COLUMN "securityEmails" TO "security_emails";
ALTER TABLE "user" RENAME COLUMN "notificationType" TO "notification_type";
ALTER TABLE "user" RENAME COLUMN "lastLoginAt" TO "last_login_at";
ALTER TABLE "user" RENAME COLUMN "deletedAt" TO "deleted_at";

-- Rename Session table columns to snake_case
ALTER TABLE "session" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "session" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "session" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "session" RENAME COLUMN "ipAddress" TO "ip_address";
ALTER TABLE "session" RENAME COLUMN "userAgent" TO "user_agent";
ALTER TABLE "session" RENAME COLUMN "userId" TO "user_id";

-- Rename Account table columns to snake_case
ALTER TABLE "account" RENAME COLUMN "accountId" TO "account_id";
ALTER TABLE "account" RENAME COLUMN "providerId" TO "provider_id";
ALTER TABLE "account" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "account" RENAME COLUMN "accessToken" TO "access_token";
ALTER TABLE "account" RENAME COLUMN "refreshToken" TO "refresh_token";
ALTER TABLE "account" RENAME COLUMN "idToken" TO "id_token";
ALTER TABLE "account" RENAME COLUMN "accessTokenExpiresAt" TO "access_token_expires_at";
ALTER TABLE "account" RENAME COLUMN "refreshTokenExpiresAt" TO "refresh_token_expires_at";
ALTER TABLE "account" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "account" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename Verification table columns to snake_case
ALTER TABLE "verification" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "verification" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "verification" RENAME COLUMN "updatedAt" TO "updated_at";

-- Recreate indexes for User table with new column names
CREATE INDEX "user_stripe_customer_id_idx" ON "user"("stripe_customer_id");
CREATE INDEX "user_resend_contact_id_idx" ON "user"("resend_contact_id");
CREATE INDEX "user_deleted_at_idx" ON "user"("deleted_at");

-- Recreate indexes for Session table with new column names
CREATE INDEX "session_user_id_idx" ON "session"("user_id");
CREATE INDEX "session_user_id_expires_at_idx" ON "session"("user_id", "expires_at");

-- Recreate indexes for Account table with new column names
CREATE UNIQUE INDEX "account_user_id_provider_id_account_id_key" ON "account"("user_id", "provider_id", "account_id");
CREATE INDEX "account_user_id_idx" ON "account"("user_id");
CREATE INDEX "account_provider_id_account_id_idx" ON "account"("provider_id", "account_id");

-- Recreate indexes for Verification table with new column names
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "verification_identifier_expires_at_idx" ON "verification"("identifier", "expires_at");

-- Recreate foreign key constraints with new column names
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
