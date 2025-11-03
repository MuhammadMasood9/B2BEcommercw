import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, supplierProfiles, products, categories, inquiries, inquiryQuotations, buyerProfiles, notifications, InsertUser, InsertSupplierProfile, InsertProduct, insertProductSchema } from '@shared/schema';
import { eq, and, or, desc, ilike, sql } from 'drizzle-orm';
import { authMiddleware, supplierMiddleware } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { supplierAnalyticsService } from './supplierAnalyticsService';

const router = Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'supplier-docs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
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

// Validation schemas
const supplierRegistrationSchema = z.object({
  // User information
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),

  // Business information
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.enum(['manufacturer', 'trading_company', 'wholesaler'], {
    errorMap: () => ({ message: 'Business type must be manufacturer, trading_company, or wholesaler' })
  }),
  storeName: z.string().min(1, 'Store name is required'),

  // Contact details
  contactPerson: z.string().min(1, 'Contact person is required'),
  position: z.string().min(1, 'Position is required'),
  phone: z.string().min(1, 'Phone number is required'),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  website: z.string().url().optional().or(z.literal('')),

  // Business details
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employees: z.string().optional(),
  factorySize: z.string().optional(),
  annualRevenue: z.string().optional(),
  mainProducts: z.array(z.string()).optional(),
  exportMarkets: z.array(z.string()).optional(),

  // Membership
  membershipTier: z.enum(['free', 'silver', 'gold', 'platinum']).default('free'),

  // Store description
  storeDescription: z.string().optional(),
});

type SupplierRegistrationData = z.infer<typeof supplierRegistrationSchema>;

// Helper function to generate unique store slug
async function generateStoreSlug(storeName: string): Promise<string> {
  const baseSlug = storeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.storeSlug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Helper function to validate business name uniqueness
async function validateBusinessNameUnique(businessName: string, excludeUserId?: string): Promise<boolean> {
  const conditions = [eq(supplierProfiles.businessName, businessName)];

  if (excludeUserId) {
    conditions.push(eq(supplierProfiles.userId, excludeUserId));
  }

  const existing = await db.select()
    .from(supplierProfiles)
    .where(excludeUserId ? and(...conditions) : conditions[0])
    .limit(1);

  return existing.length === 0;
}

// Helper function to validate store name uniqueness
async function validateStoreNameUnique(storeName: string, excludeUserId?: string): Promise<boolean> {
  const conditions = [eq(supplierProfiles.storeName, storeName)];

  if (excludeUserId) {
    conditions.push(eq(supplierProfiles.userId, excludeUserId));
  }

  const existing = await db.select()
    .from(supplierProfiles)
    .where(excludeUserId ? and(...conditions) : conditions[0])
    .limit(1);

  return existing.length === 0;
}

// POST /api/suppliers/register - Multi-step supplier registration
router.post('/register', upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'storeLogo', maxCount: 1 },
  { name: 'storeBanner', maxCount: 1 }
]), async (req, res) => {
  try {
    // Process FormData - convert strings to appropriate types
    const processedData = { ...req.body };

    // Remove empty strings and convert to appropriate types
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === '' || processedData[key] === null) {
        // Keep website as empty string for validation, delete others
        if (key !== 'website') {
          delete processedData[key];
        }
      }
    });

    // Set default membershipTier if not provided
    if (!processedData.membershipTier) {
      processedData.membershipTier = 'free';
    }

    // Convert yearEstablished to number if provided
    if (processedData.yearEstablished) {
      const year = parseInt(processedData.yearEstablished);
      if (!isNaN(year)) {
        processedData.yearEstablished = year;
      } else {
        delete processedData.yearEstablished;
      }
    }

    // Parse JSON arrays if provided
    if (processedData.mainProducts && typeof processedData.mainProducts === 'string') {
      try {
        processedData.mainProducts = JSON.parse(processedData.mainProducts);
      } catch (error) {
        delete processedData.mainProducts;
      }
    }

    if (processedData.exportMarkets && typeof processedData.exportMarkets === 'string') {
      try {
        processedData.exportMarkets = JSON.parse(processedData.exportMarkets);
      } catch (error) {
        delete processedData.exportMarkets;
      }
    }

    // Parse and validate the registration data
    const validationResult = supplierRegistrationSchema.safeParse(processedData);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Validate business name uniqueness
    const isBusinessNameUnique = await validateBusinessNameUnique(data.businessName);
    if (!isBusinessNameUnique) {
      return res.status(409).json({ error: 'Business name already exists' });
    }

    // Validate store name uniqueness
    const isStoreNameUnique = await validateStoreNameUnique(data.storeName);
    if (!isStoreNameUnique) {
      return res.status(409).json({ error: 'Store name already exists' });
    }

    // Generate unique store slug
    const storeSlug = await generateStoreSlug(data.storeName);

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Process uploaded files
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
    const verificationDocs: any = {};

    if (files.businessLicense && files.businessLicense[0]) {
      verificationDocs.businessLicense = `/uploads/supplier-docs/${files.businessLicense[0].filename}`;
    }
    if (files.taxRegistration && files.taxRegistration[0]) {
      verificationDocs.taxRegistration = `/uploads/supplier-docs/${files.taxRegistration[0].filename}`;
    }
    if (files.identityDocument && files.identityDocument[0]) {
      verificationDocs.identityDocument = `/uploads/supplier-docs/${files.identityDocument[0].filename}`;
    }

    let storeLogo = null;
    let storeBanner = null;

    if (files.storeLogo && files.storeLogo[0]) {
      storeLogo = `/uploads/supplier-docs/${files.storeLogo[0].filename}`;
    }
    if (files.storeBanner && files.storeBanner[0]) {
      storeBanner = `/uploads/supplier-docs/${files.storeBanner[0].filename}`;
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const newUser = await tx.insert(users).values({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'supplier',
        emailVerified: false,
        isActive: true,
      }).returning();

      const user = newUser[0];

      // Create supplier profile
      const supplierProfileData: InsertSupplierProfile = {
        userId: user.id,
        businessName: data.businessName,
        businessType: data.businessType,
        storeName: data.storeName,
        storeSlug,
        storeDescription: data.storeDescription || null,
        storeLogo,
        storeBanner,
        contactPerson: data.contactPerson,
        position: data.position,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        wechat: data.wechat || null,
        address: data.address,
        city: data.city,
        country: data.country,
        website: data.website || null,
        yearEstablished: data.yearEstablished || null,
        employees: data.employees || null,
        factorySize: data.factorySize || null,
        annualRevenue: data.annualRevenue || null,
        mainProducts: data.mainProducts || null,
        exportMarkets: data.exportMarkets || null,
        membershipTier: data.membershipTier,
        verificationDocs: Object.keys(verificationDocs).length > 0 ? verificationDocs : null,
        status: 'pending',
        isActive: false,
      };

      const newSupplierProfile = await tx.insert(supplierProfiles).values(supplierProfileData).returning();

      return { user, supplierProfile: newSupplierProfile[0] };
    });

    // Send success response (without password)
    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      success: true,
      message: 'Supplier registration successful. Your application is pending approval.',
      user: userWithoutPassword,
      supplierProfile: {
        id: result.supplierProfile.id,
        businessName: result.supplierProfile.businessName,
        storeName: result.supplierProfile.storeName,
        storeSlug: result.supplierProfile.storeSlug,
        status: result.supplierProfile.status,
        membershipTier: result.supplierProfile.membershipTier,
      }
    });

    // TODO: Send email verification
    // TODO: Notify admins of new supplier registration

  } catch (error: any) {
    console.error('Supplier registration error:', error);

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

    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/suppliers/verify-email - Email verification for suppliers
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }

    // TODO: Implement email verification logic
    // For now, just mark as verified
    const userResult = await db.update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email))
      .returning();

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// GET /api/suppliers/check-availability - Check business name and store name availability
router.get('/check-availability', async (req, res) => {
  try {
    const { businessName, storeName, email } = req.query;

    const result: any = {};

    if (businessName) {
      result.businessNameAvailable = await validateBusinessNameUnique(businessName as string);
    }

    if (storeName) {
      result.storeNameAvailable = await validateStoreNameUnique(storeName as string);
    }

    if (email) {
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email as string))
        .limit(1);
      result.emailAvailable = existingUser.length === 0;
    }

    res.json(result);

  } catch (error: any) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Availability check failed' });
  }
});

