# Requirements Document

## Introduction

This document defines the requirements for an enhanced commission payment system for a B2B marketplace platform. The system enables the platform admin to earn revenue through tiered commission rates on orders, while implementing a credit-based restriction mechanism that ensures suppliers pay their commission dues before continuing to use platform features. The system includes commission calculation, payment submission with proof, admin verification, and automatic account restrictions.

## Glossary

- **Platform**: The B2B marketplace system
- **Admin**: The platform owner/administrator who manages the marketplace
- **Supplier**: A vendor who sells products through the Platform
- **Buyer**: A customer who purchases products from Suppliers
- **Commission**: A percentage fee charged by the Admin on each order value
- **Commission Tier**: A pricing bracket that determines the commission rate based on order value
- **Commission Credit Limit**: The maximum amount of unpaid commission a Supplier can accumulate before account restrictions
- **Total Unpaid Commission**: The current sum of all unpaid commissions for a Supplier
- **Account Restriction**: A state where Supplier functionality is blocked due to exceeding the commission credit limit
- **Payment Submission**: A record of commission payment made by a Supplier with proof of payment
- **Payment Proof**: A screenshot or document uploaded by the Supplier showing evidence of commission payment
- **Order**: A confirmed purchase transaction between a Buyer and Supplier

## Requirements

### Requirement 1: Tiered Commission Rate System

**User Story:** As an Admin, I want to configure tiered commission rates based on order values, so that I can charge different commission percentages for different order sizes.

#### Acceptance Criteria

1. WHEN the Admin accesses the commission settings page, THE Platform SHALL display a list of all active commission tiers with their minimum amount, maximum amount, and commission rate
2. WHEN the Admin creates a new commission tier, THE Platform SHALL validate that the minimum amount is less than the maximum amount and that there are no overlapping tier ranges
3. WHEN the Admin updates a commission tier, THE Platform SHALL recalculate the commission rate for all future orders within that tier range
4. WHERE a commission tier has no maximum amount specified, THE Platform SHALL apply that tier to all orders above the minimum amount
5. WHEN an order is created, THE Platform SHALL automatically select the appropriate commission tier based on the order total amount and apply the corresponding commission rate

### Requirement 2: Automatic Commission Calculation

**User Story:** As a Supplier, I want commissions to be automatically calculated when an order is created, so that I know exactly how much I owe to the platform.

#### Acceptance Criteria

1. WHEN a Buyer accepts a quotation, THE Platform SHALL create an order and automatically calculate the commission based on the applicable tier rate
2. WHEN the commission is calculated, THE Platform SHALL store the order amount, commission rate, commission amount, and supplier net amount in the commissions table
3. WHEN the commission is created, THE Platform SHALL set the initial status to "unpaid" and calculate a due date based on platform payment terms
4. WHEN the commission is created, THE Platform SHALL increment the Supplier's total unpaid commission by the commission amount
5. WHEN the commission calculation is complete, THE Platform SHALL send a notification to the Supplier with commission details

### Requirement 3: Commission Credit Limit Management

**User Story:** As an Admin, I want to set commission credit limits for suppliers, so that I can control how much unpaid commission they can accumulate before restrictions apply.

#### Acceptance Criteria

1. WHEN the Admin creates or edits a Supplier profile, THE Platform SHALL allow the Admin to set a commission credit limit value
2. WHEN no custom limit is set for a Supplier, THE Platform SHALL apply a default commission credit limit of 10,000 rupees
3. WHEN a new commission is created, THE Platform SHALL compare the Supplier's total unpaid commission against their commission credit limit
4. IF the total unpaid commission exceeds the commission credit limit, THEN THE Platform SHALL automatically set the Supplier's account restriction status to true
5. WHEN the Supplier's account is restricted, THE Platform SHALL send an immediate notification to the Supplier with details about the outstanding amount and payment instructions

### Requirement 4: Supplier Account Restrictions

**User Story:** As an Admin, I want supplier accounts to be automatically restricted when they exceed their commission credit limit, so that they are incentivized to pay their dues promptly.

#### Acceptance Criteria

1. WHEN a Supplier's account is restricted, THE Platform SHALL block access to create new quotations for RFQs
2. WHEN a Supplier's account is restricted, THE Platform SHALL block access to respond to buyer inquiries
3. WHEN a Supplier's account is restricted, THE Platform SHALL block access to initiate or continue chat conversations with buyers
4. WHEN a Supplier's account is restricted, THE Platform SHALL display a prominent banner on all Supplier pages indicating the restriction reason and outstanding amount
5. WHEN a restricted Supplier attempts to access blocked functionality, THE Platform SHALL display a modal with payment instructions and a link to the commission payment page

