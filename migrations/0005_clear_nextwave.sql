CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"related_id" varchar,
	"related_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "unread_count_admin" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "unread_count_admin" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "unread_count_admin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "unit_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "unread_count_supplier" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "product_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rfq_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "supplier_id" varchar;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "supplier_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "supplier_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "product_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_online" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen" timestamp;--> statement-breakpoint
ALTER TABLE "quotations" DROP COLUMN "rejection_reason";