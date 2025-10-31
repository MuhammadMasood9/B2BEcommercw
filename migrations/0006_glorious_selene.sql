CREATE TABLE "alert_configuration" (
	"id" varchar PRIMARY KEY DEFAULT 'global' NOT NULL,
	"global_settings" json DEFAULT '{"enableNotifications":true,"defaultSeverity":"medium","retentionDays":30,"maxAlertsPerHour":100,"autoEscalationEnabled":true,"escalationDelayMinutes":30}'::json,
	"notification_channels" json DEFAULT '{"email":{"enabled":true,"recipients":[],"template":"default"},"sms":{"enabled":false,"recipients":[]},"webhook":{"enabled":false,"url":"","headers":{}},"inApp":{"enabled":true,"showDesktop":true},"slack":{"enabled":false,"webhookUrl":"","channel":"#alerts"}}'::json,
	"escalation_matrix" json DEFAULT '[]'::json,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "alert_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"performed_by" varchar,
	"details" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer NOT NULL,
	"critical_count" integer DEFAULT 0,
	"high_count" integer DEFAULT 0,
	"medium_count" integer DEFAULT 0,
	"low_count" integer DEFAULT 0,
	"system_count" integer DEFAULT 0,
	"security_count" integer DEFAULT 0,
	"business_count" integer DEFAULT 0,
	"compliance_count" integer DEFAULT 0,
	"performance_count" integer DEFAULT 0,
	"capacity_count" integer DEFAULT 0,
	"avg_acknowledgment_time" integer,
	"avg_resolution_time" integer,
	"escalation_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"metric" varchar NOT NULL,
	"condition" varchar NOT NULL,
	"threshold" numeric,
	"time_window" integer DEFAULT 300,
	"query" text,
	"aggregation" varchar DEFAULT 'avg',
	"enabled" boolean DEFAULT true,
	"notification_channels" json DEFAULT '["email"]'::json,
	"escalation_rules" json DEFAULT '[]'::json,
	"suppress_duration" integer DEFAULT 3600,
	"max_alerts_per_hour" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" varchar NOT NULL,
	"message" text NOT NULL,
	"attachments" json DEFAULT '[]'::json,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2),
	"evidence" json DEFAULT '[]'::json,
	"buyer_evidence" json DEFAULT '[]'::json,
	"supplier_evidence" json DEFAULT '[]'::json,
	"status" varchar DEFAULT 'open',
	"priority" varchar DEFAULT 'medium',
	"assigned_mediator" varchar,
	"mediation_notes" text,
	"resolution_summary" text,
	"resolution_type" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"escalation_level" integer DEFAULT 0,
	"escalated_at" timestamp,
	"escalation_reason" text
);
--> statement-breakpoint
CREATE TABLE "notification_delivery_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" varchar NOT NULL,
	"channel" varchar NOT NULL,
	"recipient" varchar NOT NULL,
	"status" text NOT NULL,
	"attempt_count" integer DEFAULT 1,
	"error_message" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_anomalies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"anomaly_type" varchar NOT NULL,
	"severity" varchar DEFAULT 'medium',
	"confidence_score" numeric(5, 2),
	"description" text NOT NULL,
	"detected_values" json,
	"expected_values" json,
	"status" varchar DEFAULT 'flagged',
	"reviewed_by" varchar,
	"review_notes" text,
	"detected_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_interventions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"reason" text NOT NULL,
	"action_taken" text NOT NULL,
	"previous_status" varchar,
	"new_status" varchar,
	"previous_data" json,
	"new_data" json,
	"financial_impact" numeric(15, 2) DEFAULT '0',
	"commission_adjustment" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_performance_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer,
	"total_orders" integer DEFAULT 0,
	"completed_orders" integer DEFAULT 0,
	"cancelled_orders" integer DEFAULT 0,
	"disputed_orders" integer DEFAULT 0,
	"total_order_value" numeric(15, 2) DEFAULT '0',
	"total_commission" numeric(15, 2) DEFAULT '0',
	"total_refunds" numeric(15, 2) DEFAULT '0',
	"avg_processing_time" integer,
	"avg_delivery_time" integer,
	"dispute_rate" numeric(5, 2),
	"refund_rate" numeric(5, 2),
	"active_suppliers" integer DEFAULT 0,
	"top_performing_suppliers" json DEFAULT '[]'::json,
	"underperforming_suppliers" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"value_type" varchar NOT NULL,
	"value_string" text,
	"value_number" numeric(15, 4),
	"value_boolean" boolean,
	"value_json" json,
	"default_value" json,
	"validation_rules" json,
	"environment" varchar DEFAULT 'production',
	"requires_restart" boolean DEFAULT false,
	"is_sensitive" boolean DEFAULT false,
	"dependencies" json DEFAULT '[]'::json,
	"affects" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true,
	"is_readonly" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar,
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "platform_settings_deployments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deployment_name" varchar NOT NULL,
	"description" text,
	"source_environment" varchar NOT NULL,
	"target_environment" varchar NOT NULL,
	"settings_package" json NOT NULL,
	"deployment_strategy" varchar DEFAULT 'immediate',
	"validation_status" varchar DEFAULT 'pending',
	"validation_results" json,
	"approval_status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"status" varchar DEFAULT 'draft',
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"rollback_plan" json,
	"can_rollback" boolean DEFAULT true,
	"rollback_deadline" timestamp,
	"deployment_results" json,
	"error_details" json,
	"performance_impact" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"previous_value" json,
	"new_value" json,
	"change_reason" text,
	"impact_assessment" json,
	"validation_results" json,
	"change_request_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"can_rollback" boolean DEFAULT true,
	"rollback_data" json,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "platform_settings_impact" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_id" varchar NOT NULL,
	"impact_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"description" text NOT NULL,
	"affected_systems" json DEFAULT '[]'::json,
	"affected_users" json DEFAULT '[]'::json,
	"metrics_to_monitor" json DEFAULT '[]'::json,
	"expected_changes" json,
	"mitigation_steps" json DEFAULT '[]'::json,
	"rollback_triggers" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "platform_settings_validation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"rule_type" varchar NOT NULL,
	"conditions" json NOT NULL,
	"validation_logic" json NOT NULL,
	"error_message" text NOT NULL,
	"severity" varchar DEFAULT 'error',
	"applies_to" json DEFAULT '[]'::json,
	"environments" json DEFAULT '["production","staging","development"]'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"dispute_id" varchar,
	"buyer_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"refund_amount" numeric(15, 2) NOT NULL,
	"original_amount" numeric(15, 2) NOT NULL,
	"refund_type" varchar NOT NULL,
	"reason" text NOT NULL,
	"commission_adjustment" numeric(15, 2) DEFAULT '0',
	"supplier_deduction" numeric(15, 2) DEFAULT '0',
	"status" varchar DEFAULT 'pending',
	"payment_method" varchar,
	"transaction_id" varchar,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"completed_at" timestamp,
	"admin_notes" text,
	"buyer_notification_sent" boolean DEFAULT false,
	"supplier_notification_sent" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"source" varchar NOT NULL,
	"entity_id" varchar,
	"entity_type" varchar,
	"metadata" json DEFAULT '{}'::json,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved" boolean DEFAULT false,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"resolution" text,
	"escalation_level" integer DEFAULT 0,
	"escalated_at" timestamp,
	"escalated_to" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "supplier_id" varchar;