### Requirement 5: Commission Payment Submission

**User Story:** As a Supplier, I want to submit commission payments with proof of payment, so that I can clear my outstanding dues and restore my account access.

#### Acceptance Criteria

1. WHEN a Supplier accesses the commission payment page, THE Platform SHALL display the total unpaid commission amount and a list of all unpaid commission records
2. WHEN the Supplier initiates a payment submission, THE Platform SHALL allow the Supplier to select one or more unpaid commissions to pay
3. WHEN the Supplier submits a payment, THE Platform SHALL require the Supplier to upload a payment proof file in image or PDF format
4. WHEN the Supplier submits a payment, THE Platform SHALL require the Supplier to enter a payment method and optional transaction reference number
5. WHEN the payment submission is created, THE Platform SHALL set the status to "pending" and send a notification to the Admin for verification

### Requirement 6: Admin Payment Verification

**User Story:** As an Admin, I want to review and verify supplier commission payments, so that I can confirm receipt of funds before updating commission status.

#### Acceptance Criteria

1. WHEN the Admin accesses the payment verification page, THE Platform SHALL display all pending payment submissions with Supplier details, amount, and payment proof
2. WHEN the Admin views a payment submission, THE Platform SHALL display the uploaded payment proof image or PDF in a preview modal
3. WHEN the Admin approves a payment submission, THE Platform SHALL update all associated commission records to "paid" status and record the payment date
4. WHEN the Admin approves a payment submission, THE Platform SHALL reduce the Supplier's total unpaid commission by the payment amount
5. IF the Supplier's total unpaid commission falls below the credit limit after payment approval, THEN THE Platform SHALL automatically remove the account restriction

### Requirement 7: Payment Rejection Handling

**User Story:** As an Admin, I want to reject invalid payment submissions with a reason, so that suppliers can resubmit with correct information.

#### Acceptance Criteria

1. WHEN the Admin rejects a payment submission, THE Platform SHALL require the Admin to provide a rejection reason
2. WHEN a payment submission is rejected, THE Platform SHALL update the submission status to "rejected" and store the rejection reason
3. WHEN a payment submission is rejected, THE Platform SHALL send a notification to the Supplier with the rejection reason
4. WHEN a payment submission is rejected, THE Platform SHALL not modify the commission status or total unpaid commission amount
5. WHEN a Supplier views a rejected payment submission, THE Platform SHALL display the rejection reason and allow the Supplier to create a new submission

### Requirement 8: Commission Dashboard for Suppliers

**User Story:** As a Supplier, I want to view my commission history and payment status, so that I can track my financial obligations to the platform.

#### Acceptance Criteria

1. WHEN a Supplier accesses the commission dashboard, THE Platform SHALL display the total unpaid commission, commission credit limit, and remaining credit
2. WHEN a Supplier accesses the commission dashboard, THE Platform SHALL display a list of all commissions with order details, amounts, status, and due dates
3. WHEN a Supplier accesses the commission dashboard, THE Platform SHALL provide filters for commission status, date range, and order number
4. WHEN a Supplier accesses the commission dashboard, THE Platform SHALL display a visual indicator showing the percentage of credit limit used
5. WHEN a Supplier's credit usage exceeds 80 percent, THE Platform SHALL display a warning message encouraging payment submission

### Requirement 9: Commission Analytics for Admin

**User Story:** As an Admin, I want to view commission analytics and reports, so that I can track platform revenue and supplier payment behavior.

#### Acceptance Criteria

1. WHEN the Admin accesses the commission analytics page, THE Platform SHALL display total commission revenue, pending commissions, and paid commissions
2. WHEN the Admin accesses the commission analytics page, THE Platform SHALL display a list of suppliers with outstanding commissions sorted by amount
3. WHEN the Admin accesses the commission analytics page, THE Platform SHALL display commission trends over time with monthly revenue charts
4. WHEN the Admin accesses the commission analytics page, THE Platform SHALL provide filters for date range, supplier, and commission status
5. WHEN the Admin accesses the commission analytics page, THE Platform SHALL allow export of commission data to CSV format for external reporting

### Requirement 10: Payment Reminder System

**User Story:** As an Admin, I want to send automated payment reminders to suppliers with overdue commissions, so that I can improve payment collection rates.

