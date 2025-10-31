import { Router } from 'express';
import { db } from './db';
import { supplierProfiles, users, notifications, activity_logs } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, supplierMiddleware, adminMiddleware } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

const router = Router();

// Configure multer for verification document uploads
const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'verification-docs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `verification-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const verificationUpload = multer({
  storage: verificationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and image files are allowed.'));
    }
  }
});

// Verification level configuration
const VERIFICATION_LEVELS = {
  none: {
    name: 'None',
    description: 'No verification',
    requirements: [],
    benefits: []
  },
  basic: {
    name: 'Basic Verification',
    description: 'Basic identity and business verification',
    requirements: [
      'Business License',
      'Identity Document',
      'Contact Information Verification'
    ],
    benefits: [
      'Basic verification badge',
      'Increased buyer trust',
      'Access to basic features'
    ]
  },
  business: {
    name: 'Business Verification',
    description: 'Comprehensive business verification',
    requirements: [
      'Business License',
      'Tax Registration Certificate',
      'Identity Document',
      'Bank Account Verification',
      'Business Address Verification'
    ],
    benefits: [
      'Business verification badge',
      'Higher search ranking',
      'Access to premium features',
      'Reduced commission rates'
    ]
  },
  premium: {
    name: 'Premium Verification',
    description: 'Premium verification with enhanced credibility',
    requirements: [
      'All Business Verification requirements',
      'Financial Statements',
      'Quality Certifications',
      'Export/Import License',
      'Third-party Audit Report'
    ],
    benefits: [
      'Premium verification badge',
      'Priority customer support',
      'Featured listing opportunities',
      'Lowest commission rates',
      'Advanced analytics'
    ]
  },
  trade_assurance: {
    name: 'Trade Assurance',
    description: 'Highest level verification with trade protection',
    requirements: [
      'All Premium Verification requirements',
      'Trade Assurance Agreement',
      'Insurance Coverage',
      'Escrow Account Setup',
      'Quality Guarantee Bond'
    ],
    benefits: [
      'Trade Assurance badge',
      'Order protection guarantee',
      'Priority dispute resolution',
      'Exclusive marketing opportunities',
      'Dedicated account manager'
    ]
  }
};

// Validation schemas
const verificationApplicationSchema = z.object({
  level: z.enum(['basic', 'business', 'premium', 'trade_assurance']),
  documents: z.record(z.string()).optional(),
  additionalInfo: z.string().optional(),
});

// Helper function to get supplier profile by user ID
async function getSupplierProfile(userId: string) {
  const supplierResult = await db.select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.userId, userId))
    .limit(1);
  
  return supplierResult.length > 0 ? supplierResult[0] : null;
}

// ==================== SUPPLIER VERIFICATION ENDPOINTS ====================

// GET /api/verification/levels - Get available verification levels and requirements
router.get('/levels', async (req, res) => {
  try {
    res.json({
      success: true,
      levels: VERIFICATION_LEVELS
    });
  } catch (error: any) {
    console.error('Get verification levels error:', error);
    res.status(500).json({ error: 'Failed to get verification levels' });
  }
});

// GET /api/verification/status - Get current verification status for supplier
router.get('/status', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }
    
    res.json({
      success: true,
      verification: {
        level: supplier.verificationLevel,
        isVerified: supplier.isVerified,
        verifiedAt: supplier.verifiedAt,
        documents: supplier.verificationDocs,
        availableLevels: VERIFICATION_LEVELS,
        currentLevel: VERIFICATION_LEVELS[supplier.verificationLevel as keyof typeof VERIFICATION_LEVELS] || VERIFICATION_LEVELS.none
      }
    });
    
  } catch (error: any) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// POST /api/verification/apply - Apply for verification level
