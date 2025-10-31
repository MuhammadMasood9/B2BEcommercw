-- Order and Dispute Management System Migration

-- ==================== DISPUTES TABLE ====================

CREATE TABLE IF NOT EXISTS disputes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL,
  buyer_id VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  
  -- Dispute Details
  type VARCHAR NOT NULL, -- 'product_quality', 'shipping_delay', 'wrong_item', 'payment_issue', 'communication', 'other'
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2), -- Disputed amount
  
  -- Evidence
  evidence JSON DEFAULT '[]', -- Array of evidence files/images
  buyer_evidence JSON DEFAULT '[]',
  supplier_evidence JSON DEFAULT '[]',
  
  -- Status & Resolution
  status VARCHAR DEFAULT 'open', -- 'open', 'under_review', 'mediation', 'resolved', 'closed'
  priority VARCHAR DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Admin Mediation
  assigned_mediator VARCHAR, -- Admin user ID
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

-- ==================== DISPUTE MESSAGES TABLE ====================

CREATE TABLE IF NOT EXISTS dispute_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id VARCHAR NOT NULL,
  sender_id VARCHAR NOT NULL,
  sender_type VARCHAR NOT NULL, -- 'buyer', 'supplier', 'admin'
  
  message TEXT NOT NULL,
  attachments JSON DEFAULT '[]',
  is_internal BOOLEAN DEFAULT FALSE, -- Internal admin notes
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== ORDER INTERVENTIONS TABLE ====================

CREATE TABLE IF NOT EXISTS order_interventions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL,
  admin_id VARCHAR NOT NULL,
  
  -- Intervention Details
  type VARCHAR NOT NULL, -- 'status_override', 'refund_processing', 'communication_facilitation', 'escalation'
  reason TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  
  -- Before/After State
  previous_status VARCHAR,
  new_status VARCHAR,
  previous_data JSON,
  new_data JSON,
  
  -- Impact
  financial_impact DECIMAL(15, 2) DEFAULT 0,
  commission_adjustment DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== REFUNDS TABLE ====================

CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL,
  dispute_id VARCHAR, -- Optional: linked to dispute
  buyer_id VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  admin_id VARCHAR NOT NULL, -- Admin who processed
  
  -- Refund Details
  refund_amount DECIMAL(15, 2) NOT NULL,
  original_amount DECIMAL(15, 2) NOT NULL,
  refund_type VARCHAR NOT NULL, -- 'full', 'partial', 'shipping_only'
  reason TEXT NOT NULL,
  
  -- Commission Handling
  commission_adjustment DECIMAL(15, 2) DEFAULT 0,
  supplier_deduction DECIMAL(15, 2) DEFAULT 0,
  
  -- Processing
  status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payment_method VARCHAR, -- 'original_method', 'bank_transfer', 'store_credit'
  transaction_id VARCHAR,
  
  -- Timeline
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Notes
  admin_notes TEXT,
  buyer_notification_sent BOOLEAN DEFAULT FALSE,
  supplier_notification_sent BOOLEAN DEFAULT FALSE
);

-- ==================== ORDER ANOMALIES TABLE ====================

CREATE TABLE IF NOT EXISTS order_anomalies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL,
  
  -- Anomaly Detection
  anomaly_type VARCHAR NOT NULL, -- 'unusual_amount', 'rapid_orders', 'payment_mismatch', 'shipping_inconsistency', 'supplier_pattern'
  severity VARCHAR DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  confidence_score DECIMAL(5, 2), -- 0-100 confidence in anomaly detection
  
  -- Details
  description TEXT NOT NULL,
  detected_values JSON, -- The values that triggered the anomaly
  expected_values JSON, -- What was expected
  
  -- Status
  status VARCHAR DEFAULT 'flagged', -- 'flagged', 'investigating', 'resolved', 'false_positive'
  reviewed_by VARCHAR, -- Admin who reviewed
  review_notes TEXT,
  
  -- Timeline
  detected_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP
);

-- ==================== ORDER PERFORMANCE METRICS TABLE ====================

CREATE TABLE IF NOT EXISTS order_performance_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INTEGER, -- For hourly metrics (0-23)
  
  -- Order Volume
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  disputed_orders INTEGER DEFAULT 0,
  
  -- Financial Metrics
  total_order_value DECIMAL(15, 2) DEFAULT 0,
  total_commission DECIMAL(15, 2) DEFAULT 0,
  total_refunds DECIMAL(15, 2) DEFAULT 0,
  
  -- Performance Metrics
  avg_processing_time INTEGER, -- In hours
  avg_delivery_time INTEGER, -- In days
  dispute_rate DECIMAL(5, 2), -- Percentage
  refund_rate DECIMAL(5, 2), -- Percentage
  
  -- Supplier Metrics
  active_suppliers INTEGER DEFAULT 0,
  top_performing_suppliers JSON DEFAULT '[]',
  underperforming_suppliers JSON DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer_id ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_supplier_id ON disputes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_mediator ON disputes(assigned_mediator);

-- Dispute messages indexes
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender_id ON dispute_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);

-- Order interventions indexes
CREATE INDEX IF NOT EXISTS idx_order_interventions_order_id ON order_interventions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_interventions_admin_id ON order_interventions(admin_id);
CREATE INDEX IF NOT EXISTS idx_order_interventions_created_at ON order_interventions(created_at);

-- Refunds indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_dispute_id ON refunds(dispute_id);
CREATE INDEX IF NOT EXISTS idx_refunds_buyer_id ON refunds(buyer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_supplier_id ON refunds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at);

-- Order anomalies indexes
CREATE INDEX IF NOT EXISTS idx_order_anomalies_order_id ON order_anomalies(order_id);
CREATE INDEX IF NOT EXISTS idx_order_anomalies_type ON order_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_order_anomalies_severity ON order_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_order_anomalies_status ON order_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_order_anomalies_detected_at ON order_anomalies(detected_at);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_order_performance_date ON order_performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_order_performance_date_hour ON order_performance_metrics(date, hour);