// GET /api/suppliers/profile - Get current supplier's profile
router.get('/profile', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    const supplierResult = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, userId!))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    res.json({
      success: true,
      profile: supplierResult[0]
    });

  } catch (error: any) {
    console.error('Get supplier profile error:', error);
    res.status(500).json({ error: 'Failed to get supplier profile' });
  }
});

// ==================== STORE MANAGEMENT ENDPOINTS ====================

// Configure multer for store assets (logos and banners)
const storeAssetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'store-assets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const storeAssetUpload = multer({
  storage: storeAssetStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Allow only image formats for store assets
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// GET /api/suppliers/store/:slug - Get public store page data
router.get('/store/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Store slug is required' });
    }

    // Get supplier profile by store slug
    const supplierResult = await db.select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      businessType: supplierProfiles.businessType,
      storeName: supplierProfiles.storeName,
      storeSlug: supplierProfiles.storeSlug,
      storeDescription: supplierProfiles.storeDescription,
      storeLogo: supplierProfiles.storeLogo,
      storeBanner: supplierProfiles.storeBanner,
      contactPerson: supplierProfiles.contactPerson,
      phone: supplierProfiles.phone,
      whatsapp: supplierProfiles.whatsapp,
      wechat: supplierProfiles.wechat,
      address: supplierProfiles.address,
      city: supplierProfiles.city,
      country: supplierProfiles.country,
      website: supplierProfiles.website,
      yearEstablished: supplierProfiles.yearEstablished,
      employees: supplierProfiles.employees,
      mainProducts: supplierProfiles.mainProducts,
      exportMarkets: supplierProfiles.exportMarkets,
      verificationLevel: supplierProfiles.verificationLevel,
      isVerified: supplierProfiles.isVerified,
      membershipTier: supplierProfiles.membershipTier,
      rating: supplierProfiles.rating,
      totalReviews: supplierProfiles.totalReviews,
      responseRate: supplierProfiles.responseRate,
      responseTime: supplierProfiles.responseTime,
      totalProducts: supplierProfiles.totalProducts,
      storeViews: supplierProfiles.storeViews,
      followers: supplierProfiles.followers,
      createdAt: supplierProfiles.createdAt,
    })
      .from(supplierProfiles)
      .where(and(
        eq(supplierProfiles.storeSlug, slug),
        eq(supplierProfiles.status, 'approved'),
        eq(supplierProfiles.isActive, true)
      ))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Store not found or not active' });
    }

    const supplier = supplierResult[0];

    // Increment store views
    await db.update(supplierProfiles)
      .set({
        storeViews: (supplier.storeViews || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));

    res.json({
      success: true,
      store: {
        ...supplier,
        storeViews: (supplier.storeViews || 0) + 1
      }
    });

  } catch (error: any) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to get store information' });
  }
});

