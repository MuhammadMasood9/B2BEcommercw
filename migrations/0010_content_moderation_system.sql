-- Content Moderation System Migration
-- This migration adds tables and structures for the content moderation system

-- Content Analysis Results Table
CREATE TABLE IF NOT EXISTS content_analysis_results (
    id VARCHAR(255) PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('product', 'description', 'image', 'title')),
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('text', 'image', 'policy', 'duplicate')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    flags JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    processing_time INTEGER NOT NULL, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated', 'pending_changes', 'completed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Automated Screening Results
    screening_score INTEGER CHECK (screening_score >= 0 AND screening_score <= 100),
    screening_recommendation VARCHAR(20) CHECK (screening_recommendation IN ('approve', 'review', 'reject')),
    screening_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Review Assignment
    assigned_reviewer_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Review Decision
    review_decision VARCHAR(20) CHECK (review_decision IN ('approve', 'reject', 'request_changes')),
    review_notes TEXT,
    required_changes JSONB DEFAULT '[]'::jsonb,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    review_time_minutes INTEGER, -- time spent reviewing
    
    -- Escalation
    escalated_reason TEXT,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Screening Results Table
CREATE TABLE IF NOT EXISTS product_screening_results (
    product_id VARCHAR(255) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    text_analysis JSONB DEFAULT '[]'::jsonb,
    image_analysis JSONB DEFAULT '[]'::jsonb,
    duplicate_check JSONB DEFAULT '{}'::jsonb,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('approve', 'review', 'reject')),
    flags JSONB DEFAULT '[]'::jsonb,
    screened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Moderation Policies Table
CREATE TABLE IF NOT EXISTS content_moderation_policies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('text', 'image', 'policy', 'general')),
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quality Control Standards Table
CREATE TABLE IF NOT EXISTS quality_control_standards (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('text', 'image', 'policy', 'general')),
    threshold_value DECIMAL(10,2) NOT NULL,
    threshold_unit VARCHAR(50) NOT NULL,
    current_value DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bulk Operations Table
