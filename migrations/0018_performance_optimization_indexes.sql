-- ==================== PERFORMANCE OPTIMIZATION INDEXES ====================
-- Additional indexes for improved query performance based on common access patterns

-- ==================== USERS TABLE OPTIMIZATION ====================
-- Index for user authentication and role-based queries
CREATE INDEX IF NOT EXISTS "idx_users_email_role" ON "users"("email", "role");
CREATE INDEX IF NOT EXISTS "idx_users_role_active" ON "users"("role", "is_active");
CREATE INDEX IF NOT EXISTS "idx_users_online_status" ON "users"("is_online", "last_seen");

-- ==================== PRODUCTS TABLE OPTIMIZATION ====================
-- Composite indexes for product filtering and search
CREATE INDEX IF NOT EXISTS "idx_products_published_category" ON "products"("is_published", "category_id") WHERE "is_published" = true;
CREATE INDEX IF NOT EXISTS "idx_products_supplier_published" ON "products"("supplier_id", "is_published") WHERE "is_published" = true;
CREATE INDEX IF NOT EXISTS "idx_products_featured_published" ON "products"("is_featured", "is_published") WHERE "is_published" = true;

-- Index for product search and sorting
CREATE INDEX IF NOT EXISTS "idx_products_name_trgm" ON "products" USING gin("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_products_views_desc" ON "products"("views" DESC) WHERE "is_published" = true;
CREATE INDEX IF NOT EXISTS "idx_products_created_desc" ON "products"("created_at" DESC) WHERE "is_published" = true;

-- Index for MOQ and pricing queries
CREATE INDEX IF NOT EXISTS "idx_products_moq_range" ON "products"("min_order_quantity") WHERE "is_published" = true;

-- ==================== ORDERS TABLE OPTIMIZATION ====================
-- Indexes for order management and analytics
CREATE INDEX IF NOT EXISTS "idx_orders_buyer_status" ON "orders"("buyer_id", "status");
CREATE INDEX IF NOT EXISTS "idx_orders_supplier_status" ON "orders"("supplier_id", "status");
CREATE INDEX IF NOT EXISTS "idx_orders_status_created" ON "orders"("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders"("payment_status", "status");

-- Index for financial calculations
CREATE INDEX IF NOT EXISTS "idx_orders_total_amount" ON "orders"("total_amount") WHERE "status" = 'completed';
CREATE INDEX IF NOT EXISTS "idx_orders_commission" ON "orders"("commission_amount", "supplier_id") WHERE "status" = 'completed';

-- ==================== INQUIRIES TABLE OPTIMIZATION ====================
-- Indexes for inquiry management
CREATE INDEX IF NOT EXISTS "idx_inquiries_supplier_status_created" ON "inquiries"("supplier_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_inquiries_buyer_created" ON "inquiries"("buyer_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_inquiries_product_status" ON "inquiries"("product_id", "status");

-- ==================== QUOTATIONS TABLE OPTIMIZATION ====================
-- Indexes for quotation management
CREATE INDEX IF NOT EXISTS "idx_quotations_supplier_status_created" ON "quotations"("supplier_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_quotations_rfq_status" ON "quotations"("rfq_id", "status");
CREATE INDEX IF NOT EXISTS "idx_quotations_inquiry_status" ON "quotations"("inquiry_id", "status");

-- ==================== RFQs TABLE OPTIMIZATION ====================
-- Indexes for RFQ management and matching
CREATE INDEX IF NOT EXISTS "idx_rfqs_buyer_status_created" ON "rfqs"("buyer_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_rfqs_category_status" ON "rfqs"("category_id", "status") WHERE "status" = 'open';
CREATE INDEX IF NOT EXISTS "idx_rfqs_expires_status" ON "rfqs"("expires_at", "status") WHERE "status" = 'open';

-- ==================== CONVERSATIONS AND MESSAGES OPTIMIZATION ====================
-- Indexes for chat system performance
CREATE INDEX IF NOT EXISTS "idx_conversations_participants" ON "conversations"("buyer_id", "supplier_id", "admin_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_last_message" ON "conversations"("last_message_at" DESC) WHERE "status" = 'active';

CREATE INDEX IF NOT EXISTS "idx_messages_conversation_created" ON "messages"("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_messages_sender_created" ON "messages"("sender_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_messages_unread" ON "messages"("conversation_id", "is_read") WHERE "is_read" = false;

-- ==================== SUPPLIER PROFILES OPTIMIZATION ====================
-- Indexes for supplier directory and search
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_verification" ON "supplier_profiles"("verification_level", "is_verified");
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_country" ON "supplier_profiles"("country", "is_verified");
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_business_type" ON "supplier_profiles"("business_type", "is_verified");

-- Full-text search index for supplier business names
CREATE INDEX IF NOT EXISTS "idx_supplier_profiles_business_name_trgm" ON "supplier_profiles" USING gin("business_name" gin_trgm_ops);

-- ==================== REVIEWS AND FAVORITES OPTIMIZATION ====================
-- Indexes for product reviews and favorites
CREATE INDEX IF NOT EXISTS "idx_reviews_product_rating" ON "reviews"("product_id", "rating", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_reviews_supplier_rating" ON "reviews"("supplier_id", "rating", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_favorites_user_type" ON "favorites"("user_id", "item_type");
CREATE INDEX IF NOT EXISTS "idx_favorites_item_created" ON "favorites"("item_id", "created_at" DESC);

-- ==================== NOTIFICATIONS OPTIMIZATION ====================
-- Indexes for notification system
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id", "read", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_notifications_type_created" ON "notifications"("type", "created_at" DESC);

-- ==================== ACTIVITY LOGS OPTIMIZATION ====================
-- Indexes for admin activity tracking
CREATE INDEX IF NOT EXISTS "idx_activity_logs_admin_created" ON "activity_logs"("admin_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity" ON "activity_logs"("entity_type", "entity_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_activity_logs_action_created" ON "activity_logs"("action", "created_at" DESC);

-- ==================== SYSTEM ALERTS OPTIMIZATION ====================
-- Indexes for alerting system
CREATE INDEX IF NOT EXISTS "idx_system_alerts_severity_created" ON "system_alerts"("severity", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_system_alerts_acknowledged" ON "system_alerts"("acknowledged", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_system_alerts_resolved" ON "system_alerts"("resolved", "created_at" DESC);

-- ==================== PARTIAL INDEXES FOR BETTER PERFORMANCE ====================
-- Partial indexes for commonly filtered data

-- Active products only
CREATE INDEX IF NOT EXISTS "idx_products_active_category" ON "products"("category_id", "created_at" DESC) 
  WHERE "is_published" = true AND "status" = 'approved';

-- Pending orders only
CREATE INDEX IF NOT EXISTS "idx_orders_pending_created" ON "orders"("created_at" DESC) 
  WHERE "status" IN ('pending', 'confirmed', 'processing');

-- Open RFQs only
CREATE INDEX IF NOT EXISTS "idx_rfqs_open_category" ON "rfqs"("category_id", "created_at" DESC) 
  WHERE "status" = 'open' AND "expires_at" > NOW();

-- Unread messages only
CREATE INDEX IF NOT EXISTS "idx_messages_unread_conversation" ON "messages"("conversation_id", "created_at" DESC) 
  WHERE "is_read" = false;

-- ==================== ENABLE EXTENSIONS FOR BETTER PERFORMANCE ====================
-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable btree_gin extension for composite indexes (if not already enabled)
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ==================== UPDATE TABLE STATISTICS ====================
-- Update statistics for better query planning
ANALYZE "users";
ANALYZE "products";
ANALYZE "orders";
ANALYZE "inquiries";
ANALYZE "quotations";
ANALYZE "rfqs";
ANALYZE "conversations";
ANALYZE "messages";
ANALYZE "supplier_profiles";
ANALYZE "reviews";
ANALYZE "favorites";
ANALYZE "notifications";
ANALYZE "activity_logs";
ANALYZE "system_alerts";

-- ==================== COMMENTS ====================
COMMENT ON INDEX "idx_products_name_trgm" IS 'Trigram index for fuzzy product name search';
COMMENT ON INDEX "idx_supplier_profiles_business_name_trgm" IS 'Trigram index for fuzzy supplier business name search';
COMMENT ON INDEX "idx_products_active_category" IS 'Partial index for active products by category';
COMMENT ON INDEX "idx_orders_pending_created" IS 'Partial index for pending orders';
COMMENT ON INDEX "idx_rfqs_open_category" IS 'Partial index for open RFQs by category';

-- Performance optimization migration completed