// Store settings validation schema
const storeSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').optional(),
  storeDescription: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  contactPerson: z.string().min(1, 'Contact person is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  website: z.string().url().optional().or(z.literal('')),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  employees: z.string().optional(),
  factorySize: z.string().optional(),
  annualRevenue: z.string().optional(),
  mainProducts: z.array(z.string()).optional(),
  exportMarkets: z.array(z.string()).optional(),
});

// PATCH /api/suppliers/store/settings - Update store settings
router.patch('/store/settings', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Validate input
    const validationResult = storeSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Get current supplier profile
    const currentSupplier = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, userId!))
      .limit(1);

    if (currentSupplier.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Check if store name is being changed and validate uniqueness
    let newStoreSlug;
    if (data.storeName && data.storeName !== currentSupplier[0].storeName) {
      const isStoreNameUnique = await validateStoreNameUnique(data.storeName, userId);
      if (!isStoreNameUnique) {
        return res.status(409).json({ error: 'Store name already exists' });
      }

      // Generate new store slug if store name changed
      newStoreSlug = await generateStoreSlug(data.storeName);
    }

    // Update supplier profile
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    // Add new store slug if it was generated
    if (newStoreSlug) {
      updateData.storeSlug = newStoreSlug;
    }

    const updatedSupplier = await db.update(supplierProfiles)
      .set(updateData)
      .where(eq(supplierProfiles.userId, userId!))
      .returning();

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      profile: updatedSupplier[0]
    });

  } catch (error: any) {
    console.error('Update store settings error:', error);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
});

