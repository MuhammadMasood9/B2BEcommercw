-- Create commissions table for tracking platform revenue
CREATE TABLE IF NOT EXISTS "commissions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL,
  "supplier_id" varchar NOT NULL,
  "order_amount" numeric NOT NULL,
  "commission_rate" numeric NOT NULL,
  "commission_amount" numeric NOT NULL,
  "supplier_amount" numeric NOT NULL,
  "status" varchar DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_order_id_fkey" 
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;

ALTER TABLE "commissions" ADD CONSTRAINT "commissions_supplier_id_fkey" 
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_commissions_order_id" ON "commissions"("order_id");
CREATE INDEX IF NOT EXISTS "idx_commissions_supplier_id" ON "commissions"("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_commissions_status" ON "commissions"("status");
CREATE INDEX IF NOT EXISTS "idx_commissions_created_at" ON "commissions"("created_at");
