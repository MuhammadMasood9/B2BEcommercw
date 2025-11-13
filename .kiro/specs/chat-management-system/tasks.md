# Chat Management System Implementation Tasks

- [x] 1. Fix Database Schema





  - Create migration to clean up conversations table (remove confusing unread_count_admin field, add proper admin_id, type, and unread count fields)
  - Update shared/schema.ts with corrected conversation and message definitions
  - _Requirements: 1.2, 1.3, 2.3, 4.1, 9.1, 9.2, 9.3_

- [ ] 2. Update Storage Layer
  - Fix createConversation to properly handle buyer-supplier and buyer-admin conversations
  - Update conversation retrieval methods (getBuyerConversations, getSupplierConversations, getAdminConversations)
  - Fix unread count tracking for each participant type (buyer, supplier, admin)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 4.1, 4.2, 4.3_

- [ ] 3. Fix Chat API Routes
  - Update POST /api/chat/conversations to support proper conversation types
  - Fix POST /api/chat/conversations/:id/messages to increment correct unread counts
  - Fix PATCH /api/chat/conversations/:id/read to reset correct unread count based on user role
  - _Requirements: 1.1, 1.2, 3.1, 3.5, 4.2, 4.3, 10.1, 10.2_

- [ ] 4. Update Chat UI Components
  - Fix Chat page to display conversations with proper participant info
  - Update conversation creation to support buyer-supplier chats
  - Add "Contact Supplier" button on product pages
  - Fix FloatingChatWidget to use correct unread count fields
  - _Requirements: 1.1, 1.3, 2.1, 6.1, 6.2, 6.3, 6.4_

- [ ] 5. Clean Up Database
  - Remove orphaned conversations with invalid references
  - Add proper foreign key constraints with CASCADE
  - Add indexes for performance
  - _Requirements: 9.4, 9.5_
