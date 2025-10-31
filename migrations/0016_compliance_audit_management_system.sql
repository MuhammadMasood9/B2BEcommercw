-- ==================== COMPLIANCE AND AUDIT MANAGEMENT SYSTEM ====================

-- Comprehensive Audit Logs (Immutable Records)
CREATE TABLE IF NOT EXISTS "comprehensive_audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Classification
  "event_type" varchar NOT NULL, -- 'admin_action', 'system_event', 'security_event', 'compliance_event', 'data_modification'
  "category" varchar NOT NULL, -- 'authentication', 'authorization', 'data_access', 'financial', 'supplier_management', 'content_moderation'
  "subcategory" varchar,
  
  -- Event Details
  "title" varchar NOT NULL,
  "description" text NOT NULL,
  "action" varchar NOT NULL,
  
  -- Actor Information
  "actor_id" varchar NOT NULL,
  "actor_type" varchar NOT NULL, -- 'admin', 'system', 'supplier', 'buyer'
  "actor_name" varchar NOT NULL,
  "session_id" varchar,
  
  -- Target Information
  "target_type" varchar, -- 'user', 'supplier', 'product', 'order', 'setting', 'system'
  "target_id" varchar,
  "target_name" varchar,
  
  -- Change Tracking (Immutable)
  "previous_state" jsonb,
  "new_state" jsonb,
  "change_summary" text,
  
  -- Request Context
  "ip_address" varchar,
  "user_agent" text,
  "request_method" varchar,
  "request_path" varchar,
  "request_params" jsonb,
  "response_status" integer,
  
  -- Compliance and Risk
  "compliance_tags" text[], -- Array of compliance frameworks this relates to
  "risk_level" varchar DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  "sensitivity_level" varchar DEFAULT 'public', -- 'public', 'internal', 'confidential', 'restricted'
  
  -- Immutability and Integrity
  "record_hash" varchar NOT NULL, -- Hash of the record for integrity verification
  "previous_record_hash" varchar, -- Hash of previous record for chain integrity
  "is_immutable" boolean DEFAULT true,
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "retention_until" timestamp -- When this record can be archived/deleted
);

-- Compliance Policies and Rules
CREATE TABLE IF NOT EXISTS "compliance_policies" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy Information
  "name" varchar NOT NULL,
  "description" text NOT NULL,
  "policy_type" varchar NOT NULL, -- 'regulatory', 'internal', 'security', 'data_protection'
  "framework" varchar NOT NULL, -- 'GDPR', 'SOX', 'PCI_DSS', 'ISO27001', 'INTERNAL'
  
  -- Policy Rules
  "rules" jsonb NOT NULL, -- Array of policy rules and conditions
  "enforcement_level" varchar DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  "auto_remediation" boolean DEFAULT false,
  
  -- Scope and Applicability
  "applies_to" jsonb DEFAULT '[]', -- Array of entity types this applies to
  "environments" jsonb DEFAULT '["production"]', -- Environments where this applies
  
  -- Status and Lifecycle
  "status" varchar DEFAULT 'active', -- 'draft', 'active', 'deprecated', 'archived'
  "effective_date" timestamp NOT NULL,
  "expiry_date" timestamp,
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" varchar NOT NULL,
  "updated_by" varchar
);