#### Acceptance Criteria

1. WHEN a commission due date passes without payment, THE Platform SHALL mark the commission status as "overdue"
2. WHEN a commission becomes overdue, THE Platform SHALL send an automated email reminder to the Supplier with payment details
3. WHEN a Supplier has overdue commissions for more than 7 days, THE Platform SHALL send a second reminder notification
4. WHEN a Supplier has overdue commissions for more than 14 days, THE Platform SHALL send a final warning notification indicating imminent account restriction
5. WHEN the Admin manually sends a payment reminder, THE Platform SHALL record the reminder timestamp in the Supplier profile

### Requirement 11: Commission Payment History

**User Story:** As a Supplier, I want to view my commission payment history, so that I can track all payments I have made to the platform.

#### Acceptance Criteria

1. WHEN a Supplier accesses the payment history page, THE Platform SHALL display all payment submissions with date, amount, status, and payment method
2. WHEN a Supplier views a payment submission, THE Platform SHALL display the list of commission records included in that payment
3. WHEN a Supplier views an approved payment, THE Platform SHALL display the verification date and admin name who approved it
4. WHEN a Supplier views a rejected payment, THE Platform SHALL display the rejection reason and date
5. WHEN a Supplier accesses the payment history page, THE Platform SHALL provide a download option for payment receipts in PDF format

### Requirement 12: Multi-Currency Commission Support

**User Story:** As an Admin, I want to support commission calculations in multiple currencies, so that international suppliers can pay in their local currency.

#### Acceptance Criteria

1. WHEN an order is created in a non-default currency, THE Platform SHALL calculate the commission in the order currency
2. WHEN displaying commission amounts to Suppliers, THE Platform SHALL show amounts in the Supplier's preferred currency
3. WHEN the Admin views commission analytics, THE Platform SHALL convert all amounts to the platform default currency for reporting
4. WHEN a Supplier submits a payment in a different currency, THE Platform SHALL record the original currency and amount
5. WHEN currency conversion is required, THE Platform SHALL use the exchange rate from the order creation date

### Requirement 13: Commission Dispute Resolution

**User Story:** As a Supplier, I want to dispute incorrect commission charges, so that I can resolve billing errors with the admin.

#### Acceptance Criteria

1. WHEN a Supplier views a commission record, THE Platform SHALL provide a "Dispute" button for commissions with status "unpaid" or "overdue"
2. WHEN a Supplier initiates a dispute, THE Platform SHALL require the Supplier to provide a dispute reason and supporting details
3. WHEN a dispute is created, THE Platform SHALL update the commission status to "disputed" and send a notification to the Admin
4. WHEN a commission is disputed, THE Platform SHALL exclude it from the total unpaid commission calculation until resolution
5. WHEN the Admin resolves a dispute, THE Platform SHALL update the commission status to either "unpaid" or "cancelled" based on the resolution outcome

### Requirement 14: Bulk Payment Processing

**User Story:** As an Admin, I want to approve multiple payment submissions at once, so that I can efficiently process payments during high-volume periods.

#### Acceptance Criteria

1. WHEN the Admin accesses the payment verification page, THE Platform SHALL provide checkboxes to select multiple pending payment submissions
2. WHEN the Admin selects multiple payments and clicks "Approve All", THE Platform SHALL verify all selected payments and update commission statuses
3. WHEN bulk approval is processed, THE Platform SHALL update each Supplier's total unpaid commission and restriction status
4. WHEN bulk approval is complete, THE Platform SHALL send individual notifications to each affected Supplier
5. IF any payment in the bulk selection fails verification, THEN THE Platform SHALL process the remaining payments and report the failed items to the Admin

### Requirement 15: Commission Rate Override

**User Story:** As an Admin, I want to set custom commission rates for specific suppliers, so that I can offer preferential rates to high-performing or strategic partners.

#### Acceptance Criteria

1. WHEN the Admin edits a Supplier profile, THE Platform SHALL allow the Admin to set a custom commission rate that overrides the tiered rates
2. WHEN a custom commission rate is set for a Supplier, THE Platform SHALL apply that rate to all future orders from that Supplier
3. WHEN a custom commission rate is set, THE Platform SHALL display a badge on the Supplier profile indicating the custom rate
4. WHEN an order is created for a Supplier with a custom rate, THE Platform SHALL use the custom rate instead of the tiered rate
5. WHEN the Admin removes a custom commission rate, THE Platform SHALL revert to using the tiered commission rates for future orders