// POST /api/suppliers/store/upload-logo - Upload store logo
router.post('/store/upload-logo', supplierMiddleware, storeAssetUpload.single('logo'), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    const logoPath = `/uploads/store-assets/${req.file.filename}`;

    // Update supplier profile with new logo
    const updatedSupplier = await db.update(supplierProfiles)
      .set({
        storeLogo: logoPath,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.userId, userId!))
      .returning();

    if (updatedSupplier.length === 0) {
      // Clean up uploaded file if supplier not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: logoPath
    });

  } catch (error: any) {
    console.error('Upload logo error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// POST /api/suppliers/store/upload-banner - Upload store banner
router.post('/store/upload-banner', supplierMiddleware, storeAssetUpload.single('banner'), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No banner file provided' });
    }

    const bannerPath = `/uploads/store-assets/${req.file.filename}`;

    // Update supplier profile with new banner
    const updatedSupplier = await db.update(supplierProfiles)
      .set({
        storeBanner: bannerPath,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.userId, userId!))
      .returning();

    if (updatedSupplier.length === 0) {
      // Clean up uploaded file if supplier not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      bannerUrl: bannerPath
    });

  } catch (error: any) {
    console.error('Upload banner error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

// Helper function to generate store URL
function generateStoreUrl(storeSlug: string, req: any): string {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/stores/${storeSlug}`;
}

// GET /api/suppliers/store/url - Get store URL for current supplier
router.get('/store/url', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    const supplierResult = await db.select({
      storeSlug: supplierProfiles.storeSlug,
      storeName: supplierProfiles.storeName
    })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, userId!))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplier = supplierResult[0];
    const storeUrl = generateStoreUrl(supplier.storeSlug, req);

    res.json({
      success: true,
      storeUrl,
      storeSlug: supplier.storeSlug,
      storeName: supplier.storeName
    });

  } catch (error: any) {
    console.error('Get store URL error:', error);
    res.status(500).json({ error: 'Failed to get store URL' });
  }
});

// ==================== PRODUCT MANAGEMENT ENDPOINTS ====================

// Configure multer for product images
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// Helper function to get supplier profile by user ID
async function getSupplierProfile(userId: string) {
  const supplierResult = await db.select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.userId, userId))
    .limit(1);

  return supplierResult.length > 0 ? supplierResult[0] : null;
}

// Helper function to generate unique product slug
async function generateProductSlug(name: string, supplierId: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.select()
      .from(products)
      .where(and(
        eq(products.slug, slug),
        eq(products.supplierId, supplierId)
      ))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// GET /api/suppliers/products - Get supplier's products with ownership validation
router.get('/products', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, isPublished, categoryId, search, limit, offset } = req.query;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Build query conditions
    const conditions = [eq(products.supplierId, supplier.id)];

    if (status) {
      conditions.push(eq(products.status, status as string));
    }
    if (isPublished !== undefined) {
      conditions.push(eq(products.isPublished, isPublished === 'true'));
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId as string));
    }

    // Build all query conditions including search
    let queryConditions = [...conditions];
    
    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.shortDescription, `%${search}%`)
      );
      if (searchCondition) {
        queryConditions.push(searchCondition);
      }
    }

    let query = db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      categoryId: products.categoryId,
      images: products.images,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      customizationAvailable: products.customizationAvailable,
      leadTime: products.leadTime,
      port: products.port,
      paymentTerms: products.paymentTerms,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      status: products.status,
      isApproved: products.isApproved,
      approvedAt: products.approvedAt,
      rejectionReason: products.rejectionReason,
      views: products.views,
      inquiries: products.inquiries,
      tags: products.tags,
      sku: products.sku,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryName: categories.name
    })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...queryConditions))
      .orderBy(desc(products.createdAt));

    // Add pagination
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const supplierProducts = await query;

    // Get total count for pagination
    let countConditions = [...conditions];

    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.shortDescription, `%${search}%`)
      );
      if (searchCondition) {
        countConditions.push(searchCondition);
      }
    }

    const countQuery = db.select({ count: products.id })
      .from(products)
      .where(and(...countConditions));

    const [{ count: total }] = await countQuery;

    res.json({
      success: true,
      products: supplierProducts,
      total: parseInt(total as string),
      page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
      limit: limit ? parseInt(limit as string) : supplierProducts.length
    });

  } catch (error: any) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// GET /api/suppliers/products/:id - Get specific product with ownership validation
router.get('/products/:id', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get product with ownership validation
    const productResult = await db.select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.supplierId, supplier.id)
      ))
      .limit(1);

    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    res.json({
      success: true,
      product: productResult[0]
    });

  } catch (error: any) {
    console.error('Get supplier product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// POST /api/suppliers/products - Create new product with supplier attribution
router.post('/products', supplierMiddleware, productImageUpload.array('images', 10), async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Check if supplier is approved and active
    if (supplier.status !== 'approved' || !supplier.isActive) {
      return res.status(403).json({ error: 'Supplier account must be approved and active to create products' });
    }

    // Process uploaded images
    const uploadedFiles = req.files as Express.Multer.File[] || [];
    const imagePaths = uploadedFiles.map(file => `/uploads/${file.filename}`);

    // Helper function to convert string booleans to actual booleans
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    };

    // Debug: Log original request body
    console.log('📥 Original req.body:', {
      hasTradeAssurance: req.body.hasTradeAssurance,
      hasTradeAssuranceType: typeof req.body.hasTradeAssurance,
      sampleAvailable: req.body.sampleAvailable,
      sampleAvailableType: typeof req.body.sampleAvailable,
      inStock: req.body.inStock,
      inStockType: typeof req.body.inStock,
      customizationAvailable: req.body.customizationAvailable,
      customizationAvailableType: typeof req.body.customizationAvailable
    });

    // Helper function to convert empty strings to null for decimal fields (returns string for database)
    const toDecimal = (value: any): string | null => {
      if (value === '' || value === null || value === undefined) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed.toString();
    };

    // Parse and validate product data
    const productData = {
      ...req.body,
      supplierId: supplier.id,
      images: imagePaths,
      status: 'pending_approval', // All supplier products need approval
      isApproved: false,
      isPublished: false, // Will be published after approval
      minOrderQuantity: parseInt(req.body.minOrderQuantity || '1'),
      stockQuantity: parseInt(req.body.stockQuantity || '0'),
      samplePrice: toDecimal(req.body.samplePrice),
      inStock: toBool(req.body.inStock),
      sampleAvailable: toBool(req.body.sampleAvailable),
      customizationAvailable: toBool(req.body.customizationAvailable),
      hasTradeAssurance: toBool(req.body.hasTradeAssurance),
      isFeatured: false, // Only admins can feature products
    };

    // Generate unique slug
    if (!productData.slug) {
      productData.slug = await generateProductSlug(productData.name, supplier.id);
    }

    // Parse arrays from form data
    if (typeof productData.paymentTerms === 'string') {
      productData.paymentTerms = productData.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean);
    }
    if (typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    if (typeof productData.colors === 'string') {
      productData.colors = productData.colors.split(',').map((color: string) => color.trim()).filter(Boolean);
    }
    if (typeof productData.sizes === 'string') {
      productData.sizes = productData.sizes.split(',').map((size: string) => size.trim()).filter(Boolean);
    }
    if (typeof productData.keyFeatures === 'string') {
      productData.keyFeatures = productData.keyFeatures.split(',').map((feature: string) => feature.trim()).filter(Boolean);
    }
    if (typeof productData.certifications === 'string') {
      productData.certifications = productData.certifications.split(',').map((cert: string) => cert.trim()).filter(Boolean);
    }

    // Parse price ranges if provided
    if (productData.priceRanges && typeof productData.priceRanges === 'string') {
      try {
        productData.priceRanges = JSON.parse(productData.priceRanges);
      } catch (error) {
        productData.priceRanges = null;
      }
    }

    // Parse specifications if provided
    if (productData.specifications && typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (error) {
        productData.specifications = null;
      }
    }

    // Debug: Log the data before validation
    console.log('🔍 Product data before validation:', {
      hasTradeAssurance: productData.hasTradeAssurance,
      hasTradeAssuranceType: typeof productData.hasTradeAssurance,
      sampleAvailable: productData.sampleAvailable,
      sampleAvailableType: typeof productData.sampleAvailable,
      inStock: productData.inStock,
      inStockType: typeof productData.inStock,
      customizationAvailable: productData.customizationAvailable,
      customizationAvailableType: typeof productData.customizationAvailable
    });

    // Validate with schema - create a custom schema that handles string-to-boolean conversion and nullable numerics
    const productValidationSchema = insertProductSchema.extend({
      hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      inStock: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      isPublished: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      isApproved: z.union([z.boolean(), z.string()]).transform(val => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return false;
      }),
      samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val.toString();
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? null : parsed.toString();
        }
        return null;
      }).nullable()
    });
    
    const validatedData = productValidationSchema.parse(productData);

    // Create product
    const [newProduct] = await db.insert(products).values(validatedData).returning();

    // Update supplier's total products count
    await db.update(supplierProfiles)
      .set({
        totalProducts: (supplier.totalProducts || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));

    res.status(201).json({
      success: true,
      message: 'Product created successfully and submitted for approval',
      product: newProduct
    });

  } catch (error: any) {
    console.error('Create supplier product error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
});

// PATCH /api/suppliers/products/:id - Update product with ownership validation
router.patch('/products/:id', supplierMiddleware, productImageUpload.array('images', 10), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get existing product with ownership validation
    const existingProduct = await db.select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.supplierId, supplier.id)
      ))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    const product = existingProduct[0];

    // Process uploaded images
    const uploadedFiles = req.files as Express.Multer.File[] || [];
    const newImagePaths = uploadedFiles.map(file => `/uploads/${file.filename}`);

    // Prepare update data
    const updateData: any = { ...req.body };

    // Handle image updates
    if (newImagePaths.length > 0) {
      // Combine existing images with new ones
      const existingImages = product.images || [];
      updateData.images = [...existingImages, ...newImagePaths];
    }

    // If product was rejected and being updated, reset to pending approval
    if (product.status === 'rejected') {
      updateData.status = 'pending_approval';
      updateData.isApproved = false;
      updateData.rejectionReason = null;
    }

    // Parse arrays from form data
    if (typeof updateData.paymentTerms === 'string') {
      updateData.paymentTerms = updateData.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean);
    }
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    if (typeof updateData.colors === 'string') {
      updateData.colors = updateData.colors.split(',').map((color: string) => color.trim()).filter(Boolean);
    }
    if (typeof updateData.sizes === 'string') {
      updateData.sizes = updateData.sizes.split(',').map((size: string) => size.trim()).filter(Boolean);
    }
    if (typeof updateData.keyFeatures === 'string') {
      updateData.keyFeatures = updateData.keyFeatures.split(',').map((feature: string) => feature.trim()).filter(Boolean);
    }
    if (typeof updateData.certifications === 'string') {
      updateData.certifications = updateData.certifications.split(',').map((cert: string) => cert.trim()).filter(Boolean);
    }

    // Parse JSON fields
    if (updateData.priceRanges && typeof updateData.priceRanges === 'string') {
      try {
        updateData.priceRanges = JSON.parse(updateData.priceRanges);
      } catch (error) {
        delete updateData.priceRanges;
      }
    }

    if (updateData.specifications && typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (error) {
        delete updateData.specifications;
      }
    }

    // Convert numeric fields
    if (updateData.minOrderQuantity) {
      updateData.minOrderQuantity = parseInt(updateData.minOrderQuantity);
    }
    if (updateData.stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(updateData.stockQuantity);
    }

    // Helper function to convert string booleans to actual booleans
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    };

    // Convert boolean fields
    if (updateData.inStock !== undefined) {
      updateData.inStock = toBool(updateData.inStock);
    }
    if (updateData.sampleAvailable !== undefined) {
      updateData.sampleAvailable = toBool(updateData.sampleAvailable);
    }
    if (updateData.customizationAvailable !== undefined) {
      updateData.customizationAvailable = toBool(updateData.customizationAvailable);
    }
    if (updateData.hasTradeAssurance !== undefined) {
      updateData.hasTradeAssurance = toBool(updateData.hasTradeAssurance);
    }

    // Suppliers cannot set featured status
    delete updateData.isFeatured;
    delete updateData.supplierId; // Prevent changing supplier

    updateData.updatedAt = new Date();

    // Update product
    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error: any) {
    console.error('Update supplier product error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(400).json({ error: error.message || 'Failed to update product' });
  }
});

// DELETE /api/suppliers/products/:id - Delete product with ownership validation
router.delete('/products/:id', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get existing product with ownership validation
    const existingProduct = await db.select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.supplierId, supplier.id)
      ))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    // Delete product
    await db.delete(products).where(eq(products.id, id));

    // Update supplier's total products count
    await db.update(supplierProfiles)
      .set({
        totalProducts: Math.max((supplier.totalProducts || 1) - 1, 0),
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete supplier product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/suppliers/products/bulk-upload - Bulk product upload for suppliers
router.post('/products/bulk-upload', supplierMiddleware, productImageUpload.array('images'), async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Check if supplier is approved and active
    if (supplier.status !== 'approved' || !supplier.isActive) {
      return res.status(403).json({ error: 'Supplier account must be approved and active to upload products' });
    }

    const { products: productsData } = req.body;
    const imageFiles = req.files as Express.Multer.File[];

    if (!productsData) {
      return res.status(400).json({ error: 'Products data is required' });
    }

    let parsedProducts;
    try {
      parsedProducts = JSON.parse(productsData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid products JSON format' });
    }

    if (!Array.isArray(parsedProducts)) {
      return res.status(400).json({ error: 'Products must be an array' });
    }

    console.log(`📦 Bulk upload: ${parsedProducts.length} products from supplier ${supplier.businessName}`);

    const validatedProducts = [];
    const errors = [];

    for (let i = 0; i < parsedProducts.length; i++) {
      const p = parsedProducts[i];
      try {
        // Process product images
        const productImages = [];

        // Handle image distribution for bulk upload
        if (imageFiles && imageFiles.length > 0) {
          const imagesPerProduct = Math.ceil(imageFiles.length / parsedProducts.length);
          const startIndex = i * imagesPerProduct;
          const endIndex = Math.min(startIndex + imagesPerProduct, imageFiles.length);

          for (let j = startIndex; j < endIndex; j++) {
            if (imageFiles[j]) {
              productImages.push(`/uploads/${imageFiles[j].filename}`);
            }
          }
        }

        // Generate unique slug
        const slug = await generateProductSlug(p.name, supplier.id);

        const productData = {
          name: p.name,
          slug,
          shortDescription: p.shortDescription,
          description: p.description,
          categoryId: p.categoryId,
          specifications: p.specifications || null,
          images: productImages,
          videos: [],
          supplierId: supplier.id,
          status: 'pending_approval',
          isApproved: false,
          minOrderQuantity: parseInt(p.minOrderQuantity || '1'),
          priceRanges: p.priceRanges || null,
          sampleAvailable: p.sampleAvailable === 'true' || p.sampleAvailable === true,
          samplePrice: p.samplePrice ? p.samplePrice.toString() : null,
          customizationAvailable: p.customizationAvailable === 'true' || p.customizationAvailable === true,
          customizationDetails: p.customizationDetails,
          leadTime: p.leadTime,
          port: p.port,
          paymentTerms: Array.isArray(p.paymentTerms) ? p.paymentTerms : (p.paymentTerms ? p.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean) : []),
          inStock: p.inStock === 'true' || p.inStock === true,
          stockQuantity: parseInt(p.stockQuantity || '0'),
          isPublished: false, // Will be published after approval
          isFeatured: false,
          colors: Array.isArray(p.colors) ? p.colors : (p.colors ? p.colors.split(',').map((color: string) => color.trim()).filter(Boolean) : []),
          sizes: Array.isArray(p.sizes) ? p.sizes : (p.sizes ? p.sizes.split(',').map((size: string) => size.trim()).filter(Boolean) : []),
          keyFeatures: Array.isArray(p.keyFeatures) ? p.keyFeatures : (p.keyFeatures ? p.keyFeatures.split(',').map((feature: string) => feature.trim()).filter(Boolean) : []),
          certifications: Array.isArray(p.certifications) ? p.certifications : (p.certifications ? p.certifications.split(',').map((cert: string) => cert.trim()).filter(Boolean) : []),
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []),
          hasTradeAssurance: p.hasTradeAssurance === 'true' || p.hasTradeAssurance === true,
          sku: p.sku,
          metaData: null,
        };

        // Use the same validation schema that handles string-to-boolean conversion
        const productValidationSchema = insertProductSchema.extend({
          hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          inStock: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          isPublished: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          isApproved: z.union([z.boolean(), z.string()]).transform(val => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return val.toLowerCase() === 'true';
            return false;
          }),
          samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'number') return val.toString();
            if (typeof val === 'string') {
              const parsed = parseFloat(val);
              return isNaN(parsed) ? null : parsed.toString();
            }
            return null;
          }).nullable()
        });
        
        const validated = productValidationSchema.parse(productData);
        validatedProducts.push(validated);
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation errors in bulk upload data",
        errors,
        validCount: validatedProducts.length,
        errorCount: errors.length
      });
    }

    // Create products in batches
    const createdProducts = [];
    const batchSize = 50;

    for (let i = 0; i < validatedProducts.length; i += batchSize) {
      const batch = validatedProducts.slice(i, i + batchSize);
      const batchResult = await db.insert(products).values(batch).returning();
      createdProducts.push(...batchResult);
    }

    // Update supplier's total products count
    await db.update(supplierProfiles)
      .set({
        totalProducts: (supplier.totalProducts || 0) + createdProducts.length,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplier.id));

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdProducts.length} products for approval`,
      count: createdProducts.length,
      products: createdProducts
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(400).json({ error: error.message || 'Bulk upload failed' });
  }
});

