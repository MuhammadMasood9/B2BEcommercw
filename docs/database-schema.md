# B2B Marketplace Database Schema Documentation

## Overview

This document provides comprehensive documentation for the B2B Marketplace database schema. The database is built using PostgreSQL and managed with Drizzle ORM.

## Database Design Principles

- **Role-based separation**: Clear separation between Buyers, Suppliers, and Admins
- **Multivendor support**: Full support for multiple suppliers and their products
- **Audit trail**: Comprehensive tracking of changes and activities
- **Scalability**: Designed to handle large volumes of products, orders, and communications
- **Data integrity**: Foreign key constraints and validation rules ensure data consistency

## Core Tables

### Users & Authentication

#### users
Primary user authentication and profile table.

```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer', -- buyer, admin, supplier
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `role`: Determines user permissions (buyer, supplier, admin)
- `is_online`: Real-time online status for chat features
- `email_verified`: Email verification status for security

### Buyer System

#### buyers
Enhanced buyer profiles with business information.

```sql
CREATE TABLE buyers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  business_type VARCHAR(50),
  annual_volume DECIMAL(15,2),
  preferred_payment_terms TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `annual_volume`: Annual purchasing volume for supplier targeting
- `preferred_payment_terms`: Array of preferred payment methods
- `business_type`: Type of business (manufacturer, retailer, distributor)

#### rfqs (Request for Quotations)
Buyer-initiated requests for product quotations.

```sql
CREATE TABLE rfqs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id VARCHAR NOT NULL REFERENCES buyers(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR REFERENCES categories(id),
  specifications JSONB,
  quantity INTEGER NOT NULL,
  target_price DECIMAL(10,2),
  budget_range JSONB, -- {min: 1000, max: 5000}
  delivery_location VARCHAR(255),
  required_delivery_date DATE,
  payment_terms VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open', -- open, closed, expired
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `specifications`: JSONB field for flexible product specifications
- `budget_range`: JSON object with min/max budget constraints
- `expires_at`: Automatic expiration for time-sensitive RFQs

#### inquiries
Direct buyer-to-supplier product inquiries.

```sql
CREATE TABLE inquiries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id VARCHAR NOT NULL REFERENCES buyers(id),
  supplier_id VARCHAR REFERENCES supplier_profiles(id),
  product_id VARCHAR REFERENCES products(id),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  quantity INTEGER,
  target_price DECIMAL(10,2),
  requirements TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, responded, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Supplier System

#### supplier_profiles
Comprehensive supplier business profiles.

```sql
CREATE TABLE supplier_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id),
  
  -- Business Information
  business_name VARCHAR NOT NULL,
  business_type VARCHAR NOT NULL, -- manufacturer, trading_company, wholesaler
  store_name VARCHAR NOT NULL UNIQUE,
  store_slug VARCHAR NOT NULL UNIQUE,
  store_description TEXT,
  store_logo VARCHAR,
  store_banner VARCHAR,
  
  -- Contact Details
  contact_person VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  whatsapp VARCHAR,
  wechat VARCHAR,
  address TEXT NOT NULL,
  city VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  website VARCHAR,
  
  -- Business Details
  year_established INTEGER,
  employees VARCHAR,
  factory_size VARCHAR,
  annual_revenue VARCHAR,
  main_products TEXT[],
  export_markets TEXT[],
  
  -- Verification & Status
  verification_level VARCHAR DEFAULT 'none', -- none, basic, business, premium, trade_assurance
  verification_docs JSONB,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  -- Membership & Performance
  membership_tier VARCHAR DEFAULT 'free', -- free, silver, gold, platinum
  subscription_id VARCHAR,
  subscription_status VARCHAR,
  subscription_expiry TIMESTAMP,
  
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  response_time VARCHAR,
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Status & Control
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, suspended
  is_active BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  
  -- Commission & Payout
  custom_commission_rate DECIMAL(5,2),
  bank_name VARCHAR,
  account_number VARCHAR,
  account_name VARCHAR,
  paypal_email VARCHAR,
  
  -- Metadata
  total_products INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  store_views INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `verification_level`: Supplier verification status affecting trust and visibility
- `membership_tier`: Subscription level affecting commission rates and features
- `response_rate`: Calculated metric for supplier performance
- `custom_commission_rate`: Individual commission rate overrides

#### quotations
Supplier responses to RFQs and inquiries.

```sql
CREATE TABLE quotations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id),
  rfq_id VARCHAR REFERENCES rfqs(id),
  inquiry_id VARCHAR REFERENCES inquiries(id),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  moq INTEGER NOT NULL,
  lead_time VARCHAR(50),
  payment_terms VARCHAR(100),
  validity_period INTEGER, -- days
  terms_conditions TEXT,
  attachments TEXT[],
  status VARCHAR(50) DEFAULT 'sent', -- sent, accepted, rejected, expired
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Product Catalog

