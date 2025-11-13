# Chat Management System Requirements

## Introduction

This document outlines the requirements for a comprehensive chat management system that enables seamless communication between buyers, suppliers, and administrators on the B2B marketplace platform. The system addresses current issues with conversation tracking, unread message counts, and participant management while providing a clean, scalable architecture for real-time messaging.

## Glossary

- **Chat System**: The complete messaging infrastructure enabling real-time communication between platform users
- **Conversation**: A message thread between two or more participants (buyer-supplier, buyer-admin, or multi-party)
- **Participant**: A user involved in a conversation (buyer, supplier, or admin)
- **Message**: A single communication unit within a conversation containing text and optional attachments
- **Unread Count**: The number of messages a participant has not yet viewed in a conversation
- **Conversation Type**: The classification of a conversation based on participants (buyer_supplier, buyer_admin, support)
- **Message Status**: The read/unread state of a message for each participant
- **Real-time Notification**: Instant delivery of message events via WebSocket connection

## Requirements

### Requirement 1: Conversation Management

**User Story:** As a buyer, I want to start conversations with suppliers about products, so that I can inquire about specifications and pricing.

#### Acceptance Criteria

1. WHEN a buyer views a product, THE Chat System SHALL provide an option to initiate a conversation with the product's supplier
2. WHEN a buyer initiates a conversation, THE Chat System SHALL create a new conversation record with buyer_supplier type
3. WHEN a conversation already exists between a buyer and supplier for a product, THE Chat System SHALL reuse the existing conversation
4. THE Chat System SHALL store the product_id reference for product-related conversations
5. THE Chat System SHALL support conversations without product context for general supplier inquiries

### Requirement 2: Multi-Party Conversation Support

**User Story:** As an administrator, I want to participate in buyer-supplier conversations when needed, so that I can provide support and resolve disputes.

#### Acceptance Criteria

1. THE Chat System SHALL support three conversation types: buyer_supplier, buyer_admin, and support
2. WHEN an admin joins a buyer-supplier conversation, THE Chat System SHALL maintain all existing messages and participants
3. THE Chat System SHALL track each participant's unread message count independently
4. THE Chat System SHALL allow admins to view all active conversations on the platform
5. THE Chat System SHALL prevent unauthorized users from accessing conversations they are not part of

### Requirement 3: Message Delivery and Storage

**User Story:** As a user, I want to send messages with text and attachments, so that I can communicate effectively with other parties.

#### Acceptance Criteria

1. WHEN a user sends a message, THE Chat System SHALL store the message with sender_id, receiver_id, and timestamp
2. THE Chat System SHALL support text messages up to 10000 characters in length
3. THE Chat System SHALL allow users to attach up to 5 files per message with maximum size of 10MB each
4. THE Chat System SHALL validate file types to prevent malicious uploads
5. WHEN a message is sent, THE Chat System SHALL update the conversation's last_message_at timestamp

### Requirement 4: Unread Message Tracking

**User Story:** As a user, I want to see how many unread messages I have in each conversation, so that I can prioritize my responses.

#### Acceptance Criteria

1. THE Chat System SHALL maintain separate unread_count fields for each participant type (buyer, supplier, admin)
2. WHEN a message is sent, THE Chat System SHALL increment the unread count for all recipients
3. WHEN a user views a conversation, THE Chat System SHALL reset their unread count to zero
4. THE Chat System SHALL provide an API endpoint to retrieve total unread message count across all conversations
5. THE Chat System SHALL update unread counts in real-time via WebSocket notifications

### Requirement 5: Real-time Message Notifications

**User Story:** As a user, I want to receive instant notifications when new messages arrive, so that I can respond promptly to inquiries.

#### Acceptance Criteria

1. WHEN a message is sent, THE Chat System SHALL broadcast a WebSocket event to all online recipients
2. THE Chat System SHALL include sender information and message preview in the notification payload
3. WHEN a user is offline, THE Chat System SHALL store notifications for delivery upon next login
4. THE Chat System SHALL create database notifications for important message events
5. THE Chat System SHALL support browser push notifications for desktop users

### Requirement 6: Conversation List and Filtering

**User Story:** As a supplier, I want to view all my conversations sorted by most recent activity, so that I can manage customer communications efficiently.

#### Acceptance Criteria

1. THE Chat System SHALL display conversations ordered by last_message_at timestamp descending
2. THE Chat System SHALL show conversation preview with last message content and timestamp
3. THE Chat System SHALL display unread message count badge for each conversation
4. THE Chat System SHALL allow filtering conversations by type (all, with_buyers, with_admins)
5. THE Chat System SHALL show participant online status indicators in the conversation list

### Requirement 7: Message History and Pagination

**User Story:** As a user, I want to scroll through message history in a conversation, so that I can review past communications.

#### Acceptance Criteria

1. THE Chat System SHALL load the most recent 50 messages when a conversation is opened
2. WHEN a user scrolls to the top, THE Chat System SHALL load the previous 50 messages
3. THE Chat System SHALL maintain scroll position when loading older messages
4. THE Chat System SHALL display messages in chronological order with timestamps
5. THE Chat System SHALL group messages by date with visual separators

### Requirement 8: User Online Status

**User Story:** As a buyer, I want to see if a supplier is currently online, so that I know if I can expect an immediate response.

#### Acceptance Criteria

1. THE Chat System SHALL track user online status with is_online boolean field
2. WHEN a user connects via WebSocket, THE Chat System SHALL set is_online to true
3. WHEN a user disconnects, THE Chat System SHALL set is_online to false and update last_seen timestamp
4. THE Chat System SHALL display online status indicators (green dot) next to active users
5. THE Chat System SHALL show last_seen timestamp for offline users in relative format (e.g., "2 hours ago")

### Requirement 9: Database Schema Cleanup

**User Story:** As a developer, I want a clean and consistent database schema for conversations and messages, so that the system is maintainable and scalable.

#### Acceptance Criteria

1. THE Chat System SHALL use a conversations table with fields: id, buyer_id, supplier_id, admin_id, product_id, type, last_message, last_message_at, unread_count_buyer, unread_count_supplier, unread_count_admin, created_at
2. THE Chat System SHALL use a messages table with fields: id, conversation_id, sender_id, receiver_id, sender_type, message, attachments, is_read, created_at
3. THE Chat System SHALL remove the confusing unread_count_admin field that stores admin_id
4. THE Chat System SHALL add proper foreign key constraints with ON DELETE CASCADE
5. THE Chat System SHALL create indexes on frequently queried fields (conversation_id, sender_id, created_at)

### Requirement 10: Access Control and Security

**User Story:** As a platform administrator, I want to ensure users can only access their own conversations, so that privacy and security are maintained.

#### Acceptance Criteria

1. THE Chat System SHALL verify user authentication before allowing access to any chat endpoint
2. WHEN a user requests a conversation, THE Chat System SHALL verify they are a participant
3. THE Chat System SHALL prevent users from viewing messages in conversations they are not part of
4. THE Chat System SHALL sanitize message content to prevent XSS attacks
5. THE Chat System SHALL log all conversation access attempts for security auditing
