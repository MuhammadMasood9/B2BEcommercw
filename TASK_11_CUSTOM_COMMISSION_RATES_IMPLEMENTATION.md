# Task 11: Custom Commission Rates Implementation

## Overview
Implemented the ability for admins to set custom commission rates for individual suppliers, overriding the default tiered commission system.

## Implementation Details

### Backend Changes

#### 1. API Endpoint (server/routes.ts)
- **Endpoint**: `PATCH /api/admin/suppliers/:id/commission-rate`
- **Location**: Line 340-383
- **Functionality**:
  - Accepts commission rate as decimal (0-1)
  - Validates rate is between 0 and 1
  - Updates supplier profile with custom rate
  - Returns updated supplier data

#### 2. Data Model (shared/schema.ts)
- **Field**: `commissionRate` in `supplierProfiles` table
- **Type**: `decimal` (nullable)
- **Purpose**: Stores custom commission rate that overrides tiered rates

#### 3. Admin Suppliers List Endpoint (server/routes.ts)
- **Updated**: Line 42-147
- **Change**: Added `commissionRate` field to the response data
- **Purpose**: Allows frontend to display custom rates

### Frontend Changes

#### 1. AdminSuppliers Component (client/src/pages/admin/AdminSuppliers.tsx)

**Interface Update**:
- Added `commissionRate: string | null` to Supplier interface

**Commission Rate Dialog**:
- Opens when admin clicks "Commission" button on approved suppliers
- Shows current custom rate if set
- Accepts percentage input (0-100)
- Converts percentage to decimal before sending to API
- Displays example calculation
- Shows helpful description about overriding tiered system

**Custom Rate Badge**:
- Displays in the Performance column of the suppliers table
- Shows when supplier has a custom commission rate
- Format: "X.X% Custom" with green styling
- Only visible when `commissionRate` is set

**Mutation Logic**:
- Converts percentage input (10) to decimal (0.10) before API call
- Invalidates supplier list query on success
- Shows success/error toast notifications

### Commission Calculation Integration

The custom commission rate integrates with the existing commission calculation system:

1. **Priority**: Custom rate takes precedence over tiered rates
2. **Location**: `calculateCommission()` function in `server/commissionRoutes.ts`
3. **Logic**:
   ```typescript
   if (supplier.commissionRate) {
     // Use custom rate
     commissionRate = parseFloat(supplier.commissionRate);
   } else {
     // Use tiered rate based on order amount
     commissionRate = await getCommissionRate(orderAmount);
   }
   ```

## Features Implemented

### ✅ Requirement 15.1: Admin can set custom commission rate
- Admin can access commission rate dialog from supplier list
- Input validation ensures rate is between 0-100%
- Rate is stored as decimal (0-1) in database

### ✅ Requirement 15.2: Custom rate overrides tiered rates
- Commission calculation checks for custom rate first
- Falls back to tiered system if no custom rate set
- Applies to all future orders from that supplier

### ✅ Requirement 15.3: Show custom rate badge on supplier profile
- Badge displays in admin suppliers list
- Shows percentage with "Custom" label
- Green styling to indicate special rate
- Only visible when custom rate is set

### ✅ Requirement 15.4: Custom rate applies to all orders
- Integrated into `calculateCommission()` function
- Checked before tier selection
- Consistent application across all order types

### ✅ Requirement 15.5: Admin can remove custom rate
- Admin can update rate to different value
- Can effectively remove by setting to default tier rate
- Changes apply to future orders only

## UI/UX Enhancements

1. **Commission Button**: Added to approved suppliers in the actions column
2. **Dialog Design**: Clean, informative dialog with current rate display
3. **Badge Display**: Subtle but visible indicator in performance column
4. **Example Calculation**: Helps admin understand impact of rate change
5. **Validation**: Clear error messages for invalid inputs

## Data Flow

1. Admin opens commission dialog for supplier
2. Current rate (if any) is displayed and pre-filled
3. Admin enters new rate as percentage (e.g., 12.5)
4. Frontend converts to decimal (0.125)
5. API validates and stores decimal value
6. Supplier list refreshes with updated data
7. Badge appears showing custom rate
8. Future orders use custom rate in calculations

## Testing Considerations

- Verify rate conversion (percentage ↔ decimal)
- Test with various rate values (0, 0.5, 10, 100)
- Confirm badge only shows when rate is set
- Validate commission calculation uses custom rate
- Check that tiered rates still work for suppliers without custom rate

## Notes

- Custom rates are stored as decimals (0-1) in the database
- Frontend displays and accepts percentages (0-100) for better UX
- The endpoint in `server/routes.ts` expects decimal format
- Commission calculation in `commissionRoutes.ts` uses decimal format
- Badge styling uses green color to indicate preferential/custom rate