#### categories
Hierarchical product categorization.

```sql
CREATE TABLE categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id VARCHAR REFERENCES categories(id),
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### products
Comprehensive product information with B2B features.

```sql
CREATE TABLE products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  category_id VARCHAR REFERENCES categories(id),
  specifications JSONB, -- Key-value pairs
  images TEXT[],
  videos TEXT[],
  
  -- Supplier Information
  supplier_id VARCHAR REFERENCES supplier_profiles(id),
  status VARCHAR DEFAULT 'draft', -- draft, pending_approval, approved, rejected
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP,
  approved_by VARCHAR,
  rejection_reason TEXT,
  
  -- B2B Pricing
  min_order_quantity INTEGER NOT NULL DEFAULT 1,
  price_ranges JSONB, -- [{ minQty, maxQty, pricePerUnit }]
  
  -- Sample & Customization
  sample_available BOOLEAN DEFAULT false,
  sample_price DECIMAL(10,2),
  customization_available BOOLEAN DEFAULT false,
  
  -- Shipping & Delivery
  lead_time TEXT, -- e.g., "15-30 days"
  port TEXT, -- e.g., "Shanghai/Ningbo"
  payment_terms TEXT[], -- ["T/T", "L/C", "Western Union"]
  
  -- Stock & Status
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  
  -- Product Variants & Options
  colors TEXT[], -- Available colors
  sizes TEXT[], -- Available sizes
  key_features TEXT[], -- Array of key features
  customization_details TEXT,
  
  -- Certifications & Badges
  certifications TEXT[], -- ["ISO9001", "CE", "RoHS"]
  has_trade_assurance BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[],
  sku TEXT,
  meta_data JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `price_ranges`: JSONB array for quantity-based pricing tiers
- `specifications`: Flexible JSONB field for product specifications
- `certifications`: Array of product certifications for B2B compliance
- `has_trade_assurance`: Trade assurance protection flag

#### product_attributes
Advanced filtering attributes for products.

```sql
CREATE TABLE product_attributes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR NOT NULL REFERENCES products(id),
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  is_filterable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Order Management

#### orders
Comprehensive order tracking with multivendor support.

```sql
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_id VARCHAR NOT NULL REFERENCES buyers(id),
  customer_id VARCHAR,
  inquiry_id VARCHAR REFERENCES inquiries(id),
  quotation_id VARCHAR REFERENCES quotations(id),
  rfq_id VARCHAR REFERENCES rfqs(id), -- For RFQ-based orders
  supplier_id VARCHAR REFERENCES supplier_profiles(id), -- For multivendor orders
  parent_order_id VARCHAR, -- For split orders
  product_id VARCHAR REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Commission & Financial
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(15,2),
  supplier_amount DECIMAL(15,2),
  
  items JSONB NOT NULL, -- Array of order items
  status TEXT DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  shipping_address JSONB,
  billing_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `items`: JSONB array for multivendor order items
- `commission_rate`: Platform commission rate for this order
- `parent_order_id`: Links split orders from multivendor carts

### Communication System

#### conversations
Multi-role conversation management.

```sql
CREATE TABLE conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- buyer_supplier, buyer_admin, supplier_admin
  buyer_id VARCHAR REFERENCES buyers(id),
  supplier_id VARCHAR REFERENCES supplier_profiles(id),
  admin_id VARCHAR REFERENCES users(id),
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, archived, closed
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### messages
Real-time messaging with file attachments and product references.

```sql
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES conversations(id),
  sender_id VARCHAR NOT NULL REFERENCES users(id),
  sender_type VARCHAR(20) NOT NULL, -- buyer, supplier, admin
  message TEXT NOT NULL,
  attachments TEXT[],
  product_references VARCHAR[], -- Array of product IDs referenced in message
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Dispute Management

#### disputes
Comprehensive dispute resolution system.

