-- ==================== AUTOMATED ALERTING SYSTEM ====================

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR NOT NULL CHECK (type IN ('system', 'security', 'business', 'compliance', 'performance', 'capacity')),
  severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR NOT NULL, -- Source system/service that generated the alert
  entity_id VARCHAR, -- Related entity ID (supplier, order, etc.)
  entity_type VARCHAR, -- Type of related entity
  metadata JSONB DEFAULT '{}', -- Additional alert metadata
  
  -- Alert Status
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR,
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR,
  resolved_at TIMESTAMP,
  resolution TEXT,
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMP,
  escalated_to VARCHAR[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS alert_rules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Rule Configuration
  type VARCHAR NOT NULL CHECK (type IN ('threshold', 'anomaly', 'pattern', 'custom')),
  severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metric VARCHAR NOT NULL, -- Metric to monitor (cpu_usage, error_rate, etc.)
  condition VARCHAR NOT NULL, -- Condition type (greater_than, less_than, equals, etc.)
  threshold DECIMAL, -- Threshold value
  time_window INTEGER DEFAULT 300, -- Time window in seconds
  
  -- Rule Logic
  query TEXT, -- Custom query for complex rules
  aggregation VARCHAR DEFAULT 'avg', -- Aggregation method (avg, sum, count, max, min)
  
  -- Notification Settings
  enabled BOOLEAN DEFAULT TRUE,
  notification_channels VARCHAR[] DEFAULT ARRAY['email'], -- email, sms, webhook, in_app
  escalation_rules JSONB DEFAULT '[]', -- Escalation configuration
  
  -- Suppression
  suppress_duration INTEGER DEFAULT 3600, -- Suppress duplicate alerts for X seconds
  max_alerts_per_hour INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR NOT NULL
);

-- Alert Configuration Table
CREATE TABLE IF NOT EXISTS alert_configuration (
  id VARCHAR PRIMARY KEY DEFAULT 'global',
  
  -- Global Settings
  global_settings JSONB DEFAULT '{
    "enableNotifications": true,
    "defaultSeverity": "medium",
    "retentionDays": 30,
    "maxAlertsPerHour": 100,
    "autoEscalationEnabled": true,
    "escalationDelayMinutes": 30
  }',
  
  -- Notification Channels
  notification_channels JSONB DEFAULT '{
    "email": {
      "enabled": true,
      "recipients": [],
      "template": "default",
      "smtpConfig": {}
    },
    "sms": {
      "enabled": false,
      "recipients": [],
      "provider": "twilio",
      "config": {}
    },
    "webhook": {
      "enabled": false,
      "url": "",
      "headers": {},
      "retryAttempts": 3
    },
    "inApp": {
      "enabled": true,
      "showDesktop": true,
      "soundEnabled": true
    },
    "slack": {
      "enabled": false,
      "webhookUrl": "",
      "channel": "#alerts"
    }
  }',
  
  -- Escalation Matrix
  escalation_matrix JSONB DEFAULT '[]',
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR
);

-- Alert History Table (for analytics and tracking)
CREATE TABLE IF NOT EXISTS alert_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL, -- created, acknowledged, escalated, resolved, suppressed
  performed_by VARCHAR,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert Metrics Table (for performance tracking)
CREATE TABLE IF NOT EXISTS alert_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- Counts by severity
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  
  -- Counts by type
  system_count INTEGER DEFAULT 0,
  security_count INTEGER DEFAULT 0,
  business_count INTEGER DEFAULT 0,
  compliance_count INTEGER DEFAULT 0,
  performance_count INTEGER DEFAULT 0,
  capacity_count INTEGER DEFAULT 0,
  
  -- Response metrics
  avg_acknowledgment_time INTEGER, -- seconds
  avg_resolution_time INTEGER, -- seconds
  escalation_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date, hour)
);

-- Notification Delivery Log
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id VARCHAR NOT NULL,
  channel VARCHAR NOT NULL, -- email, sms, webhook, in_app, slack
  recipient VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  attempt_count INTEGER DEFAULT 1,
  error_message TEXT,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created ON system_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type_created ON system_alerts(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(acknowledged, resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_entity ON system_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled, metric);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_metrics_date_hour ON alert_metrics(date, hour);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_alert ON notification_delivery_log(alert_id, channel, status);

-- Insert default configuration
INSERT INTO alert_configuration (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Insert some default alert rules
INSERT INTO alert_rules (name, description, type, severity, metric, condition, threshold, notification_channels, created_by) VALUES
  ('High CPU Usage', 'Alert when CPU usage exceeds 80%', 'threshold', 'high', 'cpu_usage', 'greater_than', 80, ARRAY['email', 'in_app'], 'system'),
  ('High Memory Usage', 'Alert when memory usage exceeds 90%', 'threshold', 'critical', 'memory_usage', 'greater_than', 90, ARRAY['email', 'sms', 'in_app'], 'system'),
  ('High Error Rate', 'Alert when API error rate exceeds 5%', 'threshold', 'high', 'error_rate', 'greater_than', 5, ARRAY['email', 'in_app'], 'system'),
  ('Supplier Approval Backlog', 'Alert when suppliers pending approval exceed threshold', 'threshold', 'medium', 'pending_suppliers', 'greater_than', 10, ARRAY['email', 'in_app'], 'system'),
  ('Failed Login Attempts', 'Alert on suspicious login activity', 'threshold', 'critical', 'failed_logins', 'greater_than', 20, ARRAY['email', 'sms', 'in_app'], 'system'),
  ('Low Disk Space', 'Alert when disk usage exceeds 85%', 'threshold', 'high', 'disk_usage', 'greater_than', 85, ARRAY['email', 'in_app'], 'system')
ON CONFLICT (name) DO NOTHING;