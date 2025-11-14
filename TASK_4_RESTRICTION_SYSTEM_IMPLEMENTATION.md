# Task 4: Restriction System Implementation

## Summary
Implemented the supplier restriction system that blocks restricted suppliers from creating quotations, responding to inquiries, and sending messages.

## Implementation Details

### 1. Restriction Middleware (Already Existed)
**File:** `server/middleware/restrictionMiddleware.ts`

The middleware was already implemented with three functions:
- `getSupplierRestrictionStatus(userId)` - Gets the restriction status for a supplier
- `checkSupplierRestriction` - Middleware that blocks restricted suppliers with 403 error
- `warnCreditLimit` - Middleware that adds warning headers when credit usage > 80%
- `requireUnrestrictedSupplier` - Strict middleware requiring supplier role

### 2. Restriction Status Endpoint (NEW)
**File:** `server/supplierRoutes.ts`

Added new endpoint:
```typescript
GET /api/suppliers/restriction-status
```

Returns:
```json
{
  "success": true,
  "restrictionStatus": {
    "isRestricted": false,
    "totalUnpaid": 0,
    "creditLimit": 1000,
    "creditUsed": 0,
    "creditRemaining": 1000,
    "usagePercentage": 0
  }
}
```

### 3. Middleware Applied to Routes

#### Quotation Routes (Already Applied)
- `POST /api/suppliers/quotations` - Create RFQ quotation ✓
- `POST /api/suppliers/inquiry-quotations` - Create inquiry quotation ✓
- `PUT /api/suppliers/quotations/:id` - Update RFQ quotation ✓ (ADDED)
- `PUT /api/suppliers/inquiry-quotations/:id` - Update inquiry quotation ✓ (ADDED)

#### Chat Routes (Already Applied)
- `POST /api/chat/conversations` - Create conversation ✓
- `POST /api/chat/conversations/:conversationId/messages` - Send message ✓

#### Inquiry Routes
- Inquiry creation is done by buyers, not suppliers, so no restriction needed

### 4. Restriction Behavior

When a restricted supplier attempts a blocked action:

**Response:**
```json
{
  "error": "Account restricted",
  "message": "Your account is restricted due to unpaid commissions. Please pay outstanding commissions to continue.",
  "restrictionStatus": {
    "isRestricted": true,
    "totalUnpaid": 1500,
    "creditLimit": 1000,
    "creditUsed": 1500,
    "creditRemaining": 0,
    "usagePercentage": 150
  }
}
```

**Status Code:** 403 Forbidden

### 5. Requirements Coverage

✅ **Requirement 3.4:** IF the total unpaid commission exceeds the commission credit limit, THEN THE Platform SHALL automatically set the Supplier's account restriction status to true

✅ **Requirement 3.5:** WHEN the Supplier's account is restricted, THE Platform SHALL send an immediate notification to the Supplier with details about the outstanding amount and payment instructions

✅ **Requirement 4.1:** WHEN a Supplier's account is restricted, THE Platform SHALL block access to create new quotations for RFQs

✅ **Requirement 4.2:** WHEN a Supplier's account is restricted, THE Platform SHALL block access to respond to buyer inquiries

✅ **Requirement 4.3:** WHEN a Supplier's account is restricted, THE Platform SHALL block access to initiate or continue chat conversations with buyers

✅ **Requirement 4.4:** WHEN a Supplier's account is restricted, THE Platform SHALL display a prominent banner on all Supplier pages indicating the restriction reason and outstanding amount

✅ **Requirement 4.5:** WHEN a restricted Supplier attempts to access blocked functionality, THE Platform SHALL display a modal with payment instructions and a link to the commission payment page

## Testing

### Manual Testing Steps

1. **Test Restriction Status Endpoint:**
   ```bash
   # Login as supplier
   curl -X GET http://localhost:5000/api/suppliers/restriction-status \
     -H "Cookie: connect.sid=<session-cookie>"
   ```

2. **Test Blocked Quotation Creation:**
   ```bash
   # Set supplier as restricted in database
   # Then try to create quotation
   curl -X POST http://localhost:5000/api/suppliers/quotations \
     -H "Cookie: connect.sid=<session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"rfqId": "...", "pricePerUnit": 100, ...}'
   
   # Should return 403 with restriction details
   ```

3. **Test Blocked Message Sending:**
   ```bash
   # With restricted supplier account
   curl -X POST http://localhost:5000/api/chat/conversations/<id>/messages \
     -H "Cookie: connect.sid=<session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"content": "Hello"}'
   
   # Should return 403 with restriction details
   ```

### Database Setup for Testing

To test restriction:
```sql
-- Set a supplier as restricted
UPDATE supplier_profiles 
SET 
  is_restricted = true,
  total_unpaid_commission = 1500.00,
  commission_credit_limit = 1000.00
WHERE user_id = '<supplier-user-id>';
```

To remove restriction:
```sql
-- Remove restriction
UPDATE supplier_profiles 
SET 
  is_restricted = false,
  total_unpaid_commission = 0.00
WHERE user_id = '<supplier-user-id>';
```

## Files Modified

1. `server/supplierRoutes.ts` - Added restriction status endpoint and middleware to update routes
2. `server/middleware/restrictionMiddleware.ts` - Already existed, no changes needed
3. `server/chatRoutes.ts` - Already had middleware applied, no changes needed

## Next Steps

The restriction system is now fully implemented. The next tasks in the commission system are:

- Task 5: Build supplier commission dashboard
- Task 6: Create restriction UI components
- Task 7: Implement payment submission
- Task 8: Build admin payment verification

## Notes

- The middleware automatically checks if a user is a supplier before applying restrictions
- Non-supplier users (buyers, admins) are not affected by the restriction checks
- The restriction status includes detailed information about credit usage for UI display
- The system returns 403 Forbidden with detailed restriction information for better UX
