# Revised Commission System - Supplier Pays Admin

## Overview
Suppliers owe commission to the platform for each completed order. They must pay these commissions to continue operating.

## How It Works

### 1. Order Completion
- Order is delivered/completed
- Commission is calculated (e.g., 10% of order value)
- Commission record created with status "unpaid"
- Supplier now **owes** this amount to admin

### 2. Commission Tracking
- **Total Owed**: Sum of all unpaid commissions
- **Credit Limit**: Maximum unpaid amount allowed (set by admin)
- **Available Credit**: Credit Limit - Total Owed

### 3. Account Restrictions
When Total Owed >= Credit Limit:
- ❌ Cannot create new products
- ❌ Cannot accept new orders
- ❌ Cannot respond to inquiries
- ✅ Can still view dashboard
- ✅ Can still pay commissions

### 4. Payment Process

#### Supplier Side:
1. View unpaid commissions
2. Click "Pay Commission"
3. Make payment to admin (bank transfer, etc.)
4. Submit payment proof with transaction ID

#### Admin Side:
1. Review payment submissions
2. Verify payment received
3. Mark commission as "paid"
4. Supplier's available credit increases

## Database Changes Needed

### Add to supplier_profiles table:
- `commission_credit_limit`: Maximum unpaid commission allowed
- `total_unpaid_commission`: Current unpaid amount
- `is_restricted`: Boolean flag when limit exceeded

### Update commissions table:
- Status: "unpaid" → "payment_submitted" → "paid"
- Add: `payment_proof_url`, `payment_transaction_id`, `payment_date`

### Create commission_payments table:
- Track individual payment submissions
- Link multiple commissions to one payment

## New Features Required

1. **Supplier Commission Payment Page**
   - View unpaid commissions
   - Submit payment with proof
   - Track payment status

2. **Admin Commission Payment Review**
   - Review payment submissions
   - Verify and approve payments
   - Mark commissions as paid

3. **Credit Limit Management**
   - Admin can set credit limit per supplier
   - Default credit limit for all suppliers
   - View suppliers near/over limit

4. **Account Restriction System**
   - Middleware to check credit status
   - Block restricted actions
   - Show warning messages

5. **Payment Reminders**
   - Notify suppliers when approaching limit
   - Alert when limit exceeded
   - Remind about unpaid commissions