-- Compliance Violations and Incidents
CREATE TABLE IF NOT EXISTS "compliance_violations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Violation Details
  "policy_id" varchar NOT NULL,
  "violation_type" varchar NOT NULL, -- 'policy_breach', 'data_leak', 'unauthorized_access', 'retention_violation'
  "severity" varchar NOT NULL, -- 'low', 'medium', 'high', 'critical'
  "title" varchar NOT NULL,
  "description" text NOT NULL,
  
  -- Context
  "entity_type" varchar, -- What was affected
  "entity_id" varchar,
  "entity_name" varchar,
  "audit_log_id" varchar, -- Reference to the audit log that detected this
  
  -- Detection
  "detected_by" varchar NOT NULL, -- 'automated', 'manual', 'external_audit'
  "detection_method" varchar, -- 'rule_engine', 'anomaly_detection', 'user_report'
  "detection_confidence" decimal(5,2) DEFAULT 0.0, -- 0.0 to 100.0
  
  -- Impact Assessment
  "impact_level" varchar DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  "affected_records" integer DEFAULT 0,
  "financial_impact" decimal(15,2) DEFAULT 0,
  "regulatory_impact" text,
  
  -- Status and Resolution
  "status" varchar DEFAULT 'open', -- 'open', 'investigating', 'remediation', 'resolved', 'false_positive'
  "assigned_to" varchar,
  "resolution_plan" text,
  "remediation_steps" jsonb DEFAULT '[]',
  "resolution_summary" text,
  
  -- Timeline
  "detected_at" timestamp DEFAULT now() NOT NULL,
  "acknowledged_at" timestamp,
  "resolved_at" timestamp,
  "due_date" timestamp,
  
  -- Escalation
  "escalation_level" integer DEFAULT 0,
  "escalated_at" timestamp,
  "escalated_to" jsonb DEFAULT '[]',
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  FOREIGN KEY ("policy_id") REFERENCES "compliance_policies"("id")
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS "data_retention_policies" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy Information
  "name" varchar NOT NULL,
  "description" text NOT NULL,
  "data_type" varchar NOT NULL, -- 'audit_logs', 'user_data', 'financial_records', 'communication_logs'
  
  -- Retention Rules
  "retention_period_days" integer NOT NULL,
  "archive_after_days" integer,
  "delete_after_days" integer,
  
  -- Conditions
  "conditions" jsonb DEFAULT '{}', -- Conditions that determine when this policy applies
  "legal_hold_exempt" boolean DEFAULT false, -- Whether this data type can be subject to legal holds
  
  -- Geographic and Regulatory
  "geographic_scope" jsonb DEFAULT '[]', -- Array of countries/regions this applies to
  "regulatory_basis" jsonb DEFAULT '[]', -- Array of regulations that require this retention
  
  -- Processing Rules
  "anonymization_rules" jsonb DEFAULT '{}', -- Rules for anonymizing data before deletion
  "secure_deletion_required" boolean DEFAULT true,
  "backup_retention_days" integer,
  
  -- Status
  "is_active" boolean DEFAULT true,
  "priority" integer DEFAULT 100, -- Higher number = higher priority when policies conflict
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" varchar NOT NULL,
  "updated_by" varchar
);

-- Data Retention Schedules and Execution
CREATE TABLE IF NOT EXISTS "data_retention_schedules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Schedule Information
  "policy_id" varchar NOT NULL,
  "schedule_name" varchar NOT NULL,
  "schedule_type" varchar NOT NULL, -- 'archive', 'delete', 'anonymize'
  
  -- Execution Details
  "target_table" varchar NOT NULL,
  "target_conditions" jsonb NOT NULL, -- SQL conditions for selecting records
  "estimated_records" integer DEFAULT 0,
  "estimated_size_mb" decimal(15,2) DEFAULT 0,
  
  -- Scheduling
  "scheduled_date" timestamp NOT NULL,
  "execution_window_hours" integer DEFAULT 4, -- How long the operation can run
  "priority" integer DEFAULT 100,
  
  -- Status and Results
  "status" varchar DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed', 'cancelled'
  "started_at" timestamp,
  "completed_at" timestamp,
  "records_processed" integer DEFAULT 0,
  "records_archived" integer DEFAULT 0,
  "records_deleted" integer DEFAULT 0,
  "error_message" text,
  
  -- Verification
  "verification_hash" varchar, -- Hash of processed data for verification
  "backup_location" varchar, -- Where archived data is stored
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" varchar NOT NULL,
  
  FOREIGN KEY ("policy_id") REFERENCES "data_retention_policies"("id")
);

