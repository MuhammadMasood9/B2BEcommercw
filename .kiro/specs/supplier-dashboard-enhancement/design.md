# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing the existing supplier dashboard into a comprehensive, dedicated supplier portal. The enhancement will create a cohesive admin-style layout with dedicated pages for all supplier operations, removing buyer-specific UI elements and providing a professional supplier management interface.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx Router                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supplier Route Detection (/supplier/*)                │ │
│  │  ├─ SidebarProvider                                    │ │
│  │  ├─ SupplierSidebar (Navigation)                       │ │
│  │  └─ Main Content Area                                  │ │
│  │     ├─ Top Navigation Bar                              │ │
│  │     └─ Page Content (Routed Component)                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Supplier Pages Structure                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /supplier/dashboard     - Overview & Key Metrics      │ │
│  │  /supplier/products      - Product Management          │ │
│  │  /supplier/inquiries     - Buyer Inquiries             │ │
│  │  /supplier/rfqs          - Request for Quotations      │ │
│  │  /supplier/auctions      - Auction Participation       │ │
│  │  /supplier/negotiations  - Active Negotiations         │ │
│  │  /supplier/quotations    - Quotation Management        │ │
│  │  /supplier/orders        - Order Fulfillment           │ │
│  │  /supplier/messages      - Chat & Communication        │ │
│  │  /supplier/analytics     - Performance Analytics       │ │
│  │  /supplier/store         - Store Profile Management    │ │
│  │  /supplier/commissions   - Commission Tracking         │ │
│  │  /supplier/payouts       - Payout Management           │ │
│  │  /supplier/settings      - Account Settings            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Layout Structure

The supplier portal will use a consistent layout pattern:

1. **Sidebar Navigation** (SupplierSidebar component)
   - Fixed left sidebar with collapsible menu
   - Grouped navigation items (Main Menu, Store Management, Finance)
   - Active page highlighting
   - Notification badges for items requiring attention

2. **Top Navigation Bar**
   - Sidebar toggle button
   - Portal title ("Supplier Portal")
   - User profile dropdown
   - Quick action buttons
   - Notification bell

3. **Main Content Area**
   - Full-height scrollable content
   - No buyer Header/Footer components
   - Consistent padding and spacing
   - Responsive grid layouts

## Components and Interfaces

### 1. Layout Components

#### SupplierLayout Component (New)
```typescript
interface SupplierLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

// Provides consistent layout wrapper for all supplier pages
// Includes sidebar, top nav, and content area
```

#### SupplierTopNav Component (New)
```typescript
interface SupplierTopNavProps {
  title: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

// Top navigation bar with title, actions, and breadcrumbs
```

### 2. Page Components

#### SupplierDashboard (Enhanced)
- Overview metrics cards
- Recent activity widgets
- Quick action buttons
- Performance charts
- Pending items summary

#### SupplierProducts (New)
- Product list with filters and search
- Bulk actions (publish, unpublish, delete)
- Product creation/edit dialog
- Approval status indicators
- Stock management

#### SupplierInquiries (Enhanced)
- Inquiry list with status filters
- Inquiry detail view
- Quick reply functionality
- Convert to quotation action
- Priority indicators

#### SupplierRFQs (New)
- Browse available RFQs
- Filter by category, deadline, location
- RFQ detail view
- Submit quotation from RFQ
- Track response status

#### SupplierAuctions (New)
- Active auctions list
- Auction detail with bidding interface
- Bid history
- Real-time updates
- Winning/losing status indicators

#### SupplierNegotiations (New)
- Active negotiations list
- Negotiation thread view
- Counter-offer interface
- Document attachments
- Status tracking

#### SupplierQuotations (Enhanced)
- Quotation list with status filters
- Quotation detail view
- Edit/resend functionality
- Expiration tracking
- Conversion metrics

#### SupplierOrders (Enhanced)
- Order list with status filters
- Order detail view
- Status update workflow
- Shipping information management
- Tracking number input
- Order fulfillment metrics

#### SupplierMessages (Enhanced from SupplierInbox)
- Conversation list
- Real-time chat interface
- File attachments
- Unread message indicators
- Search and filter

#### SupplierAnalytics (New)
- Performance dashboard
- Revenue charts
- Product performance metrics
- Conversion funnel
- Buyer engagement analytics
- Date range selector
- Export reports

#### SupplierStore (Enhanced)
- Store profile editor
- Logo and banner upload
- Business information
- Shipping options
- Payment terms
- Store preview
- SEO settings

