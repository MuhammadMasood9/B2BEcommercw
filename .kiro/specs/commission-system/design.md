# Commission System Design Document

## Overview

The enhanced commission system provides a comprehensive solution for managing platform revenue through tiered commission rates, credit-based supplier restrictions, and a payment verification workflow. The system automatically calculates commissions on orders, tracks unpaid amounts, restricts supplier accounts when credit limits are exceeded, and provides a streamlined payment submission and verification process.

### Key Features

- **Tiered Commission Rates**: Flexible commission percentages based on order value ranges
- **Credit Limit Management**: Configurable credit limits per supplier with automatic restriction enforcement
- **Payment Submission**: Supplier-initiated payment workflow with proof of payment upload
- **Admin Verification**: Centralized payment review and approval system
- **Account Restrictions**: Automatic blocking of supplier functionality when limits exceeded
- **Real-time Tracking**: Live updates of commission balances and credit usage
- **Analytics & Reporting**: Comprehensive dashboards for both suppliers and admin

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Supplier Dashboard  │  Admin Dashboard  │  Shared Components│
│  - Commission View   │  - Analytics      │  - Notifications  │
│  - Payment Submit    │  - Verification   │  - Modals         │
│  - History           │  - Tier Config    │  - Charts         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Commission Routes   │  Payment Routes   │  Restriction      │
│  - Calculate         │  - Submit         │  - Check          │
│  - List              │  - Verify         │  - Enforce        │
│  - Analytics         │  - Reject         │  - Remove         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Commission Service  │  Payment Service  │  Restriction      │
│  - Tier Selection    │  - Validation     │  - Middleware     │
│  - Calculation       │  - Processing     │  - Enforcement    │
│  - Status Updates    │  - Notification   │  - Checks         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  commissions         │  payment_         │  supplier_        │
│  commission_tiers    │  submissions      │  profiles         │
│  commission_payments │  commission_      │  orders           │
│                      │  payment_items    │                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Order Creation & Commission Calculation
```
Buyer accepts quotation
    ↓
Create Order (routes.ts)
    ↓
Calculate Commission (commissionService)
    ├─ Get Supplier Profile
    ├─ Check Custom Rate
    ├─ Select Tier (if no custom rate)
    ├─ Calculate Amounts
    └─ Create Commission Record
    ↓
Update Supplier Total Unpaid
    ↓
Check Credit Limit
    ↓
Apply Restriction (if exceeded)
    ↓
Send Notifications
```

#### 2. Payment Submission Flow
```
Supplier views unpaid commissions
    ↓
Select commissions to pay
    ↓
Upload payment proof
    ↓
Submit payment
    ↓
Create PaymentSubmission record
    ↓
Link CommissionPaymentItems
    ↓
Notify Admin
    ↓
Admin reviews proof
    ↓
Approve/Reject
    ↓
Update commission statuses
    ↓
Update supplier total unpaid
    ↓
Remove restriction (if applicable)
    ↓
Notify Supplier
```

#### 3. Restriction Enforcement
```
Supplier attempts action
    ↓
Restriction Middleware
    ↓
Check isRestricted flag
    ↓
If restricted:
    ├─ Block action
    ├─ Return 403 error
    └─ Show payment modal
If not restricted:
    └─ Allow action
```

## Components and Interfaces

### Backend Services

#### 1. Commission Service (`server/commissionService.ts`)

```typescript
interface CommissionService {
  // Tier Management
  getTiers(): Promise<CommissionTier[]>;
  createTier(data: CreateTierInput): Promise<CommissionTier>;
  updateTier(id: string, data: UpdateTierInput): Promise<CommissionTier>;
  deleteTier(id: string): Promise<void>;
  
  // Commission Calculation
  calculateCommission(orderId: string, supplierId: string, orderAmount: number): Promise<Commission>;
  selectTier(orderAmount: number): Promise<CommissionTier>;
  getSupplierRate(supplierId: string): Promise<number | null>;
  
  // Commission Queries
  getCommissionsBySupplier(supplierId: string, filters: CommissionFilters): Promise<Commission[]>;
  getCommissionById(id: string): Promise<Commission>;
  getUnpaidCommissions(supplierId: string): Promise<Commission[]>;
  getTotalUnpaid(supplierId: string): Promise<number>;
  
  // Status Updates
  markCommissionPaid(commissionId: string, paymentDate: Date): Promise<void>;
  markCommissionOverdue(commissionId: string): Promise<void>;
  markCommissionDisputed(commissionId: string, reason: string): Promise<void>;
  
  // Analytics
  getCommissionAnalytics(filters: AnalyticsFilters): Promise<CommissionAnalytics>;
  getSupplierCommissionSummary(supplierId: string): Promise<SupplierSummary>;
}
```

#### 2. Payment Service (`server/paymentService.ts`)