// ==================== INQUIRY MANAGEMENT ENDPOINTS ====================

// GET /api/suppliers/inquiries - Get supplier's inquiries with ownership validation
router.get('/inquiries', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, search, limit, offset } = req.query;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Build query conditions
    const conditions = [eq(inquiries.supplierId, supplier.id)];

    if (status && status !== 'all') {
      conditions.push(eq(inquiries.status, status as string));
    }

    // Build all query conditions including search
    let queryConditions = [...conditions];
    
    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(buyerProfiles.companyName, `%${search}%`)
      );
      if (searchCondition) {
        queryConditions.push(searchCondition);
      }
    }

    let query = db.select({
      id: inquiries.id,
      productId: inquiries.productId,
      buyerId: inquiries.buyerId,
      quantity: inquiries.quantity,
      targetPrice: inquiries.targetPrice,
      message: inquiries.message,
      requirements: inquiries.requirements,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      // Product information
      productName: products.name,
      productImages: products.images,
      productSlug: products.slug,
      // Buyer information
      buyerName: users.firstName,
      buyerLastName: users.lastName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      buyerPhone: buyerProfiles.phone
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(and(...queryConditions))
      .orderBy(desc(inquiries.createdAt));

    // Add pagination
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const supplierInquiries = await query;

    // Get quotations for each inquiry
    const inquiriesWithQuotations = await Promise.all(
      supplierInquiries.map(async (inquiry) => {
        const quotations = await db.select()
          .from(inquiryQuotations)
          .where(eq(inquiryQuotations.inquiryId, inquiry.id))
          .orderBy(desc(inquiryQuotations.createdAt));

        // Parse product images
        let productImage = null;
        try {
          if (inquiry.productImages && Array.isArray(inquiry.productImages) && inquiry.productImages.length > 0) {
            productImage = inquiry.productImages[0];
          }
        } catch (error) {
          productImage = null;
        }

        return {
          ...inquiry,
          productImage,
          quotations
        };
      })
    );

    // Get total count for pagination
    let countConditions = [...conditions];

    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(buyerProfiles.companyName, `%${search}%`)
      );
      if (searchCondition) {
        countConditions.push(searchCondition);
      }
    }

    const countQuery = db.select({ count: sql`count(*)` })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(and(...countConditions));

    const [{ count: total }] = await countQuery;

    res.json({
      success: true,
      inquiries: inquiriesWithQuotations,
      total: parseInt(total as string),
      page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
      limit: limit ? parseInt(limit as string) : inquiriesWithQuotations.length
    });

  } catch (error: any) {
    console.error('Get supplier inquiries error:', error);
    res.status(500).json({ error: 'Failed to get inquiries' });
  }
});

