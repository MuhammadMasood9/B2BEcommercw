# B2B Marketplace Commission System - Complete Flow

## Overview
The commission system allows the admin (platform owner) to earn revenue from every transaction between buyers and suppliers. The admin takes a percentage commission from each order, and the supplier receives the remaining amount.

---

## 🔄 Complete Commission Flow

### 1. **Commission Rate Setup**

#### Default Rate
- **Default Commission Rate**: 10% (defined in `commissionRoutes.ts`)
- This applies to all suppliers unless a custom rate is set

#### Custom Rate Per Supplier
Admin can set custom commission rates for individual suppliers:

**Endpoint**: `PATCH /api/admin/suppliers/:id/commission-rate`

```json
{
  "commissionRate": 0.15  // 15% commission
}
```

**Where it's stored**: `supplier_profiles.commission_rate`

---

### 2. **Order Creation & Commission Calculation**

When a buyer accepts a quotation (RFQ or Inquiry), the system:

#### Step 1: Create Order
```typescript
const order = await storage.createOrder({
  orderNumber: "ORD-1234567890",
  buyerId: "buyer-id",
  supplierId: "supplier-id",
  totalAmount: "1000.00",
  // ... other order details
});
```

#### Step 2: Automatically Calculate Commission
```typescript
await calculateCommission(
  order.id,           // Order ID
  supplierId,         // Supplier ID
  1000.00            // Order Amount
);
```

#### Step 3: Commission Calculation Logic
```typescript
// Get supplier's commission rate (or use default 10%)
const commissionRate = supplier.commissionRate || 0.10;

// Calculate amounts
const orderAmount = 1000.00;
const commissionAmount = orderAmount * commissionRate;  // $100
const supplierAmount = orderAmount - commissionAmount;   // $900

// Create commission record
{
  orderId: "order-id",
  supplierId: "supplier-id",
  orderAmount: "1000.00",
  commissionRate: "0.10",
  commissionAmount: "100.00",    // Admin earns this
  supplierAmount: "900.00",       // Supplier receives this
  status: "pending"
}
```

---

### 3. **Commission Status Lifecycle**

#### Status: `pending`
- **When**: Order is created
- **Meaning**: Commission is calculated but not yet earned
- **Admin Revenue**: Not yet realized
- **Supplier Payment**: Not yet released

#### Status: `paid`
- **When**: Order is marked as "delivered" or "completed"
- **Meaning**: Commission is earned by admin, supplier can request payout
- **Admin Revenue**: Realized and earned
- **Supplier Payment**: Available for payout

#### Status: `disputed`
- **When**: There's a dispute about the order
- **Meaning**: Commission is on hold
- **Admin Revenue**: Frozen until resolution
- **Supplier Payment**: Frozen until resolution

---

### 4. **Admin Revenue Tracking**

#### View All Commissions
**Endpoint**: `GET /api/admin/commissions`