-- Audit Reports and Exports
CREATE TABLE IF NOT EXISTS "audit_reports" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report Information
  "name" varchar NOT NULL,
  "description" text,
  "report_type" varchar NOT NULL, -- 'compliance', 'security', 'activity', 'financial', 'custom'
  "format" varchar NOT NULL, -- 'pdf', 'excel', 'csv', 'json'
  
  -- Report Parameters
  "date_range_start" timestamp NOT NULL,
  "date_range_end" timestamp NOT NULL,
  "filters" jsonb DEFAULT '{}', -- Filters applied to the report
  "include_sensitive" boolean DEFAULT false,
  
  -- Generation Details
  "status" varchar DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  "generated_by" varchar NOT NULL,
  "generated_at" timestamp,
  "file_path" varchar, -- Path to generated report file
  "file_size_bytes" bigint DEFAULT 0,
  "record_count" integer DEFAULT 0,
  
  -- Access Control
  "access_level" varchar DEFAULT 'restricted', -- 'public', 'internal', 'restricted', 'confidential'
  "authorized_users" jsonb DEFAULT '[]', -- Array of user IDs who can access this report
  "download_count" integer DEFAULT 0,
  "last_accessed_at" timestamp,
  
  -- Retention
  "expires_at" timestamp, -- When this report should be automatically deleted
  "retention_reason" varchar, -- Why this report is being retained
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Compliance Monitoring and Metrics
CREATE TABLE IF NOT EXISTS "compliance_metrics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Period
  "date" date NOT NULL,
  "hour" integer, -- For hourly metrics
  
  -- Compliance Scores
  "overall_compliance_score" decimal(5,2) DEFAULT 0.0, -- 0.0 to 100.0
  "policy_compliance_scores" jsonb DEFAULT '{}', -- Scores by policy type
  
  -- Violation Metrics
  "total_violations" integer DEFAULT 0,
  "critical_violations" integer DEFAULT 0,
  "high_violations" integer DEFAULT 0,
  "medium_violations" integer DEFAULT 0,
  "low_violations" integer DEFAULT 0,
  
  -- Resolution Metrics
  "violations_resolved" integer DEFAULT 0,
  "avg_resolution_time_hours" decimal(10,2) DEFAULT 0,
  "overdue_violations" integer DEFAULT 0,
  
  -- Audit Activity
  "audit_events_logged" integer DEFAULT 0,
  "sensitive_events_logged" integer DEFAULT 0,
  "failed_audit_attempts" integer DEFAULT 0,
  
  -- Data Retention
  "records_archived" integer DEFAULT 0,
  "records_deleted" integer DEFAULT 0,
  "retention_policy_violations" integer DEFAULT 0,
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Legal Holds and Litigation Support
CREATE TABLE IF NOT EXISTS "legal_holds" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Legal Hold Information
  "name" varchar NOT NULL,
  "description" text NOT NULL,
  "case_number" varchar,
  "legal_matter" varchar NOT NULL,
  
  -- Scope
  "data_types" jsonb NOT NULL, -- Array of data types to preserve
  "date_range_start" timestamp,
  "date_range_end" timestamp,
  "custodians" jsonb DEFAULT '[]', -- Array of data custodians
  "search_terms" jsonb DEFAULT '[]', -- Keywords for identifying relevant data
  
  -- Status and Lifecycle
  "status" varchar DEFAULT 'active', -- 'draft', 'active', 'released', 'expired'
  "issued_by" varchar NOT NULL,
  "issued_date" timestamp DEFAULT now() NOT NULL,
  "release_date" timestamp,
  "expiry_date" timestamp,
  
  -- Impact
  "affected_records_count" integer DEFAULT 0,
  "affected_data_size_mb" decimal(15,2) DEFAULT 0,
  "preservation_cost" decimal(15,2) DEFAULT 0,
  
  -- Compliance
  "notification_sent" boolean DEFAULT false,
  "acknowledgments_received" jsonb DEFAULT '[]',
  "compliance_verified" boolean DEFAULT false,
  "verification_date" timestamp,
  
  -- Metadata
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_by" varchar NOT NULL,
  "updated_by" varchar
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_event_type" ON "comprehensive_audit_logs"("event_type");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_category" ON "comprehensive_audit_logs"("category");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_actor" ON "comprehensive_audit_logs"("actor_id", "actor_type");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_target" ON "comprehensive_audit_logs"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_created_at" ON "comprehensive_audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_risk_level" ON "comprehensive_audit_logs"("risk_level");
CREATE INDEX IF NOT EXISTS "idx_comprehensive_audit_logs_compliance_tags" ON "comprehensive_audit_logs" USING GIN("compliance_tags");

CREATE INDEX IF NOT EXISTS "idx_compliance_violations_policy_id" ON "compliance_violations"("policy_id");
CREATE INDEX IF NOT EXISTS "idx_compliance_violations_status" ON "compliance_violations"("status");
CREATE INDEX IF NOT EXISTS "idx_compliance_violations_severity" ON "compliance_violations"("severity");
CREATE INDEX IF NOT EXISTS "idx_compliance_violations_detected_at" ON "compliance_violations"("detected_at");

CREATE INDEX IF NOT EXISTS "idx_data_retention_schedules_policy_id" ON "data_retention_schedules"("policy_id");
CREATE INDEX IF NOT EXISTS "idx_data_retention_schedules_scheduled_date" ON "data_retention_schedules"("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_data_retention_schedules_status" ON "data_retention_schedules"("status");

CREATE INDEX IF NOT EXISTS "idx_audit_reports_report_type" ON "audit_reports"("report_type");
CREATE INDEX IF NOT EXISTS "idx_audit_reports_generated_by" ON "audit_reports"("generated_by");
CREATE INDEX IF NOT EXISTS "idx_audit_reports_created_at" ON "audit_reports"("created_at");

CREATE INDEX IF NOT EXISTS "idx_compliance_metrics_date" ON "compliance_metrics"("date");
CREATE INDEX IF NOT EXISTS "idx_legal_holds_status" ON "legal_holds"("status");