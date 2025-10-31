-- Platform Settings Management System Migration

-- ==================== PLATFORM SETTINGS ====================

CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Setting Identification
  category VARCHAR NOT NULL, -- 'general', 'commission', 'payout', 'verification', 'limits', 'features', 'security'
  key VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Setting Value and Type
  value_type VARCHAR NOT NULL, -- 'string', 'number', 'boolean', 'json', 'array'
  value_string TEXT,
  value_number DECIMAL(15, 4),
  value_boolean BOOLEAN,
  value_json JSON,
  
  -- Default and Validation
  default_value JSON,
  validation_rules JSON, -- { min, max, required, pattern, enum, etc. }
  
  -- Environment and Deployment
  environment VARCHAR DEFAULT 'production', -- 'development', 'staging', 'production'
  requires_restart BOOLEAN DEFAULT FALSE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  
  -- Dependencies and Impact
  dependencies JSON DEFAULT '[]', -- Array of setting keys this depends on
  affects JSON DEFAULT '[]', -- Array of systems/features this affects
  
  -- Status and Control
  is_active BOOLEAN DEFAULT TRUE,
  is_readonly BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR
);

-- ==================== SETTINGS CHANGE HISTORY ====================

CREATE TABLE IF NOT EXISTS platform_settings_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id VARCHAR NOT NULL,
  
  -- Change Details
  action VARCHAR NOT NULL, -- 'create', 'update', 'delete', 'rollback'
  previous_value JSON,
  new_value JSON,
  change_reason TEXT,
  
  -- Impact Analysis
  impact_assessment JSON, -- Predicted impact of the change
  validation_results JSON, -- Results of validation checks
  
  -- Change Management
  change_request_id VARCHAR,
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  
  -- Rollback Information
  can_rollback BOOLEAN DEFAULT TRUE,
  rollback_data JSON,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR NOT NULL,
  ip_address VARCHAR,
  user_agent TEXT
);

-- ==================== SETTINGS VALIDATION RULES ====================

CREATE TABLE IF NOT EXISTS platform_settings_validation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule Definition
  name VARCHAR NOT NULL,
  description TEXT,
  rule_type VARCHAR NOT NULL, -- 'dependency', 'conflict', 'range', 'format', 'business_rule'
  
  -- Rule Logic
  conditions JSON NOT NULL, -- Conditions that trigger this rule
  validation_logic JSON NOT NULL, -- The actual validation logic
  error_message TEXT NOT NULL,
  severity VARCHAR DEFAULT 'error', -- 'warning', 'error', 'critical'
  
  -- Scope
  applies_to JSON DEFAULT '[]', -- Array of setting keys or categories this applies to
  environments JSON DEFAULT '["production", "staging", "development"]',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR
);

-- ==================== SETTINGS DEPLOYMENT PIPELINE ====================

CREATE TABLE IF NOT EXISTS platform_settings_deployments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deployment Details
  deployment_name VARCHAR NOT NULL,
  description TEXT,
  source_environment VARCHAR NOT NULL,
  target_environment VARCHAR NOT NULL,
  
  -- Settings Package
  settings_package JSON NOT NULL, -- Array of settings to deploy
  deployment_strategy VARCHAR DEFAULT 'immediate', -- 'immediate', 'scheduled', 'gradual'
  
  -- Validation and Approval
  validation_status VARCHAR DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  validation_results JSON,
  approval_status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  
  -- Deployment Execution
  status VARCHAR DEFAULT 'draft', -- 'draft', 'scheduled', 'in_progress', 'completed', 'failed', 'rolled_back'
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Rollback Information
  rollback_plan JSON,
  can_rollback BOOLEAN DEFAULT TRUE,
  rollback_deadline TIMESTAMP,
  
  -- Results and Monitoring
  deployment_results JSON,
  error_details JSON,
  performance_impact JSON,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR NOT NULL
);

-- ==================== SETTINGS IMPACT ANALYSIS ====================

CREATE TABLE IF NOT EXISTS platform_settings_impact (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id VARCHAR NOT NULL,
  
  -- Impact Assessment
  impact_type VARCHAR NOT NULL, -- 'performance', 'security', 'functionality', 'financial', 'user_experience'
  severity VARCHAR NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  
  -- Affected Systems
  affected_systems JSON DEFAULT '[]', -- Array of system components affected
  affected_users JSON DEFAULT '[]', -- Array of user types affected
  
  -- Metrics and Monitoring
  metrics_to_monitor JSON DEFAULT '[]', -- Metrics that should be monitored after change
  expected_changes JSON, -- Expected changes in metrics
  
  -- Mitigation
  mitigation_steps JSON DEFAULT '[]', -- Steps to mitigate negative impact
  rollback_triggers JSON DEFAULT '[]', -- Conditions that should trigger rollback
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR
);

