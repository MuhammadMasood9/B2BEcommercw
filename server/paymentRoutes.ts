import express from 'express';
import { db } from './db.ts';
import {
  commissions,
  paymentSubmissions,
  supplierProfiles,
  users
} from '../shared/schema.ts';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { authMiddleware } from './auth.ts';

// Helper middleware for role checking
const requireAuth = authMiddleware;
const requireRole = (role: string) => (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

const router = express.Router();

// Supplier routes
router.get('/supplier/commissions', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const supplierId = req.user!.id;

    const supplierCommissions = await db
      .select()
      .from(commissions)
      .where(and(
        eq(commissions.supplierId, supplierId),
        eq(commissions.status, 'pending')
      ))
      .orderBy(commissions.dueDate);

    res.json(supplierCommissions);
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ message: 'Failed to fetch commissions' });
  }
});

router.get('/supplier/credit-status', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const supplierId = req.user!.id;

    const [profile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, supplierId));

    if (!profile) {
      return res.status(404).json({ message: 'Supplier profile not found' });
    }

    // Calculate total outstanding commissions
    const [outstandingResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${commissions.commissionAmount} AS DECIMAL)), 0)`
      })
      .from(commissions)
      .where(and(
        eq(commissions.supplierId, supplierId),
        eq(commissions.status, 'pending')
      ));

    const totalOutstanding = outstandingResult?.total || 0;

    res.json({
      currentBalance: 0, // Not used in current schema
      creditLimit: parseFloat(profile.commissionCreditLimit || '10000'),
      totalOutstanding,
      isRestricted: profile.isRestricted || false,
      restrictionReason: null // Not used in current schema
    });
  } catch (error) {
    console.error('Error fetching credit status:', error);
    res.status(500).json({ message: 'Failed to fetch credit status' });
  }
});

router.post('/supplier/submit-payment', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const supplierId = req.user!.id;
    const { amount, commissionIds, paymentMethod } = req.body;

    if (!amount || !commissionIds || commissionIds.length === 0) {
      return res.status(400).json({ message: 'Amount and commission IDs are required' });
    }

    // Verify commissions belong to supplier and calculate total
    const selectedCommissions = await db
      .select()
      .from(commissions)
      .where(and(
        eq(commissions.supplierId, supplierId),
        inArray(commissions.id, commissionIds),
        eq(commissions.status, 'pending')
      ));

    if (selectedCommissions.length !== commissionIds.length) {
      return res.status(400).json({ message: 'Invalid commission selection' });
    }

    const totalCommissionAmount = selectedCommissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

    if (Math.abs(amount - totalCommissionAmount) > 0.01) {
      return res.status(400).json({ message: 'Payment amount does not match selected commissions' });
    }

    // Create payment submission
    const [submission] = await db
      .insert(paymentSubmissions)
      .values({
        supplierId,
        amount,
        commissionIds,
        paymentMethod: paymentMethod || 'bank_transfer',
        status: 'pending',
        submittedAt: new Date()
      })
      .returning();

    res.json({ message: 'Payment submitted successfully', submissionId: submission.id });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Failed to submit payment' });
  }
});

// Admin routes
router.get('/admin/payment-submissions', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    const baseQuery = db
      .select({
        id: paymentSubmissions.id,
        supplierId: paymentSubmissions.supplierId,
        supplierName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        amount: paymentSubmissions.amount,
        commissionIds: paymentSubmissions.commissionIds,
        paymentMethod: paymentSubmissions.paymentMethod,
        status: paymentSubmissions.status,
        submittedAt: paymentSubmissions.submittedAt,
        verifiedAt: paymentSubmissions.verifiedAt,
        verifiedBy: paymentSubmissions.verifiedBy,
        rejectionReason: paymentSubmissions.rejectionReason
      })
      .from(paymentSubmissions)
      .leftJoin(users, eq(users.id, paymentSubmissions.supplierId));

    const query = status && status !== 'all'
      ? baseQuery.where(eq(paymentSubmissions.status, status as string))
      : baseQuery;

    const submissions = await query.orderBy(paymentSubmissions.submittedAt);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching payment submissions:', error);
    res.status(500).json({ message: 'Failed to fetch payment submissions' });
  }
});

router.post('/admin/commissions/details', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { commissionIds } = req.body;

    const commissionDetails = await db
      .select()
      .from(commissions)
      .where(inArray(commissions.id, commissionIds));

    res.json(commissionDetails);
  } catch (error) {
    console.error('Error fetching commission details:', error);
    res.status(500).json({ message: 'Failed to fetch commission details' });
  }
});

router.post('/admin/payment-submissions/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const submissionId = req.params.id;
    const adminId = req.user!.id;

    // Get submission details
    const [submission] = await db
      .select()
      .from(paymentSubmissions)
      .where(eq(paymentSubmissions.id, submissionId));

    if (!submission) {
      return res.status(404).json({ message: 'Payment submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Payment submission already processed' });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update payment submission
      await tx
        .update(paymentSubmissions)
        .set({
          status: 'approved',
          verifiedAt: new Date(),
          verifiedBy: adminId
        })
        .where(eq(paymentSubmissions.id, submissionId));

      // Mark commissions as paid
      await tx
        .update(commissions)
        .set({
          status: 'paid',
          paymentDate: new Date()
        })
        .where(inArray(commissions.id, submission.commissionIds as string[]));

      // Update supplier last payment date
      await tx
        .update(supplierProfiles)
        .set({
          lastPaymentDate: new Date()
        })
        .where(eq(supplierProfiles.userId, submission.supplierId));
    });

    res.json({ message: 'Payment approved successfully' });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ message: 'Failed to approve payment' });
  }
});

router.post('/admin/payment-submissions/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const submissionId = req.params.id;
    const adminId = req.user!.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const [submission] = await db
      .select()
      .from(paymentSubmissions)
      .where(eq(paymentSubmissions.id, submissionId));

    if (!submission) {
      return res.status(404).json({ message: 'Payment submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Payment submission already processed' });
    }

    await db
      .update(paymentSubmissions)
      .set({
        status: 'rejected',
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: reason
      })
      .where(eq(paymentSubmissions.id, submissionId));

    res.json({ message: 'Payment rejected successfully' });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ message: 'Failed to reject payment' });
  }
});

// Credit management routes
router.get('/admin/suppliers/credit-status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const suppliersWithCredit = await db
      .select({
        id: users.id,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        email: users.email,
        creditLimit: supplierProfiles.commissionCreditLimit,
        isRestricted: supplierProfiles.isRestricted,
        lastPaymentDate: supplierProfiles.lastPaymentDate,
        registeredAt: users.createdAt
      })
      .from(users)
      .leftJoin(supplierProfiles, eq(supplierProfiles.userId, users.id))
      .where(eq(users.role, 'supplier'));

    // Calculate outstanding amounts for each supplier
    const suppliersWithOutstanding = await Promise.all(
      suppliersWithCredit.map(async (supplier) => {
        const [outstandingResult] = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${commissions.commissionAmount} AS DECIMAL)), 0)`
          })
          .from(commissions)
          .where(and(
            eq(commissions.supplierId, supplier.id),
            eq(commissions.status, 'pending')
          ));

        return {
          ...supplier,
          currentBalance: 0, // Not used in current schema
          creditLimit: parseFloat(supplier.creditLimit || '10000'),
          totalOutstanding: outstandingResult?.total || 0,
          isRestricted: supplier.isRestricted || false,
          lastPayment: supplier.lastPaymentDate
        };
      })
    );

    res.json(suppliersWithOutstanding);
  } catch (error) {
    console.error('Error fetching suppliers credit status:', error);
    res.status(500).json({ message: 'Failed to fetch suppliers credit status' });
  }
});

