import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { supplierProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware to check if supplier is restricted due to unpaid commissions
 * Blocks access to key supplier functionalities if restricted
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
    const supplier = await db.select({
      id: supplierProfiles.id,
      isRestricted: supplierProfiles.isRestricted,
      totalUnpaidCommission: supplierProfiles.totalUnpaidCommission,
      commissionCreditLimit: supplierProfiles.commissionCreditLimit
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.userId, req.user.id))
    .limit(1);

    if (supplier.length === 0) {
      return res.status(404).json({ 
        error: 'Supplier profile not found',
        restricted: false
      });
    }

    const supplierData = supplier[0];

    // Check if supplier is restricted
    if (supplierData.isRestricted) {
      return res.status(403).json({
        error: 'Account restricted due to unpaid commissions',
        restricted: true,
        message: 'Your account has been restricted because your unpaid commission balance exceeds the credit limit. Please submit payment to restore access.',
        details: {
          totalUnpaid: parseFloat(supplierData.totalUnpaidCommission || '0'),
          creditLimit: parseFloat(supplierData.commissionCreditLimit || '10000'),
          amountOverdue: parseFloat(supplierData.totalUnpaidCommission || '0') - parseFloat(supplierData.commissionCreditLimit || '10000')
        }
      });
    }

    // Supplier is not restricted, continue
    next();
  } catch (error) {
    console.error('Supplier restriction check error:', error);
    // Don't block on error, just log it
    next();
  }
}

/**
 * Middleware to add restriction status to response (non-blocking)
 * Adds restriction info to req object for use in routes
 */
export async function addRestrictionStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user?.role === 'supplier') {
      const supplier = await db.select({
        isRestricted: supplierProfiles.isRestricted,
        totalUnpaidCommission: supplierProfiles.totalUnpaidCommission,
        commissionCreditLimit: supplierProfiles.commissionCreditLimit
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

      if (supplier.length > 0) {
        (req as any).supplierRestriction = {
          isRestricted: supplier[0].isRestricted || false,
          totalUnpaid: parseFloat(supplier[0].totalUnpaidCommission || '0'),
          creditLimit: parseFloat(supplier[0].commissionCreditLimit || '10000')
        };
      }
    }
    next();
  } catch (error) {
    console.error('Add restriction status error:', error);
    next();
  }
}