-- ==================== INDEXES ====================

-- Platform Settings Indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_environment ON platform_settings(environment);
CREATE INDEX IF NOT EXISTS idx_platform_settings_active ON platform_settings(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_settings_unique ON platform_settings(category, key, environment);

-- Settings History Indexes
CREATE INDEX IF NOT EXISTS idx_settings_history_setting_id ON platform_settings_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_settings_history_created_at ON platform_settings_history(created_at);
CREATE INDEX IF NOT EXISTS idx_settings_history_created_by ON platform_settings_history(created_by);

-- Settings Validation Indexes
CREATE INDEX IF NOT EXISTS idx_settings_validation_active ON platform_settings_validation(is_active);
CREATE INDEX IF NOT EXISTS idx_settings_validation_type ON platform_settings_validation(rule_type);

-- Settings Deployments Indexes
CREATE INDEX IF NOT EXISTS idx_settings_deployments_status ON platform_settings_deployments(status);
CREATE INDEX IF NOT EXISTS idx_settings_deployments_environment ON platform_settings_deployments(target_environment);
CREATE INDEX IF NOT EXISTS idx_settings_deployments_created_at ON platform_settings_deployments(created_at);

-- Settings Impact Indexes
CREATE INDEX IF NOT EXISTS idx_settings_impact_setting_id ON platform_settings_impact(setting_id);
CREATE INDEX IF NOT EXISTS idx_settings_impact_type ON platform_settings_impact(impact_type);

-- ==================== DEFAULT PLATFORM SETTINGS ====================

-- Insert default platform settings
INSERT INTO platform_settings (category, key, name, description, value_type, value_json, default_value, validation_rules, environment, created_by) VALUES
-- General Settings
('general', 'platform_name', 'Platform Name', 'The name of the B2B marketplace platform', 'string', '"B2B Marketplace"', '"B2B Marketplace"', '{"required": true, "maxLength": 100}', 'production', 'system'),
('general', 'platform_description', 'Platform Description', 'Description of the platform for SEO and branding', 'string', '"Professional B2B marketplace connecting suppliers and buyers worldwide"', '"Professional B2B marketplace connecting suppliers and buyers worldwide"', '{"maxLength": 500}', 'production', 'system'),
('general', 'support_email', 'Support Email', 'Primary support email address', 'string', '"support@b2bmarketplace.com"', '"support@b2bmarketplace.com"', '{"required": true, "pattern": "^[^@]+@[^@]+\\.[^@]+$"}', 'production', 'system'),
('general', 'maintenance_mode', 'Maintenance Mode', 'Enable maintenance mode to restrict access', 'boolean', 'false', 'false', '{}', 'production', 'system'),

-- Commission Settings
('commission', 'default_rate', 'Default Commission Rate', 'Default commission rate for new suppliers (%)', 'number', '5.0', '5.0', '{"min": 0, "max": 50, "required": true}', 'production', 'system'),
('commission', 'tier_rates', 'Tier Commission Rates', 'Commission rates by membership tier', 'json', '{"free": 5.0, "silver": 3.0, "gold": 2.0, "platinum": 1.5}', '{"free": 5.0, "silver": 3.0, "gold": 2.0, "platinum": 1.5}', '{"required": true}', 'production', 'system'),
('commission', 'minimum_commission', 'Minimum Commission Amount', 'Minimum commission amount per transaction ($)', 'number', '1.00', '1.00', '{"min": 0, "required": true}', 'production', 'system'),

-- Payout Settings
('payout', 'minimum_payout', 'Minimum Payout Amount', 'Minimum amount required for payout processing ($)', 'number', '50.00', '50.00', '{"min": 1, "required": true}', 'production', 'system'),
('payout', 'payout_schedule', 'Payout Schedule', 'Frequency of automatic payouts', 'string', '"weekly"', '"weekly"', '{"enum": ["daily", "weekly", "biweekly", "monthly"], "required": true}', 'production', 'system'),
('payout', 'payout_methods', 'Available Payout Methods', 'Supported payout methods', 'json', '["bank_transfer", "paypal", "stripe"]', '["bank_transfer", "paypal", "stripe"]', '{"required": true}', 'production', 'system'),

-- Verification Settings
('verification', 'auto_approval_enabled', 'Auto Approval Enabled', 'Enable automatic supplier approval for qualified applications', 'boolean', 'false', 'false', '{}', 'production', 'system'),
('verification', 'required_documents', 'Required Documents', 'Documents required for supplier verification', 'json', '["business_license", "tax_certificate", "bank_statement"]', '["business_license", "tax_certificate", "bank_statement"]', '{"required": true}', 'production', 'system'),
('verification', 'verification_expiry_days', 'Verification Expiry Days', 'Days after which verification expires', 'number', '365', '365', '{"min": 30, "max": 1095, "required": true}', 'production', 'system'),

-- Platform Limits
('limits', 'max_products_per_supplier', 'Max Products Per Supplier', 'Maximum number of products per supplier', 'number', '1000', '1000', '{"min": 1, "max": 10000, "required": true}', 'production', 'system'),
('limits', 'max_images_per_product', 'Max Images Per Product', 'Maximum number of images per product', 'number', '10', '10', '{"min": 1, "max": 50, "required": true}', 'production', 'system'),
('limits', 'max_file_size_mb', 'Max File Size (MB)', 'Maximum file size for uploads in MB', 'number', '10', '10', '{"min": 1, "max": 100, "required": true}', 'production', 'system'),

-- Feature Flags
('features', 'chat_enabled', 'Chat System Enabled', 'Enable real-time chat between buyers and suppliers', 'boolean', 'true', 'true', '{}', 'production', 'system'),
('features', 'reviews_enabled', 'Reviews System Enabled', 'Enable product and supplier reviews', 'boolean', 'true', 'true', '{}', 'production', 'system'),
('features', 'bulk_upload_enabled', 'Bulk Upload Enabled', 'Enable bulk product upload for suppliers', 'boolean', 'true', 'true', '{}', 'production', 'system'),
('features', 'analytics_enabled', 'Analytics Enabled', 'Enable advanced analytics for suppliers', 'boolean', 'true', 'true', '{}', 'production', 'system'),

-- Security Settings
('security', 'session_timeout_minutes', 'Session Timeout (Minutes)', 'User session timeout in minutes', 'number', '60', '60', '{"min": 5, "max": 480, "required": true}', 'production', 'system'),
('security', 'max_login_attempts', 'Max Login Attempts', 'Maximum failed login attempts before lockout', 'number', '5', '5', '{"min": 3, "max": 10, "required": true}', 'production', 'system'),
('security', 'password_min_length', 'Password Minimum Length', 'Minimum password length requirement', 'number', '8', '8', '{"min": 6, "max": 32, "required": true}', 'production', 'system')

ON CONFLICT (category, key, environment) DO NOTHING;

-- ==================== DEFAULT VALIDATION RULES ====================

INSERT INTO platform_settings_validation (name, description, rule_type, conditions, validation_logic, error_message, severity, applies_to, created_by) VALUES
('Commission Rate Range', 'Ensure commission rates are within acceptable range', 'range', '{"categories": ["commission"]}', '{"min": 0, "max": 50}', 'Commission rates must be between 0% and 50%', 'error', '["commission.default_rate", "commission.tier_rates"]', 'system'),
('Payout Minimum Validation', 'Ensure minimum payout is reasonable', 'range', '{"keys": ["payout.minimum_payout"]}', '{"min": 1, "max": 1000}', 'Minimum payout must be between $1 and $1000', 'error', '["payout.minimum_payout"]', 'system'),
('File Size Limit', 'Ensure file size limits are reasonable', 'range', '{"keys": ["limits.max_file_size_mb"]}', '{"min": 1, "max": 100}', 'File size limit must be between 1MB and 100MB', 'error', '["limits.max_file_size_mb"]', 'system'),
('Session Timeout Range', 'Ensure session timeout is within security guidelines', 'range', '{"keys": ["security.session_timeout_minutes"]}', '{"min": 5, "max": 480}', 'Session timeout must be between 5 minutes and 8 hours', 'error', '["security.session_timeout_minutes"]', 'system'),
('Commission Tier Consistency', 'Ensure tier rates are in descending order', 'business_rule', '{"keys": ["commission.tier_rates"]}', '{"rule": "platinum <= gold <= silver <= free"}', 'Commission rates should decrease with higher membership tiers', 'warning', '["commission.tier_rates"]', 'system')

ON CONFLICT DO NOTHING;