// GET /api/suppliers/inquiries/:id - Get specific inquiry with ownership validation
router.get('/inquiries/:id', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get inquiry with ownership validation
    const inquiryResult = await db.select({
      id: inquiries.id,
      productId: inquiries.productId,
      buyerId: inquiries.buyerId,
      quantity: inquiries.quantity,
      targetPrice: inquiries.targetPrice,
      message: inquiries.message,
      requirements: inquiries.requirements,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
      // Product information
      productName: products.name,
      productImages: products.images,
      productSlug: products.slug,
      productDescription: products.description,
      productMinOrderQuantity: products.minOrderQuantity,
      // Buyer information
      buyerName: users.firstName,
      buyerLastName: users.lastName,
      buyerEmail: users.email,
      buyerCompany: buyerProfiles.companyName,
      buyerCountry: buyerProfiles.country,
      buyerPhone: buyerProfiles.phone
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(and(
        eq(inquiries.id, id),
        eq(inquiries.supplierId, supplier.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found or access denied' });
    }

    const inquiry = inquiryResult[0];

    // Get quotations for this inquiry
    const quotations = await db.select()
      .from(inquiryQuotations)
      .where(eq(inquiryQuotations.inquiryId, inquiry.id))
      .orderBy(desc(inquiryQuotations.createdAt));

    // Parse product images
    let productImage = null;
    try {
      if (inquiry.productImages && Array.isArray(inquiry.productImages) && inquiry.productImages.length > 0) {
        productImage = inquiry.productImages[0];
      }
    } catch (error) {
      productImage = null;
    }

    res.json({
      success: true,
      inquiry: {
        ...inquiry,
        productImage,
        quotations
      }
    });

  } catch (error: any) {
    console.error('Get supplier inquiry error:', error);
    res.status(500).json({ error: 'Failed to get inquiry' });
  }
});

// POST /api/suppliers/inquiries/:id/respond - Create quotation response to inquiry
router.post('/inquiries/:id/respond', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: inquiryId } = req.params;
    const { pricePerUnit, totalPrice, moq, leadTime, paymentTerms, validUntil, message, attachments } = req.body;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Verify inquiry ownership
    const inquiryResult = await db.select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, inquiryId),
        eq(inquiries.supplierId, supplier.id)
      ))
      .limit(1);

    if (inquiryResult.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found or access denied' });
    }

    const inquiry = inquiryResult[0];

    // Validate required fields
    if (!pricePerUnit || !totalPrice || !moq) {
      return res.status(400).json({ error: 'Price per unit, total price, and MOQ are required' });
    }

    // Create quotation
    const quotationData = {
      inquiryId,
      pricePerUnit: pricePerUnit.toString(),
      totalPrice: totalPrice.toString(),
      moq: parseInt(moq),
      leadTime: leadTime || null,
      paymentTerms: paymentTerms || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      message: message || null,
      attachments: attachments || [],
      status: 'pending' as const
    };

    const [quotation] = await db.insert(inquiryQuotations).values(quotationData).returning();

    // Update inquiry status to 'replied'
    await db.update(inquiries)
      .set({ status: 'replied' })
      .where(eq(inquiries.id, inquiryId));

    // Create notification for buyer
    await db.insert(notifications).values({
      userId: inquiry.buyerId,
      type: 'info',
      title: 'Quotation Received',
      message: `You have received a quotation for your inquiry`,
      relatedId: quotation.id,
      relatedType: 'quotation'
    });

    res.status(201).json({
      success: true,
      message: 'Quotation sent successfully',
      quotation
    });

  } catch (error: any) {
    console.error('Create inquiry quotation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create quotation' });
  }
});

