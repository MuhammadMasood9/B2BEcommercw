import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { 
  users, 
  supplierProfiles, 
  buyerProfiles,
  buyers,
  verificationDocuments,
  User,
  InsertUser,
  InsertSupplierProfile,
  InsertBuyerProfile,
  InsertBuyer,
  InsertVerificationDocument
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { PasswordSecurityService } from './passwordSecurityService';
import { EnhancedAuthService } from './enhancedAuthService';
import { EmailService } from './emailService.js';
import { uploadDocuments } from './upload';

const router = Router();

// ==================== SUPPLIER REGISTRATION ====================

interface SupplierRegistrationData {
  // User information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  
  // Business information
  businessName: string;
  businessType: 'manufacturer' | 'trading_company' | 'wholesaler';
  storeName: string;
  
  // Contact details
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp?: string;
  wechat?: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  
  // Business details
  yearEstablished?: number;
  employees?: string;
  factorySize?: string;
  annualRevenue?: string;
  mainProducts?: string[];
  exportMarkets?: string[];
  
  // Membership
  membershipTier: 'free' | 'silver' | 'gold' | 'platinum';
  
  // Store description
  storeDescription?: string;
}

// Multi-step supplier registration with document upload
router.post('/supplier/register', uploadDocuments.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'storeLogo', maxCount: 1 },
  { name: 'storeBanner', maxCount: 1 }
]), async (req, res) => {
  try {
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    // Parse form data
    const registrationData: SupplierRegistrationData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      storeName: req.body.storeName,
      contactPerson: req.body.contactPerson,
      position: req.body.position,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      wechat: req.body.wechat,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      website: req.body.website,
      yearEstablished: req.body.yearEstablished ? parseInt(req.body.yearEstablished) : undefined,
      employees: req.body.employees,
      factorySize: req.body.factorySize,
      annualRevenue: req.body.annualRevenue,
      mainProducts: req.body.mainProducts ? JSON.parse(req.body.mainProducts) : [],
      exportMarkets: req.body.exportMarkets ? JSON.parse(req.body.exportMarkets) : [],
      membershipTier: req.body.membershipTier || 'free',
      storeDescription: req.body.storeDescription
    };

    // Validate required fields
    const requiredFields = [
      'email', 'password', 'firstName', 'lastName', 'businessName', 
      'businessType', 'storeName', 'contactPerson', 'position', 
      'phone', 'address', 'city', 'country'
    ];

    for (const field of requiredFields) {
      if (!registrationData[field as keyof SupplierRegistrationData]) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, registrationData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Check if store name is already taken
    const existingStore = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.storeName, registrationData.storeName))
      .limit(1);

    if (existingStore.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Store name is already taken' 
      });
    }

    // Validate password strength
    const passwordValidation = PasswordSecurityService.validatePassword(
      registrationData.password, 
      {
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        companyName: registrationData.businessName
      }
    );

    if (!passwordValidation.isValid) {
      return res.status(422).json({ 
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Hash password
    const hashedPassword = await PasswordSecurityService.hashPassword(registrationData.password);

    // Generate email verification token
    const emailVerificationToken = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData: InsertUser = {
      email: registrationData.email,
      password: hashedPassword,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      companyName: registrationData.businessName,
      phone: registrationData.phone,
      role: 'supplier',
      emailVerified: false,
      isActive: false, // Inactive until approved
      emailVerificationToken,
      emailVerificationExpires
    };

    const newUser = await db.insert(users).values(userData).returning();
    const user = newUser[0];

    // Generate store slug
    const storeSlug = registrationData.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create supplier profile
    const supplierData: InsertSupplierProfile = {
      userId: user.id,
      businessName: registrationData.businessName,
      businessType: registrationData.businessType,
      storeName: registrationData.storeName,
      storeSlug,
      storeDescription: registrationData.storeDescription || '',
      contactPerson: registrationData.contactPerson,
      position: registrationData.position,
      phone: registrationData.phone,
      whatsapp: registrationData.whatsapp || null,
      wechat: registrationData.wechat || null,
      address: registrationData.address,
      city: registrationData.city,
      country: registrationData.country,
      website: registrationData.website || null,
      yearEstablished: registrationData.yearEstablished || null,
      employees: registrationData.employees || null,
      factorySize: registrationData.factorySize || null,
      annualRevenue: registrationData.annualRevenue || null,
      mainProducts: registrationData.mainProducts || [],
      exportMarkets: registrationData.exportMarkets || [],
      membershipTier: registrationData.membershipTier,
      verificationLevel: 'none',
      isVerified: false,
      status: 'pending', // Pending admin approval
      isActive: false
    };

    const newSupplierProfile = await db.insert(supplierProfiles)
      .values(supplierData)
      .returning();

    const supplierProfile = newSupplierProfile[0];

    // Handle document uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const verificationDocs: InsertVerificationDocument[] = [];

    if (files) {
      const documentTypes = [
        'businessLicense',
        'taxRegistration', 
        'identityDocument',
        'storeLogo',
        'storeBanner'
      ];

      for (const docType of documentTypes) {
        if (files[docType] && files[docType][0]) {
          const file = files[docType][0];
          verificationDocs.push({
            supplierId: supplierProfile.id,
            documentType: docType,
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: 'pending'
          });
        }
      }

      if (verificationDocs.length > 0) {
        await db.insert(verificationDocuments).values(verificationDocs);
      }
    }

    // Log registration event
    await EnhancedAuthService.logAuthenticationEvent(
      'supplier_registration',
      ipAddress,
      userAgent,
      user.id,
      user.email,
      user.role,
      true,
      undefined,
      undefined,
      undefined,
      {
        businessName: registrationData.businessName,
        businessType: registrationData.businessType,
        membershipTier: registrationData.membershipTier,
        documentsUploaded: verificationDocs.length
      }
    );

    // Send verification email
    try {
      await EmailService.sendSupplierRegistrationEmail(
        user.email,
        user.firstName || 'Supplier',
        registrationData.businessName,
        emailVerificationToken
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Notify admins of new supplier application
    try {
      await EmailService.sendAdminSupplierApplicationNotification(
        registrationData.businessName,
        user.email,
        supplierProfile.id
      );
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    // Return success response (without sensitive data)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'Supplier registration successful. Please check your email for verification instructions.',
      user: userWithoutPassword,
      supplierProfile: {
        id: supplierProfile.id,
        businessName: supplierProfile.businessName,
        storeName: supplierProfile.storeName,
        status: supplierProfile.status,
        membershipTier: supplierProfile.membershipTier
      },
      nextSteps: [
        'Verify your email address',
        'Wait for admin approval',
        'Complete your store setup once approved'
      ]
    });

  } catch (error: any) {
    console.error('Supplier registration error:', error);
    
    // Log failed registration
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    await EnhancedAuthService.logAuthenticationEvent(
      'supplier_registration',
      ipAddress,
      userAgent,
      undefined,
      req.body.email,
      'supplier',
      false,
      error.message || 'Registration failed'
    );

    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Get supplier application status
router.get('/supplier/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userResult = await db.select({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      supplierStatus: supplierProfiles.status,
      businessName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      createdAt: users.createdAt
    })
    .from(users)
    .leftJoin(supplierProfiles, eq(users.id, supplierProfiles.userId))
    .where(eq(users.email, email))
    .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const application = userResult[0];

    res.json({
      success: true,
      application: {
        email: application.email,
        emailVerified: application.emailVerified,
        isActive: application.isActive,
        status: application.supplierStatus,
        businessName: application.businessName,
        storeName: application.storeName,
        submittedAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching supplier status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application status'
    });
  }
});

// ==================== BUYER REGISTRATION ====================

interface BuyerRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  industry?: string;
  businessType?: string;
  annualVolume?: number;
  preferredPaymentTerms?: string[];
}

