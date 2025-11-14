import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { supplierProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Restriction status interface
 */
export interface RestrictionStatus {
  isRestricted: boolean;
  totalUnpaid: number;
  creditLimit: number;
  creditUsed: number;
  creditRemaining: number;
  usagePercentage: number;
}

/**
 * Get supplier restriction status
 */
export async function getSupplierRestrictionStatus(userId: string): Promise<RestrictionStatus | null> {
  try {
    const [profile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return null;
    }

    const totalUnpaid = parseFloat(profile.totalUnpaidCommission || '0');
    const creditLimit = parseFloat(profile.commissionCreditLimit || '1000');
    const creditUsed = totalUnpaid;
    const creditRemaining = Math.max(0, creditLimit - totalUnpaid);
    const usagePercentage = creditLimit > 0 ? (totalUnpaid / creditLimit) * 100 : 0;

    return {
      isRestricted: profile.isRestricted || false,
      totalUnpaid,
      creditLimit,
      creditUsed,
      creditRemaining,
      usagePercentage
    };
  } catch (error) {
    console.error('Error getting restriction status:', error);
    return null;
  }
}

/**
 * Middleware to check if supplier account is restricted
 * Blocks restricted suppliers from performing certain actions
 */
export async function checkSupplierRestriction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only check for suppliers
    if (!req.user || req.user.role !== 'supplier') {
      return next();
    }

    const status = await getSupplierRestrictionStatus(req.user.id);

    if (!status) {
      return res.status(404).json({
        error: 'Supplier profile not found'
      });
    }

    // Check if restricted
    if (status.isRestricted) {
      return res.status(403).json({
        error: 'Account restricted',
        message: 'Your account is restricted due to unpaid commissions. Please pay outstanding commissions to continue.',
        restrictionStatus: status
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
    if (!req.user || req.user.role !== 'supplier') {
      return next();
    }

    const status = await getSupplierRestrictionStatus(req.user.id);

    if (!status) {
      return next();
    }

    // Warn if more than 80% credit used
    if (status.usagePercentage >= 80 && !status.isRestricted) {
      res.setHeader('X-Credit-Warning', 'true');
      res.setHeader('X-Credit-Usage', status.usagePercentage.toFixed(2));
      res.setHeader('X-Available-Credit', status.creditRemaining.toFixed(2));
    }

    next();
  } catch (error) {
    console.error('Credit warning check error:', error);
    // Don't fail the request, just continue
    next();
  }
}

/**
 * Middleware specifically for actions that should be blocked for restricted suppliers
 * More strict than checkSupplierRestriction - requires supplier role
 */
export async function requireUnrestrictedSupplier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || req.user.role !== 'supplier') {
      return res.status(401).json({
        error: 'Supplier authentication required'
      });
    }

    const status = await getSupplierRestrictionStatus(req.user.id);

    if (!status) {
      return res.status(404).json({
        error: 'Supplier profile not found'
      });
    }

    if (status.isRestricted) {
      return res.status(403).json({
        error: 'Account restricted',
        message: 'This action is not available for restricted accounts. Please pay outstanding commissions to continue.',
        restrictionStatus: status
      });
    }

    next();
  } catch (error) {
    console.error('Error checking supplier restriction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
