-- Communication and Notification Management System Migration
-- This migration adds tables for bulk communication, notification management, and analytics

-- ==================== COMMUNICATION TEMPLATES ====================

CREATE TABLE IF NOT EXISTS communication_templates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template Identification
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL, -- 'announcement', 'policy_update', 'promotional', 'system_notification', 'approval', 'rejection'
    type VARCHAR NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    
    -- Template Content
    subject VARCHAR, -- For email templates
    content TEXT NOT NULL,
    html_content TEXT, -- For rich HTML emails
    
    -- Personalization
    variables JSON DEFAULT '[]', -- Array of available variables like {{firstName}}, {{companyName}}
    default_values JSON DEFAULT '{}', -- Default values for variables
    
    -- Targeting
    target_audience VARCHAR NOT NULL, -- 'all', 'suppliers', 'buyers', 'admins', 'custom'
    audience_criteria JSON DEFAULT '{}', -- Criteria for custom targeting
    
    -- Template Settings
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false, -- System templates cannot be deleted
    requires_approval BOOLEAN DEFAULT false,
    
    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT false,
    ab_test_config JSON DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR
);

-- ==================== BULK COMMUNICATIONS ====================

CREATE TABLE IF NOT EXISTS bulk_communications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Communication Details
    name VARCHAR NOT NULL,
    description TEXT,
    template_id VARCHAR,
    
    -- Content
    subject VARCHAR,
    content TEXT NOT NULL,
    html_content TEXT,
    
    -- Targeting
    target_type VARCHAR NOT NULL, -- 'all', 'segment', 'individual', 'custom_query'
    target_criteria JSON NOT NULL, -- Targeting criteria and filters
    estimated_recipients INTEGER DEFAULT 0,
    actual_recipients INTEGER DEFAULT 0,
    
    -- Delivery Settings
    delivery_method VARCHAR NOT NULL, -- 'immediate', 'scheduled', 'drip'
    scheduled_at TIMESTAMP,
    delivery_timezone VARCHAR DEFAULT 'UTC',
    
    -- Channel Configuration
    channels JSON NOT NULL, -- Array of channels: ['email', 'sms', 'push', 'in_app']
    channel_settings JSON DEFAULT '{}', -- Channel-specific settings
    
    -- Personalization
    personalization_data JSON DEFAULT '{}',
    use_dynamic_content BOOLEAN DEFAULT false,
    
    -- Status and Control
    status VARCHAR DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'
    approval_status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    
    -- Delivery Tracking
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Performance Metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    -- Error Handling
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_details JSON DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL
);

-- ==================== COMMUNICATION RECIPIENTS ====================

CREATE TABLE IF NOT EXISTS communication_recipients (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id VARCHAR NOT NULL,
    
    -- Recipient Details
    user_id VARCHAR NOT NULL,
    user_type VARCHAR NOT NULL, -- 'supplier', 'buyer', 'admin'
    email VARCHAR NOT NULL,
    phone VARCHAR,
    
    -- Personalization Data
    personalization_data JSON DEFAULT '{}',
    
    -- Delivery Status per Channel
    email_status VARCHAR DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    sms_status VARCHAR DEFAULT 'pending',
    push_status VARCHAR DEFAULT 'pending',
    in_app_status VARCHAR DEFAULT 'pending',
    
    -- Delivery Timestamps
    email_sent_at TIMESTAMP,
    email_delivered_at TIMESTAMP,
    email_opened_at TIMESTAMP,
    email_clicked_at TIMESTAMP,
    sms_sent_at TIMESTAMP,
    sms_delivered_at TIMESTAMP,
    push_sent_at TIMESTAMP,
    push_delivered_at TIMESTAMP,
    in_app_sent_at TIMESTAMP,
    in_app_read_at TIMESTAMP,
    
    -- Error Tracking
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Engagement Tracking
    engagement_score DECIMAL(5,2) DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== NOTIFICATION PREFERENCES ====================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE,
    
    -- Channel Preferences
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Notification Type Preferences
    marketing_emails BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    order_updates BOOLEAN DEFAULT true,
    inquiry_notifications BOOLEAN DEFAULT true,
    promotional_messages BOOLEAN DEFAULT false,
    
    -- Frequency Settings
    digest_frequency VARCHAR DEFAULT 'daily', -- 'immediate', 'hourly', 'daily', 'weekly'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR DEFAULT 'UTC',
    
    -- Contact Information
    preferred_email VARCHAR,
    preferred_phone VARCHAR,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== NOTIFICATION DELIVERY LOG ====================

CREATE TABLE IF NOT EXISTS notification_delivery_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference Information
    communication_id VARCHAR,
    template_id VARCHAR,
    user_id VARCHAR NOT NULL,
    
    -- Notification Details
    notification_type VARCHAR NOT NULL, -- 'bulk', 'automated', 'transactional', 'system'
    channel VARCHAR NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    subject VARCHAR,
    content TEXT NOT NULL,
    
    -- Delivery Information
    recipient_email VARCHAR,
    recipient_phone VARCHAR,
    status VARCHAR NOT NULL, -- 'pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
    
    -- Tracking Data
    external_id VARCHAR, -- ID from external service (SendGrid, Twilio, etc.)
    delivery_attempts INTEGER DEFAULT 1,
    error_message TEXT,
    
    -- Engagement Metrics
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    
    -- Metadata
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== COMMUNICATION ANALYTICS ====================

CREATE TABLE IF NOT EXISTS communication_analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    date DATE NOT NULL,
    hour INTEGER, -- For hourly analytics
    
    -- Communication Reference
    communication_id VARCHAR,
    template_id VARCHAR,
    channel VARCHAR NOT NULL,
    
    -- Volume Metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    delivery_rate DECIMAL(5,2) DEFAULT 0, -- (delivered / sent) * 100
    open_rate DECIMAL(5,2) DEFAULT 0, -- (opened / delivered) * 100
    click_rate DECIMAL(5,2) DEFAULT 0, -- (clicked / delivered) * 100
    bounce_rate DECIMAL(5,2) DEFAULT 0, -- (bounced / sent) * 100
    unsubscribe_rate DECIMAL(5,2) DEFAULT 0, -- (unsubscribed / delivered) * 100
    
    -- Audience Segmentation
    audience_type VARCHAR, -- 'suppliers', 'buyers', 'all'
    audience_segment VARCHAR,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== AUTOMATED NOTIFICATIONS ====================

CREATE TABLE IF NOT EXISTS automated_notification_rules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Identification
    name VARCHAR NOT NULL,
    description TEXT,
    
    -- Trigger Configuration
    trigger_event VARCHAR NOT NULL, -- 'user_signup', 'order_placed', 'inquiry_received', 'payment_completed', etc.
    trigger_conditions JSON DEFAULT '{}', -- Additional conditions for triggering
    
    -- Template and Content
    template_id VARCHAR,
    custom_content JSON, -- Override template content if needed
    
    -- Targeting
    target_audience VARCHAR NOT NULL, -- 'event_user', 'admins', 'suppliers', 'custom'
    audience_filter JSON DEFAULT '{}',
    
    -- Delivery Settings
    channels JSON NOT NULL, -- Array of channels to use
    delivery_delay INTEGER DEFAULT 0, -- Delay in minutes before sending
    max_frequency VARCHAR DEFAULT 'unlimited', -- 'once', 'daily', 'weekly', 'unlimited'
    
    -- Smart Delivery
    respect_quiet_hours BOOLEAN DEFAULT true,
    optimize_send_time BOOLEAN DEFAULT false,
    
    -- Status and Control
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5, -- 1-10, higher number = higher priority
    
    -- Performance Tracking
    total_triggered INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR
);

