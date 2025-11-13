# Chat Management System Design

## Overview

The Chat Management System provides a robust, scalable messaging infrastructure for the B2B marketplace platform. It enables real-time communication between buyers, suppliers, and administrators while maintaining clean data structures, proper access control, and efficient message delivery.

The system is built on a three-tier architecture:
1. **Database Layer**: PostgreSQL with optimized schema for conversations and messages
2. **API Layer**: Express.js REST endpoints with WebSocket support for real-time updates
3. **Client Layer**: React components with TanStack Query for state management

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Page    │  │ Floating     │  │ Conversation │      │
│  │ Component    │  │ Chat Widget  │  │ List         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Routes  │  │ WebSocket    │  │ Notification │      │
│  │ (REST API)   │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │conversations │  │  messages    │  │notifications │      │
│  │    table     │  │    table     │  │    table     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Message Sending Flow:**
1. User composes message in UI
2. Client sends POST request to `/api/chat/conversations/:id/messages`
3. Server validates user authentication and conversation access
4. Server creates message record in database
5. Server updates conversation last_message_at timestamp
6. Server increments unread count for recipients
7. Server broadcasts WebSocket event to online recipients
8. Server creates notification record for offline recipients
9. Client receives confirmation and updates UI

**Conversation Loading Flow:**
1. User navigates to chat page
2. Client requests GET `/api/chat/conversations`
3. Server queries conversations where user is a participant
4. Server joins with users table to get participant details
5. Server returns conversations with unread counts
6. Client displays conversation list
7. User selects conversation
8. Client requests GET `/api/chat/conversations/:id/messages`
9. Server returns paginated messages
10. Client marks messages as read via PATCH `/api/chat/conversations/:id/read`

## Components and Interfaces

### Database Schema

#### Conversations Table (Updated)

```sql
CREATE TABLE conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  admin_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  product_id VARCHAR REFERENCES products(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL DEFAULT 'buyer_supplier',
  last_message TEXT,
  last_message_at TIMESTAMP,
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_supplier INTEGER DEFAULT 0,
  unread_count_admin INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_supplier ON conversations(supplier_id);
CREATE INDEX idx_conversations_admin ON conversations(admin_id);
CREATE INDEX idx_conversations_product ON conversations(product_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

**Key Changes:**
- Removed confusing `unread_count_admin` field that stored admin ID
- Added separate `admin_id` field for admin participants
- Added proper unread count fields for each participant type
- Added `type` field to distinguish conversation types
- Added indexes for performance optimization

#### Messages Table (Updated)

```sql
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR DEFAULT 'buyer',
  message TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
```

**Key Changes:**
- Added `receiver_id` for direct message routing
- Added `sender_type` to identify sender role
- Added composite index on conversation_id and created_at for efficient pagination
- Added partial index on unread messages for fast unread count queries

### API Endpoints

#### Conversation Endpoints

**GET /api/chat/conversations**
- Returns list of conversations for authenticated user
- Filters based on user role (buyer, supplier, admin)
- Includes participant details and unread counts
- Sorted by last_message_at descending

```typescript
Response: {
  conversations: [
    {
      id: string;
      type: 'buyer_supplier' | 'buyer_admin' | 'support';
      participants: {
        buyer: { id: string; name: string; isOnline: boolean };
        supplier?: { id: string; name: string; isOnline: boolean };
        admin?: { id: string; name: string; isOnline: boolean };
      };
      product?: { id: string; name: string; image: string };
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
      createdAt: string;
    }
  ]
}
```

**POST /api/chat/conversations**
- Creates new conversation or returns existing one
- Validates participants exist and are active
- Determines conversation type based on participants
- Returns conversation with initial state

```typescript
Request: {
  buyerId?: string;  // Required if not buyer
  supplierId?: string;  // Optional
  adminId?: string;  // Optional
  productId?: string;  // Optional
  type?: 'buyer_supplier' | 'buyer_admin' | 'support';
}

Response: {
  id: string;
  type: string;
  participants: {...};
  createdAt: string;
}
```

**GET /api/chat/conversations/:id/messages**
- Returns paginated messages for conversation
- Validates user is a participant
- Supports cursor-based pagination
- Marks messages as read for requesting user

```typescript
Query Parameters:
  - limit: number (default: 50)
  - before: string (message ID for pagination)