```sql
CREATE TABLE disputes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id),
  buyer_id VARCHAR NOT NULL REFERENCES buyers(id),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id),
  
  -- Dispute Details
  type VARCHAR NOT NULL, -- 'product_quality', 'shipping_delay', 'wrong_item', 'payment_issue', 'communication', 'other'
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2),
  
  -- Evidence
  evidence JSONB DEFAULT '[]',
  buyer_evidence JSONB DEFAULT '[]',
  supplier_evidence JSONB DEFAULT '[]',
  
  -- Status & Resolution
  status VARCHAR DEFAULT 'open', -- 'open', 'under_review', 'mediation', 'resolved', 'closed'
  priority VARCHAR DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Admin Mediation
  assigned_mediator VARCHAR REFERENCES users(id),
  mediation_notes TEXT,
  resolution_summary TEXT,
  resolution_type VARCHAR, -- 'refund', 'replacement', 'partial_refund', 'no_action', 'custom'
  
  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMP,
  escalation_reason TEXT
);
```

#### dispute_messages
Communication within dispute resolution.

```sql
CREATE TABLE dispute_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id VARCHAR NOT NULL REFERENCES disputes(id),
  sender_id VARCHAR NOT NULL REFERENCES users(id),
  sender_type VARCHAR NOT NULL, -- 'buyer', 'supplier', 'admin'
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Financial Management

#### commission_settings
Platform commission configuration.

```sql
CREATE TABLE commission_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global Rates
  default_rate DECIMAL(5,2) DEFAULT 5.0,
  free_rate DECIMAL(5,2) DEFAULT 5.0,
  silver_rate DECIMAL(5,2) DEFAULT 3.0,
  gold_rate DECIMAL(5,2) DEFAULT 2.0,
  platinum_rate DECIMAL(5,2) DEFAULT 1.5,
  
  -- Category & Vendor Overrides
  category_rates JSONB, -- {categoryId: rate}
  vendor_overrides JSONB, -- {vendorId: rate}
  
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR
);
```

#### payouts
Supplier payout management.

```sql
CREATE TABLE payouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id),
  order_id VARCHAR REFERENCES orders(id),
  
  amount DECIMAL(15,2) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  
  method VARCHAR NOT NULL, -- bank_transfer, paypal, stripe
  status VARCHAR DEFAULT 'pending', -- pending, processing, completed, failed
  
  scheduled_date TIMESTAMP NOT NULL,
  processed_date TIMESTAMP,
  
  transaction_id VARCHAR,
  failure_reason TEXT,
  invoice_url VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### refunds
Refund processing and tracking.

```sql
CREATE TABLE refunds (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id),
  dispute_id VARCHAR REFERENCES disputes(id),
  buyer_id VARCHAR NOT NULL REFERENCES buyers(id),
  supplier_id VARCHAR NOT NULL REFERENCES supplier_profiles(id),
  admin_id VARCHAR NOT NULL REFERENCES users(id),
  
  -- Refund Details
  refund_amount DECIMAL(15,2) NOT NULL,
  original_amount DECIMAL(15,2) NOT NULL,
  refund_type VARCHAR NOT NULL, -- 'full', 'partial', 'shipping_only'
  reason TEXT NOT NULL,
  
  -- Commission Handling
  commission_adjustment DECIMAL(15,2) DEFAULT 0,
  supplier_deduction DECIMAL(15,2) DEFAULT 0,
  
  -- Processing
  status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payment_method VARCHAR,
  transaction_id VARCHAR,
  
  -- Timeline
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Notes
  admin_notes TEXT,
  buyer_notification_sent BOOLEAN DEFAULT false,
  supplier_notification_sent BOOLEAN DEFAULT false
);
```

### Analytics and Monitoring

#### system_alerts
Automated system alerting.

```sql
CREATE TABLE system_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'system', 'security', 'business', 'compliance', 'performance', 'capacity'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR NOT NULL,
  entity_id VARCHAR,
  entity_type VARCHAR,
  metadata JSONB DEFAULT '{}',
  
  -- Alert Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR,
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_by VARCHAR,
  resolved_at TIMESTAMP,
  resolution TEXT,
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMP,
  escalated_to JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### activity_logs
Comprehensive audit trail.

```sql
CREATE TABLE activity_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'inquiry', 'quotation', 'order', 'product', 'user', 'category', 'chat', 'system'
  entity_id VARCHAR,
  entity_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### notifications
User notification system.