router.post('/apply', supplierMiddleware, verificationUpload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'financialStatements', maxCount: 3 },
  { name: 'qualityCertifications', maxCount: 5 },
  { name: 'exportLicense', maxCount: 1 },
  { name: 'auditReport', maxCount: 1 },
  { name: 'insuranceCertificate', maxCount: 1 },
  { name: 'additionalDocs', maxCount: 10 }
]), async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Validate input
    const validationResult = verificationApplicationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }
    
    const { level, additionalInfo } = validationResult.data;
    
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }
    
    // Check if supplier is approved
    if (supplier.status !== 'approved') {
      return res.status(403).json({ error: 'Supplier must be approved before applying for verification' });
    }
    
    // Check if already at or above requested level
    const levelHierarchy = ['none', 'basic', 'business', 'premium', 'trade_assurance'];
    const currentLevelIndex = levelHierarchy.indexOf(supplier.verificationLevel || 'none');
    const requestedLevelIndex = levelHierarchy.indexOf(level);
    
    if (currentLevelIndex >= requestedLevelIndex) {
      return res.status(400).json({ error: 'Already at or above requested verification level' });
    }
    
    // Process uploaded documents
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const verificationDocs: any = supplier.verificationDocs || {};
    
    // Update verification documents
    Object.keys(files).forEach(fieldName => {
      if (files[fieldName] && files[fieldName].length > 0) {
        if (fieldName === 'additionalDocs') {
          verificationDocs[fieldName] = files[fieldName].map(file => 
            `/uploads/verification-docs/${file.filename}`
          );
        } else {
          verificationDocs[fieldName] = `/uploads/verification-docs/${files[fieldName][0].filename}`;
        }
      }
    });
    
    // Add application metadata
    verificationDocs.applicationInfo = {
      requestedLevel: level,
      appliedAt: new Date().toISOString(),
      additionalInfo: additionalInfo || null,
      status: 'pending_review'
    };
    
    // Update supplier profile
    await db.update(supplierProfiles)
      .set({
        verificationDocs,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));
    
    // Create notification for admins
    const adminUsers = await db.select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: 'info',
        title: 'New Verification Application',
        message: `${supplier.businessName} has applied for ${VERIFICATION_LEVELS[level].name}`,
        relatedId: supplier.id,
        relatedType: 'verification_application'
      });
    }
    
    res.json({
      success: true,
      message: `Verification application for ${VERIFICATION_LEVELS[level].name} submitted successfully`,
      application: {
        level,
        status: 'pending_review',
        appliedAt: new Date(),
        documents: Object.keys(verificationDocs).filter(key => key !== 'applicationInfo')
      }
    });
    
  } catch (error: any) {
    console.error('Verification application error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      Object.values(files).flat().forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }
    
    res.status(500).json({ error: 'Verification application failed' });
  }
});

