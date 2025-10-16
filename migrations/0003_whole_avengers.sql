CREATE TABLE "inquiry_revisions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" varchar NOT NULL,
	"revision_number" integer NOT NULL,
	"quantity" integer NOT NULL,
	"target_price" numeric(10, 2),
	"message" text,
	"requirements" text,
	"status" text DEFAULT 'pending',
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "buyer_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "inquiry_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quotation_id" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantity" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "rejection_reason" text;