-- ==================== NOTIFICATION QUEUE ====================

CREATE TABLE IF NOT EXISTS notification_queue (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Queue Information
    priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
    scheduled_at TIMESTAMP DEFAULT NOW(),
    
    -- Notification Details
    user_id VARCHAR NOT NULL,
    channel VARCHAR NOT NULL,
    notification_type VARCHAR NOT NULL,
    
    -- Content
    subject VARCHAR,
    content TEXT NOT NULL,
    html_content TEXT,
    
    -- Delivery Information
    recipient_email VARCHAR,
    recipient_phone VARCHAR,
    
    -- Processing Status
    status VARCHAR DEFAULT 'queued', -- 'queued', 'processing', 'sent', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Error Handling
    error_message TEXT,
    next_retry_at TIMESTAMP,
    
    -- Reference Data
    communication_id VARCHAR,
    template_id VARCHAR,
    rule_id VARCHAR, -- For automated notifications
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ==================== UNSUBSCRIBE MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS unsubscribe_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id VARCHAR,
    email VARCHAR NOT NULL,
    
    -- Unsubscribe Details
    unsubscribe_type VARCHAR NOT NULL, -- 'all', 'marketing', 'promotional', 'specific_template'
    template_id VARCHAR, -- For specific template unsubscribes
    communication_id VARCHAR, -- Reference to the communication that triggered unsubscribe
    
    -- Request Information
    reason VARCHAR, -- 'too_frequent', 'not_relevant', 'never_signed_up', 'other'
    feedback TEXT,
    
    -- Processing
    status VARCHAR DEFAULT 'active', -- 'active', 'resubscribed'
    processed_at TIMESTAMP DEFAULT NOW(),
    resubscribed_at TIMESTAMP,
    
    -- Metadata
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Communication Templates
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON communication_templates(type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);

-- Bulk Communications
CREATE INDEX IF NOT EXISTS idx_bulk_communications_status ON bulk_communications(status);
CREATE INDEX IF NOT EXISTS idx_bulk_communications_scheduled ON bulk_communications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bulk_communications_created_by ON bulk_communications(created_by);

-- Communication Recipients
CREATE INDEX IF NOT EXISTS idx_communication_recipients_comm_id ON communication_recipients(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_user_id ON communication_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_email_status ON communication_recipients(email_status);

-- Notification Preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Notification Delivery Log
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_user_id ON notification_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_status ON notification_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_channel ON notification_delivery_log(channel);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_sent_at ON notification_delivery_log(sent_at);

-- Communication Analytics
CREATE INDEX IF NOT EXISTS idx_communication_analytics_date ON communication_analytics(date);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_channel ON communication_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_comm_id ON communication_analytics(communication_id);

-- Automated Notification Rules
CREATE INDEX IF NOT EXISTS idx_automated_notification_rules_active ON automated_notification_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automated_notification_rules_trigger ON automated_notification_rules(trigger_event);

-- Notification Queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);

-- Unsubscribe Requests
CREATE INDEX IF NOT EXISTS idx_unsubscribe_requests_email ON unsubscribe_requests(email);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_requests_user_id ON unsubscribe_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_requests_status ON unsubscribe_requests(status);