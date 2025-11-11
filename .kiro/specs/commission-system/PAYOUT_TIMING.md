# Payout Creation & Timing - Complete Guide

## 🕐 When Payouts Are Created

### Current System: **On-Demand (Manual Request)**

Payouts are created when:
1. ✅ Supplier manually requests a payout
2. ✅ Supplier has available balance (commissions with status "paid")
3. ✅ Supplier selects payout method (bank transfer or PayPal)

---

## 📊 Complete Timeline

### Phase 1: Order & Commission Creation
```
Buyer accepts quotation
    ↓
Order created (status: "pending")
    ↓
Commission created (status: "pending")
    ├─ Order Amount: $1,000
    ├─ Commission (10%): $100 → Admin
    └─ Supplier Amount: $900 → Supplier (locked)
```

### Phase 2: Order Fulfillment
```
Supplier confirms order (status: "confirmed")
    ↓
Supplier processes order (status: "processing")
    ↓
Supplier ships order (status: "shipped")
    ↓
Order delivered (status: "delivered") ✅
    ↓
Commission status → "paid" ✅
    ↓
Supplier's $900 is now AVAILABLE for payout
```

### Phase 3: Payout Request
```
Supplier goes to /supplier/payouts
    ↓
Clicks "Request Payout"
    ↓
System calculates available balance
    ├─ Sums all commissions where status = "paid"
    └─ Example: 10 orders × $900 = $9,000 available
    ↓
Supplier selects payout method
    ↓
Payout created (status: "pending")
```

### Phase 4: Admin Processing
```
Admin reviews payout request
    ↓
Admin clicks "Process" (status: "processing")
    ↓
Admin makes bank transfer/PayPal payment
    ↓
Admin clicks "Complete" with transaction ID
    ↓
Payout status → "completed" ✅
    ↓
Supplier receives money
```

---

## 🔑 Key Triggers

### 1. Commission Becomes "Paid" (Available for Payout)

**Trigger**: Order status changes to "delivered" or "completed"

**Code Location**: `server/supplierRoutes.ts` - Order status update endpoint

```typescript
// When supplier updates order to delivered/completed
PATCH /api/suppliers/orders/:id/status
{
  "status": "delivered"  // or "completed"
}

// Automatically triggers:
await markCommissionPaid(orderId);
// Commission status: "pending" → "paid"
```

**What happens**:
- Commission record is updated
- Supplier's earnings become available
- Supplier can now request payout

### 2. Payout Request Created

**Trigger**: Supplier manually requests payout

**Code Location**: `server/commissionRoutes.ts`

```typescript
POST /api/suppliers/payouts/request
{
  "payoutMethod": "bank_transfer"  // or "paypal"
}
```

**Requirements**:
- ✅ Must have commissions with status "paid"
- ✅ Available balance > $0
- ✅ Valid payout method selected

**What happens**:
```typescript
// 1. Calculate available balance
const availableBalance = SUM(commissions.supplierAmount) 
  WHERE status = 'paid' AND supplierId = current_supplier

// 2. Create payout record
{
  supplierId: "supplier-id",
  amount: availableBalance,
  commissionDeducted: totalCommissionDeducted,
  netAmount: availableBalance,
  payoutMethod: "bank_transfer",
  status: "pending",
  scheduledDate: new Date()
}
```

---

## 💰 Available Balance Calculation

### Formula
```
Available Balance = SUM of all (supplierAmount) 
                    WHERE commission.status = 'paid'
                    AND commission.supplierId = current_supplier
```

### Example
```
Supplier has 5 completed orders:

Order 1: $1,000 → Commission $100 → Supplier $900 (status: paid)
Order 2: $2,000 → Commission $200 → Supplier $1,800 (status: paid)
Order 3: $1,500 → Commission $150 → Supplier $1,350 (status: paid)
Order 4: $3,000 → Commission $300 → Supplier $2,700 (status: pending) ❌
Order 5: $500 → Commission $50 → Supplier $450 (status: paid)

Available Balance = $900 + $1,800 + $1,350 + $450 = $4,500
(Order 4 not included because commission is still "pending")
```

---

## 🎯 Payout Frequency Options

### Current: On-Demand
- ✅ Supplier requests whenever they want
- ✅ No minimum threshold
- ✅ No automatic schedule
- ⚠️ Requires manual action

### Recommended: Hybrid Approach

#### Option 1: Scheduled Payouts
```typescript
// Weekly payouts every Friday
async function createWeeklyPayouts() {
  const suppliers = await getSuppliersWithAvailableBalance();
  
  for (const supplier of suppliers) {
    if (supplier.availableBalance >= MINIMUM_THRESHOLD) {
      await createAutomaticPayout(supplier);
    }
  }
}
```

**Schedule Options**:
- **Weekly**: Every Friday
- **Bi-weekly**: 1st and 15th of month
- **Monthly**: Last day of month

#### Option 2: Threshold-Based
```typescript
// Auto-create payout when balance reaches threshold
if (availableBalance >= $1,000) {
  await createAutomaticPayout(supplier);
}
```

#### Option 3: Supplier Choice
Let suppliers configure their preferences:
```typescript
{
  autoPayoutEnabled: true,
  payoutSchedule: "weekly",      // or "biweekly", "monthly", "on-demand"
  minimumAmount: 500.00,         // Don't payout until $500
  payoutMethod: "bank_transfer"
}
```

---

## 📋 Payout Status Lifecycle

### Status: `pending`
- **When**: Payout request created
- **Meaning**: Waiting for admin review
- **Action**: Admin needs to review and process

### Status: `processing`
- **When**: Admin clicks "Process"
- **Meaning**: Admin is making the payment
- **Action**: Admin is transferring money