### 3. Shared Components

#### StatCard Component
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  badge?: string;
  color?: string;
}
```

#### StatusBadge Component
```typescript
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline' | 'secondary';
}
```

#### DataTable Component
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filters?: FilterConfig[];
  searchable?: boolean;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
}
```

## Data Models

### Supplier Profile
```typescript
interface SupplierProfile {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription?: string;
  businessName: string;
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler';
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  yearEstablished?: number;
  employeesCount?: string;
  annualRevenue?: string;
  mainProducts: string[];
  exportMarkets: string[];
  isVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'premium' | 'gold';
  rating: number;
  totalReviews: number;
  totalOrders: number;
  responseRate: number;
  responseTime: string;
  status: 'pending' | 'approved' | 'suspended';
}
```

### Auction
```typescript
interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  startingPrice: number;
  currentPrice: number;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  bids: Bid[];
  requirements: string;
  specifications: Record<string, any>;
  attachments: string[];
}

interface Bid {
  id: string;
  auctionId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  notes?: string;
  createdAt: string;
  status: 'active' | 'outbid' | 'winning' | 'won' | 'lost';
}
```

### Negotiation
```typescript
interface Negotiation {
  id: string;
  inquiryId?: string;
  rfqId?: string;
  quotationId?: string;
  buyerId: string;
  buyerName: string;
  supplierId: string;
  supplierName: string;
  productId?: string;
  productName?: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  currentOffer: Offer;
  offerHistory: Offer[];
  messages: NegotiationMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: string;
  negotiationId: string;
  offeredBy: 'buyer' | 'supplier';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentTerms: string;
  deliveryTerms: string;
  validUntil: string;
  notes?: string;
  createdAt: string;
}

interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'supplier';
  content: string;
  attachments?: string[];
  createdAt: string;
}
```

### Analytics Data
```typescript
interface SupplierAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  trends: {
    date: string;
    revenue: number;
    orders: number;
    inquiries: number;
    quotations: number;
  }[];
  productPerformance: {
    productId: string;
    productName: string;
    views: number;
    inquiries: number;
    quotations: number;
    orders: number;
    revenue: number;
  }[];
  buyerEngagement: {
    responseRate: number;
    averageResponseTime: number;
    inquiryToQuotationRate: number;
    quotationToOrderRate: number;
  };
  topBuyers: {
    buyerId: string;
    buyerName: string;
    buyerCompany: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
}
```

## API Endpoints

### Existing Endpoints (to be used)
- `GET /api/suppliers/dashboard/stats` - Dashboard statistics
- `GET /api/suppliers/products` - List supplier products
- `POST /api/suppliers/products` - Create product
- `PUT /api/suppliers/products/:id` - Update product
- `DELETE /api/suppliers/products/:id` - Delete product
- `GET /api/suppliers/inquiries` - List inquiries
- `POST /api/suppliers/inquiries/:id/reply` - Reply to inquiry
- `GET /api/suppliers/quotations` - List quotations
- `POST /api/suppliers/quotations` - Create quotation
- `GET /api/suppliers/orders` - List orders
- `PATCH /api/suppliers/orders/:id/status` - Update order status
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message

### New Endpoints (to be created)

#### RFQs
- `GET /api/suppliers/rfqs` - List available RFQs
- `GET /api/suppliers/rfqs/:id` - Get RFQ details
- `POST /api/suppliers/rfqs/:id/respond` - Submit quotation for RFQ

#### Auctions
- `GET /api/suppliers/auctions` - List available auctions
- `GET /api/suppliers/auctions/:id` - Get auction details
- `POST /api/suppliers/auctions/:id/bid` - Place bid
- `GET /api/suppliers/auctions/:id/bids` - Get bid history

#### Negotiations
- `GET /api/suppliers/negotiations` - List active negotiations
- `GET /api/suppliers/negotiations/:id` - Get negotiation details
- `POST /api/suppliers/negotiations/:id/offer` - Make counter-offer
- `POST /api/suppliers/negotiations/:id/accept` - Accept offer
- `POST /api/suppliers/negotiations/:id/reject` - Reject offer
- `POST /api/suppliers/negotiations/:id/message` - Send message

#### Analytics
- `GET /api/suppliers/analytics/overview` - Overview metrics
- `GET /api/suppliers/analytics/trends` - Trend data
- `GET /api/suppliers/analytics/products` - Product performance
- `GET /api/suppliers/analytics/buyers` - Buyer engagement
- `GET /api/suppliers/analytics/export` - Export report