router.put('/admin/suppliers/:id/credit-limit', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { creditLimit } = req.body;

    if (creditLimit < 0) {
      return res.status(400).json({ message: 'Credit limit cannot be negative' });
    }

    // Ensure supplier profile exists
    const [existingProfile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, supplierId));

    if (!existingProfile) {
      return res.status(404).json({ message: 'Supplier profile not found' });
    } else {
      await db
        .update(supplierProfiles)
        .set({ commissionCreditLimit: creditLimit.toString() })
        .where(eq(supplierProfiles.userId, supplierId));
    }

    res.json({ message: 'Credit limit updated successfully' });
  } catch (error) {
    console.error('Error updating credit limit:', error);
    res.status(500).json({ message: 'Failed to update credit limit' });
  }
});

router.put('/admin/suppliers/:id/restriction', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { isRestricted, restrictionReason } = req.body;

    // Ensure supplier profile exists
    const [existingProfile] = await db
      .select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, supplierId));

    if (!existingProfile) {
      return res.status(404).json({ message: 'Supplier profile not found' });
    } else {
      await db
        .update(supplierProfiles)
        .set({
          isRestricted
        })
        .where(eq(supplierProfiles.userId, supplierId));
    }

    res.json({ message: `Supplier ${isRestricted ? 'restricted' : 'unrestricted'} successfully` });
  } catch (error) {
    console.error('Error updating restriction:', error);
    res.status(500).json({ message: 'Failed to update restriction' });
  }
});

export default router;