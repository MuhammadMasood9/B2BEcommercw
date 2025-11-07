-- Enhanced Database Schema Migration
-- This migration adds missing indexes, constraints, and optimizations for the authentication system

-- ==================== AUDIT LOGS TABLE ENHANCEMENTS ====================
-- Ensure audit logs table has proper indexes (already created in 0020, but adding if missing)
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_email" ON "authentication_audit_logs" ("user_email");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_role" ON "authentication_audit_logs" ("user_role");
CREATE INDEX IF NOT EXISTS "idx_auth_audit_session_id" ON "authentication_audit_logs" ("session_id");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_action" ON "authentication_audit_logs" ("user_id", "action", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_auth_audit_ip_action" ON "authentication_audit_logs" ("ip_address", "action", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_auth_audit_failed_logins" ON "authentication_audit_logs" ("user_email", "action", "success") WHERE action = 'login_attempt' AND success = false;

-- ==================== USER TABLE ENHANCEMENTS ====================
-- Add composite indexes for common authentication queries
CREATE INDEX IF NOT EXISTS "idx_users_email_active" ON "users" ("email", "is_active");
CREATE INDEX IF NOT EXISTS "idx_users_role_active" ON "users" ("role", "is_active");
CREATE INDEX IF NOT EXISTS "idx_users_email_verified_active" ON "users" ("email_verified", "is_active");

-- Index for password reset token lookup
CREATE INDEX IF NOT EXISTS "idx_users_password_reset_token" ON "users" ("password_reset_token") WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_users_email_verification_token" ON "users" ("email_verification_token") WHERE email_verification_token IS NOT NULL;

-- Index for account lockout queries
CREATE INDEX IF NOT EXISTS "idx_users_locked_accounts" ON "users" ("locked_until") WHERE locked_until IS NOT NULL AND locked_until > NOW();

-- ==================== PASSWORD HISTORY ENHANCEMENTS ====================
-- Composite index for password history lookup
CREATE INDEX IF NOT EXISTS "idx_password_history_user_recent" ON "password_history" ("user_id", "created_at" DESC);

-- ==================== TOKEN BLACKLIST ENHANCEMENTS ====================
-- Composite index for token validation
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_jti_expires" ON "token_blacklist" ("jti", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_user_type" ON "token_blacklist" ("user_id", "token_type");

-- ==================== USER SESSIONS ENHANCEMENTS ====================
-- Composite indexes for session management
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_active" ON "user_sessions" ("user_id", "is_active", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_refresh_token" ON "user_sessions" ("refresh_token_jti") WHERE refresh_token_jti IS NOT NULL;

-- ==================== STAFF MEMBERS TABLE ENHANCEMENTS ====================
-- Ensure staff members table has proper indexes
CREATE INDEX IF NOT EXISTS "idx_staff_members_supplier_active" ON "staff_members" ("supplier_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_staff_members_email_active" ON "staff_members" ("email", "is_active");

-- ==================== VERIFICATION DOCUMENTS ENHANCEMENTS ====================
-- Composite indexes for verification document queries
CREATE INDEX IF NOT EXISTS "idx_verification_docs_supplier_status" ON "verification_documents" ("supplier_id", "status");
CREATE INDEX IF NOT EXISTS "idx_verification_docs_supplier_type" ON "verification_documents" ("supplier_id", "document_type");

-- ==================== SUPPLIER PROFILES ENHANCEMENTS ====================
-- Additional indexes for supplier queries
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_user_status" ON "supplier_profiles" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_status_active" ON "supplier_profiles" ("status", "is_active");
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_pending_approval" ON "supplier_profiles" ("status", "created_at") WHERE status = 'pending';

-- ==================== BUYERS TABLE ENHANCEMENTS ====================
-- Ensure buyers table has proper indexes
CREATE INDEX IF NOT EXISTS "idx_buyers_user_id" ON "buyers" ("user_id");

-- ==================== DATA VALIDATION CONSTRAINTS ====================
-- Note: Constraints are added with error suppression to handle existing constraints

-- Email format validation (basic check) - skip if exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_format_check') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_email_format_check" 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Ensure login attempts is non-negative - skip if exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_login_attempts_check') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_login_attempts_check" 
      CHECK (login_attempts >= 0);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==================== PERFORMANCE OPTIMIZATION FUNCTIONS ====================

-- Function to cleanup expired authentication data (enhanced version)
CREATE OR REPLACE FUNCTION cleanup_authentication_data_enhanced() RETURNS void AS $
BEGIN
  -- Remove expired blacklisted tokens
  DELETE FROM "token_blacklist" WHERE "expires_at" < NOW();
  
  -- Remove old audit logs (keep 90 days)
  DELETE FROM "authentication_audit_logs" WHERE "created_at" < NOW() - INTERVAL '90 days';
  
  -- Remove old password history (keep last 5 per user)
  DELETE FROM "password_history" 
  WHERE "id" NOT IN (
    SELECT "id" FROM (
      SELECT "id", ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "created_at" DESC) as rn
      FROM "password_history"
    ) ranked WHERE rn <= 5
  );
  
  -- Remove expired sessions
  DELETE FROM "user_sessions" WHERE "expires_at" < NOW();
  
  -- Clear expired password reset tokens
  UPDATE "users" 
  SET "password_reset_token" = NULL, "password_reset_expires" = NULL
  WHERE "password_reset_expires" < NOW();
  
  -- Clear expired email verification tokens
  UPDATE "users" 
  SET "email_verification_token" = NULL, "email_verification_expires" = NULL
  WHERE "email_verification_expires" < NOW();
  
  -- Unlock accounts where lockout period has expired
  UPDATE "users" 
  SET "locked_until" = NULL, "login_attempts" = 0
  WHERE "locked_until" < NOW();
  
  RAISE NOTICE 'Authentication data cleanup completed';