// POST /api/verification/upload-document - Upload additional verification document
router.post('/upload-document', supplierMiddleware, verificationUpload.single('document'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { documentType, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }
    
    const documentPath = `/uploads/verification-docs/${req.file.filename}`;
    
    // Update verification documents
    const verificationDocs: any = supplier.verificationDocs || {};
    if (!verificationDocs.additionalDocs) {
      verificationDocs.additionalDocs = [];
    }
    
    verificationDocs.additionalDocs.push({
      type: documentType,
      path: documentPath,
      description: description || null,
      uploadedAt: new Date().toISOString()
    });
    
    await db.update(supplierProfiles)
      .set({
        verificationDocs,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        type: documentType,
        path: documentPath,
        description: description || null
      }
    });
    
  } catch (error: any) {
    console.error('Upload verification document error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ==================== ADMIN VERIFICATION ENDPOINTS ====================

// GET /api/verification/admin/pending - Get pending verification applications
router.get('/admin/pending', adminMiddleware, async (req, res) => {
  try {
    const { level, limit, offset } = req.query;
    
    // Build query conditions
    const conditions = [
      eq(supplierProfiles.status, 'approved'),
      sql`${supplierProfiles.verificationDocs}->>'applicationInfo' IS NOT NULL`
    ];
    
    if (level) {
      conditions.push(
        sql`${supplierProfiles.verificationDocs}->'applicationInfo'->>'requestedLevel' = ${level}`
      );
    }
    
    const baseQuery = db.select({
      id: supplierProfiles.id,
      userId: supplierProfiles.userId,
      businessName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      contactPerson: supplierProfiles.contactPerson,
      email: users.email,
      phone: supplierProfiles.phone,
      country: supplierProfiles.country,
      currentVerificationLevel: supplierProfiles.verificationLevel,
      isVerified: supplierProfiles.isVerified,
      verificationDocs: supplierProfiles.verificationDocs,
      membershipTier: supplierProfiles.membershipTier,
      createdAt: supplierProfiles.createdAt,
      updatedAt: supplierProfiles.updatedAt
    })
    .from(supplierProfiles)
    .leftJoin(users, eq(supplierProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(supplierProfiles.updatedAt));
    
    // Add pagination
    let query = baseQuery;
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }
    
    const applications = await query;
    
    // Parse application info for each supplier
    const applicationsWithInfo = applications.map(app => {
      const applicationInfo: any = app.verificationDocs?.applicationInfo || {};
      return {
        ...app,
        application: {
          requestedLevel: applicationInfo.requestedLevel,
          appliedAt: applicationInfo.appliedAt,
          additionalInfo: applicationInfo.additionalInfo,
          status: applicationInfo.status || 'pending_review'
        }
      };
    });
    
    // Get total count
    const [{ count: total }] = await db.select({ count: sql`count(*)` })
      .from(supplierProfiles)
      .where(and(...conditions));
    
    res.json({
      success: true,
      applications: applicationsWithInfo,
      total: parseInt(total as string),
      page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
      limit: limit ? parseInt(limit as string) : applicationsWithInfo.length
    });
    
  } catch (error: any) {
    console.error('Get pending verification applications error:', error);
    res.status(500).json({ error: 'Failed to get pending applications' });
  }
});

// GET /api/verification/admin/application/:id - Get specific verification application
router.get('/admin/application/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplierResult = await db.select({
      id: supplierProfiles.id,
      userId: supplierProfiles.userId,
      businessName: supplierProfiles.businessName,
      businessType: supplierProfiles.businessType,
      storeName: supplierProfiles.storeName,
      contactPerson: supplierProfiles.contactPerson,
      position: supplierProfiles.position,
      email: users.email,
      phone: supplierProfiles.phone,
      address: supplierProfiles.address,
      city: supplierProfiles.city,
      country: supplierProfiles.country,
      website: supplierProfiles.website,
      yearEstablished: supplierProfiles.yearEstablished,
      employees: supplierProfiles.employees,
      currentVerificationLevel: supplierProfiles.verificationLevel,
      isVerified: supplierProfiles.isVerified,
      verifiedAt: supplierProfiles.verifiedAt,
      verificationDocs: supplierProfiles.verificationDocs,
      membershipTier: supplierProfiles.membershipTier,
      rating: supplierProfiles.rating,
      totalReviews: supplierProfiles.totalReviews,
      totalOrders: supplierProfiles.totalOrders,
      createdAt: supplierProfiles.createdAt,
      updatedAt: supplierProfiles.updatedAt
    })
    .from(supplierProfiles)
    .leftJoin(users, eq(supplierProfiles.userId, users.id))
    .where(eq(supplierProfiles.id, id))
    .limit(1);
    
    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const supplier = supplierResult[0];
    const applicationInfo: any = supplier.verificationDocs?.applicationInfo || {};
    
    res.json({
      success: true,
      supplier: {
        ...supplier,
        application: {
          requestedLevel: applicationInfo.requestedLevel,
          appliedAt: applicationInfo.appliedAt,
          additionalInfo: applicationInfo.additionalInfo,
          status: applicationInfo.status || 'pending_review'
        },
        availableLevels: VERIFICATION_LEVELS
      }
    });
    
  } catch (error: any) {
    console.error('Get verification application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// POST /api/verification/admin/approve/:id - Approve verification application
router.post('/admin/approve/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { level, notes } = req.body;
    const adminId = req.user?.id;
    
    if (!level) {
      return res.status(400).json({ error: 'Verification level is required' });
    }
    
    const supplier = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, id))
      .limit(1);
    
    if (supplier.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const supplierProfile = supplier[0];
    
    // Update verification status
    const verificationDocs: any = supplierProfile.verificationDocs || {};
    if (verificationDocs.applicationInfo) {
      verificationDocs.applicationInfo.status = 'approved';
      verificationDocs.applicationInfo.approvedAt = new Date().toISOString();
      verificationDocs.applicationInfo.approvedBy = adminId;
      verificationDocs.applicationInfo.notes = notes || null;
    }
    
    await db.update(supplierProfiles)
      .set({
        verificationLevel: level,
        isVerified: true,
        verifiedAt: new Date(),
        verificationDocs,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, id));
    
    // Create notification for supplier
    await db.insert(notifications).values({
      userId: supplierProfile.userId,
      type: 'success',
      title: 'Verification Approved',
      message: `Your ${VERIFICATION_LEVELS[level as keyof typeof VERIFICATION_LEVELS].name} application has been approved`,
      relatedId: id,
      relatedType: 'verification_approval'
    });
    
    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: adminId!,
      adminName: req.user?.firstName + ' ' + req.user?.lastName,
      action: 'approve_verification',
      description: `Approved ${VERIFICATION_LEVELS[level as keyof typeof VERIFICATION_LEVELS].name} for ${supplierProfile.businessName}`,
      entityType: 'supplier_verification',
      entityId: id,
      entityName: supplierProfile.businessName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null
    });
    
    res.json({
      success: true,
      message: `Verification approved successfully`,
      verification: {
        level,
        approvedAt: new Date(),
        approvedBy: adminId
      }
    });
    
  } catch (error: any) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
});

