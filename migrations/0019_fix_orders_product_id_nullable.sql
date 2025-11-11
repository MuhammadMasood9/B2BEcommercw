-- Make product_id nullable in orders table for RFQ-based orders
-- RFQ orders don't have a direct product_id since they're custom requests

ALTER TABLE "orders" ALTER COLUMN "product_id" DROP NOT NULL;

-- Add comment to clarify
COMMENT ON COLUMN "orders"."product_id" IS 'Product ID - nullable for RFQ-based orders which are custom requests';