END;
$ LANGUAGE plpgsql;

-- Function to get user authentication statistics
CREATE OR REPLACE FUNCTION get_user_auth_stats(p_user_id VARCHAR) 
RETURNS TABLE (
  total_logins BIGINT,
  failed_logins BIGINT,
  last_login TIMESTAMP,
  last_failed_login TIMESTAMP,
  active_sessions BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM "authentication_audit_logs" 
     WHERE "user_id" = p_user_id AND "action" = 'login_success') as total_logins,
    (SELECT COUNT(*) FROM "authentication_audit_logs" 
     WHERE "user_id" = p_user_id AND "action" = 'login_failure') as failed_logins,
    (SELECT MAX("created_at") FROM "authentication_audit_logs" 
     WHERE "user_id" = p_user_id AND "action" = 'login_success') as last_login,
    (SELECT MAX("created_at") FROM "authentication_audit_logs" 
     WHERE "user_id" = p_user_id AND "action" = 'login_failure') as last_failed_login,
    (SELECT COUNT(*) FROM "user_sessions" 
     WHERE "user_id" = p_user_id AND "is_active" = true AND "expires_at" > NOW()) as active_sessions;
END;
$ LANGUAGE plpgsql;

-- Function to detect suspicious authentication activity
CREATE OR REPLACE FUNCTION detect_suspicious_auth_activity(p_time_window_minutes INTEGER DEFAULT 15)
RETURNS TABLE (
  user_email VARCHAR,
  user_id VARCHAR,
  failed_attempts BIGINT,
  unique_ips BIGINT,
  first_attempt TIMESTAMP,
  last_attempt TIMESTAMP
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    aal.user_email,
    aal.user_id,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT aal.ip_address) as unique_ips,
    MIN(aal.created_at) as first_attempt,
    MAX(aal.created_at) as last_attempt
  FROM "authentication_audit_logs" aal
  WHERE 
    aal.action = 'login_failure' 
    AND aal.created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
  GROUP BY aal.user_email, aal.user_id
  HAVING COUNT(*) >= 5
  ORDER BY failed_attempts DESC;
END;
$ LANGUAGE plpgsql;

-- ==================== TRIGGERS FOR DATA INTEGRITY ====================

-- Trigger to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_timestamp
  BEFORE UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_timestamp();

-- Trigger to update supplier profile timestamp
CREATE OR REPLACE FUNCTION update_supplier_profile_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_profile_timestamp
  BEFORE UPDATE ON "supplier_profiles"
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_profile_timestamp();

-- Trigger to update staff member timestamp
CREATE OR REPLACE FUNCTION update_staff_member_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_staff_member_timestamp
  BEFORE UPDATE ON "staff_members"
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_member_timestamp();

-- Trigger to log authentication events automatically
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $
BEGIN
  -- Log when user is locked
  IF NEW.locked_until IS NOT NULL AND (OLD.locked_until IS NULL OR OLD.locked_until != NEW.locked_until) THEN
    INSERT INTO "authentication_audit_logs" (
      user_id, user_email, user_role, action, ip_address, success, metadata
    ) VALUES (
      NEW.id, NEW.email, NEW.role, 'account_locked', '0.0.0.0', true,
      json_build_object('locked_until', NEW.locked_until, 'login_attempts', NEW.login_attempts)
    );
  END IF;
  
  -- Log when user is unlocked
  IF OLD.locked_until IS NOT NULL AND NEW.locked_until IS NULL THEN
    INSERT INTO "authentication_audit_logs" (
      user_id, user_email, user_role, action, ip_address, success, metadata
    ) VALUES (
      NEW.id, NEW.email, NEW.role, 'account_unlocked', '0.0.0.0', true,
      json_build_object('previous_locked_until', OLD.locked_until)
    );
  END IF;
  
  -- Log password changes
  IF NEW.password != OLD.password THEN
    INSERT INTO "authentication_audit_logs" (
      user_id, user_email, user_role, action, ip_address, success, metadata
    ) VALUES (
      NEW.id, NEW.email, NEW.role, 'password_change', '0.0.0.0', true,
      json_build_object('changed_at', NOW())
    );
    
    -- Update password_changed_at
    NEW.password_changed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_user_status_change
  BEFORE UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION log_user_status_change();

