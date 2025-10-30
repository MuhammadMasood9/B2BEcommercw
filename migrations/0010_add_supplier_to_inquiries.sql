-- Add supplier_id column to inquiries table for routing inquiries to specific suppliers
ALTER TABLE inquiries ADD COLUMN supplier_id VARCHAR;

-- Add foreign key constraint to supplier_profiles
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_supplier 
  FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id);

-- Create index for better query performance
CREATE INDEX idx_inquiries_supplier_id ON inquiries(supplier_id);
CREATE INDEX idx_inquiries_status_supplier ON inquiries(status, supplier_id);