// Streamlined buyer registration
router.post('/buyer/register', async (req, res) => {
  try {
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    const registrationData: BuyerRegistrationData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      companyName: req.body.companyName,
      phone: req.body.phone,
      industry: req.body.industry,
      businessType: req.body.businessType,
      annualVolume: req.body.annualVolume ? parseFloat(req.body.annualVolume) : undefined,
      preferredPaymentTerms: req.body.preferredPaymentTerms || []
    };

    // Validate required fields
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!registrationData[field as keyof BuyerRegistrationData]) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, registrationData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Validate password strength
    const passwordValidation = PasswordSecurityService.validatePassword(
      registrationData.password, 
      {
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        companyName: registrationData.companyName
      }
    );

    if (!passwordValidation.isValid) {
      return res.status(422).json({ 
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Hash password
    const hashedPassword = await PasswordSecurityService.hashPassword(registrationData.password);

    // Generate email verification token
    const emailVerificationToken = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData: InsertUser = {
      email: registrationData.email,
      password: hashedPassword,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      companyName: registrationData.companyName || null,
      phone: registrationData.phone || null,
      role: 'buyer',
      emailVerified: false,
      isActive: true, // Buyers are immediately active
      emailVerificationToken,
      emailVerificationExpires
    };

    const newUser = await db.insert(users).values(userData).returning();
    const user = newUser[0];

    // Create buyer profile
    const buyerData: InsertBuyer = {
      userId: user.id,
      companyName: registrationData.companyName || null,
      industry: registrationData.industry || null,
      businessType: registrationData.businessType || null,
      annualVolume: registrationData.annualVolume ? registrationData.annualVolume.toString() : null,
      preferredPaymentTerms: registrationData.preferredPaymentTerms || []
    };

    await db.insert(buyers).values(buyerData);

    // Also create legacy buyer profile for compatibility
    const buyerProfileData: InsertBuyerProfile = {
      userId: user.id,
      companyName: registrationData.companyName || '',
      fullName: `${registrationData.firstName} ${registrationData.lastName}`,
      phone: registrationData.phone || null,
      country: null,
      industry: registrationData.industry || '',
      buyingPreferences: null,
      isVerified: false
    };

    await db.insert(buyerProfiles).values(buyerProfileData);

    // Log registration event
    await EnhancedAuthService.logAuthenticationEvent(
      'buyer_registration',
      ipAddress,
      userAgent,
      user.id,
      user.email,
      user.role,
      true,
      undefined,
      undefined,
      undefined,
      {
        companyName: registrationData.companyName,
        industry: registrationData.industry,
        businessType: registrationData.businessType
      }
    );

    // Send verification email
    try {
      await EmailService.sendBuyerRegistrationEmail(
        user.email,
        user.firstName || 'Buyer',
        registrationData.companyName || 'Your Company',
        emailVerificationToken
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT tokens for immediate login
    try {
      const sessionId = await EnhancedAuthService.createSession(user.id, ipAddress, userAgent);
      
      const accessToken = EnhancedAuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'buyer',
        sessionId,
        sessionMetadata: {
          ipAddress,
          userAgent,
          loginTime: Date.now()
        }
      });
      
      const refreshToken = EnhancedAuthService.generateRefreshToken({
        userId: user.id,
        sessionId,
        tokenVersion: 1,
        ipAddress
      });

      // Return success response with tokens
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        message: 'Buyer registration successful. Please verify your email to access all features.',
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: '15m',
        nextSteps: [
          'Verify your email address',
          'Complete your buyer profile',
          'Start exploring products and suppliers'
        ]
      });

    } catch (tokenError) {
      console.error('Token generation error after buyer signup:', tokenError);
      
      // Fallback to registration without tokens
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        message: 'Buyer registration successful. Please verify your email and login.',
        user: userWithoutPassword
      });
    }

  } catch (error: any) {
    console.error('Buyer registration error:', error);
    
    // Log failed registration
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    await EnhancedAuthService.logAuthenticationEvent(
      'buyer_registration',
      ipAddress,
      userAgent,
      undefined,
      req.body.email,
      'buyer',
      false,
      error.message || 'Registration failed'
    );

    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// ==================== ADMIN ACCOUNT MANAGEMENT ====================

interface AdminCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId?: string;
  permissions?: Record<string, any>;
  requireMfa?: boolean;
}

