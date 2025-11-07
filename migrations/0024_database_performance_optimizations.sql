-- Database Performance Optimizations Migration
-- This migration adds performance indexes, query optimization, and monitoring capabilities

-- ==================== COMPOSITE INDEXES FOR COMPLEX QUERIES ====================

-- Authentication audit logs - common query patterns
CREATE INDEX IF NOT EXISTS "idx_auth_audit_user_time_range" 
  ON "authentication_audit_logs" ("user_id", "created_at" DESC, "action");

CREATE INDEX IF NOT EXISTS "idx_auth_audit_failed_by_ip" 
  ON "authentication_audit_logs" ("ip_address", "created_at" DESC) 
  WHERE "success" = false;

CREATE INDEX IF NOT EXISTS "idx_auth_audit_recent_failures" 
  ON "authentication_audit_logs" ("user_email", "created_at" DESC) 
  WHERE "action" = 'login_failure';

-- User sessions - active session queries
CREATE INDEX IF NOT EXISTS "idx_user_sessions_active_by_user" 
  ON "user_sessions" ("user_id", "last_accessed_at" DESC) 
  WHERE "is_active" = true AND "expires_at" > NOW();

CREATE INDEX IF NOT EXISTS "idx_user_sessions_cleanup" 
  ON "user_sessions" ("expires_at") 
  WHERE "is_active" = true;

-- Token blacklist - fast token validation
CREATE INDEX IF NOT EXISTS "idx_token_blacklist_active" 
  ON "token_blacklist" ("jti", "token_type") 
  WHERE "expires_at" > NOW();

-- Password history - recent password checks
CREATE INDEX IF NOT EXISTS "idx_password_history_recent_by_user" 
  ON "password_history" ("user_id", "created_at" DESC);

-- Users - authentication queries
CREATE INDEX IF NOT EXISTS "idx_users_active_by_role" 
  ON "users" ("role", "is_active", "email_verified");

CREATE INDEX IF NOT EXISTS "idx_users_locked_accounts" 
  ON "users" ("email", "locked_until") 
  WHERE "locked_until" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_users_verification_pending" 
  ON "users" ("email_verified", "created_at") 
  WHERE "email_verified" = false;

-- ==================== SUPPLIER AND STAFF PERFORMANCE INDEXES ====================

-- Supplier profiles - directory and search queries
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_active_featured" 
  ON "supplier_profiles" ("is_active", "is_featured", "rating" DESC);

CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_search" 
  ON "supplier_profiles" ("status", "is_active", "business_name");

CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_membership" 
  ON "supplier_profiles" ("membership_tier", "rating" DESC, "total_sales" DESC);

-- Staff members - permission checks
CREATE INDEX IF NOT EXISTS "idx_staff_members_active_by_role" 
  ON "staff_members" ("supplier_id", "role", "is_active");