Response: {
  messages: [
    {
      id: string;
      senderId: string;
      senderName: string;
      senderType: 'buyer' | 'supplier' | 'admin';
      message: string;
      attachments: string[];
      isRead: boolean;
      createdAt: string;
    }
  ];
  hasMore: boolean;
  nextCursor: string | null;
}
```

**POST /api/chat/conversations/:id/messages**
- Sends new message in conversation
- Validates user is a participant
- Updates conversation last_message_at
- Increments unread counts for recipients
- Broadcasts WebSocket event
- Creates notifications

```typescript
Request: {
  content: string;
  attachments?: string[];
}

Response: {
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    message: string;
    attachments: string[];
    createdAt: string;
  }
}
```

**PATCH /api/chat/conversations/:id/read**
- Marks all messages as read for authenticated user
- Resets unread count to zero
- Returns success confirmation

```typescript
Response: {
  success: boolean;
  unreadCount: number;
}
```

**GET /api/chat/unread-count**
- Returns total unread message count for authenticated user
- Aggregates across all conversations
- Used for notification badges

```typescript
Response: {
  count: number;
}
```

### Storage Layer Methods

The storage layer provides abstraction over database operations:

```typescript
interface ChatStorage {
  // Conversation methods
  createConversation(data: CreateConversationData): Promise<Conversation>;
  getConversationById(id: string): Promise<Conversation | null>;
  getBuyerConversations(buyerId: string): Promise<Conversation[]>;
  getSupplierConversations(supplierId: string): Promise<Conversation[]>;
  getAdminConversations(adminId: string): Promise<Conversation[]>;
  getAllConversationsForAdmin(): Promise<Conversation[]>;
  updateConversationLastMessage(id: string): Promise<void>;
  
  // Message methods
  createMessage(data: CreateMessageData): Promise<Message>;
  getConversationMessages(
    conversationId: string,
    userId: string,
    userRole: string,
    limit?: number,
    before?: string
  ): Promise<Message[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // User status methods
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  getUserOnlineStatus(userId: string): Promise<UserStatus | null>;
  
  // Utility methods
  resolveSupplierUserId(supplierIdOrUserId: string): Promise<string | null>;
  getAvailableAdmins(): Promise<User[]>;
}
```

### WebSocket Events

The system uses WebSocket for real-time updates:

**Client → Server Events:**
- `authenticate`: User connects with auth token
- `typing`: User is typing in a conversation
- `read`: User read messages in a conversation

**Server → Client Events:**
- `message`: New message received
- `typing`: Another user is typing
- `read`: Messages were read by recipient
- `online_status`: User online status changed
- `conversation_updated`: Conversation metadata changed

```typescript
// Message event payload
{
  type: 'message',
  payload: {
    conversationId: string;
    message: {
      id: string;
      senderId: string;
      senderName: string;
      message: string;
      createdAt: string;
    }
  }
}

// Online status event payload
{
  type: 'online_status',
  payload: {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
  }
}
```

## Data Models

### Conversation Model

```typescript
interface Conversation {
  id: string;
  buyerId: string;
  supplierId: string | null;
  adminId: string | null;
  productId: string | null;
  type: 'buyer_supplier' | 'buyer_admin' | 'support';
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCountBuyer: number;
  unreadCountSupplier: number;
  unreadCountAdmin: number;
  createdAt: Date;
  
