# Implementation Plan

- [x] 1. Setup database schema





  - Create commission_tiers table with minAmount, maxAmount, commissionRate fields
  - Add commissionCreditLimit, totalUnpaidCommission, isRestricted fields to supplier_profiles
  - Update commissions table status to support 'payment_submitted' and 'overdue'
  - Create payment_submissions table if not exists
  - Add database indexes for performance
  - Seed default tiers: 0-10000 (5%), 10001-100000 (10%), 100001+ (15%)
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 2. Implement tiered commission calculation





  - Create selectCommissionTier function to find tier based on order amount
  - Update calculateCommission to check custom supplier rate first, then use tier
  - Auto-create commission on order acceptance with 'unpaid' status
  - Update supplier totalUnpaidCommission when commission created
  - Check credit limit and apply restriction if exceeded
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 3.3, 3.4_

- [x] 3. Build commission tier management (Admin)








  - Create API endpoints: GET/POST/PATCH/DELETE /api/admin/commission-tiers
  - Build AdminCommissionTiers page with tier list, create/edit forms
  - Validate no overlapping tier ranges
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Implement restriction system










  - Create restriction middleware to check isRestricted flag
  - Apply middleware to quotation, inquiry, and message routes
  - Return 403 with restriction details if blocked
  - Create GET /api/suppliers/restriction-status endpoint
  - _Requirements: 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Build supplier commission dashboard








  - Create SupplierCommissions page showing unpaid total, credit limit, usage percentage
  - Display commission list table with filters and pagination
  - Add CreditUsageBar component with color coding
  - Show warning when usage > 80%
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Create restriction UI components





  - Build RestrictionBanner component for supplier pages
  - Create restriction modal for blocked actions
  - Apply checks to quotation/inquiry/message creation
  - _Requirements: 4.4, 4.5_

- [x] 7. Implement payment submission





  - Create POST /api/suppliers/payments/submit endpoint with file upload
  - Build CommissionPaymentModal to select commissions and upload proof
  - Update commission status to 'payment_submitted'
  - Create PaymentSubmission record with status 'pending'
  - Send notification to admin
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Build admin payment verification





  - Create GET /api/admin/payments/pending endpoint
  - Create POST /api/admin/payments/:id/verify endpoint (approve)
  - Create POST /api/admin/payments/:id/reject endpoint with reason
  - Build AdminPaymentVerification page with proof preview
  - Update commissions to 'paid', reduce totalUnpaidCommission, remove restriction
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [x] 9. Add commission analytics (Admin)





  - Create GET /api/admin/commissions/analytics endpoint
  - Build AdminCommissionAnalytics page with revenue cards and charts
  - Show total/pending/paid/overdue commissions
  - Display top suppliers by commission
  - _Requirements: 9.1, 9.2, 9.3_




- [x] 10. Implement overdue tracking and reminders






  - Create daily job to mark overdue commissions
  - Send automated email reminders (day 0, 7, 14)
  - Create POST /api/admin/suppliers/:id/payment-reminder for manual reminders
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Add custom commission rates





  - Create PATCH /api/admin/suppliers/:id/commission-rate endpoint
  - Add commission rate field to supplier edit form
  - Show custom rate badge on supplier profile
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_



- [x] 12. Integrate notifications



  - Send notification when commission created
  - Send notification when account restricted
  - Send notification when payment submitted (to admin)
  - Send notification when payment approved/rejected (to supplier)
  - _Requirements: 2.5, 3.5, 5.5, 6.5, 7.3_
