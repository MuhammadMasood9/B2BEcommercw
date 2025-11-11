# Commission Payout System Guide

## Overview

The commission payout system allows suppliers to request payouts of their earned commissions, and admins to process these requests. This guide explains how the system works and how to use it.

## How It Works

### 1. Commission Calculation

When an order is placed:
- Platform calculates commission based on supplier's commission rate (default 10%)
- Commission record is created with status "pending"
- When order is completed and paid, commission status changes to "paid"
- Paid commissions become available for payout

### 2. Supplier Payout Request

Suppliers can request payouts from their dashboard:
- Navigate to **Supplier Portal > Payouts**
- View available balance (sum of all paid commissions)
- Click "Request Payout" button
- Select payout method (Bank Transfer or PayPal)
- Submit request

### 3. Admin Payout Processing

Admins process payout requests:
- Navigate to **Admin > Payouts**
- View pending payout requests
- Review supplier details and amount
- Process the payout through these steps:

#### Step 1: Mark as Processing
- Click "Process" on a pending payout
- Optionally add transaction ID
- Status changes to "processing"

#### Step 2: Transfer Funds
- Transfer funds to supplier using their preferred method
- Bank Transfer: Use supplier's registered bank account
- PayPal: Transfer to supplier's PayPal email

#### Step 3: Complete Payout
- Click "Complete" on the processing payout
- Enter transaction ID (required)
- Status changes to "completed"
- Supplier is notified


## Payout Status Flow

```
pending → processing → completed
   ↓
failed (if rejected or transfer fails)
```

## API Endpoints

### Supplier Endpoints

**GET /api/commissions/supplier/payouts**
- Get supplier's payout history
- Returns list of all payout requests

**POST /api/commissions/supplier/payouts/request**
- Request a new payout
- Body: `{ payoutMethod: "bank_transfer" | "paypal" }`
- Validates available balance
- Creates payout request with status "pending"

**GET /api/commissions/supplier/commissions/summary**
- Get commission summary including available balance
- Returns total earnings, pending, and paid amounts

### Admin Endpoints

**GET /api/commissions/admin/payouts**
- Get all payout requests
- Query params: `status`, `supplierId`, `startDate`, `endDate`
- Returns paginated list with supplier details

**POST /api/commissions/admin/payouts/:id/process**
- Mark payout as processing
- Body: `{ transactionId?: string }`
- Changes status to "processing"

**POST /api/commissions/admin/payouts/:id/complete**
- Complete a payout
- Body: `{ transactionId: string }` (required)
- Changes status to "completed"

**POST /api/commissions/admin/payouts/:id/fail**
- Mark payout as failed
- Body: `{ reason: string }`
- Changes status to "failed"
- Notifies supplier with reason

## Database Schema

### Payouts Table
```sql
payouts (
  id: varchar (primary key)
  supplierId: varchar (foreign key to supplier_profiles)
  amount: decimal (gross amount)
  commissionDeducted: decimal (platform commission)
  netAmount: decimal (amount to pay supplier)
  payoutMethod: text (bank_transfer, paypal)
  status: text (pending, processing, completed, failed)
  scheduledDate: timestamp
  processedDate: timestamp
  transactionId: text
  createdAt: timestamp
)
```

## Important Notes

### For Suppliers
- Only completed orders with paid commissions are available for payout
- Platform commission is automatically deducted from order amounts
- Ensure payment details are up to date in profile settings
- Payout requests typically processed within 3-5 business days

### For Admins
- Always verify supplier identity before processing payouts
- Keep transaction IDs for record keeping and dispute resolution
- Failed payouts should include a clear reason for the supplier
- Completed payouts cannot be reversed through the system

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Role-based access (supplier/admin)
3. **Validation**: Amount validation, status checks
4. **Audit Trail**: All payout actions are logged
5. **Transaction IDs**: Required for completed payouts

## Testing

To test the payout system:

1. Create a supplier account
2. Create and complete orders to generate commissions
3. Mark commissions as "paid" (admin action)
4. Request payout as supplier
5. Process payout as admin
6. Verify status updates and notifications
