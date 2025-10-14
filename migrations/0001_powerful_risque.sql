ALTER TABLE "products" ADD COLUMN "colors" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sizes" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "key_features" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "customization_details" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "certifications" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_trade_assurance" boolean DEFAULT false;