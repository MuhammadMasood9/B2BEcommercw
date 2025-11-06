-- Security Monitoring and Alerting System Migration
-- This migration adds the security_alerts table for enhanced security monitoring

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS "security_alerts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" varchar NOT NULL, -- 'brute_force', 'account_takeover', 'suspicious_activity', 'token_abuse', 'geographic_anomaly'
  "severity" varchar NOT NULL, -- 'low', 'medium', 'high', 'critical'
  "description" text NOT NULL,
  "ip_address" varchar NOT NULL,
  "user_id" varchar,
  "user_email" varchar,
  "metadata" json DEFAULT '{}',
  "status" varchar DEFAULT 'active', -- 'active', 'investigating', 'resolved', 'false_positive'
  "acknowledged_by" varchar,
  "acknowledged_at" timestamp,
  "resolved_by" varchar,
  "resolved_at" timestamp,
  "resolution_notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create indexes for security_alerts
CREATE INDEX IF NOT EXISTS "idx_security_alerts_type" ON "security_alerts" ("type");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_severity" ON "security_alerts" ("severity");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_status" ON "security_alerts" ("status");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_ip_address" ON "security_alerts" ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_user_id" ON "security_alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_created_at" ON "security_alerts" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_security_alerts_severity_status" ON "security_alerts" ("severity", "status");

-- Add foreign key constraints if users table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "security_alerts" ADD CONSTRAINT "fk_security_alerts_user_id" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_alerts_updated_at
  BEFORE UPDATE ON "security_alerts"
  FOR EACH ROW
  EXECUTE FUNCTION update_security_alerts_updated_at();

-- Insert initial security alert types for reference
INSERT INTO "security_alerts" ("type", "severity", "description", "ip_address", "status", "created_at") VALUES
('system_initialization', 'low', 'Security monitoring system initialized', '127.0.0.1', 'resolved', now())
ON CONFLICT DO NOTHING;

COMMENT ON TABLE "security_alerts" IS 'Security alerts and threats detected by the monitoring system';
COMMENT ON COLUMN "security_alerts"."type" IS 'Type of security threat detected';
COMMENT ON COLUMN "security_alerts"."severity" IS 'Severity level of the security alert';
COMMENT ON COLUMN "security_alerts"."status" IS 'Current status of the security alert';
COMMENT ON COLUMN "security_alerts"."metadata" IS 'Additional context and data about the security alert';