# Online/Offline Status Implementation

## Overview
Added real-time online/offline status tracking for users in the chat system, allowing users to see when other participants are online or when they were last seen.

## Changes Made

### 1. Database Schema Updates (`shared/schema.ts`)
- Added `isOnline` boolean field (default: false) to track current online status
- Added `lastSeen` timestamp field to track when user was last active

### 2. Database Migration
- Created and executed migration to add new columns to the `users` table
- Migration SQL:
  ```sql
  ALTER TABLE users ADD COLUMN is_online boolean DEFAULT false;
  ALTER TABLE users ADD COLUMN last_seen timestamp;
  ```

### 3. Storage Layer (`server/storage.ts`)
Added two new methods to the storage interface:
- `updateUserOnlineStatus(userId: string, isOnline: boolean)`: Updates user's online status and last seen timestamp
- `getUserOnlineStatus(userId: string)`: Retrieves user's online status and last seen time

### 4. API Endpoints (`server/chatRoutes.ts`)
Added two new endpoints:
- `POST /api/chat/user/status`: Update current user's online status
  - Body: `{ isOnline: boolean }`
  - Authenticated endpoint
  
- `GET /api/chat/user/:userId/status`: Get a user's online status
  - Returns: `{ isOnline: boolean, lastSeen: Date | null }`
  - Authenticated endpoint

### 5. Chat Interface (`client/src/components/chat/ChatInterface.tsx`)

#### New Features:
- **Online Status Indicator**: Visual indicator (green dot for online, gray for offline) next to user avatar
- **Last Seen Display**: Shows when offline user was last active (e.g., "Last seen 5 min ago")
- **Automatic Status Updates**: User status is automatically set to online when chat is opened
- **Activity Tracking**: Updates user's online status every minute while active
- **Cleanup on Exit**: Sets user to offline when chat is closed or page is unloaded

#### Visual Indicators:
- Green dot (🟢) = User is online
- Gray dot (⚫) = User is offline
- Last seen timestamp shown for offline users

#### Status Update Mechanisms:
1. **On Component Mount**: User is marked as online
2. **Periodic Updates**: Status refreshed every 60 seconds
3. **On Component Unmount**: User is marked as offline
4. **On Page Unload**: Uses `navigator.sendBeacon` for reliable status update

#### Status Polling:
- Other user's status is fetched when conversation is selected
- Status refreshed every 30 seconds to show real-time updates

## User Experience

### For Buyers:
- Can see if support/admin is currently online
- Shows when support was last active if offline

### For Admins:
- Can see which customers are currently online
- Shows customer's last activity timestamp

## Technical Details

### Status Display Format:
- "Online" - User is currently active
- "Last seen Just now" - Less than 1 minute ago
- "Last seen X min ago" - Minutes ago (< 60 min)
- "Last seen Xh ago" - Hours ago (< 24 hours)
- "Last seen Yesterday" - 1 day ago
- "Last seen X days ago" - Days ago (< 7 days)
- Date string - Older than 7 days

### Performance Considerations:
- Status updates batched at 60-second intervals
- Polling limited to 30-second intervals
- Uses efficient database queries with indexed fields
- Status indicator only shown for active conversation

## Future Enhancements (Optional)
1. WebSocket integration for real-time status updates (eliminate polling)
2. Show online status in conversation list
3. "Typing..." indicator when user is actively typing
4. Online user list/presence sidebar
5. Status persistence across multiple tabs/devices
6. Custom status messages (Available, Away, Busy, etc.)

## Testing Checklist
- [x] Database migration executed successfully
- [x] Online status updates when user opens chat
- [x] Status shows as offline when user closes chat
- [x] Last seen timestamp displays correctly
- [x] Status indicator appears in chat header
- [x] Status polls and updates every 30 seconds
- [x] Activity updates every 60 seconds
- [x] No linting errors in modified files

## Files Modified
1. `shared/schema.ts` - Added isOnline and lastSeen fields
2. `server/storage.ts` - Added online status methods
3. `server/chatRoutes.ts` - Added status API endpoints
4. `client/src/components/chat/ChatInterface.tsx` - Added UI and logic for status display
5. `migrations/0005_user_online_status.sql` - Migration file

## API Usage Examples

### Update Status:
```typescript
POST /api/chat/user/status
Body: { isOnline: true }
```

### Get User Status:
```typescript
GET /api/chat/user/:userId/status
Response: { isOnline: false, lastSeen: "2025-10-20T10:30:00Z" }
```

