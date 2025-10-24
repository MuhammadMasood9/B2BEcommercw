-- Migration: Add notifications and activity_logs tables
-- Created: 2024-01-26

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"related_id" varchar,
	"related_type" text,
	"created_at" timestamp DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"admin_id" varchar NOT NULL,
	"admin_name" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar,
	"entity_name" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_notifications_related" ON "notifications" ("related_id", "related_type");

CREATE INDEX IF NOT EXISTS "idx_activity_logs_admin_id" ON "activity_logs" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity_type" ON "activity_logs" ("entity_type");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "activity_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_entity" ON "activity_logs" ("entity_id", "entity_type");