-- ==================== VIEWS FOR COMMON QUERIES ====================

-- View for active user sessions
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
  us.id,
  us.user_id,
  u.email,
  u.role,
  us.session_id,
  us.ip_address,
  us.user_agent,
  us.created_at,
  us.last_accessed_at,
  us.expires_at,
  EXTRACT(EPOCH FROM (us.expires_at - NOW())) / 60 as minutes_until_expiry
FROM "user_sessions" us
JOIN "users" u ON us.user_id = u.id
WHERE us.is_active = true AND us.expires_at > NOW();

-- View for pending supplier approvals
CREATE OR REPLACE VIEW pending_supplier_approvals AS
SELECT 
  sp.id,
  sp.user_id,
  u.email,
  sp.business_name,
  sp.store_name,
  sp.contact_person,
  sp.phone,
  sp.country,
  sp.created_at,
  EXTRACT(DAY FROM (NOW() - sp.created_at)) as days_pending,
  (SELECT COUNT(*) FROM "verification_documents" 
   WHERE supplier_id = sp.id) as document_count
FROM "supplier_profiles" sp
JOIN "users" u ON sp.user_id = u.id
WHERE sp.status = 'pending'
ORDER BY sp.created_at ASC;

-- View for recent authentication failures
CREATE OR REPLACE VIEW recent_auth_failures AS
SELECT 
  user_email,
  user_id,
  ip_address,
  action,
  failure_reason,
  created_at,
  user_agent
FROM "authentication_audit_logs"
WHERE 
  success = false 
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- View for user security summary
CREATE OR REPLACE VIEW user_security_summary AS
SELECT 
  u.id,
  u.email,
  u.role,
  u.email_verified,
  u.is_active,
  u.two_factor_enabled,
  u.login_attempts,
  u.locked_until,
  u.last_login_at,
  u.password_changed_at,
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE user_id = u.id AND is_active = true AND expires_at > NOW()) as active_sessions,
  (SELECT COUNT(*) FROM "authentication_audit_logs" 
   WHERE user_id = u.id AND action = 'login_failure' 
   AND created_at > NOW() - INTERVAL '24 hours') as failed_logins_24h,
  (SELECT COUNT(*) FROM "password_history" 
   WHERE user_id = u.id) as password_history_count
FROM "users" u;

-- ==================== GRANT PERMISSIONS ====================
-- Grant execute permissions on functions to application role (if needed)
-- GRANT EXECUTE ON FUNCTION cleanup_authentication_data_enhanced() TO your_app_role;
-- GRANT EXECUTE ON FUNCTION get_user_auth_stats(VARCHAR) TO your_app_role;
-- GRANT EXECUTE ON FUNCTION detect_suspicious_auth_activity(INTEGER) TO your_app_role;

-- ==================== COMMENTS FOR DOCUMENTATION ====================
COMMENT ON TABLE "authentication_audit_logs" IS 'Comprehensive audit log for all authentication events';
COMMENT ON TABLE "password_history" IS 'Stores password history to prevent reuse of recent passwords';
COMMENT ON TABLE "token_blacklist" IS 'Blacklisted JWT tokens for logout and security purposes';
COMMENT ON TABLE "user_sessions" IS 'Active user sessions with refresh token tracking';
COMMENT ON TABLE "staff_members" IS 'Staff members associated with supplier accounts';
COMMENT ON TABLE "verification_documents" IS 'Verification documents uploaded by suppliers during registration';

COMMENT ON FUNCTION cleanup_authentication_data_enhanced() IS 'Cleans up expired tokens, old audit logs, and password history';
COMMENT ON FUNCTION get_user_auth_stats(VARCHAR) IS 'Returns authentication statistics for a specific user';
COMMENT ON FUNCTION detect_suspicious_auth_activity(INTEGER) IS 'Detects suspicious authentication patterns within a time window';

COMMENT ON VIEW active_user_sessions IS 'Shows all currently active user sessions';
COMMENT ON VIEW pending_supplier_approvals IS 'Lists all supplier applications pending admin approval';
COMMENT ON VIEW recent_auth_failures IS 'Shows authentication failures in the last 24 hours';
COMMENT ON VIEW user_security_summary IS 'Comprehensive security summary for each user';