### Status: `completed`
- **When**: Admin clicks "Complete" with transaction ID
- **Meaning**: Money has been sent to supplier
- **Action**: None - payout is done

### Status: `failed`
- **When**: Admin marks as failed
- **Meaning**: Payment couldn't be processed
- **Action**: Supplier needs to update payment details

---

## 🔄 Automatic Payout Implementation

### Step 1: Add Supplier Payout Settings

```sql
ALTER TABLE supplier_profiles ADD COLUMN auto_payout_enabled BOOLEAN DEFAULT false;
ALTER TABLE supplier_profiles ADD COLUMN payout_schedule TEXT DEFAULT 'on-demand';
ALTER TABLE supplier_profiles ADD COLUMN minimum_payout_amount DECIMAL(10,2) DEFAULT 0;
```

### Step 2: Create Scheduled Job

```typescript
// Run daily at midnight
import cron from 'node-cron';

cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled payout creation...');
  
  // Get suppliers with auto-payout enabled
  const suppliers = await db.select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.autoPayoutEnabled, true));
  
  for (const supplier of suppliers) {
    const today = new Date();
    const shouldCreatePayout = checkPayoutSchedule(
      supplier.payoutSchedule,
      today
    );
    
    if (shouldCreatePayout) {
      const balance = await getAvailableBalance(supplier.id);
      
      if (balance >= supplier.minimumPayoutAmount) {
        await createAutomaticPayout(supplier.id, balance);
      }
    }
  }
});
```

### Step 3: Check Schedule Function

```typescript
function checkPayoutSchedule(schedule: string, date: Date): boolean {
  switch (schedule) {
    case 'weekly':
      // Every Friday
      return date.getDay() === 5;
    
    case 'biweekly':
      // 1st and 15th of month
      const day = date.getDate();
      return day === 1 || day === 15;
    
    case 'monthly':
      // Last day of month
      const tomorrow = new Date(date);
      tomorrow.setDate(date.getDate() + 1);
      return tomorrow.getMonth() !== date.getMonth();
    
    case 'on-demand':
    default:
      return false;
  }
}
```

---

## 🎨 UI Components Needed

### Supplier Payout Settings Page
```typescript
// /supplier/settings/payouts

<Form>
  <Toggle>
    Enable Automatic Payouts
  </Toggle>
  
  <Select name="schedule">
    <option value="on-demand">On-Demand (Manual)</option>
    <option value="weekly">Weekly (Every Friday)</option>
    <option value="biweekly">Bi-weekly (1st & 15th)</option>
    <option value="monthly">Monthly (End of Month)</option>
  </Select>
  
  <Input 
    name="minimumAmount" 
    label="Minimum Payout Amount"
    placeholder="$100"
  />
  
  <Select name="payoutMethod">
    <option value="bank_transfer">Bank Transfer</option>
    <option value="paypal">PayPal</option>
  </Select>
</Form>
```

### Supplier Payouts Page
```typescript
// /supplier/payouts

<Card>
  <h2>Available Balance</h2>
  <p className="text-3xl">$4,500.00</p>
  <Button onClick={requestPayout}>Request Payout</Button>
</Card>

<Table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Amount</th>
      <th>Method</th>
      <th>Status</th>
      <th>Transaction ID</th>
    </tr>
  </thead>
  <tbody>
    {payouts.map(payout => (
      <tr>
        <td>{payout.createdAt}</td>
        <td>${payout.amount}</td>
        <td>{payout.payoutMethod}</td>
        <td><Badge>{payout.status}</Badge></td>
        <td>{payout.transactionId}</td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 📊 Admin Payout Management

### Admin Payouts Dashboard
```typescript
// /admin/payouts

<Stats>
  <Card>
    <h3>Pending Payouts</h3>
    <p>15 requests</p>
    <p>$45,000 total</p>
  </Card>
  
  <Card>
    <h3>Processing</h3>
    <p>3 payouts</p>
    <p>$8,500 total</p>
  </Card>
  
  <Card>
    <h3>Completed This Month</h3>
    <p>127 payouts</p>
    <p>$385,000 total</p>
  </Card>
</Stats>

<Table>
  <thead>
    <tr>
      <th>Supplier</th>
      <th>Amount</th>
      <th>Method</th>
      <th>Requested</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {payouts.map(payout => (
      <tr>
        <td>{payout.supplierName}</td>
        <td>${payout.amount}</td>
        <td>{payout.payoutMethod}</td>
        <td>{payout.createdAt}</td>
        <td><Badge>{payout.status}</Badge></td>
        <td>
          {payout.status === 'pending' && (
            <Button onClick={() => processPayout(payout.id)}>
              Process
            </Button>
          )}
          {payout.status === 'processing' && (
            <Button onClick={() => completePayout(payout.id)}>
              Complete
            </Button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 🎯 Summary

### Current Implementation
- ✅ **Manual Request**: Supplier initiates payout
- ✅ **No Minimum**: Can request any available amount
- ✅ **Immediate**: Available as soon as commission is "paid"
- ✅ **Admin Approval**: All payouts require admin processing

### When Payout is Created
1. **Commission becomes "paid"** when order is delivered/completed
2. **Supplier requests payout** from available balance
3. **System creates payout record** with status "pending"
4. **Admin processes** and marks as completed

### Recommended Enhancements
- 🔄 Add automatic payout scheduling
- 💵 Add minimum payout threshold
- ⚙️ Let suppliers configure payout preferences
- 📧 Add email notifications for payout status changes
- 🔐 Add two-factor authentication for payout requests
- 📊 Add payout analytics and reporting
