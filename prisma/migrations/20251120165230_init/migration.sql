-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'fr', 'de', 'es', 'pt', 'ru', 'ja', 'ko', 'zh');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('all', 'none', 'mentions');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(11) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" VARCHAR(500),
    "language" "Language" NOT NULL DEFAULT 'en',
    "birth_date" DATE,
    "stripe_customer_id" VARCHAR(255),
    "resend_contact_id" VARCHAR(255),
    "communication_emails" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT true,
    "social_emails" BOOLEAN NOT NULL DEFAULT true,
    "security_emails" BOOLEAN NOT NULL DEFAULT true,
    "notification_type" "NotificationType" NOT NULL DEFAULT 'all',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(11) NOT NULL,
    "user_id" VARCHAR(11) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" VARCHAR(11) NOT NULL,
    "user_id" VARCHAR(11) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "account_id" VARCHAR(255) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "password" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" VARCHAR(11) NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_resend_contact_id_key" ON "users"("resend_contact_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_stripe_customer_id_idx" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "users_resend_contact_id_idx" ON "users"("resend_contact_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "accounts_provider_id_user_id_idx" ON "accounts"("provider_id", "user_id");

-- CreateIndex
CREATE INDEX "accounts_created_at_idx" ON "accounts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_at_idx" ON "verification_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_value_key" ON "verification_tokens"("identifier", "value");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