```typescript
interface PaymentService {
  // Payment Submission
  createPaymentSubmission(data: CreatePaymentInput): Promise<PaymentSubmission>;
  uploadPaymentProof(file: File): Promise<string>; // Returns file URL
  
  // Payment Verification
  verifyPayment(submissionId: string, adminId: string): Promise<void>;
  rejectPayment(submissionId: string, adminId: string, reason: string): Promise<void>;
  bulkVerifyPayments(submissionIds: string[], adminId: string): Promise<BulkResult>;
  
  // Payment Queries
  getPendingPayments(): Promise<PaymentSubmission[]>;
  getPaymentHistory(supplierId: string): Promise<PaymentSubmission[]>;
  getPaymentById(id: string): Promise<PaymentSubmission>;
  
  // Payment Processing
  processPaymentApproval(submission: PaymentSubmission): Promise<void>;
  updateCommissionStatuses(commissionIds: string[]): Promise<void>;
  updateSupplierBalance(supplierId: string, amount: number): Promise<void>;
}
```

#### 3. Restriction Service (`server/restrictionService.ts`)

```typescript
interface RestrictionService {
  // Restriction Checks
  checkRestriction(supplierId: string): Promise<boolean>;
  getRestrictionStatus(supplierId: string): Promise<RestrictionStatus>;
  
  // Restriction Management
  applyRestriction(supplierId: string, reason: string): Promise<void>;
  removeRestriction(supplierId: string): Promise<void>;
  
  // Credit Limit
  checkCreditLimit(supplierId: string): Promise<CreditLimitStatus>;
  updateCreditLimit(supplierId: string, newLimit: number): Promise<void>;
  
  // Enforcement
  enforceRestriction(supplierId: string, action: string): Promise<void>;
  canPerformAction(supplierId: string, action: ActionType): Promise<boolean>;
}
```

### Frontend Components

#### 1. Supplier Components

**SupplierCommissionDashboard** (`client/src/pages/supplier/SupplierCommissions.tsx`)
- Display total unpaid commission
- Show credit limit and usage percentage
- List all commissions with filters
- Visual credit usage indicator
- Quick payment button

**CommissionPaymentModal** (`client/src/components/supplier/CommissionPaymentModal.tsx`)
- Select commissions to pay
- Upload payment proof
- Enter payment details
- Submit payment
- Show submission confirmation

**PaymentHistoryTable** (`client/src/components/supplier/PaymentHistoryTable.tsx`)
- List all payment submissions
- Show status badges
- Display payment proof
- Show rejection reasons
- Download receipts

**RestrictionBanner** (`client/src/components/supplier/RestrictionBanner.tsx`)
- Display restriction warning
- Show outstanding amount
- Link to payment page
- Countdown to restriction (if near limit)

#### 2. Admin Components

**AdminCommissionAnalytics** (`client/src/pages/admin/AdminCommissionAnalytics.tsx`)
- Revenue overview cards
- Commission trends chart
- Top suppliers by commission
- Overdue commissions list
- Export functionality

**PaymentVerificationQueue** (`client/src/pages/admin/AdminPaymentVerification.tsx`)
- List pending payments
- Preview payment proof
- Approve/reject actions
- Bulk approval
- Filter and search

**CommissionTierManager** (`client/src/pages/admin/AdminCommissionTiers.tsx`)
- List all tiers
- Create new tier
- Edit existing tier
- Delete tier
- Validate tier ranges

**SupplierCommissionSettings** (`client/src/components/admin/SupplierCommissionSettings.tsx`)
- Set custom commission rate
- Set credit limit
- View commission history
- Manual restriction toggle
- Send payment reminder

#### 3. Shared Components

**CommissionStatusBadge** (`client/src/components/CommissionStatusBadge.tsx`)
- Color-coded status display
- Tooltip with details
- Icon indicators

**CreditUsageBar** (`client/src/components/CreditUsageBar.tsx`)
- Progress bar visualization
- Color coding (green/yellow/red)
- Percentage display
- Threshold indicators

**PaymentProofViewer** (`client/src/components/PaymentProofViewer.tsx`)
- Image preview
- PDF viewer
- Download option
- Zoom functionality

## Data Models

### Commission Tiers

```typescript
interface CommissionTier {
  id: string;
  minAmount: number;        // e.g., 0
  maxAmount: number | null; // e.g., 10000, null for unlimited
  commissionRate: number;   // e.g., 0.05 (5%)
  description: string;      // e.g., "Orders under ₹10,000"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Example tiers:
// Tier 1: ₹0 - ₹10,000 = 5%
// Tier 2: ₹10,001 - ₹100,000 = 10%
// Tier 3: ₹100,001+ = 15%
```

### Commission Record

```typescript
interface Commission {
  id: string;
  orderId: string;
  supplierId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  supplierAmount: number;
  status: 'unpaid' | 'payment_submitted' | 'paid' | 'overdue' | 'disputed';
  dueDate: Date;
  paymentSubmittedAt: Date | null;
  paymentDate: Date | null;
  paymentTransactionId: string | null;
  paymentVerifiedBy: string | null;
  paymentVerifiedAt: Date | null;
  createdAt: Date;
}
```

### Payment Submission

```typescript
interface PaymentSubmission {
  id: string;
  supplierId: string;
  amount: number;
  commissionIds: string[];
  paymentMethod: 'bank_transfer' | 'upi' | 'paypal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  proofOfPayment: string; // File URL
  transactionReference: string | null;
  createdAt: Date;
}
```

### Supplier Profile Extensions

```typescript
interface SupplierProfile {
  // ... existing fields
  commissionRate: number | null;           // Custom rate override
  commissionCreditLimit: number;           // e.g., 10000
  totalUnpaidCommission: number;           // Current unpaid amount
  isRestricted: boolean;                   // Restriction flag
  lastPaymentDate: Date | null;
  paymentReminderSentAt: Date | null;
}
```

### Restriction Status

```typescript
interface RestrictionStatus {
  isRestricted: boolean;
  totalUnpaid: number;
  creditLimit: number;
  creditUsed: number;
  creditRemaining: number;
  usagePercentage: number;
  overdueCount: number;
  oldestDueDate: Date | null;
  restrictedActions: ActionType[];
}

type ActionType = 
  | 'create_quotation'
  | 'respond_inquiry'
  | 'send_message'
  | 'update_product'
  | 'create_product';
```

## Error Handling

### Commission Calculation Errors

```typescript
class CommissionCalculationError extends Error {
  constructor(message: string, public orderId: string) {
    super(message);
    this.name = 'CommissionCalculationError';
  }
}

// Handle cases:
// - No applicable tier found
// - Invalid order amount
// - Supplier not found
// - Database errors
```

### Payment Submission Errors

```typescript
class PaymentSubmissionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentSubmissionError';
  }
}

// Error codes:
// - INVALID_AMOUNT: Payment amount doesn't match commissions
// - NO_PROOF: Payment proof not uploaded
// - INVALID_COMMISSIONS: Selected commissions already paid
// - UPLOAD_FAILED: File upload failed
```

### Restriction Errors

```typescript
class RestrictionError extends Error {
  constructor(
    message: string,
    public supplierId: string,
    public action: ActionType,
    public restrictionStatus: RestrictionStatus
  ) {
    super(message);
    this.name = 'RestrictionError';
  }
}

// HTTP 403 response with restriction details
```

## API Endpoints

### Commission Endpoints

```typescript
// Get commission tiers (Admin)
GET /api/admin/commission-tiers
Response: { tiers: CommissionTier[] }

// Create commission tier (Admin)
POST /api/admin/commission-tiers
Body: { minAmount, maxAmount, commissionRate, description }
Response: { tier: CommissionTier }

// Update commission tier (Admin)
PATCH /api/admin/commission-tiers/:id
Body: { minAmount?, maxAmount?, commissionRate?, description?, isActive? }
Response: { tier: CommissionTier }

// Delete commission tier (Admin)
DELETE /api/admin/commission-tiers/:id
Response: { success: true }

// Get supplier commissions (Supplier)
GET /api/suppliers/commissions
Query: { status?, startDate?, endDate?, limit?, offset? }
Response: { commissions: Commission[], total: number, summary: SupplierSummary }

// Get commission details (Supplier/Admin)
GET /api/commissions/:id
Response: { commission: Commission, order: Order }

// Get commission analytics (Admin)
GET /api/admin/commissions/analytics
Query: { startDate?, endDate?, supplierId? }
Response: { analytics: CommissionAnalytics }

// Dispute commission (Supplier)
POST /api/suppliers/commissions/:id/dispute
Body: { reason: string, details: string }
Response: { commission: Commission }
```

### Payment Endpoints

```typescript
// Submit payment (Supplier)
POST /api/suppliers/payments/submit
Body: {
  commissionIds: string[],
  paymentMethod: string,
  proofOfPayment: File,
  transactionReference?: string
}
Response: { submission: PaymentSubmission }

// Get payment submissions (Supplier)
GET /api/suppliers/payments
Query: { status?, limit?, offset? }
Response: { submissions: PaymentSubmission[], total: number }

// Get pending payments (Admin)
GET /api/admin/payments/pending
Response: { submissions: PaymentSubmission[] }

// Verify payment (Admin)
POST /api/admin/payments/:id/verify
Response: { submission: PaymentSubmission }

// Reject payment (Admin)
POST /api/admin/payments/:id/reject
Body: { reason: string }
Response: { submission: PaymentSubmission }

// Bulk verify payments (Admin)
POST /api/admin/payments/bulk-verify
Body: { submissionIds: string[] }
Response: { results: BulkResult }

// Download payment receipt (Supplier)
GET /api/suppliers/payments/:id/receipt
Response: PDF file
```

