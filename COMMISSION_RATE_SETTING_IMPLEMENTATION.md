# Commission Rate Setting Implementation

## Overview
Added functionality for admins to set custom commission rates for individual suppliers through the Admin Suppliers page.

## Features Implemented

### 1. Admin UI - Commission Rate Dialog
**Location**: `client/src/pages/admin/AdminSuppliers.tsx`

**New Components**:
- **Commission Button**: Added to each approved supplier's action buttons
  - Icon: DollarSign
  - Label: "Commission"
  - Only visible for approved suppliers

- **Commission Rate Dialog**: Modal for setting commission rates
  - Input field for commission percentage (0-100%)
  - Real-time example calculation showing:
    - Order amount ($1,000 example)
    - Commission amount
    - Supplier payout amount
  - Validation: Rate must be between 0-100%
  - Default suggestion: 10%

**UI Features**:
- Shows supplier name and business name
- Number input with min/max validation
- Example calculation updates as you type
- Clear visual feedback with color-coded info box

### 2. Backend API Endpoint
**Location**: `server/routes.ts`

**Endpoint**: `PATCH /api/admin/suppliers/:id/commission-rate`

**Functionality**:
- Requires admin authentication
- Validates commission rate (0-100%)
- Updates `supplier_profiles.commission_rate` field
- Returns updated supplier data

**Request Body**:
```json
{
  "commissionRate": 15.5
}
```

**Response**:
```json
{
  "success": true,
  "message": "Commission rate updated successfully",
  "supplier": { ... }
}
```

**Validation**:
- Rate must be a number
- Rate must be between 0 and 100
- Admin role required

### 3. Database Schema
**Table**: `supplier_profiles`
**Field**: `commission_rate` (decimal)

- Stores the custom commission rate for each supplier
- If NULL or not set, defaults to 10% platform rate
- Used in commission calculation when orders are marked as paid

## How It Works

### Setting Commission Rate:
1. Admin navigates to "Suppliers" page
2. Finds an approved supplier
3. Clicks "Commission" button
4. Dialog opens showing current rate (or default 10%)
5. Admin enters new rate (e.g., 15%)
6. Example calculation shows impact
7. Admin clicks "Update Commission Rate"
8. Rate is saved to database

### Commission Calculation Flow:
1. Buyer marks order as paid
2. Backend checks supplier's `commission_rate`
3. If custom rate exists, uses that
4. If not, uses default 10%
5. Calculates commission and creates record

**Example**:
```javascript
// Supplier A has custom rate of 15%
Order: $1,000
Commission: $150 (15%)
Supplier Receives: $850

// Supplier B has no custom rate (uses default 10%)
Order: $1,000
Commission: $100 (10%)
Supplier Receives: $900
```

## User Interface

### Commission Button Location:
```
Suppliers Table
├── Store Name
├── Business Type
├── Location
├── Status
├── Verification
├── Performance
└── Actions
    ├── Verify
    ├── Commission ← NEW
    └── Suspend
```

### Commission Dialog:
```
┌─────────────────────────────────────┐
│ 💲 Set Commission Rate              │
├─────────────────────────────────────┤
│ Store Name                          │
│ Business Name                       │
│                                     │
│ Commission Rate (%)                 │
│ [15.5]                             │
│ Default platform rate is 10%        │
│                                     │
│ Example Calculation                 │
│ Order: $1,000 → Commission: $155    │
│ → Supplier Receives: $845           │
│                                     │
│ [Cancel] [Update Commission Rate]   │
└─────────────────────────────────────┘
```

## API Endpoints

### Update Commission Rate
```
PATCH /api/admin/suppliers/:id/commission-rate
Authorization: Admin role required
Content-Type: application/json

Body:
{
  "commissionRate": 15.5
}

Response:
{
  "success": true,
  "message": "Commission rate updated successfully",
  "supplier": {
    "id": "supplier-id",
    "commissionRate": "15.5",
    ...
  }
}
```

## Testing

### Test the Feature:
1. Login as admin
2. Navigate to "Suppliers" page
3. Find an approved supplier
4. Click "Commission" button
5. Enter a commission rate (e.g., 12.5%)
6. Verify example calculation updates
7. Click "Update Commission Rate"
8. Verify success toast appears
9. Create a test order with that supplier
10. Mark order as paid as buyer
11. Check commission record uses custom rate

### Test Cases:
- ✅ Set commission rate to 0%
- ✅ Set commission rate to 100%
- ✅ Set commission rate to 10.5% (decimal)
- ❌ Try to set negative rate (should fail)
- ❌ Try to set rate > 100% (should fail)
- ✅ Update existing commission rate
- ✅ Verify commission calculation uses custom rate

## Business Rules

### Commission Rate Priority:
1. **Custom Rate**: If supplier has `commission_rate` set, use that
2. **Default Rate**: If no custom rate, use 10%

### Rate Limits:
- Minimum: 0% (no commission)
- Maximum: 100% (platform takes all)
- Precision: Up to 1 decimal place (e.g., 10.5%)

### Who Can Set Rates:
- Only admins can set commission rates
- Suppliers cannot see or modify their own rates
- Buyers cannot see commission rates

## Future Enhancements
- Bulk commission rate updates for multiple suppliers
- Commission rate history/audit log
- Tiered commission rates based on sales volume
- Promotional commission rates with expiry dates
- Commission rate negotiation workflow
- Analytics showing commission rate impact on sales
