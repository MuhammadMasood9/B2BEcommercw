-- ==================== ADMIN ACCESS CONTROL SYSTEM ====================

-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  description TEXT,
  
  -- Role Hierarchy
  level INTEGER NOT NULL DEFAULT 0, -- Higher number = more permissions
  parent_role_id VARCHAR REFERENCES admin_roles(id),
  
  -- Permissions
  permissions JSONB NOT NULL DEFAULT '{}',
  resource_permissions JSONB NOT NULL DEFAULT '{}', -- Resource-level permissions
  
  -- Status and Control
  is_active BOOLEAN DEFAULT true,
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR
);

-- Admin Users Table (extends users table for admin-specific data)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role Assignment
  role_id VARCHAR NOT NULL REFERENCES admin_roles(id),
  additional_permissions JSONB DEFAULT '{}', -- User-specific permission overrides
  
  -- Access Control
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  lock_reason TEXT,
  locked_at TIMESTAMP,
  locked_by VARCHAR,
  
  -- Session Management
  max_concurrent_sessions INTEGER DEFAULT 3,
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
  require_mfa BOOLEAN DEFAULT false,
  
  -- Security
  last_login TIMESTAMP,
  last_login_ip VARCHAR,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR
);

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR NOT NULL UNIQUE,
  
  -- Session Details
  ip_address VARCHAR,
  user_agent TEXT,
  device_fingerprint VARCHAR,
  
  -- Status and Control
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  
  -- Security
  created_at TIMESTAMP DEFAULT NOW(),
  terminated_at TIMESTAMP,
  termination_reason VARCHAR -- 'logout', 'timeout', 'admin_action', 'security_violation'
);

-- Admin Activity Logs Table (enhanced version)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR NOT NULL REFERENCES admin_users(id),
  session_id VARCHAR REFERENCES admin_sessions(id),
  
  -- Action Details
  action VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL, -- 'authentication', 'authorization', 'data_modification', 'system_configuration', 'security'
  
  -- Target Information
  entity_type VARCHAR, -- 'user', 'supplier', 'product', 'order', 'setting', etc.
  entity_id VARCHAR,
  entity_name VARCHAR,
  
  -- Change Tracking
  previous_value JSONB,
  new_value JSONB,
  
  -- Request Context
  ip_address VARCHAR,
  user_agent TEXT,
  request_method VARCHAR,
  request_path VARCHAR,
  request_params JSONB,
  
  -- Security and Risk
  risk_level VARCHAR DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  security_flags JSONB DEFAULT '[]', -- Array of security concerns
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Permission Resources Table
CREATE TABLE IF NOT EXISTS permission_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  description TEXT,
  
  -- Resource Hierarchy
  parent_resource_id VARCHAR REFERENCES permission_resources(id),
  resource_path VARCHAR NOT NULL, -- e.g., 'admin.suppliers.management'
  
  -- Available Actions
  available_actions JSONB NOT NULL DEFAULT '["read", "write", "delete", "approve"]',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Security Audit Events Table
