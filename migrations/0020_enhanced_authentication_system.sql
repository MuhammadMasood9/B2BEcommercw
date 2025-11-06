-- Enhanced Authentication System Migration
-- This migration adds tables for token blacklisting, audit logging, and password security

-- ==================== TOKEN BLACKLIST TABLE ====================
CREATE TABLE IF NOT EXISTS "token_blacklist" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "jti" varchar NOT NULL UNIQUE,
  "user_id" varchar NOT NULL,
  "token_type" varchar NOT NULL DEFAULT 'access', -- 'access', 'refresh'
  "expires_at" timestamp NOT NULL,
  "blacklisted_at" timestamp DEFAULT now(),
  "reason" varchar DEFAULT 'logout' -- 'logout', 'security', 'expired', 'revoked'
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_jti" ON "token_blacklist" ("jti");
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_expires" ON "token_blacklist" ("expires_at");

-- ==================== AUTHENTICATION AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS "authentication_audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar,
  "user_email" varchar,
  "user_role" varchar,
  "action" varchar NOT NULL, -- 'login_attempt', 'login_success', 'login_failure', 'logout', 'token_refresh', 'password_change', 'account_locked', 'account_unlocked'
  "ip_address" varchar NOT NULL,
  "user_agent" text,
  "session_id" varchar,
  "token_jti" varchar,
  "success" boolean NOT NULL DEFAULT false,
  "failure_reason" varchar,
  "metadata" json DEFAULT '{}',
  "created_at" timestamp DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_id" ON "authentication_audit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_action" ON "authentication_audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_created_at" ON "authentication_audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_ip_address" ON "authentication_audit_logs" ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_success" ON "authentication_audit_logs" ("success");

-- ==================== PASSWORD HISTORY TABLE ====================
CREATE TABLE IF NOT EXISTS "password_history" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Index for password history lookup
CREATE INDEX IF NOT EXISTS "idx_password_history_user_id" ON "password_history" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_history_created_at" ON "password_history" ("created_at");

-- ==================== ENHANCE USERS TABLE ====================
-- Add security fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_ip" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "login_attempts" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" varchar;

-- ==================== SESSION MANAGEMENT TABLE ====================
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "session_id" varchar NOT NULL UNIQUE,
  "refresh_token_jti" varchar,
  "ip_address" varchar,
  "user_agent" text,
  "is_active" boolean DEFAULT true,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "last_accessed_at" timestamp DEFAULT now()
);

-- Indexes for session management
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_session_id" ON "user_sessions" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_is_active" ON "user_sessions" ("is_active");

-- ==================== CLEANUP POLICIES ====================
-- Create function to cleanup expired tokens and old audit logs
CREATE OR REPLACE FUNCTION cleanup_authentication_data() RETURNS void AS $$
BEGIN
  -- Remove expired blacklisted tokens
  DELETE FROM "token_blacklist" WHERE "expires_at" < now();
  
  -- Remove old audit logs (keep 90 days)
  DELETE FROM "authentication_audit_logs" WHERE "created_at" < now() - interval '90 days';
  
  -- Remove old password history (keep last 5 per user)
  DELETE FROM "password_history" 
  WHERE "id" NOT IN (
    SELECT "id" FROM (
      SELECT "id", ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "created_at" DESC) as rn
      FROM "password_history"
    ) ranked WHERE rn <= 5
  );
  
  -- Remove expired sessions
  DELETE FROM "user_sessions" WHERE "expires_at" < now();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_email_verified" ON "users" ("email_verified");
CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "idx_users_locked_until" ON "users" ("locked_until");
CREATE INDEX IF NOT EXISTS "idx_users_login_attempts" ON "users" ("login_attempts");