// POST /api/verification/admin/reject/:id - Reject verification application
router.post('/admin/reject/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user?.id;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const supplier = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, id))
      .limit(1);
    
    if (supplier.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const supplierProfile = supplier[0];
    
    // Update verification status
    const verificationDocs: any = supplierProfile.verificationDocs || {};
    if (verificationDocs.applicationInfo) {
      verificationDocs.applicationInfo.status = 'rejected';
      verificationDocs.applicationInfo.rejectedAt = new Date().toISOString();
      verificationDocs.applicationInfo.rejectedBy = adminId;
      verificationDocs.applicationInfo.rejectionReason = reason;
      verificationDocs.applicationInfo.notes = notes || null;
    }
    
    await db.update(supplierProfiles)
      .set({
        verificationDocs,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, id));
    
    // Create notification for supplier
    await db.insert(notifications).values({
      userId: supplierProfile.userId,
      type: 'error',
      title: 'Verification Rejected',
      message: `Your verification application has been rejected. Reason: ${reason}`,
      relatedId: id,
      relatedType: 'verification_rejection'
    });
    
    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: adminId!,
      adminName: req.user?.firstName + ' ' + req.user?.lastName,
      action: 'reject_verification',
      description: `Rejected verification application for ${supplierProfile.businessName}. Reason: ${reason}`,
      entityType: 'supplier_verification',
      entityId: id,
      entityName: supplierProfile.businessName,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null
    });
    
    res.json({
      success: true,
      message: 'Verification application rejected',
      rejection: {
        reason,
        rejectedAt: new Date(),
        rejectedBy: adminId
      }
    });
    
  } catch (error: any) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

// GET /api/verification/admin/stats - Get verification statistics
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    // Get verification level distribution
    const verificationStats = await db
      .select({
        level: supplierProfiles.verificationLevel,
        count: sql`count(*)`,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, 'approved'))
      .groupBy(supplierProfiles.verificationLevel);
    
    // Get pending applications count
    const [{ count: pendingCount }] = await db.select({ count: sql`count(*)` })
      .from(supplierProfiles)
      .where(and(
        eq(supplierProfiles.status, 'approved'),
        sql`${supplierProfiles.verificationDocs}->>'applicationInfo' IS NOT NULL`,
        sql`${supplierProfiles.verificationDocs}->'applicationInfo'->>'status' = 'pending_review'`
      ));
    
    // Get recent verifications (last 30 days)
    const recentVerifications = await db.select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      verificationLevel: supplierProfiles.verificationLevel,
      verifiedAt: supplierProfiles.verifiedAt
    })
    .from(supplierProfiles)
    .where(and(
      eq(supplierProfiles.isVerified, true),
      sql`${supplierProfiles.verifiedAt} >= NOW() - INTERVAL '30 days'`
    ))
    .orderBy(desc(supplierProfiles.verifiedAt))
    .limit(10);
    
    res.json({
      success: true,
      stats: {
        verificationLevels: verificationStats.reduce((acc, stat) => {
          if (stat.level) {
            acc[stat.level] = Number(stat.count);
          }
          return acc;
        }, {} as Record<string, number>),
        pendingApplications: Number(pendingCount),
        recentVerifications,
        totalVerified: verificationStats.reduce((sum, stat) => {
          return sum + (stat.level !== 'none' ? Number(stat.count) : 0);
        }, 0)
      }
    });
    
  } catch (error: any) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ error: 'Failed to get verification statistics' });
  }
});

export default router;