// GET /api/suppliers/inquiries/stats - Get inquiry statistics for supplier dashboard
router.get('/inquiries/stats', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get inquiry counts by status
    const [pendingCount] = await db.select({ count: sql`count(*)` })
      .from(inquiries)
      .where(and(
        eq(inquiries.supplierId, supplier.id),
        eq(inquiries.status, 'pending')
      ));

    const [repliedCount] = await db.select({ count: sql`count(*)` })
      .from(inquiries)
      .where(and(
        eq(inquiries.supplierId, supplier.id),
        eq(inquiries.status, 'replied')
      ));

    const [negotiatingCount] = await db.select({ count: sql`count(*)` })
      .from(inquiries)
      .where(and(
        eq(inquiries.supplierId, supplier.id),
        eq(inquiries.status, 'negotiating')
      ));

    const [closedCount] = await db.select({ count: sql`count(*)` })
      .from(inquiries)
      .where(and(
        eq(inquiries.supplierId, supplier.id),
        eq(inquiries.status, 'closed')
      ));

    // Get recent inquiries
    const recentInquiries = await db.select({
      id: inquiries.id,
      productName: products.name,
      buyerName: users.firstName,
      buyerCompany: buyerProfiles.companyName,
      quantity: inquiries.quantity,
      status: inquiries.status,
      createdAt: inquiries.createdAt
    })
      .from(inquiries)
      .leftJoin(products, eq(inquiries.productId, products.id))
      .leftJoin(users, eq(inquiries.buyerId, users.id))
      .leftJoin(buyerProfiles, eq(inquiries.buyerId, buyerProfiles.userId))
      .where(eq(inquiries.supplierId, supplier.id))
      .orderBy(desc(inquiries.createdAt))
      .limit(5);

    res.json({
      success: true,
      stats: {
        pending: parseInt(pendingCount.count as string),
        replied: parseInt(repliedCount.count as string),
        negotiating: parseInt(negotiatingCount.count as string),
        closed: parseInt(closedCount.count as string),
        total: supplier.totalInquiries || 0
      },
      recentInquiries
    });

  } catch (error: any) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({ error: 'Failed to get inquiry statistics' });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// GET /api/suppliers/analytics/overview - Get comprehensive analytics overview