**Query Parameters**:
- `supplierId`: Filter by supplier
- `status`: Filter by status (pending, paid, disputed)
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Pagination limit
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "commissions": [
    {
      "id": "commission-id",
      "orderId": "order-id",
      "orderNumber": "ORD-1234567890",
      "supplierId": "supplier-id",
      "supplierName": "ABC Manufacturing",
      "orderAmount": "1000.00",
      "commissionRate": "0.10",
      "commissionAmount": "100.00",
      "supplierAmount": "900.00",
      "status": "paid",
      "createdAt": "2025-11-11T10:00:00Z"
    }
  ],
  "total": 150
}
```

#### View Commission Analytics
**Endpoint**: `GET /api/admin/commissions/analytics`

**Response**:
```json
{
  "success": true,
  "analytics": {
    "totalRevenue": 15000.00,        // Total admin earnings
    "totalOrders": 150,
    "pendingRevenue": 3000.00,       // Not yet earned
    "paidRevenue": 12000.00,         // Earned revenue
    "disputedRevenue": 0.00,
    "recentRevenue": 2500.00,        // Last 30 days
    "recentOrders": 25,
    "topSuppliers": [
      {
        "supplierId": "supplier-1",
        "supplierName": "ABC Manufacturing",
        "totalCommission": 5000.00,
        "totalOrders": 50,
        "averageCommission": 100.00
      }
    ]
  }
}
```

---

### 5. **Supplier Earnings Tracking**

#### View Commission History
**Endpoint**: `GET /api/suppliers/commissions`

Suppliers can see:
- How much they earned (after commission)
- How much commission was deducted
- Order details
- Payment status

**Response**:
```json
{
  "success": true,
  "commissions": [
    {
      "id": "commission-id",
      "orderId": "order-id",
      "orderNumber": "ORD-1234567890",
      "orderAmount": "1000.00",
      "commissionRate": "0.10",
      "commissionAmount": "100.00",    // Deducted by platform
      "supplierAmount": "900.00",       // Supplier receives
      "status": "paid",
      "createdAt": "2025-11-11T10:00:00Z"
    }
  ],
  "summary": {
    "totalEarnings": 45000.00,         // Total supplier earnings
    "totalCommissions": 5000.00,       // Total deducted
    "totalOrders": 50,
    "pendingAmount": 5000.00,          // Pending orders
    "paidAmount": 40000.00             // Available for payout
  }
}
```

---

### 6. **Payout System**

#### Supplier Requests Payout
**Endpoint**: `POST /api/suppliers/payouts/request`

```json
{
  "payoutMethod": "bank_transfer"  // or "paypal"
}
```

**What happens**:
1. System calculates available balance (all "paid" commissions)
2. Creates payout request with status "pending"
3. Admin is notified

#### Admin Processes Payout
**Endpoint**: `POST /api/admin/payouts/:id/process`

```json
{
  "transactionId": "TXN-123456"
}
```

**Status changes**: `pending` → `processing`

#### Admin Completes Payout
**Endpoint**: `POST /api/admin/payouts/:id/complete`

```json
{
  "transactionId": "TXN-123456"
}
```

**Status changes**: `processing` → `completed`

#### View All Payouts (Admin)
**Endpoint**: `GET /api/admin/payouts`

```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout-id",
      "supplierId": "supplier-id",
      "supplierName": "ABC Manufacturing",
      "supplierEmail": "supplier@example.com",
      "amount": "40000.00",
      "commissionDeducted": "4444.44",
      "netAmount": "40000.00",
      "payoutMethod": "bank_transfer",
      "status": "completed",
      "transactionId": "TXN-123456",
      "scheduledDate": "2025-11-10T00:00:00Z",
      "processedDate": "2025-11-11T10:00:00Z"
    }
  ]
}
```

---

## 💰 How Admin Earns Money

### Revenue Sources

1. **Commission on Every Order**
   - Default: 10% of order value
   - Custom rates per supplier (can be higher or lower)
   - Automatically calculated when order is created

2. **Revenue Realization**
   - Commission is "pending" when order is created
   - Commission becomes "paid" when order is delivered
   - Admin keeps the commission amount
   - Supplier receives the remaining amount

### Example Transaction

**Order Details**:
- Order Amount: $10,000
- Commission Rate: 10%

**Money Flow**:
```
Buyer pays: $10,000
├─ Admin earns: $1,000 (10% commission)
└─ Supplier receives: $9,000 (90% of order)
```

**With Custom Rate (15%)**:
```
Buyer pays: $10,000
├─ Admin earns: $1,500 (15% commission)
└─ Supplier receives: $8,500 (85% of order)
```

---

## 📊 Admin Dashboard Views

### 1. Commission Overview
- Total revenue earned
- Pending revenue (orders not yet completed)
- Revenue by time period
- Top earning suppliers

### 2. Commission Management
- View all commissions
- Filter by supplier, status, date
- Export commission reports
- Track commission trends

### 3. Payout Management
- View payout requests
- Approve/process payouts
- Track payout history
- Manage failed payouts

### 4. Supplier Commission Settings
- Set custom commission rates per supplier
- View supplier earnings
- Adjust rates based on performance

---

## 🔐 Security & Business Rules

### Commission Calculation
- ✅ Automatically calculated on order creation
- ✅ Cannot be manually edited
- ✅ Based on supplier's commission rate
- ✅ Stored in separate commission table

### Payout Rules
- ✅ Only "paid" commissions can be paid out
- ✅ Supplier can only request payout for available balance
- ✅ Admin must approve all payouts
- ✅ Transaction ID required for completion

### Commission Status
- ✅ Automatically set to "pending" on order creation
- ✅ Changed to "paid" when order is completed
- ✅ Can be set to "disputed" if issues arise
- ✅ Status changes are tracked and logged

---

## 📈 Revenue Optimization

### Strategies for Admin

1. **Tiered Commission Rates**
   - New suppliers: 15%
   - Established suppliers: 10%
   - Premium suppliers: 8%

2. **Volume-Based Rates**
   - High-volume suppliers get lower rates
   - Incentivizes more transactions

3. **Category-Based Rates**
   - Different rates for different product categories
   - Higher margins on premium products

4. **Performance-Based Rates**
   - Lower rates for suppliers with high ratings
   - Rewards quality and customer satisfaction

---

## 🛠️ Technical Implementation

### Database Schema

```sql
-- Commissions Table
CREATE TABLE commissions (
  id VARCHAR PRIMARY KEY,
  order_id VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  order_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  supplier_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payouts Table
CREATE TABLE payouts (
  id VARCHAR PRIMARY KEY,
  supplier_id VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_deducted DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  scheduled_date TIMESTAMP,
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Key Functions

1. **calculateCommission(orderId, supplierId, orderAmount)**
   - Calculates commission based on supplier's rate
   - Creates commission record
   - Returns commission details

2. **markCommissionPaid(orderId)**
   - Updates commission status to "paid"
   - Called when order is completed
   - Enables supplier payout

---

## 📱 UI Components

### Admin Pages
- `/admin/commissions` - View all commissions
- `/admin/payouts` - Manage supplier payouts
- `/admin/suppliers/:id` - Edit supplier commission rate

### Supplier Pages
- `/supplier/commissions` - View commission history
- `/supplier/payouts` - Request and track payouts

---

## 🎯 Summary

The commission system provides:

1. **Automated Revenue**: Admin earns automatically on every order
2. **Transparent Tracking**: Both admin and suppliers can track earnings
3. **Flexible Rates**: Custom commission rates per supplier
4. **Secure Payouts**: Admin-controlled payout process
5. **Detailed Analytics**: Comprehensive revenue reporting

**Admin earns money by**:
- Taking a percentage (commission) from every order
- The commission is automatically calculated and tracked
- Revenue is realized when orders are completed
- Suppliers receive the remaining amount after commission deduction
