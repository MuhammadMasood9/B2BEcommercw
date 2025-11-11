# Commission Payout Workflow - Quick Reference

## Supplier Workflow

### Step 1: Check Available Balance
- Go to **Supplier Portal > Payouts**
- View "Available Balance" card
- This shows total from completed orders with paid commissions

### Step 2: Request Payout
- Click "Request Payout" button
- Select payout method:
  - **Bank Transfer**: Direct deposit to registered bank account
  - **PayPal**: Transfer to PayPal account email
- Click "Request Payout"
- Request is submitted with status "pending"

### Step 3: Track Request
- View payout history in the same page
- Check status:
  - **Pending**: Awaiting admin review
  - **Processing**: Admin is processing the transfer
  - **Completed**: Funds transferred successfully
  - **Failed**: Request rejected or transfer failed
- Receive notifications on status changes

---

## Admin Workflow

### Step 1: Review Requests
- Go to **Admin > Payouts**
- View pending payout requests
- Review supplier details:
  - Supplier name and store
  - Email and phone
  - Payout amount and method
  - Request date

### Step 2: Process Payout
- Click "Process" on a pending request
- Optionally add transaction ID
- Status changes to "processing"

### Step 3: Transfer Funds
**Outside the system:**
- For Bank Transfer: Use supplier's bank account details
- For PayPal: Transfer to supplier's PayPal email
- Note the transaction ID from your payment system

### Step 4: Complete Payout
- Click "Complete" on the processing payout
- Enter transaction ID (required)
- Click "Complete Payout"
- Status changes to "completed"
- Supplier receives notification

### Alternative: Reject/Fail Payout
- Click "Reject" (for pending) or "Mark Failed" (for processing)
- Enter reason for failure
- Click "Mark as Failed"
- Supplier receives notification with reason

---

## Key Points

### Amounts Explained
- **Gross Amount**: Total order value
- **Commission Deducted**: Platform's commission (default 10%)
- **Net Amount**: What supplier receives (Gross - Commission)

### Processing Time
- Standard: 3-5 business days
- Depends on payment method and bank processing times

### Transaction IDs
- Required when completing payouts
- Used for tracking and dispute resolution
- Keep records for audit purposes

### Status Meanings
- **Pending**: New request, awaiting admin action
- **Processing**: Admin initiated transfer, funds in transit
- **Completed**: Transfer successful, supplier received funds
- **Failed**: Request rejected or transfer unsuccessful
