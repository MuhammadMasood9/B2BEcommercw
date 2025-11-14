/**
 * Manual test script for restriction system
 * Run with: node test-restriction-system.js
 */

import fs from 'fs';

console.log('=== Testing Restriction System ===\n');

// Test 1: Middleware exists
console.log('Test 1: Checking middleware file exists...');
try {
  const middlewarePath = './server/middleware/restrictionMiddleware.ts';
  if (fs.existsSync(middlewarePath)) {
    console.log('✓ Middleware file exists');
  } else {
    console.log('✗ Middleware file not found');
  }
} catch (error) {
  console.log('✗ Error checking middleware file:', error.message);
}

// Test 2: Check imports in supplierRoutes
console.log('\nTest 2: Checking supplierRoutes imports...');
try {
  const supplierRoutesContent = fs.readFileSync('./server/supplierRoutes.ts', 'utf8');
  
  if (supplierRoutesContent.includes('checkSupplierRestriction')) {
    console.log('✓ checkSupplierRestriction imported');
  } else {
    console.log('✗ checkSupplierRestriction not imported');
  }
  
  if (supplierRoutesContent.includes('requireUnrestrictedSupplier')) {
    console.log('✓ requireUnrestrictedSupplier imported');
  } else {
    console.log('✗ requireUnrestrictedSupplier not imported');
  }
  
  if (supplierRoutesContent.includes('/restriction-status')) {
    console.log('✓ Restriction status endpoint exists');
  } else {
    console.log('✗ Restriction status endpoint not found');
  }
} catch (error) {
  console.log('✗ Error checking supplierRoutes:', error.message);
}

// Test 3: Check chatRoutes middleware application
console.log('\nTest 3: Checking chatRoutes middleware...');
try {
  const chatRoutesContent = fs.readFileSync('./server/chatRoutes.ts', 'utf8');
  
  if (chatRoutesContent.includes('checkSupplierRestriction')) {
    console.log('✓ checkSupplierRestriction imported in chatRoutes');
  } else {
    console.log('✗ checkSupplierRestriction not imported in chatRoutes');
  }
  
  // Check if middleware is applied to message route
  const messageRouteMatch = chatRoutesContent.match(/router\.post\('\/conversations\/:conversationId\/messages',\s*authMiddleware,\s*checkSupplierRestriction/);
  if (messageRouteMatch) {
    console.log('✓ Restriction middleware applied to message route');
  } else {
    console.log('✗ Restriction middleware not applied to message route');
  }
  
  // Check if middleware is applied to conversation creation
  const conversationRouteMatch = chatRoutesContent.match(/router\.post\('\/conversations',\s*authMiddleware,\s*checkSupplierRestriction/);
  if (conversationRouteMatch) {
    console.log('✓ Restriction middleware applied to conversation creation');
  } else {
    console.log('✗ Restriction middleware not applied to conversation creation');
  }
} catch (error) {
  console.log('✗ Error checking chatRoutes:', error.message);
}

// Test 4: Check quotation routes have middleware
console.log('\nTest 4: Checking quotation routes middleware...');
try {
  const supplierRoutesContent = fs.readFileSync('./server/supplierRoutes.ts', 'utf8');
  
  // Check quotation creation routes
  const quotationRouteMatch = supplierRoutesContent.match(/router\.post\('\/quotations',\s*authMiddleware,\s*checkSupplierRestriction/);
  if (quotationRouteMatch) {
    console.log('✓ Restriction middleware applied to quotation creation');
  } else {
    console.log('✗ Restriction middleware not applied to quotation creation');
  }
  
  const inquiryQuotationRouteMatch = supplierRoutesContent.match(/router\.post\('\/inquiry-quotations',\s*authMiddleware,\s*checkSupplierRestriction/);
  if (inquiryQuotationRouteMatch) {
    console.log('✓ Restriction middleware applied to inquiry quotation creation');
  } else {
    console.log('✗ Restriction middleware not applied to inquiry quotation creation');
  }
} catch (error) {
  console.log('✗ Error checking quotation routes:', error.message);
}

// Test 5: Check middleware functions
console.log('\nTest 5: Checking middleware functions...');
try {
  const middlewareContent = fs.readFileSync('./server/middleware/restrictionMiddleware.ts', 'utf8');
  
  if (middlewareContent.includes('export async function getSupplierRestrictionStatus')) {
    console.log('✓ getSupplierRestrictionStatus function exists');
  } else {
    console.log('✗ getSupplierRestrictionStatus function not found');
  }
  
  if (middlewareContent.includes('export async function checkSupplierRestriction')) {
    console.log('✓ checkSupplierRestriction function exists');
  } else {
    console.log('✗ checkSupplierRestriction function not found');
  }
  
  if (middlewareContent.includes('export async function requireUnrestrictedSupplier')) {
    console.log('✓ requireUnrestrictedSupplier function exists');
  } else {
    console.log('✗ requireUnrestrictedSupplier function not found');
  }
  
  if (middlewareContent.includes('export async function warnCreditLimit')) {
    console.log('✓ warnCreditLimit function exists');
  } else {
    console.log('✗ warnCreditLimit function not found');
  }
  
  // Check for 403 status code in restriction response
  if (middlewareContent.includes('res.status(403)')) {
    console.log('✓ Returns 403 status for restricted accounts');
  } else {
    console.log('✗ Does not return 403 status');
  }
  
  // Check for restriction details in response
  if (middlewareContent.includes('restrictionStatus')) {
    console.log('✓ Returns restriction details in response');
  } else {
    console.log('✗ Does not return restriction details');
  }
} catch (error) {
  console.log('✗ Error checking middleware functions:', error.message);
}

console.log('\n=== Test Summary ===');
console.log('All checks completed. Review results above.');
console.log('\nTo test the API endpoints:');
console.log('1. Start the server: npm run dev');
console.log('2. Login as a supplier');
console.log('3. GET /api/suppliers/restriction-status');
console.log('4. Try creating a quotation/message when restricted');
