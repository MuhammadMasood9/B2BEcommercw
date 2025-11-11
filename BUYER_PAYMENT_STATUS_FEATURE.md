# Buyer Payment Status Feature - Commission Trigger

## Overview
Added functionality for buyers to mark orders as paid, which automatically triggers commission calculations for suppliers.

## Changes Made

### 1. Frontend - Buyer Order Detail Page
**File**: `client/src/pages/buyer/OrderDetail.tsx`

#### Added Features:
- **Payment Status Badge**: Now shows color-coded payment status (pending/paid/failed)
- **Mark as Paid Button**: Appears when payment status is "pending"
- **Mark as Paid Mutation**: Handles the API call to mark order as paid

#### UI Changes:
```typescript
// Payment status badge with conditional styling
<Badge className={
  order.paymentStatus === 'paid' 
    ? 'bg-green-100 text-green-800' 
    : order.paymentStatus === 'failed'
    ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800'
}>
  {order.paymentStatus || 'Pending'}
</Badge>

// Mark as Paid button (only shows for pending payments)
{order.paymentStatus === 'pending' && (
  <Button onClick={() => markAsPaidMutation.mutate(order.id)}>
    Mark as Paid
  </Button>
)}
```

### 2. Backend - Payment Status Endpoint
**File**: `server/routes.ts`

#### New Endpoint:
```
PATCH /api/buyer/orders/:id/mark-paid
```

#### Functionality:
1. **Authentication Check**: Verifies buyer is logged in
2. **Authorization Check**: Ensures buyer owns the order
3. **Status Validation**: Prevents duplicate marking as paid
4. **Payment Update**: Updates order payment status to 'paid'
5. **Commission Calculation**: Automatically calculates commission if supplier exists
6. **Commission Record Creation**: Creates commission entry in database
7. **Supplier Notification**: Notifies supplier of payment confirmation

#### Commission Calculation Logic:
```typescript
// Get supplier's custom commission rate or use default (10%)
const commissionRate = supplierProfile?.commissionRate || 10.0;

// Calculate amounts
const orderAmount = parseFloat(order.totalAmount);
const commissionAmount = (orderAmount * commissionRate) / 100;
const supplierAmount = orderAmount - commissionAmount;

// Create commission record
await db.insert(commissions).values({
  orderId: order.id,
  supplierId: order.supplierId,
  orderAmount: orderAmount.toString(),
  commissionRate: commissionRate.toString(),
  commissionAmount: commissionAmount.toString(),
  supplierAmount: supplierAmount.toString(),
  status: 'pending'
});
```

## Business Flow

### Order Payment Flow:
1. **Buyer places order** → Order created with `paymentStatus: 'pending'`
2. **Buyer makes payment** (external to system)
3. **Buyer marks order as paid** → Clicks "Mark as Paid" button
4. **System updates payment status** → `paymentStatus: 'paid'`
5. **Commission calculated** → Based on order amount and supplier's commission rate
6. **Commission record created** → Stored in `commissions` table with status 'pending'
7. **Supplier notified** → Receives notification about payment confirmation

### Commission Calculation:
- **Default Rate**: 10% of order amount
- **Custom Rate**: Can be set per supplier in `supplier_profiles.commission_rate`
- **Platform Amount**: `commissionAmount = orderAmount * (commissionRate / 100)`
- **Supplier Amount**: `supplierAmount = orderAmount - commissionAmount`

## Database Schema

### Commissions Table:
```sql
CREATE TABLE commissions (
  id VARCHAR PRIMARY KEY,
  order_id VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  order_amount DECIMAL NOT NULL,
  commission_rate DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  supplier_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'disputed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Request/Response

### Request:
```http
PATCH /api/buyer/orders/:orderId/mark-paid
Authorization: Bearer <token>
```

### Success Response:
```json
{
  "success": true,
  "message": "Order marked as paid successfully. Commission has been calculated.",
  "order": {
    "id": "order-uuid",
    "orderNumber": "ORD-1234567890",
    "paymentStatus": "paid",
    "totalAmount": "1000.00",
    // ... other order fields
  }
}
```

### Error Responses:
```json
// Already paid
{
  "error": "Order is already marked as paid"
}

// Not authorized
{
  "error": "You don't have permission to update this order"
}

// Not found
{
  "error": "Order not found"
}
```

## User Experience

### Buyer View:
1. Navigate to order detail page
2. See payment status badge showing "Pending"
3. Click "Mark as Paid" button after making payment
4. See success toast: "Payment confirmed. Commission will be calculated."
5. Payment status badge updates to "Paid" (green)
6. Button disappears (can't mark as paid twice)

### Supplier View:
1. Receive notification: "Payment Received - Payment confirmed for order ORD-XXX. Commission: $XX.XX"
2. Can view commission details in supplier dashboard
3. Commission shows as "pending" until admin processes payout

## Testing

### Test Scenarios:
1. **Happy Path**: Buyer marks order as paid → Commission created
2. **Already Paid**: Try to mark paid order as paid again → Error
3. **Wrong Buyer**: Different buyer tries to mark order as paid → 403 Forbidden
4. **No Supplier**: Order without supplier → Payment updated, no commission created
5. **Custom Commission Rate**: Supplier with custom rate → Correct commission calculated

### Test Commands:
```bash
# Test marking order as paid
curl -X PATCH http://localhost:5000/api/buyer/orders/:orderId/mark-paid \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  --cookie-jar cookies.txt

# Verify commission was created
SELECT * FROM commissions WHERE order_id = ':orderId';
```

## Future Enhancements

### Potential Improvements:
1. **Payment Method Selection**: Allow buyer to specify payment method when marking as paid
2. **Payment Proof Upload**: Allow buyers to upload payment receipt/proof
3. **Automatic Payment Integration**: Integrate with payment gateways for automatic status updates
4. **Payment Reminders**: Send reminders to buyers for pending payments
5. **Partial Payments**: Support marking orders as partially paid
6. **Payment History**: Show payment history timeline on order detail page

## Notes
- Commission status starts as 'pending' and must be marked as 'paid' by admin after payout
- Suppliers can view their pending commissions in the supplier dashboard
- Platform admin can manage commissions through the admin commission management page
- Commission calculations are logged for audit purposes
