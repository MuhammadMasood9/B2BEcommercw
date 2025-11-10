/**
 * Test setup file for Vitest
 * This file runs before all tests
 */

import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

// Global test utilities can be added here