```sql
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'info', 'success', 'error', 'warning'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_id VARCHAR, -- ID of related entity
  related_type TEXT, -- Type of related entity
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Platform Management

#### platform_settings
Dynamic platform configuration.

```sql
CREATE TABLE platform_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Setting Identification
  category VARCHAR NOT NULL, -- 'general', 'commission', 'payout', 'verification', 'limits', 'features', 'security'
  key VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Setting Value and Type
  value_type VARCHAR NOT NULL, -- 'string', 'number', 'boolean', 'json', 'array'
  value_string TEXT,
  value_number DECIMAL(15,4),
  value_boolean BOOLEAN,
  value_json JSONB,
  
  -- Default and Validation
  default_value JSONB,
  validation_rules JSONB, -- { min, max, required, pattern, enum, etc. }
  
  -- Environment and Deployment
  environment VARCHAR DEFAULT 'production', -- 'development', 'staging', 'production'
  requires_restart BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  
  -- Dependencies and Impact
  dependencies JSONB DEFAULT '[]', -- Array of setting keys this depends on
  affects JSONB DEFAULT '[]', -- Array of systems/features this affects
  
  -- Status and Control
  is_active BOOLEAN DEFAULT true,
  is_readonly BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR
);
```

## Indexes and Performance Optimization

### Primary Indexes

```sql
-- User authentication and lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Product discovery and search
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_published ON products(is_published, is_approved);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Order management
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_supplier ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- RFQ and quotation matching
CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_category ON rfqs(category_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_expires ON rfqs(expires_at);
CREATE INDEX idx_quotations_rfq ON quotations(rfq_id);
CREATE INDEX idx_quotations_supplier ON quotations(supplier_id);

-- Communication system
CREATE INDEX idx_conversations_participants ON conversations(buyer_id, supplier_id, admin_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_unread ON messages(is_read, sender_id);

-- Dispute management
CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_assigned ON disputes(assigned_mediator);

-- Analytics and reporting
CREATE INDEX idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
```

### Composite Indexes

```sql
-- Product filtering performance
CREATE INDEX idx_products_filter_combo ON products(category_id, is_published, is_approved, supplier_id);
CREATE INDEX idx_products_price_moq ON products(min_order_quantity, is_published) WHERE is_approved = true;

-- Supplier performance metrics
CREATE INDEX idx_supplier_performance ON supplier_profiles(rating, response_rate, is_verified, status);

-- Order analytics
CREATE INDEX idx_orders_analytics ON orders(created_at, status, supplier_id, total_amount);

-- Chat system performance
CREATE INDEX idx_messages_timeline ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_activity ON conversations(last_message_at, status);
```

### JSONB Indexes

```sql
-- Product specifications search
CREATE INDEX idx_products_specs ON products USING gin(specifications);

-- Order items analysis
CREATE INDEX idx_orders_items ON orders USING gin(items);

-- Platform settings lookup
CREATE INDEX idx_platform_settings_category ON platform_settings(category, key);
```

## Data Relationships

### Key Foreign Key Constraints

```sql
-- User relationships
ALTER TABLE buyers ADD CONSTRAINT fk_buyers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE supplier_profiles ADD CONSTRAINT fk_suppliers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Product relationships
ALTER TABLE products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Order relationships
ALTER TABLE orders ADD CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE RESTRICT;
ALTER TABLE orders ADD CONSTRAINT fk_orders_supplier FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE RESTRICT;
ALTER TABLE orders ADD CONSTRAINT fk_orders_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;

-- Communication relationships
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_supplier FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Dispute relationships
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE RESTRICT;
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_supplier FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE RESTRICT;
```

## Data Types and Validation

### JSONB Field Structures

#### Product Price Ranges
```json
[
  {
    "minQty": 100,
    "maxQty": 499,
    "pricePerUnit": 10.50
  },
  {
    "minQty": 500,
    "maxQty": 999,
    "pricePerUnit": 9.80
  }
]
```

#### Product Specifications
```json
{
  "material": "Aluminum Alloy",
  "color": "Black",
  "weight": "2.5kg",
  "dimensions": "30x20x15cm",
  "warranty": "2 years",
  "certifications": ["CE", "RoHS", "ISO9001"]
}
```

#### Order Items
```json
[
  {
    "productId": "prod-123",
    "productName": "Product Name",
    "quantity": 100,
    "unitPrice": 15.50,
    "totalPrice": 1550.00,
    "specifications": {
      "color": "Blue",
      "size": "Large"
    }
  }
]
```

#### Shipping Address
```json
{
  "name": "John Doe",
  "company": "ABC Company",
  "address1": "123 Main Street",
  "address2": "Suite 100",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "phone": "+1234567890"
}
```

### Validation Rules

#### Email Validation
```sql
ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### Price Validation
```sql
ALTER TABLE products ADD CONSTRAINT positive_sample_price CHECK (sample_price IS NULL OR sample_price > 0);
ALTER TABLE quotations ADD CONSTRAINT positive_unit_price CHECK (unit_price > 0);
ALTER TABLE orders ADD CONSTRAINT positive_total_amount CHECK (total_amount > 0);
```

#### Status Validation
```sql
ALTER TABLE orders ADD CONSTRAINT valid_order_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
ALTER TABLE disputes ADD CONSTRAINT valid_dispute_status CHECK (status IN ('open', 'under_review', 'mediation', 'resolved', 'closed'));
ALTER TABLE supplier_profiles ADD CONSTRAINT valid_supplier_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
```

## Migration Strategy

### Version Control
All schema changes are managed through numbered migration files:
- `0001_initial_schema.sql`
- `0002_add_buyer_profiles.sql`
- `0003_enhance_products.sql`
- etc.

### Migration Best Practices
1. **Backward Compatibility**: New columns are nullable or have defaults
2. **Data Preservation**: Migrations include data transformation scripts
3. **Rollback Support**: Each migration includes rollback instructions
4. **Testing**: All migrations tested on staging before production
5. **Performance**: Large table changes use batched operations

### Example Migration
```sql
-- Migration: 0018_performance_optimization_indexes.sql
-- Description: Add performance indexes for product discovery and order management

-- Add indexes for product filtering
CREATE INDEX CONCURRENTLY idx_products_filter_combo ON products(category_id, is_published, is_approved, supplier_id);
CREATE INDEX CONCURRENTLY idx_products_search_gin ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Add indexes for order analytics
CREATE INDEX CONCURRENTLY idx_orders_analytics ON orders(created_at, status, supplier_id, total_amount);

-- Add indexes for supplier performance
CREATE INDEX CONCURRENTLY idx_supplier_performance ON supplier_profiles(rating, response_rate, is_verified, status);

-- Rollback instructions:
-- DROP INDEX CONCURRENTLY idx_products_filter_combo;
-- DROP INDEX CONCURRENTLY idx_products_search_gin;
-- DROP INDEX CONCURRENTLY idx_orders_analytics;
-- DROP INDEX CONCURRENTLY idx_supplier_performance;
```

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Buyers can only see their own orders
CREATE POLICY buyer_orders_policy ON orders
  FOR ALL TO buyer_role
  USING (buyer_id = current_user_buyer_id());

-- Suppliers can only see their own orders
CREATE POLICY supplier_orders_policy ON orders
  FOR ALL TO supplier_role
  USING (supplier_id = current_user_supplier_id());

-- Admins can see all orders
CREATE POLICY admin_orders_policy ON orders
  FOR ALL TO admin_role
  USING (true);
```

### Data Encryption
- Sensitive fields (payment info, personal data) encrypted at application level
- Database connections use SSL/TLS
- Backup files encrypted at rest

### Access Control
- Database users have minimal required permissions
- Application uses connection pooling with limited privileges
- Audit logging enabled for all data modifications

## Backup and Recovery

### Backup Strategy
1. **Daily full backups** of entire database
2. **Hourly incremental backups** during business hours
3. **Point-in-time recovery** capability
4. **Cross-region backup replication** for disaster recovery

### Recovery Procedures
1. **Automated monitoring** detects issues
2. **Failover procedures** for high availability
3. **Data validation** after recovery
4. **Business continuity** planning

## Performance Monitoring

### Key Metrics
- Query execution times
- Index usage statistics
- Connection pool utilization
- Disk I/O patterns
- Lock contention analysis

### Optimization Techniques
1. **Query optimization** using EXPLAIN ANALYZE
2. **Index tuning** based on usage patterns
3. **Partitioning** for large tables (orders, messages)
4. **Connection pooling** for efficient resource usage
5. **Caching strategies** for frequently accessed data

This comprehensive database schema documentation provides the foundation for understanding and maintaining the B2B Marketplace system's data layer.