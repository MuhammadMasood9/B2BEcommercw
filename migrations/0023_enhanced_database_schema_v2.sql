-- Enhanced Database Schema Migration V2
-- This migration adds missing indexes and optimizations for the authentication system

-- ==================== AUDIT LOGS TABLE ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_email" ON "authentication_audit_logs" ("user_email");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_role" ON "authentication_audit_logs" ("user_role");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_session_id" ON "authentication_audit_logs" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_action" ON "authentication_audit_logs" ("user_id", "action", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_auth_audit_ip_action" ON "authentication_audit_logs" ("ip_address", "action", "created_at" DESC);

-- ==================== USER TABLE ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_users_email_active" ON "users" ("email", "is_active");
CREATE INDEX IF NOT EXISTS "idx_users_role_active" ON "users" ("role", "is_active");
CREATE INDEX IF NOT EXISTS "idx_users_email_verified_active" ON "users" ("email_verified", "is_active");

-- ==================== PASSWORD HISTORY ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_password_history_user_recent" ON "password_history" ("user_id", "created_at" DESC);

-- ==================== TOKEN BLACKLIST ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_jti_expires" ON "token_blacklist" ("jti", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_user_type" ON "token_blacklist" ("user_id", "token_type");

-- ==================== USER SESSIONS ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_active" ON "user_sessions" ("user_id", "is_active", "expires_at");

-- ==================== STAFF MEMBERS TABLE ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_staff_members_supplier_active" ON "staff_members" ("supplier_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_staff_members_email_active" ON "staff_members" ("email", "is_active");

-- ==================== SUPPLIER PROFILES ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_user_status" ON "supplier_profiles" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_status_active" ON "supplier_profiles" ("status", "is_active");

-- ==================== BUYERS TABLE ENHANCEMENTS ====================
CREATE INDEX IF NOT EXISTS "idx_buyers_user_id" ON "buyers" ("user_id");

-- ==================== COMMENTS FOR DOCUMENTATION ====================
COMMENT ON TABLE authentication_audit_logs IS 'Comprehensive audit log for all authentication events';
COMMENT ON TABLE password_history IS 'Stores password history to prevent reuse of recent passwords';
COMMENT ON TABLE token_blacklist IS 'Blacklisted JWT tokens for logout and security purposes';
COMMENT ON TABLE user_sessions IS 'Active user sessions with refresh token tracking';
COMMENT ON TABLE staff_members IS 'Staff members associated with supplier accounts';
