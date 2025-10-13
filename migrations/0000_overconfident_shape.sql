CREATE TABLE "buyer_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" text,
	"full_name" text,
	"phone" text,
	"country" text,
	"industry" text,
	"buying_preferences" json,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" varchar,
	"image_url" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"unread_count_buyer" integer DEFAULT 0,
	"unread_count_admin" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"phone" text,
	"country" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"is_verified" boolean DEFAULT false,
	"account_type" text DEFAULT 'buyer',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"target_price" numeric(10, 2),
	"message" text,
	"requirements" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"message" text NOT NULL,
	"attachments" text[],
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"buyer_id" varchar,
	"customer_id" varchar,
	"status" text DEFAULT 'pending',
	"total_amount" numeric(10, 2) NOT NULL,
	"shipping_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"items" json NOT NULL,
	"shipping_address" json,
	"billing_address" json,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending',
	"tracking_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text,
	"description" text,
	"category_id" varchar,
	"specifications" json,
	"images" text[],
	"videos" text[],
	"min_order_quantity" integer DEFAULT 1 NOT NULL,
	"price_ranges" json,
	"sample_available" boolean DEFAULT false,
	"sample_price" numeric(10, 2),
	"customization_available" boolean DEFAULT false,
	"lead_time" text,
	"port" text,
	"payment_terms" text[],
	"in_stock" boolean DEFAULT true,
	"stock_quantity" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"views" integer DEFAULT 0,
	"inquiries" integer DEFAULT 0,
	"tags" text[],
	"sku" text,
	"meta_data" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" varchar NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"buyer_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"order_reference" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"title" text NOT NULL,
	"category_id" varchar,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"target_price" numeric(10, 2),
	"delivery_location" text,
	"expected_date" timestamp,
	"attachments" text[],
	"status" text DEFAULT 'open',
	"quotations_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company_name" text,
	"phone" text,
	"role" text DEFAULT 'buyer' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