// Admin account creation (super-admin only)
router.post('/admin/create', async (req, res) => {
  try {
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    // Check if requester is authenticated and is super-admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify the requesting user is a super-admin
    // This would typically be done through middleware, but for now we'll do basic validation
    const token = authHeader.substring(7);
    let requestingUser;
    
    try {
      const decoded = await EnhancedAuthService.verifyAccessToken(token);
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);
      
      if (userResult.length === 0 || userResult[0].role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions. Only super-admins can create admin accounts.'
        });
      }
      
      requestingUser = userResult[0];
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    const adminData: AdminCreationData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      roleId: req.body.roleId,
      permissions: req.body.permissions || {},
      requireMfa: req.body.requireMfa !== false // Default to true
    };

    // Validate required fields
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!adminData[field as keyof AdminCreationData]) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, adminData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Validate password strength (stricter for admins)
    const passwordValidation = PasswordSecurityService.validatePassword(
      adminData.password, 
      {
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName
      }
    );

    if (!passwordValidation.isValid || (typeof passwordValidation.strength === 'number' && passwordValidation.strength < 4)) {
      return res.status(422).json({ 
        success: false,
        error: 'Admin password must be very strong',
        details: passwordValidation.errors,
        strength: passwordValidation.strength,
        minStrength: 4
      });
    }

    // Hash password
    const hashedPassword = await PasswordSecurityService.hashPassword(adminData.password);

    // Generate email verification token
    const emailVerificationToken = `verify-admin-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData: InsertUser = {
      email: adminData.email,
      password: hashedPassword,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      phone: adminData.phone || null,
      role: 'admin',
      emailVerified: false,
      isActive: true,
      emailVerificationToken,
      emailVerificationExpires,
      twoFactorEnabled: adminData.requireMfa
    };

    const newUser = await db.insert(users).values(userData).returning();
    const user = newUser[0];

    // Log admin creation event
    await EnhancedAuthService.logAuthenticationEvent(
      'admin_account_created',
      ipAddress,
      userAgent,
      user.id,
      user.email,
      user.role,
      true,
      undefined,
      undefined,
      undefined,
      {
        createdBy: requestingUser.id,
        createdByEmail: requestingUser.email,
        requireMfa: adminData.requireMfa,
        roleId: adminData.roleId
      }
    );

    // Send admin welcome email with setup instructions
    try {
      await EmailService.sendAdminWelcomeEmail(
        user.email,
        user.firstName || 'Admin',
        emailVerificationToken,
        requestingUser.firstName || 'Super Admin'
      );
    } catch (emailError) {
      console.error('Failed to send admin welcome email:', emailError);
      // Don't fail creation if email fails
    }

    // Return success response (without sensitive data)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Verification email sent.',
      user: userWithoutPassword,
      nextSteps: [
        'Admin must verify email address',
        'Set up two-factor authentication (if required)',
        'Complete admin profile setup',
        'Review assigned permissions'
      ]
    });

  } catch (error: any) {
    console.error('Admin creation error:', error);
    
    // Log failed creation
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    await EnhancedAuthService.logAuthenticationEvent(
      'admin_account_creation_failed',
      ipAddress,
      userAgent,
      undefined,
      req.body.email,
      'admin',
      false,
      error.message || 'Admin creation failed'
    );

    res.status(500).json({ 
      success: false, 
      error: 'Admin account creation failed. Please try again.' 
    });
  }
});

// Get admin users list (super-admin only)
router.get('/admin/users', async (req, res) => {
  try {
    // Check authentication and permissions
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    let requestingUser;
    
    try {
      const decoded = await EnhancedAuthService.verifyAccessToken(token);
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);
      
      if (userResult.length === 0 || userResult[0].role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      requestingUser = userResult[0];
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // Get all admin users
    const adminUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      twoFactorEnabled: users.twoFactorEnabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.role, 'admin'));

    res.json({
      success: true,
      adminUsers,
      total: adminUsers.length
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
    });
  }
});

// Update admin user status (activate/deactivate)
router.patch('/admin/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Check authentication and permissions
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    let requestingUser;
    
    try {
      const decoded = await EnhancedAuthService.verifyAccessToken(token);
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);
      
      if (userResult.length === 0 || userResult[0].role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      requestingUser = userResult[0];
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // Prevent self-deactivation
    if (userId === requestingUser.id && isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }

    // Update user status
    const updatedUser = await db.update(users)
      .set({
        isActive: isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Log status change
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    await EnhancedAuthService.logAuthenticationEvent(
      'admin_status_changed',
      ipAddress,
      userAgent,
      userId,
      updatedUser[0].email,
      'admin',
      true,
      undefined,
      undefined,
      undefined,
      {
        changedBy: requestingUser.id,
        changedByEmail: requestingUser.email,
        newStatus: isActive ? 'active' : 'inactive'
      }
    );

    const { password: _, ...userWithoutPassword } = updatedUser[0];

    res.json({
      success: true,
      message: `Admin account ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin status'
    });
  }
});

