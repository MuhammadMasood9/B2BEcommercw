-- Create verification documents table for supplier registration
CREATE TABLE IF NOT EXISTS "verification_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "verification_documents_supplier_id_idx" ON "verification_documents" ("supplier_id");
CREATE INDEX IF NOT EXISTS "verification_documents_status_idx" ON "verification_documents" ("status");
CREATE INDEX IF NOT EXISTS "verification_documents_document_type_idx" ON "verification_documents" ("document_type");

-- Add foreign key constraint to supplier profiles
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_supplier_id_fkey" 
FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE;