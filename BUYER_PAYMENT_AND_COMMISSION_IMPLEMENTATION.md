# Buyer Payment Status & Commission Implementation

## Overview
Implemented functionality for buyers to mark orders as paid, which automatically triggers commission calculations for the platform admin.

## Features Implemented

### 1. Buyer Order Payment Status Update
**Location**: `client/src/pages/buyer/OrderDetail.tsx`

**Functionality**:
- Buyers can now see their payment status (pending/paid/failed)
- "Mark as Paid" button appears when payment status is "pending"
- Clicking the button updates the order payment status to "paid"
- Automatically triggers commission calculation on the backend

**UI Changes**:
- Payment status badge with color coding:
  - Green: Paid
  - Yellow: Pending
  - Red: Failed
- "Mark as Paid" button with loading state

### 2. Backend Payment Status Endpoint
**Location**: `server/routes.ts`

**Endpoint**: `PATCH /api/buyer/orders/:id/mark-paid`

**Functionality**:
1. Verifies buyer owns the order
2. Checks if order is already paid
3. Updates payment status to "paid"
4. Calculates commission based on:
   - Supplier's custom commission rate (if set)
   - Default platform rate of 10% (if no custom rate)
5. Creates commission record in database
6. Notifies supplier of payment confirmation

**Commission Calculation**:
```javascript
orderAmount = order.totalAmount
commissionRate = supplier.commissionRate || 10.0%
commissionAmount = orderAmount * (commissionRate / 100)
supplierAmount = orderAmount - commissionAmount
```

**Commission Record Fields**:
- `orderId`: Reference to the order
- `supplierId`: Supplier who will receive payout
- `orderAmount`: Total order value
- `commissionRate`: Percentage rate applied
- `commissionAmount`: Platform's commission
- `supplierAmount`: Amount supplier receives
- `status`: 'pending' (awaiting payout)

### 3. Admin Commission Management
**Location**: `client/src/pages/admin/AdminCommissions.tsx`

**Features**:
- **Analytics Dashboard**:
  - Total Revenue (all-time)
  - Pending Revenue (awaiting completion)
  - Recent Revenue (last 30 days)
  - Top Suppliers by commission

- **Commission Transactions List**:
  - Filter by status (all/pending/paid/disputed)
  - View all commission records
  - See order details, supplier info, amounts
  - Track commission status

- **Revenue Breakdown**:
  - Paid Revenue (completed)
  - Pending Revenue (awaiting completion)
  - Disputed Revenue (requires attention)

- **Top Suppliers**:
  - Ranked list of suppliers by commission generated
  - Shows total commission, order count, average commission

### 4. Admin Sidebar Integration
**Location**: `client/src/components/AdminSidebar.tsx`

**Changes**:
- Added "Commissions" menu item with DollarSign icon
- Positioned between "Orders" and "Users"
- Links to `/admin/commissions`

### 5. Routing
**Location**: `client/src/App.tsx`

**Changes**:
- Added route: `/admin/commissions` → `AdminCommissions` component
- Protected with admin role requirement

## Business Flow

### Complete Order-to-Commission Flow:

1. **Buyer creates RFQ** → `POST /api/rfqs`
2. **Supplier responds with quotation** → `POST /api/suppliers/rfqs/:id/respond`
3. **Buyer accepts quotation** → `POST /api/quotations/:id/accept`
   - Order is created automatically
   - Payment status: "pending"
4. **Buyer marks order as paid** → `PATCH /api/buyer/orders/:id/mark-paid`
   - Payment status: "paid"
   - Commission is calculated and recorded
   - Supplier is notified
5. **Admin views commission** → `/admin/commissions`
   - Sees commission record with "pending" status
   - Can track revenue and supplier performance

### Commission Status Lifecycle:
- **pending**: Commission calculated, awaiting payout to supplier
- **paid**: Commission has been paid out to supplier
- **disputed**: Issue with commission (requires admin attention)

## API Endpoints

### Buyer Endpoints
```
PATCH /api/buyer/orders/:id/mark-paid
- Marks order as paid
- Triggers commission calculation
- Requires: buyer authentication
- Returns: updated order with commission info
```

### Admin Endpoints
```
GET /api/commissions/admin/commissions/analytics
- Returns commission analytics and metrics
- Requires: admin authentication

GET /api/commissions/admin/commissions?status=pending
- Returns list of commissions
- Optional filter by status
- Requires: admin authentication
```

## Database Schema

### Commissions Table
```sql
CREATE TABLE commissions (
  id VARCHAR PRIMARY KEY,
  order_id VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  order_amount DECIMAL NOT NULL,
  commission_rate DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  supplier_amount DECIMAL NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Default Commission Rate
- **Default**: 10% of order amount
- **Customizable**: Per-supplier rates can be set in `supplier_profiles.commission_rate`

### Commission Calculation Example
```
Order Amount: $1,000
Commission Rate: 10%
Commission Amount: $100 (platform keeps)
Supplier Amount: $900 (supplier receives)
```

## Testing

### Test the Complete Flow:
1. Login as buyer
2. Create an RFQ for a product
3. Login as supplier
4. Respond to the RFQ with a quotation
5. Login as buyer
6. Accept the quotation (order is created)
7. Go to order detail page
8. Click "Mark as Paid"
9. Login as admin
10. Navigate to "Commissions" in sidebar
11. Verify commission record appears with correct amounts

## Future Enhancements
- Bulk payment marking for multiple orders
- Commission payout scheduling
- Commission dispute resolution workflow
- Automated commission reports
- Commission rate negotiation interface
- Payment gateway integration for automatic status updates
