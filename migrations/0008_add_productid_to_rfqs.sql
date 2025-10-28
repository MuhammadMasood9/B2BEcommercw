-- Add product_id column to rfqs table for product-specific RFQs
ALTER TABLE "rfqs" ADD COLUMN "product_id" varchar;