#### Store Management
- `GET /api/suppliers/store/profile` - Get store profile
- `PUT /api/suppliers/store/profile` - Update store profile
- `POST /api/suppliers/store/logo` - Upload logo
- `POST /api/suppliers/store/banner` - Upload banner

## Error Handling

### Client-Side Error Handling
1. **Network Errors**: Display toast notification with retry option
2. **Validation Errors**: Show inline field errors
3. **Authorization Errors**: Redirect to login with return URL
4. **Not Found Errors**: Display friendly 404 message with navigation options
5. **Server Errors**: Display error page with support contact

### Error Boundary
Implement React Error Boundary for each major page section to prevent full page crashes.

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SupplierPageErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  // Catch errors in child components
  // Display fallback UI
  // Log errors to monitoring service
}
```

## Testing Strategy

### Unit Tests
- Component rendering tests
- State management tests
- Utility function tests
- Form validation tests

### Integration Tests
- API integration tests
- Route navigation tests
- Authentication flow tests
- Data flow tests

### E2E Tests
- Complete user workflows
- Multi-page interactions
- Real-time features (chat, notifications)
- File upload flows

### Test Coverage Goals
- Components: 80%
- Utilities: 90%
- API routes: 85%
- Critical paths: 100%

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**
   - Lazy load page components
   - Split vendor bundles
   - Dynamic imports for heavy components

2. **Data Fetching**
   - Use React Query for caching
   - Implement pagination for large lists
   - Prefetch data on hover
   - Debounce search inputs

3. **Rendering Optimization**
   - Memoize expensive computations
   - Use React.memo for pure components
   - Virtualize long lists
   - Optimize re-renders with proper key usage

4. **Asset Optimization**
   - Lazy load images
   - Use WebP format with fallbacks
   - Implement progressive image loading
   - Compress and minify assets

5. **Real-time Updates**
   - Use WebSocket for chat
   - Implement polling with exponential backoff
   - Batch notification updates
   - Optimize query invalidation

## Security Considerations

### Authentication & Authorization
- Verify supplier role on all routes
- Implement CSRF protection
- Use HTTP-only cookies for sessions
- Validate JWT tokens on API requests

### Data Protection
- Sanitize user inputs
- Validate file uploads (type, size)
- Encrypt sensitive data
- Implement rate limiting

### API Security
- Validate request payloads
- Implement proper CORS policies
- Use parameterized queries
- Log security events

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast ratios
- Screen reader compatibility
- Alt text for images
- Form labels and error messages

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Global search
- `Ctrl/Cmd + /`: Toggle sidebar
- `Esc`: Close dialogs/modals
- `Tab`: Navigate form fields
- `Enter`: Submit forms

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Collapsible sidebar (drawer)
- Stacked layouts
- Touch-friendly buttons (min 44px)
- Simplified tables (card view)
- Bottom navigation for key actions

## Migration Strategy

### Phase 1: Layout Enhancement
1. Update App.tsx routing logic
2. Enhance SupplierSidebar component
3. Create SupplierLayout wrapper
4. Remove Header/Footer from supplier routes

### Phase 2: Page Creation
1. Create new page components
2. Implement routing
3. Add navigation links
4. Test page transitions

### Phase 3: Feature Implementation
1. Implement RFQs functionality
2. Implement Auctions functionality
3. Implement Negotiations functionality
4. Implement Analytics dashboard

### Phase 4: Enhancement & Polish
1. Add real-time updates
2. Implement notifications
3. Add keyboard shortcuts
4. Performance optimization
5. Accessibility audit

## Monitoring & Analytics

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User session recording
- API response times

### Business Metrics
- Page views per section
- Feature usage statistics
- Conversion rates
- User engagement metrics

## Future Enhancements

### Potential Features
1. **Advanced Analytics**
   - Predictive analytics
   - Market insights
   - Competitor analysis

2. **Automation**
   - Auto-respond to inquiries
   - Smart pricing suggestions
   - Inventory sync

3. **Integration**
   - ERP system integration
   - Shipping carrier integration
   - Payment gateway integration

4. **Mobile App**
   - Native mobile application
   - Push notifications
   - Offline support

5. **AI Features**
   - Chatbot for buyer inquiries
   - Product description generation
   - Image recognition for product categorization