-- Products - supplier product queries
CREATE INDEX IF NOT EXISTS "idx_products_supplier_published" 
  ON "products" ("supplier_id", "is_published", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_products_approval_queue" 
  ON "products" ("status", "created_at") 
  WHERE "status" = 'pending_approval';

-- ==================== ORDER AND TRANSACTION INDEXES ====================

-- Orders - supplier order management
CREATE INDEX IF NOT EXISTS "idx_orders_supplier_status_date" 
  ON "orders" ("supplier_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_orders_buyer_status_date" 
  ON "orders" ("buyer_id", "status", "created_at" DESC);

-- Inquiries - response tracking
CREATE INDEX IF NOT EXISTS "idx_inquiries_supplier_pending" 
  ON "inquiries" ("supplier_id", "status", "created_at" DESC) 
  WHERE "status" = 'pending';

CREATE INDEX IF NOT EXISTS "idx_inquiries_buyer_active" 
  ON "inquiries" ("buyer_id", "status", "created_at" DESC);

-- RFQs - active RFQ queries
CREATE INDEX IF NOT EXISTS "idx_rfqs_active" 
  ON "rfqs" ("status", "created_at" DESC) 
  WHERE "status" = 'open';

CREATE INDEX IF NOT EXISTS "idx_rfqs_buyer_active" 
  ON "rfqs" ("buyer_id", "status", "expires_at");

-- ==================== COMMUNICATION INDEXES ====================

-- Conversations - active conversation queries
CREATE INDEX IF NOT EXISTS "idx_conversations_buyer_active" 
  ON "conversations" ("buyer_id", "status", "last_message_at" DESC) 
  WHERE "status" = 'active';

CREATE INDEX IF NOT EXISTS "idx_conversations_supplier_active" 
  ON "conversations" ("supplier_id", "status", "last_message_at" DESC) 
  WHERE "status" = 'active';

-- Messages - conversation message queries
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_time" 
  ON "messages" ("conversation_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_unread" 
  ON "messages" ("conversation_id", "is_read") 
  WHERE "is_read" = false;

-- Notifications - user notification queries
CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" 
  ON "notifications" ("user_id", "created_at" DESC) 
  WHERE "read" = false;

CREATE INDEX IF NOT EXISTS "idx_notifications_user_recent" 
  ON "notifications" ("user_id", "created_at" DESC);

-- ==================== ANALYTICS AND REPORTING INDEXES ====================

-- Activity logs - admin activity tracking
CREATE INDEX IF NOT EXISTS "idx_activity_logs_admin_recent" 
  ON "activity_logs" ("admin_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity" 
  ON "activity_logs" ("entity_type", "entity_id", "created_at" DESC);

-- System alerts - alert management
CREATE INDEX IF NOT EXISTS "idx_system_alerts_unresolved" 
  ON "system_alerts" ("severity", "created_at" DESC) 
  WHERE "resolved" = false;

CREATE INDEX IF NOT EXISTS "idx_system_alerts_unacknowledged" 
  ON "system_alerts" ("severity", "created_at" DESC) 
  WHERE "acknowledged" = false;

-- ==================== FULL TEXT SEARCH INDEXES ====================

-- Add GIN indexes for text search on key tables
CREATE INDEX IF NOT EXISTS "idx_products_name_search" 
  ON "products" USING gin(to_tsvector('english', "name"));

CREATE INDEX IF NOT EXISTS "idx_products_description_search" 
  ON "products" USING gin(to_tsvector('english', COALESCE("description", '')));

CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_business_search" 
  ON "supplier_profiles" USING gin(to_tsvector('english', "business_name"));

-- ==================== STATISTICS AND VACUUM SETTINGS ====================

-- Update statistics targets for frequently queried columns
ALTER TABLE "users" ALTER COLUMN "email" SET STATISTICS 1000;
ALTER TABLE "users" ALTER COLUMN "role" SET STATISTICS 1000;
ALTER TABLE "authentication_audit_logs" ALTER COLUMN "user_id" SET STATISTICS 1000;
ALTER TABLE "authentication_audit_logs" ALTER COLUMN "action" SET STATISTICS 1000;
ALTER TABLE "supplier_profiles" ALTER COLUMN "status" SET STATISTICS 1000;
ALTER TABLE "products" ALTER COLUMN "supplier_id" SET STATISTICS 1000;
ALTER TABLE "orders" ALTER COLUMN "supplier_id" SET STATISTICS 1000;
ALTER TABLE "orders" ALTER COLUMN "buyer_id" SET STATISTICS 1000;

-- ==================== TABLE COMMENTS FOR DOCUMENTATION ====================

COMMENT ON INDEX "idx_auth_audit_user_time_range" IS 'Optimizes user authentication history queries';
COMMENT ON INDEX "idx_user_sessions_active_by_user" IS 'Fast lookup of active user sessions';
COMMENT ON INDEX "idx_supplier_profiles_active_featured" IS 'Optimizes supplier directory queries';
COMMENT ON INDEX "idx_products_supplier_published" IS 'Fast supplier product listing';
COMMENT ON INDEX "idx_orders_supplier_status_date" IS 'Optimizes supplier order management queries';
COMMENT ON INDEX "idx_conversations_buyer_active" IS 'Fast active conversation lookup for buyers';
COMMENT ON INDEX "idx_notifications_user_unread" IS 'Quick unread notification count';

-- ==================== ANALYZE TABLES ====================

-- Update table statistics for query planner
ANALYZE "users";
ANALYZE "authentication_audit_logs";
ANALYZE "password_history";
ANALYZE "token_blacklist";
ANALYZE "user_sessions";
ANALYZE "supplier_profiles";
ANALYZE "staff_members";
ANALYZE "buyers";
ANALYZE "products";
ANALYZE "orders";
ANALYZE "inquiries";
ANALYZE "rfqs";
ANALYZE "conversations";
ANALYZE "messages";
ANALYZE "notifications";
