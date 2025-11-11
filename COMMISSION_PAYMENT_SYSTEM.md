# Commission Payment System - Complete Guide

## System Overview

In this B2B marketplace, **suppliers owe commission to the platform** for each completed order. Suppliers must pay these commissions to continue operating on the platform.

## Key Concepts

### 1. Commission Flow
```
Order Completed → Commission Owed → Supplier Pays → Commission Cleared
```

### 2. Credit System
- **Credit Limit**: Maximum unpaid commission allowed (default: $1,000)
- **Total Owed**: Sum of all unpaid commissions
- **Available Credit**: Credit Limit - Total Owed

### 3. Account Status
- **Active**: Total Owed < Credit Limit
- **Restricted**: Total Owed >= Credit Limit

## How It Works

### When Order is Completed

1. Order status changes to "delivered" or "completed"
2. System calculates commission (e.g., 10% of order value)
3. Commission record created with status "unpaid"
4. Supplier's `total_unpaid_commission` increases
5. If total >= credit limit, `is_restricted` = true

### When Supplier is Restricted

Suppliers cannot:
- ❌ Create new products
- ❌ Accept new orders
- ❌ Respond to new inquiries
- ❌ Submit quotations

Suppliers can still:
- ✅ View dashboard
- ✅ View unpaid commissions
- ✅ Submit commission payments
- ✅ View payment history

### Payment Process

#### Supplier Side:
1. Go to **Supplier Portal > Commission Payments**
2. View list of unpaid commissions
3. Select commissions to pay
4. Click "Submit Payment"
5. Enter payment details:
   - Payment method (Bank Transfer, PayPal, etc.)
   - Transaction ID
   - Payment date
   - Upload payment proof (receipt/screenshot)
6. Submit for admin review

#### Admin Side:
1. Go to **Admin > Commission Payments**
2. View pending payment submissions
3. Verify payment received in bank/PayPal
4. Click "Verify Payment" or "Reject Payment"
5. If verified:
   - Linked commissions marked as "paid"
   - Supplier's total_unpaid_commission decreases
   - Restriction lifted if below credit limit

## Database Schema

### supplier_profiles (new columns)
```sql
commission_credit_limit DECIMAL(10, 2) DEFAULT 1000.00
total_unpaid_commission DECIMAL(10, 2) DEFAULT 0.00
is_restricted BOOLEAN DEFAULT false
last_payment_date TIMESTAMP
payment_reminder_sent_at TIMESTAMP
```

### commissions (updated)
```sql
status TEXT -- 'unpaid', 'payment_submitted', 'paid', 'disputed'
payment_proof_url TEXT
payment_transaction_id TEXT
payment_date TIMESTAMP
payment_submitted_at TIMESTAMP
payment_verified_by VARCHAR
payment_verified_at TIMESTAMP
```

### commission_payments (new table)
```sql
id VARCHAR PRIMARY KEY
supplier_id VARCHAR
amount DECIMAL(10, 2)
payment_method TEXT
payment_proof_url TEXT
transaction_id TEXT
payment_date TIMESTAMP
status TEXT -- 'pending', 'verified', 'rejected'
notes TEXT
verified_by VARCHAR
verified_at TIMESTAMP
rejection_reason TEXT
```

### commission_payment_items (new table)
```sql
id VARCHAR PRIMARY KEY
payment_id VARCHAR
commission_id VARCHAR
amount DECIMAL(10, 2)
```

## API Endpoints Needed

### Supplier Endpoints

**GET /api/commissions/supplier/unpaid**
- Get list of unpaid commissions
- Returns commissions with status 'unpaid'

**GET /api/commissions/supplier/credit-status**
- Get credit limit, total owed, available credit
- Returns restriction status

**POST /api/commissions/supplier/submit-payment**
- Submit payment for commissions
- Body: payment details + commission IDs
- Creates commission_payment record

**GET /api/commissions/supplier/payments**
- Get payment submission history
- Returns all payment submissions

### Admin Endpoints

**GET /api/commissions/admin/payments**
- Get all payment submissions
- Filter by status, supplier, date

**POST /api/commissions/admin/payments/:id/verify**
- Verify a payment submission
- Marks linked commissions as paid
- Updates supplier credit status

**POST /api/commissions/admin/payments/:id/reject**
- Reject a payment submission
- Body: rejection reason
- Notifies supplier

**PATCH /api/commissions/admin/suppliers/:id/credit-limit**
- Update supplier's credit limit
- Body: new credit limit amount

**GET /api/commissions/admin/restricted-suppliers**
- Get list of restricted suppliers
- Returns suppliers with is_restricted = true

## Middleware for Restrictions

Create middleware to check supplier restrictions:

```typescript
export async function checkSupplierRestriction(req, res, next) {
  if (req.user?.role !== 'supplier') {
    return next();
  }
  
  const supplier = await getSupplierProfile(req.user.id);
  
  if (supplier.isRestricted) {
    return res.status(403).json({
      error: 'Account restricted',
      message: 'Your account is restricted due to unpaid commissions. Please pay outstanding commissions to continue.',
      totalOwed: supplier.totalUnpaidCommission,
      creditLimit: supplier.commissionCreditLimit
    });
  }
  
  next();
}
```

Apply to routes:
- Product creation
- Order acceptance
- Inquiry responses
- Quotation submissions

## Notifications

### For Suppliers:
1. **Commission Created**: "New commission of $X for order #Y"
2. **Approaching Limit**: "You have $X unpaid commission. Credit limit: $Y"
3. **Account Restricted**: "Account restricted. Pay $X to continue"
4. **Payment Verified**: "Payment of $X verified. Available credit: $Y"
5. **Payment Rejected**: "Payment rejected. Reason: ..."

### For Admins:
1. **Payment Submitted**: "Supplier X submitted payment of $Y"
2. **Supplier Restricted**: "Supplier X reached credit limit"

## Admin Settings

Create admin page to manage:
1. **Default Credit Limit**: For all new suppliers
2. **Per-Supplier Credit Limit**: Override for specific suppliers
3. **Commission Rate**: Per supplier or global
4. **Payment Methods**: Accepted payment methods
5. **Auto-Restrictions**: Enable/disable automatic restrictions

## Implementation Priority

1. ✅ Database migration (DONE)
2. ⏳ Update commission calculation to use "unpaid" status
3. ⏳ Create supplier credit status API
4. ⏳ Create supplier payment submission page
5. ⏳ Create admin payment verification page
6. ⏳ Add restriction middleware
7. ⏳ Add restriction checks to supplier actions
8. ⏳ Add notifications
9. ⏳ Add admin credit limit management
10. ⏳ Add payment reminders

## Testing Checklist

- [ ] Commission created when order completed
- [ ] Total unpaid commission calculated correctly
- [ ] Supplier restricted when limit exceeded
- [ ] Restricted supplier cannot create products
- [ ] Restricted supplier cannot accept orders
- [ ] Supplier can submit payment
- [ ] Admin can verify payment
- [ ] Commissions marked as paid after verification
- [ ] Restriction lifted when below limit
- [ ] Notifications sent correctly
- [ ] Credit limit can be updated per supplier