CREATE TABLE IF NOT EXISTS security_audit_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Classification
  event_type VARCHAR NOT NULL, -- 'login_success', 'login_failure', 'permission_denied', 'suspicious_activity', 'data_breach_attempt'
  severity VARCHAR NOT NULL, -- 'low', 'medium', 'high', 'critical'
  category VARCHAR NOT NULL, -- 'authentication', 'authorization', 'data_access', 'system_security'
  
  -- Event Details
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  
  -- Context
  admin_user_id VARCHAR REFERENCES admin_users(id),
  session_id VARCHAR REFERENCES admin_sessions(id),
  ip_address VARCHAR,
  user_agent TEXT,
  
  -- Risk Assessment
  risk_score INTEGER DEFAULT 0, -- 0-100
  threat_indicators JSONB DEFAULT '[]',
  
  -- Response and Resolution
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR,
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_by VARCHAR,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access Pattern Analysis Table
CREATE TABLE IF NOT EXISTS access_pattern_analysis (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR NOT NULL REFERENCES admin_users(id),
  
  -- Pattern Details
  pattern_type VARCHAR NOT NULL, -- 'login_time', 'ip_location', 'resource_access', 'session_duration'
  pattern_data JSONB NOT NULL,
  
  -- Analysis Results
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_score DECIMAL(5,2) DEFAULT 0.0, -- 0.0 to 100.0
  confidence_level DECIMAL(5,2) DEFAULT 0.0, -- 0.0 to 100.0
  
  -- Baseline Comparison
  baseline_data JSONB,
  deviation_metrics JSONB,
  
  -- Actions Taken
  alert_generated BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  actions_taken JSONB DEFAULT '[]',
  
  -- Metadata
  analysis_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Default Admin Roles
INSERT INTO admin_roles (name, display_name, description, level, permissions, resource_permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 100, 
 '{"all": true}', 
 '{"*": ["read", "write", "delete", "approve", "configure"]}', 
 true),
 
('platform_manager', 'Platform Manager', 'Comprehensive platform management with limited system configuration', 80,
 '{"dashboard": true, "suppliers": true, "orders": true, "financial": true, "content": true, "analytics": true, "settings": ["read", "write"]}',
 '{"suppliers": ["read", "write", "approve"], "orders": ["read", "write", "approve"], "financial": ["read", "write"], "content": ["read", "write", "approve"], "analytics": ["read"], "settings": ["read", "write"]}',
 true),
 
('supplier_manager', 'Supplier Manager', 'Supplier oversight and management', 60,
 '{"dashboard": ["read"], "suppliers": true, "content": ["read", "approve"], "analytics": ["read"]}',
 '{"suppliers": ["read", "write", "approve"], "content": ["read", "approve"], "analytics": ["read"]}',
 true),
 
('content_moderator', 'Content Moderator', 'Product and content review and approval', 40,
 '{"dashboard": ["read"], "content": true, "analytics": ["read"]}',
 '{"content": ["read", "write", "approve"], "analytics": ["read"]}',
 true),
 
('financial_manager', 'Financial Manager', 'Financial operations and reporting', 50,
 '{"dashboard": ["read"], "financial": true, "analytics": ["read"]}',
 '{"financial": ["read", "write", "approve"], "analytics": ["read"]}',
 true),
 
('support_manager', 'Support Manager', 'Customer and supplier support operations', 30,
 '{"dashboard": ["read"], "suppliers": ["read"], "orders": ["read", "write"], "analytics": ["read"]}',
 '{"suppliers": ["read"], "orders": ["read", "write"], "analytics": ["read"]}',
 true),
 
('read_only_admin', 'Read-Only Administrator', 'View-only access to all admin functions', 10,
 '{"dashboard": ["read"], "suppliers": ["read"], "orders": ["read"], "financial": ["read"], "content": ["read"], "analytics": ["read"], "settings": ["read"]}',
 '{"*": ["read"]}',
 true);

-- Insert Default Permission Resources
INSERT INTO permission_resources (name, display_name, description, resource_path, available_actions) VALUES
('dashboard', 'Admin Dashboard', 'Main administrative dashboard and metrics', 'admin.dashboard', '["read"]'),
('suppliers', 'Supplier Management', 'Supplier registration, verification, and management', 'admin.suppliers', '["read", "write", "approve", "suspend"]'),
('orders', 'Order Management', 'Order monitoring, dispute resolution, and intervention', 'admin.orders', '["read", "write", "approve", "cancel", "refund"]'),
('financial', 'Financial Management', 'Commission settings, payouts, and financial reporting', 'admin.financial', '["read", "write", "approve", "process"]'),
('content', 'Content Moderation', 'Product approval, content review, and quality control', 'admin.content', '["read", "write", "approve", "reject"]'),
('analytics', 'Analytics & Reporting', 'Platform analytics, reports, and insights', 'admin.analytics', '["read", "export"]'),
('settings', 'Platform Settings', 'System configuration and platform settings', 'admin.settings', '["read", "write", "configure"]'),
('users', 'User Management', 'Admin user and access management', 'admin.users', '["read", "write", "create", "delete", "manage_roles"]'),
('security', 'Security Management', 'Security monitoring, audit logs, and compliance', 'admin.security', '["read", "write", "investigate"]'),
('system', 'System Management', 'System monitoring, maintenance, and configuration', 'admin.system', '["read", "write", "configure", "maintain"]);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_category ON admin_activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_security_audit_events_admin_user_id ON security_audit_events(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_events_severity ON security_audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_events_created_at ON security_audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_access_pattern_analysis_admin_user_id ON access_pattern_analysis(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_access_pattern_analysis_date ON access_pattern_analysis(analysis_date);