router.get('/analytics/overview', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const analytics = await supplierAnalyticsService.getSupplierAnalytics(
      supplier.id,
      timeRange as string
    );

    res.json({
      success: true,
      analytics,
      timeRange
    });

  } catch (error: any) {
    console.error('Get supplier analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// GET /api/suppliers/analytics/sales - Get sales analytics
router.get('/analytics/sales', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const salesAnalytics = await supplierAnalyticsService.getSalesAnalytics(
      supplier.id,
      timeRange as string
    );

    res.json({
      success: true,
      salesAnalytics,
      timeRange
    });

  } catch (error: any) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Failed to get sales analytics' });
  }
});

// GET /api/suppliers/analytics/products - Get product analytics
router.get('/analytics/products', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const productAnalytics = await supplierAnalyticsService.getProductAnalytics(supplier.id);

    res.json({
      success: true,
      productAnalytics
    });

  } catch (error: any) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Failed to get product analytics' });
  }
});

// GET /api/suppliers/analytics/customers - Get customer analytics
router.get('/analytics/customers', supplierMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    // Get supplier profile
    const supplier = await getSupplierProfile(userId!);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    // Get full analytics and extract customer data
    const analytics = await supplierAnalyticsService.getSupplierAnalytics(
      supplier.id,
      timeRange as string
    );

    res.json({
      success: true,
      customerAnalytics: analytics.customerAnalytics,
      timeRange
    });

  } catch (error: any) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Failed to get customer analytics' });
  }
});

export { router as supplierRoutes };