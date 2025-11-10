# Multivendor Marketplace Test Suite

This directory contains comprehensive tests for the multivendor marketplace functionality.

## Test Structure

### Unit Tests (`tests/unit/`)
Tests individual components and functions in isolation.

- **supplier-management.test.ts**: Tests supplier registration, profile management, verification, and status management
- **commission-calculation.test.ts**: Tests commission rate management, calculations, and payout logic

### Integration Tests (`tests/integration/`)
Tests interactions between multiple components and systems.

- **supplier-buyer-communication.test.ts**: Tests RFQ routing, inquiry management, quotation workflows, and end-to-end communication flows
- **admin-oversight.test.ts**: Tests admin supplier management, product approval workflows, verification levels, and platform oversight

### End-to-End Tests (`tests/e2e/`)
Tests complete user journeys from start to finish.

- **supplier-onboarding.test.ts**: Tests the complete supplier onboarding process from registration to first sale

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test tests/unit/supplier-management.test.ts
```

### Run specific test suite
```bash
npm test -- --grep "Supplier Management"
```

## Test Coverage

The test suite covers:

### Supplier Management (Requirements 1, 2, 11)
- ✅ Supplier registration with validation
- ✅ Profile creation and updates
- ✅ Store customization
- ✅ Verification status management
- ✅ Performance metrics tracking
- ✅ Status management (pending, approved, rejected, suspended)

### Admin Oversight (Requirement 7)
- ✅ Supplier approval/rejection workflows
- ✅ Verification level management (none, basic, business, premium)
- ✅ Product approval workflows
- ✅ Bulk operations
- ✅ Platform analytics and reporting
- ✅ Read-only oversight (no direct RFQ/quotation management)

### Supplier-Buyer Communication (Requirements 4, 9)
- ✅ Inquiry routing directly to suppliers
- ✅ RFQ routing to product suppliers
- ✅ Supplier quotation creation
- ✅ Quotation acceptance workflows
- ✅ End-to-end communication flows
- ✅ Admin oversight without direct management

### Commission System (Requirement 10)
- ✅ Commission rate management (default and custom)
- ✅ Commission calculations for various amounts
- ✅ Decimal amount handling
- ✅ Commission status management
- ✅ Payout calculations
- ✅ Rate validation (0% to 100%)

### Complete Onboarding Journey (All Requirements)
- ✅ Step 1: Supplier registration
- ✅ Step 2: Admin approval and verification
- ✅ Step 3: Store setup and customization
- ✅ Step 4: Product creation and approval
- ✅ Step 5: Receiving first inquiry
- ✅ Step 6: Creating first quotation
- ✅ Step 7: First order completion
- ✅ Step 8: Verification of operational status

## Test Database

Tests use the database connection specified in your `.env` file. For safety:

1. Use a separate test database if possible
2. Set `TEST_DATABASE_URL` in your `.env` file
3. Tests clean up after themselves but use caution with production data

## Writing New Tests

### Test File Template
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Clean up test data
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Test implementation
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices
1. Always clean up test data in `afterAll` hooks
2. Use descriptive test names that explain what is being tested
3. Test both success and failure cases
4. Keep tests focused on one thing
5. Use meaningful assertions with clear expectations
6. Avoid test interdependencies

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
  
- name: Generate coverage
  run: npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` or `TEST_DATABASE_URL` is set correctly
- Ensure database is accessible from test environment
- Check database permissions

### Test Timeouts
- Default timeout is 10 seconds
- Increase in `vitest.config.ts` if needed for slow operations

### Cleanup Issues
- Tests clean up their own data
- If tests fail mid-execution, manual cleanup may be needed
- Check for orphaned test data with email patterns like `*@example.com`

## Future Test Additions

Potential areas for additional testing:
- API endpoint tests with supertest
- Frontend component tests
- Performance and load testing
- Security and authentication tests
- File upload and image handling tests
- Real-time chat functionality tests
- Notification system tests