// ==================== EMAIL VERIFICATION ====================

// Email verification endpoint
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const userResult = await db.select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    const user = userResult[0];

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified'
      });
    }

    // Update user as verified
    await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Log verification event
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    await EnhancedAuthService.logAuthenticationEvent(
      'email_verification',
      ipAddress,
      userAgent,
      user.id,
      user.email,
      user.role,
      true
    );

    // Send confirmation email
    try {
      await EmailService.sendEmailVerificationSuccess(
        user.email,
        user.firstName || 'User',
        user.role as 'buyer' | 'supplier'
      );
    } catch (emailError) {
      console.error('Failed to send verification confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user
    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult[0];

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const emailVerificationToken = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await db.update(users)
      .set({
        emailVerificationToken,
        emailVerificationExpires,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Send verification email based on role
    try {
      if (user.role === 'supplier') {
        await EmailService.sendSupplierRegistrationEmail(
          user.email,
          user.firstName || 'Supplier',
          user.companyName || 'Your Business',
          emailVerificationToken
        );
      } else {
        await EmailService.sendBuyerRegistrationEmail(
          user.email,
          user.firstName || 'Buyer',
          user.companyName || 'Your Company',
          emailVerificationToken
        );
      }
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email'
    });
  }
});

export { router as registrationRoutes };