### Restriction Endpoints

```typescript
// Get restriction status (Supplier)
GET /api/suppliers/restriction-status
Response: { status: RestrictionStatus }

// Check if action allowed (Supplier)
GET /api/suppliers/can-perform/:action
Response: { allowed: boolean, reason?: string }

// Set credit limit (Admin)
PATCH /api/admin/suppliers/:id/credit-limit
Body: { creditLimit: number }
Response: { supplier: SupplierProfile }

// Manual restriction toggle (Admin)
POST /api/admin/suppliers/:id/restriction
Body: { isRestricted: boolean, reason?: string }
Response: { supplier: SupplierProfile }

// Send payment reminder (Admin)
POST /api/admin/suppliers/:id/payment-reminder
Response: { success: true }
```

## Testing Strategy

### Unit Tests

1. **Commission Calculation**
   - Test tier selection logic
   - Test custom rate override
   - Test amount calculations
   - Test edge cases (zero amount, negative, etc.)

2. **Credit Limit Checks**
   - Test limit exceeded detection
   - Test restriction application
   - Test restriction removal
   - Test percentage calculations

3. **Payment Processing**
   - Test payment validation
   - Test commission status updates
   - Test balance calculations
   - Test bulk operations

### Integration Tests

1. **Order to Commission Flow**
   - Create order → Calculate commission → Update supplier balance
   - Test with different tier ranges
   - Test with custom rates

2. **Payment Submission Flow**
   - Submit payment → Admin verify → Update commissions → Remove restriction
   - Test rejection flow
   - Test partial payments

3. **Restriction Enforcement**
   - Exceed limit → Apply restriction → Block actions
   - Submit payment → Verify → Remove restriction → Allow actions

### End-to-End Tests

1. **Supplier Journey**
   - Create orders → Accumulate commissions → Reach limit → Get restricted
   - Submit payment → Wait for approval → Restriction removed

2. **Admin Journey**
   - Configure tiers → Monitor analytics → Review payments → Verify/reject
   - Send reminders → Manage restrictions

## Security Considerations

### Authentication & Authorization

- All commission endpoints require authentication
- Suppliers can only view their own commissions
- Admin-only endpoints protected with role check
- Payment verification requires admin role

### Data Validation

- Validate commission tier ranges (no overlaps)
- Validate payment amounts match selected commissions
- Validate file uploads (type, size, malware scan)
- Sanitize all user inputs

### File Upload Security

- Restrict file types (images, PDF only)
- Limit file size (max 5MB)
- Store files in secure location
- Generate unique filenames
- Scan for malware

### Financial Data Protection

- Encrypt sensitive financial data
- Audit log all commission changes
- Audit log all payment verifications
- Prevent commission tampering
- Validate all calculations server-side

## Performance Considerations

### Database Optimization

- Index on `supplierId` in commissions table
- Index on `status` in commissions table
- Index on `orderId` in commissions table
- Index on `supplierId` and `status` in payment_submissions
- Composite index on `minAmount` and `maxAmount` in commission_tiers

### Caching Strategy

- Cache commission tiers (rarely change)
- Cache supplier restriction status (5 min TTL)
- Cache commission analytics (15 min TTL)
- Invalidate cache on tier updates
- Invalidate supplier cache on payment approval

### Query Optimization

- Use pagination for commission lists
- Limit analytics date ranges
- Use database aggregations for summaries
- Batch commission status updates
- Use transactions for payment processing

## Deployment Considerations

### Database Migrations

1. Create commission_tiers table
2. Add restriction fields to supplier_profiles
3. Update commissions table with new status values
4. Create payment_submissions table
5. Create indexes

### Default Configuration

- Create default commission tiers on first deployment
- Set default credit limit (₹10,000)
- Configure payment reminder schedule
- Set up file storage for payment proofs

### Monitoring & Alerts

- Alert on failed commission calculations
- Alert on payment verification errors
- Monitor restriction enforcement
- Track payment submission rate
- Monitor file upload failures

## Future Enhancements

1. **Automated Payment Integration**
   - Direct payment gateway integration
   - Automatic payment verification
   - Instant restriction removal

2. **Advanced Analytics**
   - Predictive payment behavior
   - Commission forecasting
   - Supplier risk scoring

3. **Flexible Payment Plans**
   - Installment payments
   - Payment schedules
   - Grace periods

4. **Multi-Currency Support**
   - Currency conversion
   - Multi-currency tiers
   - Exchange rate tracking

5. **Mobile App**
   - Mobile payment submission
   - Push notifications
   - Quick payment options
