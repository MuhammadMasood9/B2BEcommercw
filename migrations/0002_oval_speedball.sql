CREATE TABLE "inquiry_quotations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" varchar NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"moq" integer NOT NULL,
	"lead_time" text,
	"payment_terms" text,
	"valid_until" timestamp,
	"message" text,
	"attachments" text[],
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
