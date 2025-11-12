import { Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';
import { supplierProfiles } from '../../shared/schema.ts';
import { eq } from 'drizzle-orm';

export const checkSupplierRestriction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only check for suppliers
    if (!req.user || req.user.role !== 'supplier') {
      return next();
    }

    const supplierId = req.user.id;

    // Get supplier profile
    const [profile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, supplierId));

    // If no profile exists, allow (they haven't been restricted yet)
    if (!profile) {
      return next();
    }

    // Check if supplier is restricted
    if (profile.isRestricted) {
      return res.status(403).json({
        message: 'Your account has been restricted',
        reason: profile.restrictionReason || 'Account restricted by administrator',
        isRestricted: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking supplier restriction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware specifically for actions that should be blocked for restricted suppliers
export const requireUnrestrictedSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'supplier') {
      return res.status(401).json({ message: 'Supplier authentication required' });
    }

    const supplierId = req.user.id;

    const [profile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, supplierId));

    if (profile && profile.isRestricted) {
      return res.status(403).json({
        message: 'This action is not available for restricted accounts',
        reason: profile.restrictionReason || 'Account restricted by administrator',
        isRestricted: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking supplier restriction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};