  // Joined fields
  buyer?: User;
  supplier?: User;
  admin?: User;
  product?: Product;
}
```

### Message Model

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string | null;
  senderType: 'buyer' | 'supplier' | 'admin';
  message: string;
  attachments: string[];
  isRead: boolean;
  createdAt: Date;
  
  // Joined fields
  sender?: User;
  receiver?: User;
}
```

### User Status Model

```typescript
interface UserStatus {
  id: string;
  isOnline: boolean;
  lastSeen: Date | null;
}
```

## Error Handling

### Error Types

1. **Authentication Errors (401)**
   - User not authenticated
   - Invalid or expired token
   - Response: `{ error: 'Unauthorized' }`

2. **Authorization Errors (403)**
   - User not a conversation participant
   - Insufficient permissions
   - Response: `{ error: 'Forbidden', message: 'You are not authorized to access this conversation' }`

3. **Not Found Errors (404)**
   - Conversation not found
   - User not found
   - Response: `{ error: 'Not Found', message: 'Conversation not found' }`

4. **Validation Errors (400)**
   - Missing required fields
   - Invalid data format
   - Response: `{ error: 'Validation Error', fields: { content: 'Message content is required' } }`

5. **Server Errors (500)**
   - Database connection failures
   - Unexpected errors
   - Response: `{ error: 'Internal Server Error', message: 'An unexpected error occurred' }`

### Error Handling Strategy

- All API endpoints wrapped in try-catch blocks
- Errors logged with context (user ID, conversation ID, action)
- User-friendly error messages returned to client
- Sensitive error details hidden from client
- Failed WebSocket messages queued for retry
- Database transaction rollback on failures

## Testing Strategy

### Unit Tests

1. **Storage Layer Tests**
   - Test conversation creation with various participant combinations
   - Test message creation and retrieval
   - Test unread count calculations
   - Test user status updates
   - Mock database connections

2. **API Route Tests**
   - Test authentication middleware
   - Test authorization checks
   - Test input validation
   - Test error responses
   - Mock storage layer

3. **WebSocket Service Tests**
   - Test connection handling
   - Test message broadcasting
   - Test user authentication
   - Test reconnection logic
   - Mock WebSocket connections

### Integration Tests

1. **End-to-End Conversation Flow**
   - Buyer creates conversation with supplier
   - Supplier receives notification
   - Both parties exchange messages
   - Unread counts update correctly
   - Messages marked as read

2. **Multi-Party Conversations**
   - Admin joins buyer-supplier conversation
   - All parties receive messages
   - Unread counts tracked independently
   - Admin can view all conversations

3. **Real-time Updates**
   - Message sent via REST API
   - WebSocket event received by online users
   - Offline users receive notification on login
   - Online status updates propagate

### Performance Tests

1. **Load Testing**
   - 100 concurrent users sending messages
   - 1000 conversations with message history
   - WebSocket connection stability under load
   - Database query performance

2. **Pagination Testing**
   - Load conversations with 10,000+ messages
   - Verify cursor-based pagination works correctly
   - Measure query response times
   - Test scroll-to-load behavior

## Security Considerations

1. **Authentication**
   - All endpoints require valid session
   - WebSocket connections authenticated via token
   - Session expiration handled gracefully

2. **Authorization**
   - Users can only access their own conversations
   - Admins have elevated access to all conversations
   - Supplier can only access conversations where they are a participant

3. **Input Validation**
   - Message content sanitized to prevent XSS
   - File uploads validated for type and size
   - SQL injection prevented via parameterized queries

4. **Rate Limiting**
   - Message sending limited to 10 per minute per user
   - Conversation creation limited to 5 per hour per user
   - WebSocket connections limited to 3 per user

5. **Data Privacy**
   - Conversations deleted when participants are deleted (CASCADE)
   - Message attachments stored securely
   - Audit logs for conversation access

## Migration Strategy

### Database Migration Steps

1. **Create backup of existing conversations and messages tables**
2. **Add new columns to conversations table:**
   - `admin_id` VARCHAR
   - `type` VARCHAR DEFAULT 'buyer_supplier'
   - `unread_count_buyer` INTEGER DEFAULT 0
   - `unread_count_supplier` INTEGER DEFAULT 0
   - `unread_count_admin_new` INTEGER DEFAULT 0

3. **Migrate data:**
   - Copy `unread_count_admin` (admin ID) to `admin_id` column
   - Set `unread_count_admin_new` to 0 for all rows
   - Determine conversation type based on participants

4. **Drop old column:**
   - `DROP COLUMN unread_count_admin`

5. **Rename new column:**
   - `ALTER TABLE conversations RENAME COLUMN unread_count_admin_new TO unread_count_admin`

6. **Add indexes:**
   - Create indexes on new columns for performance

7. **Update foreign key constraints:**
   - Add ON DELETE CASCADE for buyer_id, supplier_id
   - Add ON DELETE SET NULL for admin_id

### Code Migration Steps

1. **Update schema.ts** with new conversation structure
2. **Update storage.ts** methods to use new fields
3. **Update chatRoutes.ts** to handle new conversation types
4. **Update client components** to display conversation types
5. **Test thoroughly** in development environment
6. **Deploy with zero-downtime** strategy

## Performance Optimization

1. **Database Indexes**
   - Composite index on (conversation_id, created_at) for message queries
   - Partial index on unread messages
   - Index on last_message_at for conversation sorting

2. **Query Optimization**
   - Use JOIN to fetch participant details in single query
   - Implement cursor-based pagination for messages
   - Cache frequently accessed data (user online status)

3. **WebSocket Optimization**
   - Use Redis for WebSocket pub/sub in production
   - Implement connection pooling
   - Batch notifications for offline users

4. **Caching Strategy**
   - Cache conversation list for 30 seconds
   - Cache user online status for 1 minute
   - Invalidate cache on message send

5. **Frontend Optimization**
   - Implement virtual scrolling for long message lists
   - Debounce typing indicators
   - Lazy load conversation details
   - Use optimistic UI updates
