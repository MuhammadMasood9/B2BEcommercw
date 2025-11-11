# Quotation Negotiation Feature - Requirements

## Overview
A comprehensive negotiation system for suppliers to manage and negotiate quotations with buyers, enabling back-and-forth price discussions and terms adjustments.

## User Stories

### Supplier Perspective
1. As a supplier, I want to view all my quotations with negotiation status so I can track active negotiations
2. As a supplier, I want to see the buyer's target price vs my quoted price to understand the gap
3. As a supplier, I want to send counter offers with adjusted pricing and terms
4. As a supplier, I want to see which quotations are pending buyer response
5. As a supplier, I want to track my negotiation success rate

### Buyer Perspective
1. As a buyer, I want to see all quotations I've received from suppliers
2. As a buyer, I want to accept, reject, or counter a quotation
3. As a buyer, I want to negotiate pricing and terms with suppliers
4. As a buyer, I want to compare multiple quotations side-by-side

## Features Implemented

### Supplier Negotiations Page (`/supplier/negotiations`)

#### Dashboard Stats
- **Active Negotiations**: Count of pending/sent quotations
- **Accepted**: Count of accepted quotations
- **Rejected**: Count of rejected quotations
- **Success Rate**: Percentage of accepted vs total quotations

#### Negotiation List
- Displays all quotations with negotiation details
- Shows buyer information (name, company)
- Displays buyer's target price vs supplier's quoted price
- Price difference calculation and visualization
- Status badges (pending, accepted, rejected, negotiating)
- Search functionality by buyer name, product, or quotation ID
- Filter by status (all, active, accepted, rejected)

#### Negotiation Details View
- Complete quotation information
- Buyer details and company
- Product/RFQ details
- Price comparison (target vs quoted)
- Pricing details (MOQ, price per unit, total price)
- Terms (lead time, payment terms, validity)
- Supplier's message/notes

#### Counter Offer Functionality
- Adjust price per unit
- Modify minimum order quantity
- Update lead time
- Change payment terms
- Extend validity period
- Add negotiation message to buyer
- Auto-calculate total price based on MOQ and unit price

## Technical Implementation

### Frontend Components
- `SupplierNegotiations.tsx` - Main negotiations page
- Integrated with existing quotation API endpoints
- Real-time price difference calculations
- Form validation for counter offers

### API Endpoints Used
- `GET /api/suppliers/quotations` - Fetch all supplier quotations
- `PUT /api/suppliers/quotations/:id` - Update RFQ quotation
- `PUT /api/suppliers/inquiry-quotations/:id` - Update inquiry quotation

### Data Structure
Quotations include:
- Quotation ID and type (RFQ or Inquiry)
- Buyer information (name, company)
- Product/RFQ details
- Pricing (target price, quoted price, MOQ, total)
- Terms (lead time, payment terms, validity)
- Status (pending, accepted, rejected)
- Messages and notes

## User Interface

### Color Coding
- **Blue**: Pending/Active negotiations
- **Green**: Accepted quotations
- **Red**: Rejected quotations
- **Yellow**: Awaiting response

### Status Icons
- Clock: Pending
- Check Circle: Accepted
- X Circle: Rejected
- Message Square: Negotiating

## Business Rules

1. **Counter Offers**: Can only be sent on pending/sent quotations
2. **Price Calculation**: Total price auto-calculates from unit price × MOQ
3. **Validity Period**: Must be a future date
4. **Price Difference**: Calculated as percentage difference from buyer's target
5. **Status Updates**: Automatically sync with quotation status changes

## Future Enhancements

### Phase 2 - Buyer Negotiation Interface
- Buyer negotiations page
- Accept/reject quotation functionality
- Buyer counter offer capability
- Side-by-side quotation comparison

### Phase 3 - Advanced Features
- Negotiation history/timeline
- Automated negotiation suggestions based on market data
- Bulk negotiation actions
- Negotiation templates
- Email notifications for counter offers
- Real-time chat integration
- Document attachments for negotiations

### Phase 4 - Analytics
- Negotiation performance metrics
- Average negotiation rounds
- Time to close analysis
- Price concession tracking
- Win/loss analysis by product category

## Success Metrics
- Negotiation completion rate
- Average time to close
- Price variance from initial quote
- Buyer satisfaction with negotiation process
- Supplier conversion rate improvement

## Notes
- The negotiations page provides a focused view of quotations requiring active negotiation
- Suppliers can manage all quotations from the main Quotations page
- The Negotiations page filters for active discussions and provides negotiation-specific tools
- Integration with existing quotation system ensures data consistency
