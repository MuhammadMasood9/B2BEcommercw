import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { supplierProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware to check if supplier account is restricted due to unpaid commissions
 * Blocks restricted suppliers from performing certain actions
 */
export async function checkSupplierRestriction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only check for suppliers
    if (req.user?.role !== 'supplier') {
      return next();
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ 
        error: 'Supplier profile not found' 
      });
    }

    const supplier = supplierProfile[0];

    // Check if restricted
    if (supplier.isRestricted) {
      return res.status(403).json({
        error: 'Account restricted',
        message: 'Your account is restricted due to unpaid commissions. Please pay outstanding commissions to continue.',
        details: {
          totalUnpaid: parseFloat(supplier.totalUnpaidCommission || '0'),
          creditLimit: parseFloat(supplier.commissionCreditLimit || '1000'),
          isRestricted: true
        }
      });
    }

    // Not restricted, continue
    next();
  } catch (error) {
    console.error('Restriction check error:', error);
    res.status(500).json({ error: 'Failed to check account status' });
  }
}

/**
 * Middleware to warn suppliers approaching their credit limit
 * Adds warning to response headers but doesn't block the request
 */
export async function warnCreditLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only check for suppliers
    if (req.user?.role !== 'supplier') {
      return next();
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return next();
    }

    const supplier = supplierProfile[0];
    const totalUnpaid = parseFloat(supplier.totalUnpaidCommission || '0');
    const creditLimit = parseFloat(supplier.commissionCreditLimit || '1000');
    const availableCredit = creditLimit - totalUnpaid;

    // Warn if less than 20% credit remaining
    if (availableCredit < creditLimit * 0.2 && availableCredit > 0) {
      res.setHeader('X-Credit-Warning', 'true');
      res.setHeader('X-Available-Credit', availableCredit.toString());
    }

    next();
  } catch (error) {
    console.error('Credit warning check error:', error);
    // Don't fail the request, just continue
    next();
  }
}