CREATE TABLE IF NOT EXISTS bulk_moderation_operations (
    id VARCHAR(255) PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('approve', 'reject', 'screening', 'quality_check')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    
    -- Operation Details
    target_items JSONB DEFAULT '[]'::jsonb, -- Array of item IDs
    operation_params JSONB DEFAULT '{}'::jsonb, -- Operation-specific parameters
    notes TEXT,
    
    -- Results
    results JSONB DEFAULT '[]'::jsonb, -- Array of operation results
    error_details JSONB DEFAULT '[]'::jsonb, -- Array of errors
    
    -- Execution Info
    started_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Log for Content Moderation
CREATE TABLE IF NOT EXISTS content_moderation_activity_log (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'review', 'policy', etc.
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_analysis_results_content_id ON content_analysis_results(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_results_content_type ON content_analysis_results(content_type);
CREATE INDEX IF NOT EXISTS idx_content_analysis_results_created_at ON content_analysis_results(created_at);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_priority ON product_reviews(priority);
CREATE INDEX IF NOT EXISTS idx_product_reviews_assigned_reviewer_id ON product_reviews(assigned_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_submitted_at ON product_reviews(submitted_at);

CREATE INDEX IF NOT EXISTS idx_product_screening_results_screened_at ON product_screening_results(screened_at);
CREATE INDEX IF NOT EXISTS idx_product_screening_results_recommendation ON product_screening_results(recommendation);

CREATE INDEX IF NOT EXISTS idx_content_moderation_policies_category ON content_moderation_policies(category);
CREATE INDEX IF NOT EXISTS idx_content_moderation_policies_is_active ON content_moderation_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_quality_control_standards_category ON quality_control_standards(category);
CREATE INDEX IF NOT EXISTS idx_quality_control_standards_status ON quality_control_standards(status);

CREATE INDEX IF NOT EXISTS idx_bulk_moderation_operations_status ON bulk_moderation_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_moderation_operations_started_by ON bulk_moderation_operations(started_by);
CREATE INDEX IF NOT EXISTS idx_bulk_moderation_operations_created_at ON bulk_moderation_operations(created_at);

CREATE INDEX IF NOT EXISTS idx_content_moderation_activity_log_admin_id ON content_moderation_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_activity_log_entity_type ON content_moderation_activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_activity_log_created_at ON content_moderation_activity_log(created_at);

-- Add approval_status column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'approval_status') THEN
        ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending_review' CHECK (approval_status IN ('pending_review', 'approved', 'rejected', 'pending_changes'));
    END IF;
END $$;

-- Add reviewer-related columns to admin users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_workload') THEN
        ALTER TABLE users ADD COLUMN current_workload INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'max_workload') THEN
        ALTER TABLE users ADD COLUMN max_workload INTEGER DEFAULT 10;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avg_review_time') THEN
        ALTER TABLE users ADD COLUMN avg_review_time DECIMAL(5,2) DEFAULT 30.0; -- in minutes
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'quality_score') THEN
        ALTER TABLE users ADD COLUMN quality_score INTEGER DEFAULT 80 CHECK (quality_score >= 0 AND quality_score <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_reviews') THEN
        ALTER TABLE users ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'specializations') THEN
        ALTER TABLE users ADD COLUMN specializations JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Insert default content moderation policies
INSERT INTO content_moderation_policies (id, name, description, category, rules, severity, is_active) VALUES
('general_content_policy', 'General Content Policy', 'Basic content guidelines for all product listings', 'general', 
 '[
   {"rule": "No inappropriate or offensive content", "weight": 1.0},
   {"rule": "No spam or promotional language", "weight": 0.8},
   {"rule": "Accurate product descriptions required", "weight": 0.9},
   {"rule": "High-quality images only", "weight": 0.7}
 ]'::jsonb, 'high', true),

('image_quality_policy', 'Image Quality Policy', 'Standards for product image quality and appropriateness', 'image',
 '[
   {"rule": "Minimum resolution 300x300 pixels", "weight": 1.0},
   {"rule": "No watermarks or copyright violations", "weight": 1.0},
   {"rule": "Clear product visibility required", "weight": 0.9},
   {"rule": "Maximum file size 5MB", "weight": 0.6}
 ]'::jsonb, 'medium', true),

('duplicate_content_policy', 'Duplicate Content Policy', 'Prevention of duplicate and plagiarized content', 'policy',
 '[
   {"rule": "No exact duplicates allowed", "weight": 1.0},
   {"rule": "Similarity threshold 80%", "weight": 0.9},
   {"rule": "Original content required", "weight": 1.0},
   {"rule": "Proper attribution for shared content", "weight": 0.7}
 ]'::jsonb, 'high', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default quality control standards
INSERT INTO quality_control_standards (id, name, description, category, threshold_value, threshold_unit, current_value, status) VALUES
('text_quality_min_length', 'Minimum Text Length', 'Minimum character count for product descriptions', 'text', 50, 'characters', 65, 'active'),
('text_quality_max_length', 'Maximum Text Length', 'Maximum character count for product descriptions', 'text', 2000, 'characters', 850, 'active'),
('image_min_resolution', 'Minimum Image Resolution', 'Minimum pixel resolution for product images', 'image', 300, 'pixels', 420, 'active'),
('image_max_file_size', 'Maximum Image File Size', 'Maximum file size for product images', 'image', 5, 'MB', 2.8, 'active'),
('policy_compliance_score', 'Policy Compliance Score', 'Minimum policy compliance score', 'policy', 85, 'percentage', 88.1, 'active'),
('duplicate_content_threshold', 'Duplicate Content Threshold', 'Maximum acceptable duplicate content rate', 'general', 10, 'percentage', 5.2, 'active')
ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS update_content_analysis_results_updated_at ON content_analysis_results;
CREATE TRIGGER update_content_analysis_results_updated_at BEFORE UPDATE ON content_analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_screening_results_updated_at ON product_screening_results;
CREATE TRIGGER update_product_screening_results_updated_at BEFORE UPDATE ON product_screening_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_moderation_policies_updated_at ON content_moderation_policies;
CREATE TRIGGER update_content_moderation_policies_updated_at BEFORE UPDATE ON content_moderation_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quality_control_standards_updated_at ON quality_control_standards;
CREATE TRIGGER update_quality_control_standards_updated_at BEFORE UPDATE ON quality_control_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bulk_moderation_operations_updated_at ON bulk_moderation_operations;
CREATE TRIGGER update_bulk_moderation_operations_updated_at BEFORE UPDATE ON bulk_moderation_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();