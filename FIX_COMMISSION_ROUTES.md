# Fix Commission Creation in Order Payment

## Issue
When an order is paid (from inquiry), the commission is created using old logic in `server/routes.ts` around line 3519. This old logic:
- Doesn't use the tiered commission system
- Doesn't update supplier unpaid totals
- Doesn't check credit limits
- Doesn't send proper notifications
- Creates commission with status 'pending' instead of 'unpaid'

## Solution
Replace the old commission creation logic with a call to `calculateCommission()` function.

## Location
File: `server/routes.ts`
Line: ~3519-3570
Endpoint: `POST /api/orders/:id/mark-paid`

## Current Code (TO REPLACE):
```typescript
// Calculate and create commission if supplier exists
if (order.supplierId) {
  console.log('Creating commission for supplier:', order.supplierId);

  // Get supplier profile to check for custom commission rate
  const [supplierProfile] = await db.select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, order.supplierId))
    .limit(1);

  // Use supplier's custom rate or default platform rate (10%)
  const commissionRate = supplierProfile?.commissionRate
    ? parseFloat(supplierProfile.commissionRate.toString())
    : 10.0;

  const orderAmount = parseFloat(order.totalAmount.toString());
  const commissionAmount = (orderAmount * commissionRate) / 100;
  const supplierAmount = orderAmount - commissionAmount;

  console.log('Commission calculation:', {
    orderAmount,
    commissionRate,
    commissionAmount,
    supplierAmount
  });

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

  console.log('Commission created successfully');

  // Notify supplier
  const supplier = await db.select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, order.supplierId))
    .limit(1);

  if (supplier.length > 0) {
    await createNotification({
      userId: supplier[0].userId,
      type: 'success',
      title: 'Payment Received',
      message: `Payment confirmed for order ${order.orderNumber}. Commission: ${commissionAmount.toFixed(2)}`,
      relatedId: order.id,
      relatedType: 'order'
    });
  }
}
```

## New Code (REPLACEMENT):
```typescript
// Calculate and create commission if supplier exists
if (order.supplierId) {
  console.log('Creating commission for supplier:', order.supplierId);
  
  try {
    const orderAmount = parseFloat(order.totalAmount.toString());
    
    // Use the centralized commission calculation function
    // This handles tiered rates, credit limits, notifications, etc.
    await calculateCommission(order.id, order.supplierId, orderAmount);
    
    console.log('✅ Commission created successfully using calculateCommission');
  } catch (commissionError) {
    console.error('⚠️ Failed to calculate commission:', commissionError);
    // Don't fail the payment if commission calculation fails
  }
}
```

## Benefits of New Code:
1. ✅ Uses tiered commission rates
2. ✅ Updates supplier totalUnpaidCommission
3. ✅ Checks credit limits and applies restrictions
4. ✅ Sends proper commission created notification
5. ✅ Creates commission with correct 'unpaid' status
6. ✅ Calculates due date (30 days from creation)
7. ✅ Handles errors gracefully

## Manual Fix Required
Please manually replace the code in `server/routes.ts` at the location specified above.

The `calculateCommission` function is already imported at the top of the file (line 13).
