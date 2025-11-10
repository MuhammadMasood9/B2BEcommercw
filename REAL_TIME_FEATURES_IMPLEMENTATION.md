# Real-Time Features Implementation

## Overview

This document describes the implementation of real-time features using WebSocket technology for the B2B marketplace supplier portal.

## Architecture

### Server-Side Components

#### 1. WebSocket Service (`server/websocket.ts`)
- Manages WebSocket connections for all users
- Handles connection lifecycle (connect, disconnect, reconnect)
- Implements heartbeat mechanism to keep connections alive
- Provides methods to send messages to specific users, roles, or broadcast to all

**Key Features:**
- User authentication via query parameters
- Automatic connection cleanup
- Heartbeat ping/pong every 30 seconds
- Support for multiple connections per user (multiple tabs/devices)

#### 2. Notification Service (`server/notificationService.ts`)
- Centralized service for creating and sending notifications
- Saves notifications to database
- Sends real-time WebSocket notifications
- Provides specific methods for different notification types:
  - `notifyNewInquiry()` - New inquiry received
  - `notifyInquiryUpdate()` - Inquiry status changed
  - `notifyNewOrder()` - New order received
  - `notifyOrderStatusChange()` - Order status updated
  - `notifyNewRFQ()` - New RFQ matching supplier's products
  - `notifyRFQResponse()` - RFQ response status update
  - `notifyAuctionUpdate()` - Auction bid updates
  - `notifyQuotationUpdate()` - Quotation accepted/rejected/expired
  - `notifyQuotationReceived()` - Buyer receives quotation

### Client-Side Components

#### 1. WebSocket Hook (`client/src/hooks/useWebSocket.ts`)
- React hook for managing WebSocket connections
- Handles automatic connection on user login
- Implements reconnection logic with exponential backoff
- Provides methods to send messages and check connection status

**Features:**
- Auto-connect when user is authenticated
- Reconnection attempts (up to 5 times)
- Connection state management
- Error handling

#### 2. WebSocket Context (`client/src/contexts/WebSocketContext.tsx`)
- Global WebSocket provider for the application
- Handles incoming messages and routes them appropriately
- Automatically invalidates React Query caches when updates arrive
- Shows toast notifications for important events

**Message Types Handled:**
- `notification` - General notifications
- `inquiry` - Inquiry updates
- `order` - Order updates
- `message` - Chat messages
- `rfq` - RFQ updates
- `auction` - Auction updates
- `quotation` - Quotation updates

#### 3. WebSocket Status Component (`client/src/components/WebSocketStatus.tsx`)
- Visual indicator of WebSocket connection status
- Shows "Live" when connected, "Offline" when disconnected
- Displays connection errors in tooltip

## Integration Points

### 1. Inquiry Creation
**Location:** `server/routes.ts` - POST `/api/inquiries`
- Notifies supplier when new inquiry is received
- Sends real-time notification via WebSocket
- Updates inquiry count in dashboard

### 2. Order Status Updates
**Location:** `server/supplierRoutes.ts` - PATCH `/api/suppliers/orders/:id/status`
- Notifies buyer when order status changes
- Sends real-time notification with new status
- Updates order list in real-time

### 3. Quotation Creation
**Location:** `server/supplierRoutes.ts` - POST `/api/suppliers/inquiry-quotations`
- Notifies buyer when quotation is received
- Sends real-time notification via WebSocket
- Updates quotation list

### 4. Quotation Acceptance
**Location:** `server/routes.ts` - POST `/api/quotations/accept`
- Notifies supplier when quotation is accepted
- Notifies supplier about new order
- Updates both quotation and order lists

### 5. Chat Messages
**Location:** `server/chatRoutes.ts` - POST `/api/chat/conversations/:conversationId/messages`
- Sends real-time message to recipient
- Updates unread message count
- Shows toast notification

## WebSocket Message Format

All WebSocket messages follow this structure:

```typescript
{
  type: string,        // Message type (notification, inquiry, order, etc.)
  payload: {
    // Type-specific data
  }
}
```

### Example Messages

#### Notification
```json
{
  "type": "notification",
  "payload": {
    "title": "New Inquiry",
    "message": "You have received a new inquiry from John Doe",
    "type": "info",
    "relatedId": "inquiry-123",
    "relatedType": "inquiry"
  }
}
```

#### Order Update
```json
{
  "type": "order",
  "payload": {
    "action": "status_changed",
    "order": {
      "id": "order-456",
      "status": "shipped"
    }
  }
}
```

#### Chat Message
```json
{
  "type": "message",
  "payload": {
    "conversationId": "conv-789",
    "message": "Hello, I have a question about your product",
    "sender": {
      "id": "user-123",
      "name": "John Doe"
    }
  }
}
```

## Connection Flow

1. **User Login**
   - User authenticates via login page
   - AuthContext stores user information

2. **WebSocket Connection**
   - WebSocketProvider automatically connects when user is available
   - Connection URL: `ws://host/ws?userId={userId}&userRole={role}`
   - Server validates user and establishes connection

3. **Heartbeat**
   - Server sends ping every 30 seconds
   - Client responds with pong
   - Connection terminated if no response

4. **Message Handling**
   - Server sends message to specific user
   - Client receives message in WebSocketContext
   - Context routes message to appropriate handler
   - Handler shows notification and invalidates queries

5. **Disconnection**
   - User logs out or closes browser
   - Connection automatically cleaned up
   - Reconnection attempted if unexpected disconnect

## Testing

### Manual Testing

1. **Test Real-Time Notifications**
   - Open supplier dashboard in two browser tabs
   - Create an inquiry from buyer account
   - Verify notification appears in both tabs

2. **Test Connection Status**
   - Check WebSocket status indicator in top nav
   - Should show "Live" when connected
   - Disconnect network and verify "Offline" status

3. **Test Reconnection**
   - Disconnect network briefly
   - Reconnect network
   - Verify connection re-establishes automatically

### Monitoring

- Check browser console for WebSocket connection logs
- Server logs show connection/disconnection events
- Monitor WebSocket message traffic in browser DevTools

## Performance Considerations

- WebSocket connections are lightweight and persistent
- Heartbeat mechanism prevents connection timeouts
- Multiple tabs share same user ID but maintain separate connections
- Messages are only sent to connected users (no queuing)
- React Query cache invalidation is efficient and targeted

## Security

- User authentication required via query parameters
- Connection validated on server side
- Messages only sent to authorized users
- No sensitive data in WebSocket messages (use IDs and fetch details)

## Future Enhancements

1. **Message Queuing**
   - Store messages for offline users
   - Deliver when user reconnects

2. **Typing Indicators**
   - Show when other user is typing in chat
   - Real-time presence updates

3. **Advanced Notifications**
   - Notification preferences
   - Notification history
   - Mark as read functionality

4. **Performance Monitoring**
   - Track connection uptime
   - Monitor message delivery rates
   - Alert on connection issues

## Troubleshooting

### Connection Issues

**Problem:** WebSocket won't connect
- Check if user is logged in
- Verify WebSocket server is running
- Check browser console for errors
- Ensure firewall allows WebSocket connections

**Problem:** Frequent disconnections
- Check network stability
- Verify heartbeat mechanism is working
- Check server logs for errors

### Notification Issues

**Problem:** Notifications not appearing
- Verify WebSocket connection is active
- Check if notification service is being called
- Verify React Query cache invalidation
- Check browser console for errors

**Problem:** Duplicate notifications
- Check if multiple WebSocket connections exist
- Verify notification deduplication logic
- Check React Query cache settings
