import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import {
    users, supplierProfiles, products, categories, rfqs, inquiries, quotations, inquiryQuotations, orders, reviews,
    InsertSupplierProfile, InsertProduct
} from '@shared/schema';
import { eq, and, desc, sql, ilike, or, gte, asc } from 'drizzle-orm';
import { authMiddleware } from './auth';
import { checkSupplierRestriction, warnCreditLimit } from './restrictionMiddleware';
import { uploadMultiple, uploadSingle, uploadSingleFile } from './upload';
import { z } from 'zod';
import { calculateCommission } from './commissionRoutes';

const router = Router();

// Validation schemas
const supplierRegistrationSchema = z.object({
    // User fields
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),

    // Supplier profile fields
    businessName: z.string().min(1),
    businessType: z.enum(['manufacturer', 'trading_company', 'wholesaler']),
    storeName: z.string().min(1),
    contactPerson: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),

    // Optional fields
    position: z.string().optional(),
    whatsapp: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
    employeesCount: z.string().optional(),
    annualRevenue: z.string().optional(),
    mainProducts: z.array(z.string()).optional(),
    exportMarkets: z.array(z.string()).optional(),
});

// Helper function to generate unique store slug
async function generateStoreSlug(storeName: string): Promise<string> {
    const baseSlug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

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

// Supplier registration endpoint
router.post('/register', async (req, res) => {
    try {
        // Validate input
        const validatedData = supplierRegistrationSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.email, validatedData.email))
            .limit(1);

        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }

        // Check if store name already exists
        const existingStore = await db.select()
            .from(supplierProfiles)
            .where(eq(supplierProfiles.storeName, validatedData.storeName))
            .limit(1);

        if (existingStore.length > 0) {
            return res.status(409).json({ error: 'Store name already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        // Generate unique store slug
        const storeSlug = await generateStoreSlug(validatedData.storeName);

        // Create user with supplier role
        const newUser = await db.insert(users).values({
            email: validatedData.email,
            password: hashedPassword,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            role: 'supplier',
            emailVerified: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        const user = newUser[0];

        // Create supplier profile
        const supplierProfileData: InsertSupplierProfile = {
            userId: user.id,
            businessName: validatedData.businessName,
            businessType: validatedData.businessType,
            storeName: validatedData.storeName,
            storeSlug: storeSlug,
            contactPerson: validatedData.contactPerson,
            phone: validatedData.phone,
            address: validatedData.address,
            city: validatedData.city,
            country: validatedData.country,
            position: validatedData.position || null,
            whatsapp: validatedData.whatsapp || null,
            website: validatedData.website || null,
            yearEstablished: validatedData.yearEstablished || null,
            employeesCount: validatedData.employeesCount || null,
            annualRevenue: validatedData.annualRevenue || null,
            mainProducts: validatedData.mainProducts || [],
            exportMarkets: validatedData.exportMarkets || [],
            verificationLevel: 'none',
            isVerified: false,
            status: 'pending',
            isActive: false,
            isFeatured: false
        };

        await db.insert(supplierProfiles).values(supplierProfileData);

        // Return success response (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            message: 'Supplier registration successful. Your account is pending approval.',
            user: userWithoutPassword,
            storeSlug: storeSlug
        });

    } catch (error: any) {
        console.error('Supplier registration error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get public supplier profile by ID (no auth required)
router.get('/:id/profile', async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await db.select()
            .from(supplierProfiles)
            .where(eq(supplierProfiles.id, id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        // Return public profile information
        res.json(profile[0]);

    } catch (error: any) {
        console.error('Get public supplier profile error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier profile' });
    }
});

// Get supplier profile (authenticated)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const profile = await db.select()
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            profile: profile[0]
        });

    } catch (error: any) {
        console.error('Get supplier profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update supplier profile (authenticated)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Validation schema for profile updates (excluding user fields)
        const updateSchema = z.object({
            businessName: z.string().min(1).optional(),
            businessType: z.enum(['manufacturer', 'trading_company', 'wholesaler']).optional(),
            storeName: z.string().min(1).optional(),
            storeDescription: z.string().optional(),
            contactPerson: z.string().min(1).optional(),
            position: z.string().optional(),
            phone: z.string().min(1).optional(),
            whatsapp: z.string().optional(),
            address: z.string().min(1).optional(),
            city: z.string().min(1).optional(),
            country: z.string().min(1).optional(),
            website: z.string().url().optional().or(z.literal('')),
            yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
            employeesCount: z.string().optional(),
            annualRevenue: z.string().optional(),
            mainProducts: z.array(z.string()).optional(),
            exportMarkets: z.array(z.string()).optional(),
            storePolicies: z.any().optional(),
            operatingHours: z.any().optional(),
        });

        const validatedData = updateSchema.parse(req.body);

        // Check if store name is being updated and if it already exists
        if (validatedData.storeName) {
            const existingStore = await db.select()
                .from(supplierProfiles)
                .where(and(
                    eq(supplierProfiles.storeName, validatedData.storeName),
                    eq(supplierProfiles.userId, req.user.id)
                ))
                .limit(1);

            if (existingStore.length === 0) {
                // Check if another supplier has this store name
                const otherStore = await db.select()
                    .from(supplierProfiles)
                    .where(eq(supplierProfiles.storeName, validatedData.storeName))
                    .limit(1);

                if (otherStore.length > 0) {
                    return res.status(409).json({ error: 'Store name already exists' });
                }
            }
        }

        // Update profile
        const updateData: any = {
            ...validatedData,
            updatedAt: new Date()
        };

        // Generate new slug if store name is being updated
        if (validatedData.storeName) {
            updateData.storeSlug = await generateStoreSlug(validatedData.storeName);
        }

        const updatedProfile = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .returning();

        if (updatedProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedProfile[0]
        });

    } catch (error: any) {
        console.error('Update supplier profile error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Upload verification documents
router.post('/verification/upload', authMiddleware, uploadMultiple, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get current verification documents
        const currentProfile = await db.select()
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (currentProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const existingDocs = (currentProfile[0].verificationDocuments as any) || {};

        // Process uploaded files
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            url: `/uploads/${file.filename}`,
            uploadedAt: new Date().toISOString()
        }));

        // Update verification documents
        const updatedDocs = {
            ...existingDocs,
            documents: [
                ...(existingDocs.documents || []),
                ...uploadedFiles
            ],
            lastUpdated: new Date().toISOString()
        };

        await db.update(supplierProfiles)
            .set({
                verificationDocuments: updatedDocs,
                updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, req.user.id));

        res.json({
            success: true,
            message: 'Verification documents uploaded successfully',
            files: uploadedFiles
        });

    } catch (error: any) {
        console.error('Verification upload error:', error);
        res.status(500).json({ error: 'Failed to upload verification documents' });
    }
});

// Get verification status
router.get('/verification/status', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const profile = await db.select({
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            verifiedAt: supplierProfiles.verifiedAt,
            verificationDocuments: supplierProfiles.verificationDocuments,
            status: supplierProfiles.status
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            verification: profile[0]
        });

    } catch (error: any) {
        console.error('Get verification status error:', error);
        res.status(500).json({ error: 'Failed to fetch verification status' });
    }
});

// ==================== STORE CUSTOMIZATION API ====================

// Upload store logo
router.post('/store/logo', authMiddleware, uploadSingleFile, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No logo file uploaded' });
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        const updatedProfile = await db.update(supplierProfiles)
            .set({
                storeLogo: logoUrl,
                updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, req.user.id))
            .returning();

        if (updatedProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            message: 'Store logo updated successfully',
            logoUrl: logoUrl
        });

    } catch (error: any) {
        console.error('Store logo upload error:', error);
        res.status(500).json({ error: 'Failed to upload store logo' });
    }
});

// Upload store banner
router.post('/store/banner', authMiddleware, uploadSingleFile, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No banner file uploaded' });
        }

        const bannerUrl = `/uploads/${req.file.filename}`;

        const updatedProfile = await db.update(supplierProfiles)
            .set({
                storeBanner: bannerUrl,
                updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, req.user.id))
            .returning();

        if (updatedProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            message: 'Store banner updated successfully',
            bannerUrl: bannerUrl
        });

    } catch (error: any) {
        console.error('Store banner upload error:', error);
        res.status(500).json({ error: 'Failed to upload store banner' });
    }
});

// Get store customization data
router.get('/store', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const profile = await db.select({
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeDescription: supplierProfiles.storeDescription,
            storeLogo: supplierProfiles.storeLogo,
            storeBanner: supplierProfiles.storeBanner,
            storePolicies: supplierProfiles.storePolicies,
            operatingHours: supplierProfiles.operatingHours,
            isActive: supplierProfiles.isActive,
            isFeatured: supplierProfiles.isFeatured
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            store: profile[0]
        });

    } catch (error: any) {
        console.error('Get store data error:', error);
        res.status(500).json({ error: 'Failed to fetch store data' });
    }
});

// Update store customization
router.put('/store', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const updateStoreSchema = z.object({
            storeName: z.string().min(1).optional(),
            storeDescription: z.string().optional(),
            storePolicies: z.object({
                shipping: z.string().optional(),
                returns: z.string().optional(),
                payment: z.string().optional(),
                warranty: z.string().optional()
            }).optional(),
            operatingHours: z.object({
                monday: z.string().optional(),
                tuesday: z.string().optional(),
                wednesday: z.string().optional(),
                thursday: z.string().optional(),
                friday: z.string().optional(),
                saturday: z.string().optional(),
                sunday: z.string().optional(),
                timezone: z.string().optional()
            }).optional()
        });

        const validatedData = updateStoreSchema.parse(req.body);

        // Check if store name is being updated and if it already exists
        if (validatedData.storeName) {
            const existingStore = await db.select()
                .from(supplierProfiles)
                .where(and(
                    eq(supplierProfiles.storeName, validatedData.storeName),
                    eq(supplierProfiles.userId, req.user.id)
                ))
                .limit(1);

            if (existingStore.length === 0) {
                // Check if another supplier has this store name
                const otherStore = await db.select()
                    .from(supplierProfiles)
                    .where(eq(supplierProfiles.storeName, validatedData.storeName))
                    .limit(1);

                if (otherStore.length > 0) {
                    return res.status(409).json({ error: 'Store name already exists' });
                }
            }
        }

        const updateData: any = {
            ...validatedData,
            updatedAt: new Date()
        };

        // Generate new slug if store name is being updated
        if (validatedData.storeName) {
            updateData.storeSlug = await generateStoreSlug(validatedData.storeName);
        }

        const updatedProfile = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .returning();

        if (updatedProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            message: 'Store updated successfully',
            store: {
                storeName: updatedProfile[0].storeName,
                storeSlug: updatedProfile[0].storeSlug,
                storeDescription: updatedProfile[0].storeDescription,
                storePolicies: updatedProfile[0].storePolicies,
                operatingHours: updatedProfile[0].operatingHours
            }
        });

    } catch (error: any) {
        console.error('Update store error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update store' });
    }
});

// ==================== PERFORMANCE METRICS API ====================

// Get supplier performance metrics
router.get('/metrics', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const profile = await db.select({
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            responseRate: supplierProfiles.responseRate,
            responseTime: supplierProfiles.responseTime,
            totalSales: supplierProfiles.totalSales,
            totalOrders: supplierProfiles.totalOrders,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            status: supplierProfiles.status,
            isActive: supplierProfiles.isActive,
            isFeatured: supplierProfiles.isFeatured,
            createdAt: supplierProfiles.createdAt
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            metrics: profile[0]
        });

    } catch (error: any) {
        console.error('Get supplier metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier metrics' });
    }
});

// Update supplier performance metrics (internal use - typically called by system)
router.put('/metrics', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const updateMetricsSchema = z.object({
            responseRate: z.number().min(0).max(100).optional(),
            responseTime: z.string().optional(),
            // Note: rating, totalReviews, totalSales, totalOrders are typically updated by system events
        });

        const validatedData = updateMetricsSchema.parse(req.body);

        // Convert number fields to strings for decimal columns
        const updateData: any = {
            ...validatedData,
            updatedAt: new Date()
        };

        if (validatedData.responseRate !== undefined) {
            updateData.responseRate = validatedData.responseRate.toString();
        }

        const updatedProfile = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .returning();

        if (updatedProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            message: 'Metrics updated successfully',
            metrics: {
                responseRate: updatedProfile[0].responseRate,
                responseTime: updatedProfile[0].responseTime
            }
        });

    } catch (error: any) {
        console.error('Update supplier metrics error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update metrics' });
    }
});

// ==================== TEST DATA API ====================

// Create test supplier data (development only)
router.post('/test/create-sample-data', async (req, res) => {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        // Sample suppliers data
        const sampleSuppliers = [
            {
                businessName: 'Tech Innovations Ltd',
                businessType: 'manufacturer' as const,
                storeName: 'Tech Innovations Ltd',
                storeSlug: 'tech-innovations-ltd',
                storeDescription: 'Leading manufacturer of electronic components and IoT devices with over 15 years of experience in the industry.',
                contactPerson: 'John Smith',
                position: 'Sales Manager',
                phone: '+1-555-0123',
                whatsapp: '+1-555-0123',
                address: '123 Tech Street',
                city: 'San Francisco',
                country: 'USA',
                website: 'https://techinnovations.com',
                yearEstablished: 2008,
                employeesCount: '100-200',
                annualRevenue: '$10M - $50M',
                mainProducts: ['Electronic Components', 'IoT Devices', 'Sensors', 'Microcontrollers'],
                exportMarkets: ['North America', 'Europe', 'Asia Pacific'],
                verificationLevel: 'premium',
                isVerified: true,
                rating: '4.8',
                totalReviews: 127,
                responseRate: '98',
                responseTime: '< 2h',
                totalSales: '2500000',
                totalOrders: 1250,
                status: 'approved',
                isActive: true,
                isFeatured: true,
                storePolicies: {
                    shipping: 'Free shipping on orders over $500. Standard delivery 5-7 business days.',
                    returns: '30-day return policy for defective items. Return shipping paid by seller.',
                    payment: 'T/T, L/C, PayPal accepted. 30% deposit, 70% before shipment.',
                    warranty: '1-year warranty on all electronic components.'
                }
            },
            {
                businessName: 'Global Textiles Co',
                businessType: 'manufacturer' as const,
                storeName: 'Global Textiles Co',
                storeSlug: 'global-textiles-co',
                storeDescription: 'Premium textile manufacturer specializing in sustainable fabrics and custom textile solutions.',
                contactPerson: 'Maria Garcia',
                position: 'Export Manager',
                phone: '+86-138-0013-8000',
                address: '456 Textile Avenue',
                city: 'Guangzhou',
                country: 'China',
                website: 'https://globaltextiles.com',
                yearEstablished: 2003,
                employeesCount: '200-500',
                annualRevenue: '$50M - $100M',
                mainProducts: ['Cotton Fabrics', 'Synthetic Textiles', 'Eco-friendly Materials', 'Custom Textiles'],
                exportMarkets: ['Europe', 'North America', 'South America', 'Africa'],
                verificationLevel: 'business',
                isVerified: true,
                rating: '4.6',
                totalReviews: 89,
                responseRate: '95',
                responseTime: '< 4h',
                totalSales: '1800000',
                totalOrders: 890,
                status: 'approved',
                isActive: true,
                isFeatured: false
            },
            {
                businessName: 'Precision Machinery Corp',
                businessType: 'manufacturer' as const,
                storeName: 'Precision Machinery',
                storeSlug: 'precision-machinery',
                storeDescription: 'Industrial machinery and automation solutions for manufacturing industries worldwide.',
                contactPerson: 'Hans Mueller',
                position: 'Technical Director',
                phone: '+49-30-12345678',
                address: '789 Industrial Park',
                city: 'Munich',
                country: 'Germany',
                website: 'https://precisionmachinery.de',
                yearEstablished: 1995,
                employeesCount: '50-100',
                annualRevenue: '$5M - $10M',
                mainProducts: ['CNC Machines', 'Automation Equipment', 'Industrial Robots', 'Precision Tools'],
                exportMarkets: ['Europe', 'Asia', 'North America'],
                verificationLevel: 'business',
                isVerified: true,
                rating: '4.9',
                totalReviews: 45,
                responseRate: '100',
                responseTime: '< 1h',
                totalSales: '850000',
                totalOrders: 156,
                status: 'approved',
                isActive: true,
                isFeatured: true
            }
        ];

        // Create users and supplier profiles
        const createdSuppliers = [];
        for (const supplierData of sampleSuppliers) {
            // Create user
            const hashedPassword = await bcrypt.hash('password123', 12);
            const newUser = await db.insert(users).values({
                email: `${supplierData.storeSlug}@example.com`,
                password: hashedPassword,
                firstName: supplierData.contactPerson.split(' ')[0],
                lastName: supplierData.contactPerson.split(' ')[1] || '',
                role: 'supplier',
                emailVerified: true,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            // Create supplier profile
            const supplierProfile = await db.insert(supplierProfiles).values({
                userId: newUser[0].id,
                ...supplierData,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            createdSuppliers.push(supplierProfile[0]);
        }

        res.json({
            success: true,
            message: 'Sample supplier data created successfully',
            suppliers: createdSuppliers.map(s => ({
                id: s.id,
                storeName: s.storeName,
                storeSlug: s.storeSlug
            }))
        });

    } catch (error: any) {
        console.error('Create sample data error:', error);
        res.status(500).json({ error: 'Failed to create sample data' });
    }
});

// ==================== PUBLIC STORE API ====================

// Get public supplier store data by slug
router.get('/store/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Get supplier profile with store information
        const supplierProfile = await db.select({
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeDescription: supplierProfiles.storeDescription,
            storeLogo: supplierProfiles.storeLogo,
            storeBanner: supplierProfiles.storeBanner,
            contactPerson: supplierProfiles.contactPerson,
            position: supplierProfiles.position,
            phone: supplierProfiles.phone,
            whatsapp: supplierProfiles.whatsapp,
            address: supplierProfiles.address,
            city: supplierProfiles.city,
            country: supplierProfiles.country,
            website: supplierProfiles.website,
            yearEstablished: supplierProfiles.yearEstablished,
            employeesCount: supplierProfiles.employeesCount,
            annualRevenue: supplierProfiles.annualRevenue,
            mainProducts: supplierProfiles.mainProducts,
            exportMarkets: supplierProfiles.exportMarkets,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            responseRate: supplierProfiles.responseRate,
            responseTime: supplierProfiles.responseTime,
            totalSales: supplierProfiles.totalSales,
            totalOrders: supplierProfiles.totalOrders,
            status: supplierProfiles.status,
            isActive: supplierProfiles.isActive,
            isFeatured: supplierProfiles.isFeatured,
            storePolicies: supplierProfiles.storePolicies,
            operatingHours: supplierProfiles.operatingHours,
            createdAt: supplierProfiles.createdAt
        })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.storeSlug, slug),
                eq(supplierProfiles.isActive, true),
                eq(supplierProfiles.status, 'approved')
            ))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier store not found' });
        }

        const supplier = supplierProfile[0];

        // Get supplier's published products with category information
        const supplierProducts = await db.select({
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
            isFeatured: products.isFeatured,
            views: products.views,
            inquiries: products.inquiries,
            hasTradeAssurance: products.hasTradeAssurance,
            certifications: products.certifications,
            approvalStatus: products.approvalStatus,
            createdAt: products.createdAt,
            // Category information
            categoryName: categories.name
        })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(and(
                eq(products.supplierId, supplier.id),
                eq(products.isPublished, true),
                eq(products.approvalStatus, 'approved')
            ))
            .orderBy(desc(products.isFeatured), desc(products.createdAt));

        // Calculate additional metrics
        const totalProducts = supplierProducts.length;
        const featuredProducts = supplierProducts.filter(p => p.isFeatured).length;
        const totalViews = supplierProducts.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalInquiries = supplierProducts.reduce((sum, p) => sum + (p.inquiries || 0), 0);

        // Get categories for this supplier's products
        const supplierCategories = await db.select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            productCount: sql`count(${products.id})::int`
        })
            .from(categories)
            .innerJoin(products, and(
                eq(products.categoryId, categories.id),
                eq(products.supplierId, supplier.id),
                eq(products.isPublished, true),
                eq(products.approvalStatus, 'approved')
            ))
            .groupBy(categories.id, categories.name, categories.slug)
            .orderBy(desc(sql`count(${products.id})`));

        res.json({
            success: true,
            supplier: {
                ...supplier,
                metrics: {
                    totalProducts,
                    featuredProducts,
                    totalViews,
                    totalInquiries
                }
            },
            products: supplierProducts,
            categories: supplierCategories
        });

    } catch (error: any) {
        console.error('Get supplier store error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier store' });
    }
});

// Get supplier store products with filters
router.get('/store/:slug/products', async (req, res) => {
    try {
        const { slug } = req.params;
        const {
            categoryId,
            search,
            featured,
            minPrice,
            maxPrice,
            inStock,
            page = '1',
            limit = '20'
        } = req.query;

        // Get supplier profile
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.storeSlug, slug),
                eq(supplierProfiles.isActive, true),
                eq(supplierProfiles.status, 'approved')
            ))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier store not found' });
        }

        const supplierId = supplierProfile[0].id;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const offset = (pageNum - 1) * limitNum;

        // Build query conditions
        const conditions = [
            eq(products.supplierId, supplierId),
            eq(products.isPublished, true),
            eq(products.approvalStatus, 'approved')
        ];

        if (categoryId) {
            conditions.push(eq(products.categoryId, categoryId as string));
        }

        if (featured === 'true') {
            conditions.push(eq(products.isFeatured, true));
        }

        if (inStock === 'true') {
            conditions.push(eq(products.inStock, true));
        }

        if (search) {
            const searchPattern = `%${search}%`;
            conditions.push(
                or(
                    ilike(products.name, searchPattern),
                    ilike(products.description, searchPattern)
                )
            );
        }

        // Get products with pagination
        const supplierProducts = await db.select({
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
            isFeatured: products.isFeatured,
            views: products.views,
            inquiries: products.inquiries,
            hasTradeAssurance: products.hasTradeAssurance,
            certifications: products.certifications,
            createdAt: products.createdAt,
            // Category information
            categoryName: categories.name
        })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(and(...conditions))
            .orderBy(desc(products.isFeatured), desc(products.createdAt))
            .limit(limitNum)
            .offset(offset);

        // Get total count for pagination
        const totalCountResult = await db.select({ count: sql`count(*)::int` })
            .from(products)
            .where(and(...conditions));

        const totalCount = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            products: supplierProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error: any) {
        console.error('Get supplier store products error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier products' });
    }
});

// ==================== STATUS MANAGEMENT API ====================

// Get supplier status information
router.get('/status', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const profile = await db.select({
            status: supplierProfiles.status,
            isActive: supplierProfiles.isActive,
            isFeatured: supplierProfiles.isFeatured,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            verifiedAt: supplierProfiles.verifiedAt,
            createdAt: supplierProfiles.createdAt,
            updatedAt: supplierProfiles.updatedAt
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        res.json({
            success: true,
            status: profile[0]
        });

    } catch (error: any) {
        console.error('Get supplier status error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier status' });
    }
});

// Update supplier active status (supplier can activate/deactivate their store)
router.put('/status/active', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const updateActiveSchema = z.object({
            isActive: z.boolean()
        });

        const validatedData = updateActiveSchema.parse(req.body);

        // Check if supplier is approved before allowing activation
        const currentProfile = await db.select({
            status: supplierProfiles.status,
            isVerified: supplierProfiles.isVerified
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user!.id))
            .limit(1);

        if (currentProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        if (validatedData.isActive && currentProfile[0].status !== 'approved') {
            return res.status(400).json({
                error: 'Cannot activate store. Supplier must be approved by admin first.',
                currentStatus: currentProfile[0].status
            });
        }

        const updatedProfile = await db.update(supplierProfiles)
            .set({
                isActive: validatedData.isActive,
                updatedAt: new Date()
            })
            .where(eq(supplierProfiles.userId, req.user!.id))
            .returning();

        res.json({
            success: true,
            message: `Store ${validatedData.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: updatedProfile[0].isActive
        });

    } catch (error: any) {
        console.error('Update supplier active status error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update active status' });
    }
});

// ==================== SUPPLIER DASHBOARD STATS ====================

// Get supplier dashboard statistics
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        // Get product statistics
        const productStats = await db.select({
            totalProducts: sql`count(*)`,
            publishedProducts: sql`count(*) filter (where ${products.isPublished} = true)`,
            pendingApproval: sql`count(*) filter (where ${products.approvalStatus} = 'pending')`,
            totalViews: sql`coalesce(sum(${products.views}), 0)`,
            totalInquiries: sql`coalesce(sum(${products.inquiries}), 0)`
        })
            .from(products)
            .where(eq(products.supplierId, supplierId));

        // Get inquiry statistics
        const inquiryStats = await db.select({
            totalInquiries: sql`count(*)`,
            pendingInquiries: sql`count(*) filter (where ${inquiries.status} = 'pending')`,
            repliedInquiries: sql`count(*) filter (where ${inquiries.status} = 'replied')`,
            quotedInquiries: sql`count(*) filter (where ${inquiries.status} = 'quoted')`
        })
            .from(inquiries)
            .where(eq(inquiries.supplierId, supplierId));

        // Get quotation statistics
        const quotationStats = await db.select({
            totalQuotations: sql`count(*)`,
            sentQuotations: sql`count(*) filter (where ${quotations.status} = 'sent')`,
            acceptedQuotations: sql`count(*) filter (where ${quotations.status} = 'accepted')`,
            rejectedQuotations: sql`count(*) filter (where ${quotations.status} = 'rejected')`
        })
            .from(quotations)
            .where(eq(quotations.supplierId, supplierId));

        // Get order statistics
        const orderStats = await db.select({
            totalOrders: sql`count(*)`,
            pendingOrders: sql`count(*) filter (where ${orders.status} = 'pending')`,
            confirmedOrders: sql`count(*) filter (where ${orders.status} = 'confirmed')`,
            completedOrders: sql`count(*) filter (where ${orders.status} = 'delivered')`,
            totalRevenue: sql`coalesce(sum(case when ${orders.status} = 'delivered' then ${orders.totalAmount} else 0 end), 0)`
        })
            .from(orders)
            .where(eq(orders.supplierId, supplierId));

        // Get RFQ statistics
        const rfqStats = await db.select({
            totalRfqs: sql`count(*)`,
            newRfqs: sql`count(*) filter (where ${rfqs.status} = 'open' and ${rfqs.quotationsCount} = 0)`,
            respondedRfqs: sql`count(*) filter (where ${rfqs.quotationsCount} > 0)`
        })
            .from(rfqs)
            .where(eq(rfqs.supplierId, supplierId));

        const stats = {
            totalProducts: parseInt(productStats[0]?.totalProducts as string || '0'),
            publishedProducts: parseInt(productStats[0]?.publishedProducts as string || '0'),
            pendingApproval: parseInt(productStats[0]?.pendingApproval as string || '0'),
            productViews: parseInt(productStats[0]?.totalViews as string || '0'),
            inquiriesReceived: parseInt(inquiryStats[0]?.totalInquiries as string || '0'),
            pendingInquiries: parseInt(inquiryStats[0]?.pendingInquiries as string || '0'),
            quotationsSent: parseInt(quotationStats[0]?.totalQuotations as string || '0'),
            acceptedQuotations: parseInt(quotationStats[0]?.acceptedQuotations as string || '0'),
            totalOrders: parseInt(orderStats[0]?.totalOrders as string || '0'),
            pendingOrders: parseInt(orderStats[0]?.pendingOrders as string || '0'),
            completedOrders: parseInt(orderStats[0]?.completedOrders as string || '0'),
            totalRevenue: parseFloat(orderStats[0]?.totalRevenue as string || '0'),
            totalRfqs: parseInt(rfqStats[0]?.totalRfqs as string || '0'),
            newRfqs: parseInt(rfqStats[0]?.newRfqs as string || '0'),
            respondedRfqs: parseInt(rfqStats[0]?.respondedRfqs as string || '0'),
            responseRate: inquiryStats[0]?.totalInquiries && parseInt(inquiryStats[0]?.totalInquiries as string) > 0
                ? Math.round((parseInt(inquiryStats[0]?.repliedInquiries as string || '0') / parseInt(inquiryStats[0]?.totalInquiries as string)) * 100)
                : 0,
            averageRating: 4.5 // This would come from a reviews system
        };

        res.json(stats);

    } catch (error: any) {
        console.error('Get supplier dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// ==================== SUPPLIER ORDER MANAGEMENT ====================

// Get supplier's orders
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { status, search, limit, offset } = req.query;

        // Build where conditions first
        const whereConditions = [eq(orders.supplierId, supplierId)];

        if (status) {
            whereConditions.push(eq(orders.status, status as string));
        }

        if (search) {
            whereConditions.push(
                or(
                    ilike(orders.orderNumber, `%${search}%`),
                    ilike(users.firstName, `%${search}%`),
                    ilike(users.lastName, `%${search}%`),
                    ilike(users.email, `%${search}%`),
                    ilike(products.name, `%${search}%`)
                )!
            );
        }

        // Build query with all conditions at once
        let query = db.select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            buyerId: orders.buyerId,
            productId: orders.productId,
            quantity: orders.quantity,
            unitPrice: orders.unitPrice,
            totalAmount: orders.totalAmount,
            shippingAmount: orders.shippingAmount,
            taxAmount: orders.taxAmount,
            items: orders.items,
            status: orders.status,
            paymentMethod: orders.paymentMethod,
            paymentStatus: orders.paymentStatus,
            shippingAddress: orders.shippingAddress,
            billingAddress: orders.billingAddress,
            trackingNumber: orders.trackingNumber,
            notes: orders.notes,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            // Buyer info
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            buyerCompany: users.companyName,
            // Product info
            productName: products.name,
            productImage: products.images
        })
            .from(orders)
            .leftJoin(users, eq(orders.buyerId, users.id))
            .leftJoin(products, eq(orders.productId, products.id))
            .where(and(...whereConditions))
            .orderBy(desc(orders.createdAt))
            .$dynamic();

        if (limit) {
            query = query.limit(parseInt(limit as string));
        }
        if (offset) {
            query = query.offset(parseInt(offset as string));
        }

        const supplierOrders = await query;

        // Get total count for pagination (reuse the same conditions)
        const [{ count }] = await db.select({ count: sql`count(*)` })
            .from(orders)
            .where(and(...whereConditions));

        res.json({
            success: true,
            orders: supplierOrders,
            total: parseInt(count as string),
            page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
            limit: limit ? parseInt(limit as string) : supplierOrders.length
        });

    } catch (error: any) {
        console.error('Get supplier orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get specific order details for supplier
router.get('/orders/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const order = await db.select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            buyerId: orders.buyerId,
            productId: orders.productId,
            quantity: orders.quantity,
            unitPrice: orders.unitPrice,
            totalAmount: orders.totalAmount,
            shippingAmount: orders.shippingAmount,
            taxAmount: orders.taxAmount,
            items: orders.items,
            status: orders.status,
            paymentMethod: orders.paymentMethod,
            paymentStatus: orders.paymentStatus,
            shippingAddress: orders.shippingAddress,
            billingAddress: orders.billingAddress,
            trackingNumber: orders.trackingNumber,
            notes: orders.notes,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
            // Buyer info
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            buyerCompany: users.companyName,
            buyerPhone: users.phone,
            // Product info
            productName: products.name,
            productImage: products.images,
            productDescription: products.description
        })
            .from(orders)
            .leftJoin(users, eq(orders.buyerId, users.id))
            .leftJoin(products, eq(orders.productId, products.id))
            .where(and(
                eq(orders.id, req.params.id),
                eq(orders.supplierId, supplierId)
            ))
            .limit(1);

        if (order.length === 0) {
            return res.status(404).json({ error: 'Order not found or access denied' });
        }

        res.json({
            success: true,
            order: order[0]
        });

    } catch (error: any) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// Update order status (supplier order fulfillment workflow)
router.patch('/orders/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const updateStatusSchema = z.object({
            status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']),
            trackingNumber: z.string().optional(),
            notes: z.string().optional()
        });

        const validatedData = updateStatusSchema.parse(req.body);

        // Verify order belongs to this supplier
        const existingOrder = await db.select()
            .from(orders)
            .where(and(
                eq(orders.id, req.params.id),
                eq(orders.supplierId, supplierId)
            ))
            .limit(1);

        if (existingOrder.length === 0) {
            return res.status(404).json({ error: 'Order not found or access denied' });
        }

        const currentOrder = existingOrder[0];

        // Validate status transition
        const validTransitions: Record<string, string[]> = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'completed'],
            'delivered': ['completed'],
            'completed': [],
            'cancelled': []
        };

        const currentStatus = currentOrder.status || 'pending';
        if (!validTransitions[currentStatus]?.includes(validatedData.status)) {
            return res.status(400).json({
                error: `Invalid status transition from ${currentStatus} to ${validatedData.status}`,
                validTransitions: validTransitions[currentStatus]
            });
        }

        // Prepare update data
        const updateData: any = {
            status: validatedData.status,
            updatedAt: new Date()
        };

        if (validatedData.trackingNumber) {
            updateData.trackingNumber = validatedData.trackingNumber;
        }

        if (validatedData.notes) {
            updateData.notes = (currentOrder.notes || '') + `\n\n[${new Date().toISOString()}] Status updated to ${validatedData.status}: ${validatedData.notes}`;
        } else {
            updateData.notes = (currentOrder.notes || '') + `\n\n[${new Date().toISOString()}] Status updated to ${validatedData.status}`;
        }

        // Update order
        const updatedOrder = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, req.params.id))
            .returning();

        // Mark commission as paid when order is delivered or completed
        if (validatedData.status === 'delivered' || validatedData.status === 'completed') {
            try {
                const { markCommissionPaid } = await import('./commissionRoutes');
                await markCommissionPaid(req.params.id);
                console.log('✅ Commission marked as paid for order:', req.params.id);
            } catch (error) {
                console.error('⚠️ Failed to mark commission as paid:', error);
                // Don't fail the order update if commission update fails
            }
        }

        // Send notification to buyer about status update
        if (updatedOrder[0] && currentOrder.buyerId) {
            const { notificationService } = await import('./notificationService');
            await notificationService.notifyOrderStatusChange(
                currentOrder.buyerId,
                req.params.id,
                validatedData.status
            );
        }

        res.json({
            success: true,
            message: `Order status updated to ${validatedData.status}`,
            order: updatedOrder[0]
        });

    } catch (error: any) {
        console.error('Update order status error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Confirm order (supplier accepts the order)
router.post('/orders/:id/confirm', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const confirmSchema = z.object({
            estimatedDeliveryDate: z.string().optional(),
            notes: z.string().optional()
        });

        const validatedData = confirmSchema.parse(req.body);

        // Verify order belongs to this supplier and is in pending status
        const existingOrder = await db.select()
            .from(orders)
            .where(and(
                eq(orders.id, req.params.id),
                eq(orders.supplierId, supplierId),
                eq(orders.status, 'pending')
            ))
            .limit(1);

        if (existingOrder.length === 0) {
            return res.status(404).json({ error: 'Order not found, access denied, or order is not in pending status' });
        }

        const currentOrder = existingOrder[0];

        // Update order to confirmed status
        const updateData: any = {
            status: 'confirmed',
            updatedAt: new Date(),
            notes: (currentOrder.notes || '') + `\n\n[${new Date().toISOString()}] Order confirmed by supplier.`
        };

        if (validatedData.estimatedDeliveryDate) {
            updateData.notes += ` Estimated delivery: ${validatedData.estimatedDeliveryDate}`;
        }

        if (validatedData.notes) {
            updateData.notes += ` Notes: ${validatedData.notes}`;
        }

        const updatedOrder = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, req.params.id))
            .returning();

        // TODO: Send notification to buyer about order confirmation

        res.json({
            success: true,
            message: 'Order confirmed successfully',
            order: updatedOrder[0]
        });

    } catch (error: any) {
        console.error('Confirm order error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to confirm order' });
    }
});

// Add tracking information to order
router.patch('/orders/:id/tracking', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const trackingSchema = z.object({
            trackingNumber: z.string().min(1),
            carrier: z.string().optional(),
            trackingUrl: z.string().url().optional(),
            notes: z.string().optional()
        });

        const validatedData = trackingSchema.parse(req.body);

        // Verify order belongs to this supplier
        const existingOrder = await db.select()
            .from(orders)
            .where(and(
                eq(orders.id, req.params.id),
                eq(orders.supplierId, supplierId)
            ))
            .limit(1);

        if (existingOrder.length === 0) {
            return res.status(404).json({ error: 'Order not found or access denied' });
        }

        const currentOrder = existingOrder[0];

        // Update order with tracking information
        const updateData: any = {
            trackingNumber: validatedData.trackingNumber,
            updatedAt: new Date(),
            notes: (currentOrder.notes || '') + `\n\n[${new Date().toISOString()}] Tracking added: ${validatedData.trackingNumber}`
        };

        if (validatedData.carrier) {
            updateData.notes += ` (Carrier: ${validatedData.carrier})`;
        }

        if (validatedData.trackingUrl) {
            updateData.notes += ` (Track: ${validatedData.trackingUrl})`;
        }

        if (validatedData.notes) {
            updateData.notes += ` - ${validatedData.notes}`;
        }

        const updatedOrder = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, req.params.id))
            .returning();

        // TODO: Send notification to buyer about tracking information

        res.json({
            success: true,
            message: 'Tracking information added successfully',
            order: updatedOrder[0]
        });

    } catch (error: any) {
        console.error('Add tracking error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to add tracking information' });
    }
});

// Get supplier order analytics
router.get('/orders/analytics', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { period = '30' } = req.query; // Default to last 30 days

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

        // Get order counts by status
        const statusCounts = await db.select({
            status: orders.status,
            count: sql`count(*)`
        })
            .from(orders)
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ))
            .groupBy(orders.status);

        // Get total revenue
        const [revenueResult] = await db.select({
            totalRevenue: sql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            totalOrders: sql`count(*)`
        })
            .from(orders)
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ));

        // Get recent orders
        const recentOrders = await db.select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            totalAmount: orders.totalAmount,
            status: orders.status,
            createdAt: orders.createdAt,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            productName: products.name
        })
            .from(orders)
            .leftJoin(users, eq(orders.buyerId, users.id))
            .leftJoin(products, eq(orders.productId, products.id))
            .where(eq(orders.supplierId, supplierId))
            .orderBy(desc(orders.createdAt))
            .limit(10);

        // Get top products by order count
        const topProducts = await db.select({
            productId: orders.productId,
            productName: products.name,
            orderCount: sql`count(*)`,
            totalRevenue: sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`
        })
            .from(orders)
            .leftJoin(products, eq(orders.productId, products.id))
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ))
            .groupBy(orders.productId, products.name)
            .orderBy(desc(sql`count(*)`))
            .limit(5);

        const analytics = {
            period: parseInt(period as string),
            totalOrders: parseInt(revenueResult?.totalOrders as string || '0'),
            totalRevenue: parseFloat(revenueResult?.totalRevenue as string || '0'),
            averageOrderValue: revenueResult?.totalOrders
                ? parseFloat(revenueResult.totalRevenue as string) / parseInt(revenueResult.totalOrders as string)
                : 0,
            statusBreakdown: statusCounts.reduce((acc, item) => {
                acc[item.status as string] = parseInt(item.count as string);
                return acc;
            }, {} as Record<string, number>),
            recentOrders,
            topProducts: topProducts.map(p => ({
                productId: p.productId,
                productName: p.productName,
                orderCount: parseInt(p.orderCount as string),
                totalRevenue: parseFloat(p.totalRevenue as string || '0')
            }))
        };

        res.json({
            success: true,
            analytics
        });

    } catch (error: any) {
        console.error('Get order analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch order analytics' });
    }
});

// ==================== SUPPLIER RFQ/INQUIRY MANAGEMENT ====================

// Get supplier's RFQs (RFQs sent to this supplier)
router.get('/rfqs', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { status, limit, offset } = req.query;

        // Build query for RFQs directed to this supplier
        let query = db.select({
            id: rfqs.id,
            title: rfqs.title,
            description: rfqs.description,
            quantity: rfqs.quantity,
            targetPrice: rfqs.targetPrice,
            deliveryLocation: rfqs.deliveryLocation,
            expectedDate: rfqs.expectedDate,
            status: rfqs.status,
            quotationsCount: rfqs.quotationsCount,
            createdAt: rfqs.createdAt,
            expiresAt: rfqs.expiresAt,
            // Buyer info
            buyerId: rfqs.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            // Product info (if product-specific RFQ)
            productId: rfqs.productId,
            productName: products.name,
            // Category info
            categoryId: rfqs.categoryId,
            categoryName: categories.name
        })
            .from(rfqs)
            .leftJoin(users, eq(rfqs.buyerId, users.id))
            .leftJoin(products, eq(rfqs.productId, products.id))
            .leftJoin(categories, eq(rfqs.categoryId, categories.id))
            .where(eq(rfqs.supplierId, supplierId));

        const conditions = [eq(rfqs.supplierId, supplierId)];

        if (status) {
            conditions.push(eq(rfqs.status, status as string));
        }

        // Build the complete query with all conditions and pagination
        let finalQuery = db.select({
            id: rfqs.id,
            title: rfqs.title,
            description: rfqs.description,
            quantity: rfqs.quantity,
            targetPrice: rfqs.targetPrice,
            deliveryLocation: rfqs.deliveryLocation,
            expectedDate: rfqs.expectedDate,
            status: rfqs.status,
            quotationsCount: rfqs.quotationsCount,
            createdAt: rfqs.createdAt,
            expiresAt: rfqs.expiresAt,
            // Buyer info
            buyerId: rfqs.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            // Product info (if product-specific RFQ)
            productId: rfqs.productId,
            productName: products.name,
            // Category info
            categoryId: rfqs.categoryId,
            categoryName: categories.name
        })
            .from(rfqs)
            .leftJoin(users, eq(rfqs.buyerId, users.id))
            .leftJoin(products, eq(rfqs.productId, products.id))
            .leftJoin(categories, eq(rfqs.categoryId, categories.id))
            .where(conditions.length > 1 ? and(...conditions) : conditions[0])
            .orderBy(desc(rfqs.createdAt))
            .$dynamic();

        // Apply pagination
        if (limit) {
            finalQuery = finalQuery.limit(parseInt(limit as string));
        }
        if (offset) {
            finalQuery = finalQuery.offset(parseInt(offset as string));
        }

        const supplierRfqs = await finalQuery;



        // Get total count
        const countConditions = [eq(rfqs.supplierId, supplierId)];
        if (status) {
            countConditions.push(eq(rfqs.status, status as string));
        }

        const countQuery = db.select({ count: sql`count(*)` })
            .from(rfqs)
            .where(countConditions.length > 1 ? and(...countConditions) : countConditions[0]);

        const [{ count }] = await countQuery;

        res.json({
            success: true,
            rfqs: supplierRfqs,
            total: parseInt(count as string),
            page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
            limit: limit ? parseInt(limit as string) : supplierRfqs.length
        });

    } catch (error: any) {
        console.error('Get supplier RFQs error:', error);
        res.status(500).json({ error: 'Failed to fetch RFQs' });
    }
});

// ==================== SUPPLIER REVIEWS AND RATINGS ====================

// Get supplier reviews
router.get('/reviews', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { limit, offset } = req.query;

        // Get reviews for this supplier
        let query = db.select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            orderReference: reviews.orderReference,
            createdAt: reviews.createdAt,
            // Buyer info
            buyerId: reviews.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerCompany: users.companyName,
            // Product info (if product-specific review)
            productId: reviews.productId,
            productName: products.name
        })
            .from(reviews)
            .leftJoin(users, eq(reviews.buyerId, users.id))
            .leftJoin(products, eq(reviews.productId, products.id))
            .where(eq(reviews.supplierId, supplierId))
            .orderBy(desc(reviews.createdAt))
            .$dynamic();

        if (limit) {
            query = query.limit(parseInt(limit as string));
        }
        if (offset) {
            query = query.offset(parseInt(offset as string));
        }

        const supplierReviews = await query;

        // Get total count and average rating
        const [stats] = await db.select({
            count: sql`count(*)`,
            avgRating: sql`COALESCE(AVG(CAST(${reviews.rating} AS DECIMAL)), 0)`
        })
            .from(reviews)
            .where(eq(reviews.supplierId, supplierId));

        res.json({
            success: true,
            reviews: supplierReviews,
            total: parseInt(stats.count as string),
            averageRating: parseFloat(stats.avgRating as string),
            page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
            limit: limit ? parseInt(limit as string) : supplierReviews.length
        });

    } catch (error: any) {
        console.error('Get supplier reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get supplier's inquiries (inquiries sent to this supplier's products)
router.get('/inquiries', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { status, productId, limit, offset } = req.query;

        // Build query for inquiries directed to this supplier
        let query = db.select({
            id: inquiries.id,
            productId: inquiries.productId,
            quantity: inquiries.quantity,
            targetPrice: inquiries.targetPrice,
            message: inquiries.message,
            requirements: inquiries.requirements,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            // Buyer info
            buyerId: inquiries.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            // Product info
            productName: products.name,
            productSlug: products.slug,
            productImages: products.images
        })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.buyerId, users.id))
            .leftJoin(products, eq(inquiries.productId, products.id))
            .where(eq(inquiries.supplierId, supplierId));

        const conditions = [eq(inquiries.supplierId, supplierId)];

        if (status) {
            conditions.push(eq(inquiries.status, status as string));
        }
        if (productId) {
            conditions.push(eq(inquiries.productId, productId as string));
        }

        // Build the complete query with all conditions and pagination
        let finalInquiryQuery = db.select({
            id: inquiries.id,
            productId: inquiries.productId,
            quantity: inquiries.quantity,
            targetPrice: inquiries.targetPrice,
            message: inquiries.message,
            requirements: inquiries.requirements,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            // Buyer info
            buyerId: inquiries.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            // Product info
            productName: products.name,
            productSlug: products.slug,
            productImages: products.images
        })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.buyerId, users.id))
            .leftJoin(products, eq(inquiries.productId, products.id))
            .where(conditions.length > 1 ? and(...conditions) : conditions[0])
            .orderBy(desc(inquiries.createdAt))
            .$dynamic();

        // Apply pagination
        if (limit) {
            finalInquiryQuery = finalInquiryQuery.limit(parseInt(limit as string));
        }
        if (offset) {
            finalInquiryQuery = finalInquiryQuery.offset(parseInt(offset as string));
        }

        const supplierInquiries = await finalInquiryQuery;

        // Get total count
        const countConditions = [eq(inquiries.supplierId, supplierId)];
        if (status) {
            countConditions.push(eq(inquiries.status, status as string));
        }
        if (productId) {
            countConditions.push(eq(inquiries.productId, productId as string));
        }

        const countQuery = db.select({ count: sql`count(*)` })
            .from(inquiries)
            .where(countConditions.length > 1 ? and(...countConditions) : countConditions[0]);

        const [{ count }] = await countQuery;

        res.json({
            success: true,
            inquiries: supplierInquiries,
            total: parseInt(count as string),
            page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
            limit: limit ? parseInt(limit as string) : supplierInquiries.length
        });

    } catch (error: any) {
        console.error('Get supplier inquiries error:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// Get specific RFQ details for supplier
router.get('/rfqs/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const rfq = await db.select({
            id: rfqs.id,
            title: rfqs.title,
            description: rfqs.description,
            quantity: rfqs.quantity,
            targetPrice: rfqs.targetPrice,
            deliveryLocation: rfqs.deliveryLocation,
            expectedDate: rfqs.expectedDate,
            attachments: rfqs.attachments,
            status: rfqs.status,
            quotationsCount: rfqs.quotationsCount,
            createdAt: rfqs.createdAt,
            expiresAt: rfqs.expiresAt,
            // Buyer info
            buyerId: rfqs.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            buyerCompany: users.companyName,
            // Product info (if product-specific RFQ)
            productId: rfqs.productId,
            productName: products.name,
            productSlug: products.slug,
            productImages: products.images,
            // Category info
            categoryId: rfqs.categoryId,
            categoryName: categories.name
        })
            .from(rfqs)
            .leftJoin(users, eq(rfqs.buyerId, users.id))
            .leftJoin(products, eq(rfqs.productId, products.id))
            .leftJoin(categories, eq(rfqs.categoryId, categories.id))
            .where(and(
                eq(rfqs.id, req.params.id),
                eq(rfqs.supplierId, supplierId)
            ))
            .limit(1);

        if (rfq.length === 0) {
            return res.status(404).json({ error: 'RFQ not found or not accessible' });
        }

        res.json({
            success: true,
            rfq: rfq[0]
        });

    } catch (error: any) {
        console.error('Get RFQ details error:', error);
        res.status(500).json({ error: 'Failed to fetch RFQ details' });
    }
});

// Respond to RFQ with quotation
router.post('/rfqs/:id/respond', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const respondSchema = z.object({
            pricePerUnit: z.number().positive(),
            totalPrice: z.number().positive(),
            moq: z.number().int().positive(),
            leadTime: z.string().optional(),
            paymentTerms: z.string().optional(),
            validUntil: z.string().datetime().optional(),
            message: z.string().optional(),
            attachments: z.array(z.string()).optional()
        });

        const validatedData = respondSchema.parse(req.body);

        // Verify RFQ exists and is assigned to this supplier
        const rfq = await db.select()
            .from(rfqs)
            .where(and(
                eq(rfqs.id, req.params.id),
                eq(rfqs.supplierId, supplierId)
            ))
            .limit(1);

        if (rfq.length === 0) {
            return res.status(404).json({ error: 'RFQ not found or not accessible' });
        }

        if (rfq[0].status === 'closed') {
            return res.status(400).json({ error: 'Cannot respond to closed RFQ' });
        }

        // Check if supplier already has a quotation for this RFQ
        const existingQuotation = await db.select()
            .from(quotations)
            .where(and(
                eq(quotations.rfqId, req.params.id),
                eq(quotations.supplierId, supplierId)
            ))
            .limit(1);

        if (existingQuotation.length > 0) {
            return res.status(409).json({
                error: 'You have already responded to this RFQ',
                quotationId: existingQuotation[0].id
            });
        }

        // Create quotation
        const newQuotation = await db.insert(quotations).values({
            rfqId: req.params.id,
            supplierId: supplierId,
            pricePerUnit: validatedData.pricePerUnit.toString(),
            totalPrice: validatedData.totalPrice.toString(),
            moq: validatedData.moq,
            leadTime: validatedData.leadTime || null,
            paymentTerms: validatedData.paymentTerms || null,
            validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
            message: validatedData.message || null,
            attachments: validatedData.attachments || [],
            status: 'pending',
            createdAt: new Date()
        }).returning();

        // Update RFQ quotations count
        await db.update(rfqs)
            .set({
                quotationsCount: sql`${rfqs.quotationsCount} + 1`
            })
            .where(eq(rfqs.id, req.params.id));

        res.status(201).json({
            success: true,
            message: 'Quotation submitted successfully',
            quotation: newQuotation[0]
        });

    } catch (error: any) {
        console.error('Respond to RFQ error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to submit quotation' });
    }
});

// Get specific inquiry details for supplier
router.get('/inquiries/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const inquiry = await db.select({
            id: inquiries.id,
            productId: inquiries.productId,
            quantity: inquiries.quantity,
            targetPrice: inquiries.targetPrice,
            message: inquiries.message,
            requirements: inquiries.requirements,
            status: inquiries.status,
            createdAt: inquiries.createdAt,
            // Buyer info
            buyerId: inquiries.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerEmail: users.email,
            buyerCompany: users.companyName,
            // Product info
            productName: products.name,
            productSlug: products.slug,
            productImages: products.images,
            productDescription: products.shortDescription,
            productMinOrderQuantity: products.minOrderQuantity,
            productPriceRanges: products.priceRanges
        })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.buyerId, users.id))
            .leftJoin(products, eq(inquiries.productId, products.id))
            .where(and(
                eq(inquiries.id, req.params.id),
                eq(inquiries.supplierId, supplierId)
            ))
            .limit(1);

        if (inquiry.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found or not accessible' });
        }

        res.json({
            success: true,
            inquiry: inquiry[0]
        });

    } catch (error: any) {
        console.error('Get inquiry details error:', error);
        res.status(500).json({ error: 'Failed to fetch inquiry details' });
    }
});

// Create quotation for RFQ
router.post('/quotations', authMiddleware, checkSupplierRestriction, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const quotationSchema = z.object({
            rfqId: z.string(),
            pricePerUnit: z.number().positive(),
            totalPrice: z.number().positive(),
            moq: z.number().int().positive(),
            leadTime: z.string().optional(),
            paymentTerms: z.string().optional(),
            validUntil: z.string().datetime().optional(),
            message: z.string().optional(),
            attachments: z.array(z.string()).optional()
        });

        const validatedData = quotationSchema.parse(req.body);

        // Verify RFQ exists and is assigned to this supplier
        const rfq = await db.select()
            .from(rfqs)
            .where(and(
                eq(rfqs.id, validatedData.rfqId),
                eq(rfqs.supplierId, supplierId)
            ))
            .limit(1);

        if (rfq.length === 0) {
            return res.status(404).json({ error: 'RFQ not found or not accessible' });
        }

        if (rfq[0].status === 'closed') {
            return res.status(400).json({ error: 'Cannot create quotation for closed RFQ' });
        }

        // Check if supplier already has a quotation for this RFQ
        const existingQuotation = await db.select()
            .from(quotations)
            .where(and(
                eq(quotations.rfqId, validatedData.rfqId),
                eq(quotations.supplierId, supplierId)
            ))
            .limit(1);

        if (existingQuotation.length > 0) {
            return res.status(409).json({ error: 'Quotation already exists for this RFQ. Use update endpoint to modify.' });
        }

        // Create quotation
        const newQuotation = await db.insert(quotations).values({
            rfqId: validatedData.rfqId,
            supplierId: supplierId,
            pricePerUnit: validatedData.pricePerUnit.toString(),
            totalPrice: validatedData.totalPrice.toString(),
            moq: validatedData.moq,
            leadTime: validatedData.leadTime || null,
            paymentTerms: validatedData.paymentTerms || null,
            validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
            message: validatedData.message || null,
            attachments: validatedData.attachments || [],
            status: 'pending',
            createdAt: new Date()
        }).returning();

        // Update RFQ quotations count
        await db.update(rfqs)
            .set({
                quotationsCount: sql`${rfqs.quotationsCount} + 1`
            })
            .where(eq(rfqs.id, validatedData.rfqId));

        res.status(201).json({
            success: true,
            message: 'Quotation created successfully',
            quotation: newQuotation[0]
        });

    } catch (error: any) {
        console.error('Create quotation error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to create quotation' });
    }
});

// REMOVED: Duplicate endpoint - see line 2869 for the correct implementation that fetches both RFQ and inquiry quotations

// Create quotation for inquiry
router.post('/inquiry-quotations', authMiddleware, checkSupplierRestriction, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const inquiryQuotationSchema = z.object({
            inquiryId: z.string(),
            pricePerUnit: z.number().positive(),
            totalPrice: z.number().positive(),
            moq: z.number().int().positive(),
            leadTime: z.string().optional(),
            paymentTerms: z.string().optional(),
            validUntil: z.string().datetime().optional(),
            message: z.string().optional(),
            attachments: z.array(z.string()).optional()
        });

        const validatedData = inquiryQuotationSchema.parse(req.body);

        // Verify inquiry exists and is assigned to this supplier
        const inquiry = await db.select()
            .from(inquiries)
            .where(and(
                eq(inquiries.id, validatedData.inquiryId),
                eq(inquiries.supplierId, supplierId)
            ))
            .limit(1);

        if (inquiry.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found or not accessible' });
        }

        if (inquiry[0].status === 'closed') {
            return res.status(400).json({ error: 'Cannot create quotation for closed inquiry' });
        }

        // Check if supplier already has a quotation for this inquiry
        const existingQuotation = await db.select()
            .from(inquiryQuotations)
            .where(and(
                eq(inquiryQuotations.inquiryId, validatedData.inquiryId),
                eq(inquiryQuotations.supplierId, supplierId)
            ))
            .limit(1);

        if (existingQuotation.length > 0) {
            return res.status(409).json({ error: 'Quotation already exists for this inquiry. Use update endpoint to modify.' });
        }

        // Create inquiry quotation
        const newQuotation = await db.insert(inquiryQuotations).values({
            inquiryId: validatedData.inquiryId,
            supplierId: supplierId,
            pricePerUnit: validatedData.pricePerUnit.toString(),
            totalPrice: validatedData.totalPrice.toString(),
            moq: validatedData.moq,
            leadTime: validatedData.leadTime || null,
            paymentTerms: validatedData.paymentTerms || null,
            validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
            message: validatedData.message || null,
            attachments: validatedData.attachments || [],
            status: 'pending',
            createdAt: new Date()
        }).returning();

        // Update inquiry status to replied
        await db.update(inquiries)
            .set({
                status: 'replied'
            })
            .where(eq(inquiries.id, validatedData.inquiryId));

        // Notify buyer about new quotation
        const { notificationService } = await import('./notificationService');
        const supplier = await db.select({ storeName: supplierProfiles.storeName })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.id, supplierId))
            .limit(1);

        const supplierName = supplier.length > 0 ? supplier[0].storeName : 'A supplier';

        await notificationService.notifyQuotationReceived(
            inquiry[0].buyerId,
            newQuotation[0].id,
            supplierName
        );

        res.status(201).json({
            success: true,
            message: 'Inquiry quotation created successfully',
            quotation: newQuotation[0]
        });

    } catch (error: any) {
        console.error('Create inquiry quotation error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to create inquiry quotation' });
    }
});

// Update inquiry quotation
router.put('/inquiry-quotations/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const updateInquiryQuotationSchema = z.object({
            pricePerUnit: z.number().positive().optional(),
            totalPrice: z.number().positive().optional(),
            moq: z.number().int().positive().optional(),
            leadTime: z.string().optional(),
            paymentTerms: z.string().optional(),
            validUntil: z.string().datetime().optional(),
            message: z.string().optional(),
            attachments: z.array(z.string()).optional()
        });

        const validatedData = updateInquiryQuotationSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.pricePerUnit !== undefined) updateData.pricePerUnit = validatedData.pricePerUnit.toString();
        if (validatedData.totalPrice !== undefined) updateData.totalPrice = validatedData.totalPrice.toString();
        if (validatedData.moq !== undefined) updateData.moq = validatedData.moq;
        if (validatedData.leadTime !== undefined) updateData.leadTime = validatedData.leadTime;
        if (validatedData.paymentTerms !== undefined) updateData.paymentTerms = validatedData.paymentTerms;
        if (validatedData.validUntil !== undefined) updateData.validUntil = validatedData.validUntil ? new Date(validatedData.validUntil) : null;
        if (validatedData.message !== undefined) updateData.message = validatedData.message;
        if (validatedData.attachments !== undefined) updateData.attachments = validatedData.attachments;

        // Update inquiry quotation
        const updatedQuotation = await db.update(inquiryQuotations)
            .set(updateData)
            .where(and(
                eq(inquiryQuotations.id, req.params.id),
                eq(inquiryQuotations.supplierId, supplierId)
            ))
            .returning();

        if (updatedQuotation.length === 0) {
            return res.status(404).json({ error: 'Inquiry quotation not found or not accessible' });
        }

        res.json({
            success: true,
            message: 'Inquiry quotation updated successfully',
            quotation: updatedQuotation[0]
        });

    } catch (error: any) {
        console.error('Update inquiry quotation error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update inquiry quotation' });
    }
});

// Get supplier's quotations
router.get('/quotations', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { status, type, limit, offset } = req.query;

        // Build conditions for RFQ quotations
        const rfqConditions = [eq(quotations.supplierId, supplierId)];
        if (status) {
            rfqConditions.push(eq(quotations.status, status as string));
        }

        // Build conditions for inquiry quotations
        const inquiryConditions = [eq(inquiryQuotations.supplierId, supplierId)];
        if (status) {
            inquiryConditions.push(eq(inquiryQuotations.status, status as string));
        }

        // Get RFQ quotations
        let rfqQuotationsQuery = db.select({
            id: quotations.id,
            type: sql`'rfq'`.as('type'),
            rfqId: quotations.rfqId,
            inquiryId: sql`null`.as('inquiryId'),
            pricePerUnit: quotations.pricePerUnit,
            totalPrice: quotations.totalPrice,
            moq: quotations.moq,
            leadTime: quotations.leadTime,
            paymentTerms: quotations.paymentTerms,
            validUntil: quotations.validUntil,
            message: quotations.message,
            status: quotations.status,
            createdAt: quotations.createdAt,
            // RFQ info
            title: rfqs.title,
            description: rfqs.description,
            quantity: rfqs.quantity,
            // Buyer info
            buyerId: rfqs.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName
        })
            .from(quotations)
            .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
            .leftJoin(users, eq(rfqs.buyerId, users.id))
            .where(rfqConditions.length > 1 ? and(...rfqConditions) : rfqConditions[0]);

        // Get inquiry quotations
        let inquiryQuotationsQuery = db.select({
            id: inquiryQuotations.id,
            type: sql`'inquiry'`.as('type'),
            rfqId: sql`null`.as('rfqId'),
            inquiryId: inquiryQuotations.inquiryId,
            pricePerUnit: inquiryQuotations.pricePerUnit,
            totalPrice: inquiryQuotations.totalPrice,
            moq: inquiryQuotations.moq,
            leadTime: inquiryQuotations.leadTime,
            paymentTerms: inquiryQuotations.paymentTerms,
            validUntil: inquiryQuotations.validUntil,
            message: inquiryQuotations.message,
            status: inquiryQuotations.status,
            createdAt: inquiryQuotations.createdAt,
            // Inquiry info (using inquiry fields as title/description)
            title: products.name,
            description: inquiries.message,
            quantity: inquiries.quantity,
            // Buyer info
            buyerId: inquiries.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName
        })
            .from(inquiryQuotations)
            .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
            .leftJoin(products, eq(inquiries.productId, products.id))
            .leftJoin(users, eq(inquiries.buyerId, users.id))
            .where(inquiryConditions.length > 1 ? and(...inquiryConditions) : inquiryConditions[0]);

        let allQuotations: any[] = [];

        // Fetch based on type filter
        if (!type || type === 'rfq') {
            const rfqQuotations = await rfqQuotationsQuery;
            allQuotations = [...allQuotations, ...rfqQuotations];
        }

        if (!type || type === 'inquiry') {
            const inquiryQuotationsResult = await inquiryQuotationsQuery;
            allQuotations = [...allQuotations, ...inquiryQuotationsResult];
        }

        // Sort by creation date (newest first)
        allQuotations.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        // Apply pagination
        const limitNum = limit ? parseInt(limit as string) : allQuotations.length;
        const offsetNum = offset ? parseInt(offset as string) : 0;
        const paginatedQuotations = allQuotations.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            quotations: paginatedQuotations,
            total: allQuotations.length,
            page: offset ? Math.floor(offsetNum / limitNum) + 1 : 1,
            limit: limitNum
        });

    } catch (error: any) {
        console.error('Get supplier quotations error:', error);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
});

// Update quotation
router.put('/quotations/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { type } = req.query; // 'rfq' or 'inquiry'

        const updateQuotationSchema = z.object({
            pricePerUnit: z.number().positive().optional(),
            totalPrice: z.number().positive().optional(),
            moq: z.number().int().positive().optional(),
            leadTime: z.string().optional(),
            paymentTerms: z.string().optional(),
            validUntil: z.string().datetime().optional(),
            message: z.string().optional(),
            attachments: z.array(z.string()).optional()
        });

        const validatedData = updateQuotationSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.pricePerUnit !== undefined) updateData.pricePerUnit = validatedData.pricePerUnit.toString();
        if (validatedData.totalPrice !== undefined) updateData.totalPrice = validatedData.totalPrice.toString();
        if (validatedData.moq !== undefined) updateData.moq = validatedData.moq;
        if (validatedData.leadTime !== undefined) updateData.leadTime = validatedData.leadTime;
        if (validatedData.paymentTerms !== undefined) updateData.paymentTerms = validatedData.paymentTerms;
        if (validatedData.validUntil !== undefined) updateData.validUntil = validatedData.validUntil ? new Date(validatedData.validUntil) : null;
        if (validatedData.message !== undefined) updateData.message = validatedData.message;
        if (validatedData.attachments !== undefined) updateData.attachments = validatedData.attachments;

        let updatedQuotation;

        if (type === 'inquiry') {
            // Update inquiry quotation
            updatedQuotation = await db.update(inquiryQuotations)
                .set(updateData)
                .where(and(
                    eq(inquiryQuotations.id, req.params.id),
                    eq(inquiryQuotations.supplierId, supplierId)
                ))
                .returning();
        } else {
            // Update RFQ quotation (default)
            updatedQuotation = await db.update(quotations)
                .set(updateData)
                .where(and(
                    eq(quotations.id, req.params.id),
                    eq(quotations.supplierId, supplierId)
                ))
                .returning();
        }

        if (updatedQuotation.length === 0) {
            return res.status(404).json({ error: 'Quotation not found or not accessible' });
        }

        res.json({
            success: true,
            message: 'Quotation updated successfully',
            quotation: updatedQuotation[0]
        });

    } catch (error: any) {
        console.error('Update quotation error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update quotation' });
    }
});

// ==================== SUPPLIER QUOTATION ANALYTICS ====================

// Get quotation analytics for supplier dashboard
router.get('/analytics/quotations', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { period = '30' } = req.query; // days

        const periodDays = parseInt(period as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Get RFQ quotation statistics
        const rfqQuotationStats = await db.select({
            total: sql`count(*)`,
            pending: sql`count(*) filter (where status = 'pending')`,
            accepted: sql`count(*) filter (where status = 'accepted')`,
            rejected: sql`count(*) filter (where status = 'rejected')`,
            totalValue: sql`sum(case when status = 'accepted' then ${quotations.totalPrice}::numeric else 0 end)`,
            avgResponseTime: sql`avg(extract(epoch from (${quotations.createdAt} - ${rfqs.createdAt})) / 3600)` // hours
        })
            .from(quotations)
            .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, startDate)
            ));

        // Get inquiry quotation statistics
        const inquiryQuotationStats = await db.select({
            total: sql`count(*)`,
            pending: sql`count(*) filter (where status = 'pending')`,
            accepted: sql`count(*) filter (where status = 'accepted')`,
            rejected: sql`count(*) filter (where status = 'rejected')`,
            totalValue: sql`sum(case when status = 'accepted' then ${inquiryQuotations.totalPrice}::numeric else 0 end)`,
            avgResponseTime: sql`avg(extract(epoch from (${inquiryQuotations.createdAt} - ${inquiries.createdAt})) / 3600)` // hours
        })
            .from(inquiryQuotations)
            .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, startDate)
            ));

        // Get quotation trends (daily counts for the period)
        const quotationTrends = await db.select({
            date: sql`date(${quotations.createdAt})`,
            rfqQuotations: sql`count(${quotations.id})`,
            inquiryQuotations: sql`0`
        })
            .from(quotations)
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, startDate)
            ))
            .groupBy(sql`date(${quotations.createdAt})`)
            .union(
                db.select({
                    date: sql`date(${inquiryQuotations.createdAt})`,
                    rfqQuotations: sql`0`,
                    inquiryQuotations: sql`count(${inquiryQuotations.id})`
                })
                    .from(inquiryQuotations)
                    .where(and(
                        eq(inquiryQuotations.supplierId, supplierId),
                        gte(inquiryQuotations.createdAt, startDate)
                    ))
                    .groupBy(sql`date(${inquiryQuotations.createdAt})`)
            )
            .orderBy(sql`date`);

        // Get recent quotations for quick overview
        const recentQuotations = await db.select({
            id: quotations.id,
            type: sql`'rfq'`.as('type'),
            title: rfqs.title,
            pricePerUnit: quotations.pricePerUnit,
            totalPrice: quotations.totalPrice,
            status: quotations.status,
            createdAt: quotations.createdAt,
            buyerName: users.firstName
        })
            .from(quotations)
            .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
            .leftJoin(users, eq(rfqs.buyerId, users.id))
            .where(eq(quotations.supplierId, supplierId))
            .orderBy(desc(quotations.createdAt))
            .limit(5)
            .union(
                db.select({
                    id: inquiryQuotations.id,
                    type: sql`'inquiry'`.as('type'),
                    title: products.name,
                    pricePerUnit: inquiryQuotations.pricePerUnit,
                    totalPrice: inquiryQuotations.totalPrice,
                    status: inquiryQuotations.status,
                    createdAt: inquiryQuotations.createdAt,
                    buyerName: users.firstName
                })
                    .from(inquiryQuotations)
                    .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
                    .leftJoin(products, eq(inquiries.productId, products.id))
                    .leftJoin(users, eq(inquiries.buyerId, users.id))
                    .where(eq(inquiryQuotations.supplierId, supplierId))
                    .orderBy(desc(inquiryQuotations.createdAt))
                    .limit(5)
            );

        const rfqStats = rfqQuotationStats[0] || {};
        const inquiryStats = inquiryQuotationStats[0] || {};

        const analytics = {
            summary: {
                totalQuotations: parseInt(rfqStats.total as string || '0') + parseInt(inquiryStats.total as string || '0'),
                pendingQuotations: parseInt(rfqStats.pending as string || '0') + parseInt(inquiryStats.pending as string || '0'),
                acceptedQuotations: parseInt(rfqStats.accepted as string || '0') + parseInt(inquiryStats.accepted as string || '0'),
                rejectedQuotations: parseInt(rfqStats.rejected as string || '0') + parseInt(inquiryStats.rejected as string || '0'),
                totalValue: parseFloat(rfqStats.totalValue as string || '0') + parseFloat(inquiryStats.totalValue as string || '0'),
                avgResponseTime: Math.round(((parseFloat(rfqStats.avgResponseTime as string || '0') + parseFloat(inquiryStats.avgResponseTime as string || '0')) / 2) * 100) / 100,
                conversionRate: Math.round(((parseInt(rfqStats.accepted as string || '0') + parseInt(inquiryStats.accepted as string || '0')) / Math.max(1, parseInt(rfqStats.total as string || '0') + parseInt(inquiryStats.total as string || '0'))) * 10000) / 100
            },
            breakdown: {
                rfqQuotations: {
                    total: parseInt(rfqStats.total as string || '0'),
                    pending: parseInt(rfqStats.pending as string || '0'),
                    accepted: parseInt(rfqStats.accepted as string || '0'),
                    rejected: parseInt(rfqStats.rejected as string || '0'),
                    totalValue: parseFloat(rfqStats.totalValue as string || '0'),
                    avgResponseTime: parseFloat(rfqStats.avgResponseTime as string || '0')
                },
                inquiryQuotations: {
                    total: parseInt(inquiryStats.total as string || '0'),
                    pending: parseInt(inquiryStats.pending as string || '0'),
                    accepted: parseInt(inquiryStats.accepted as string || '0'),
                    rejected: parseInt(inquiryStats.rejected as string || '0'),
                    totalValue: parseFloat(inquiryStats.totalValue as string || '0'),
                    avgResponseTime: parseFloat(inquiryStats.avgResponseTime as string || '0')
                }
            },
            trends: quotationTrends,
            recentQuotations: recentQuotations.slice(0, 10).sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }),
            period: periodDays
        };

        res.json({
            success: true,
            analytics
        });

    } catch (error: any) {
        console.error('Get quotation analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation analytics' });
    }
});

// Get quotation performance metrics
router.get('/analytics/quotation-performance', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        // Get performance metrics by month for the last 12 months
        const monthlyPerformance = await db.select({
            month: sql`to_char(${quotations.createdAt}, 'YYYY-MM')`,
            quotationsSent: sql`count(*)`,
            quotationsAccepted: sql`count(*) filter (where status = 'accepted')`,
            totalValue: sql`sum(case when status = 'accepted' then ${quotations.totalPrice}::numeric else 0 end)`,
            avgPrice: sql`avg(${quotations.pricePerUnit}::numeric)`,
            avgMOQ: sql`avg(${quotations.moq})`
        })
            .from(quotations)
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, sql`current_date - interval '12 months'`)
            ))
            .groupBy(sql`to_char(${quotations.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`to_char(${quotations.createdAt}, 'YYYY-MM')`);

        // Get top performing products (by quotation acceptance rate)
        const topProducts = await db.select({
            productId: products.id,
            productName: products.name,
            quotationsSent: sql`count(${quotations.id})`,
            quotationsAccepted: sql`count(*) filter (where ${quotations.status} = 'accepted')`,
            acceptanceRate: sql`round((count(*) filter (where ${quotations.status} = 'accepted')::numeric / count(*)::numeric) * 100, 2)`,
            totalValue: sql`sum(case when ${quotations.status} = 'accepted' then ${quotations.totalPrice}::numeric else 0 end)`
        })
            .from(quotations)
            .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
            .leftJoin(products, eq(rfqs.productId, products.id))
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, sql`current_date - interval '6 months'`)
            ))
            .groupBy(products.id, products.name)
            .having(sql`count(*) >= 3`) // Only products with at least 3 quotations
            .orderBy(sql`round((count(*) filter (where ${quotations.status} = 'accepted')::numeric / count(*)::numeric) * 100, 2) desc`)
            .limit(10);

        // Get buyer interaction metrics
        const buyerMetrics = await db.select({
            uniqueBuyers: sql`count(distinct ${rfqs.buyerId})`,
            repeatBuyers: sql`count(*) filter (where buyer_quotation_count > 1)`,
            avgQuotationsPerBuyer: sql`avg(buyer_quotation_count)`
        })
            .from(
                db.select({
                    buyerId: rfqs.buyerId,
                    buyerQuotationCount: sql`count(*)`.as('buyer_quotation_count')
                })
                    .from(quotations)
                    .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
                    .where(eq(quotations.supplierId, supplierId))
                    .groupBy(rfqs.buyerId)
                    .as('buyer_stats')
            );

        res.json({
            success: true,
            performance: {
                monthlyTrends: monthlyPerformance,
                topProducts: topProducts,
                buyerMetrics: buyerMetrics[0] || {},
                period: '12 months'
            }
        });

    } catch (error: any) {
        console.error('Get quotation performance error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation performance metrics' });
    }
});

// ==================== ADMIN SUPPLIER VERIFICATION MANAGEMENT ====================

// Admin: Get all suppliers with filtering
router.get('/admin/suppliers', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const { status, verificationLevel, isVerified, isActive, limit, offset } = req.query;

        const conditions = [];

        if (status) {
            conditions.push(eq(supplierProfiles.status, status as string));
        }
        if (verificationLevel) {
            conditions.push(eq(supplierProfiles.verificationLevel, verificationLevel as string));
        }
        if (isVerified !== undefined) {
            conditions.push(eq(supplierProfiles.isVerified, isVerified === 'true'));
        }
        if (isActive !== undefined) {
            conditions.push(eq(supplierProfiles.isActive, isActive === 'true'));
        }

        // Build the complete query with all conditions, ordering, and pagination in one go
        let baseQuery = db.select({
            // Supplier profile fields
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            contactPerson: supplierProfiles.contactPerson,
            phone: supplierProfiles.phone,
            address: supplierProfiles.address,
            city: supplierProfiles.city,
            country: supplierProfiles.country,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            status: supplierProfiles.status,
            isActive: supplierProfiles.isActive,
            isFeatured: supplierProfiles.isFeatured,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            createdAt: supplierProfiles.createdAt,
            updatedAt: supplierProfiles.updatedAt,
            // User fields
            userEmail: users.email,
            userFirstName: users.firstName,
            userLastName: users.lastName
        })
            .from(supplierProfiles)
            .leftJoin(users, eq(supplierProfiles.userId, users.id))
            .$dynamic();

        // Apply conditions
        if (conditions.length > 0) {
            baseQuery = baseQuery.where(and(...conditions));
        }

        // Apply ordering
        baseQuery = baseQuery.orderBy(desc(supplierProfiles.createdAt));

        // Apply pagination
        if (limit) {
            baseQuery = baseQuery.limit(parseInt(limit as string));
        }
        if (offset) {
            baseQuery = baseQuery.offset(parseInt(offset as string));
        }

        const suppliers = await baseQuery;

        res.json({
            success: true,
            suppliers: suppliers
        });

    } catch (error: any) {
        console.error('Admin get suppliers error:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// ==================== SUPPLIER PRODUCT MANAGEMENT ====================

// Product validation schema
const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    slug: z.string().optional(), // Slug will be generated from name
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    specifications: z.any().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    minOrderQuantity: z.number().int().min(1, 'Minimum order quantity must be at least 1'),
    priceRanges: z.array(z.object({
        minQty: z.number().int().min(1),
        maxQty: z.number().int().optional(),
        pricePerUnit: z.number().min(0)
    })).min(1, 'At least one price range is required'),
    sampleAvailable: z.boolean().optional(),
    samplePrice: z.number().min(0).optional(),
    customizationAvailable: z.boolean().optional(),
    leadTime: z.string().optional(),
    port: z.string().optional(),
    paymentTerms: z.array(z.string()).optional(),
    inStock: z.boolean().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    keyFeatures: z.array(z.string()).optional(),
    customizationDetails: z.string().optional(),
    certifications: z.array(z.string()).optional(),
    hasTradeAssurance: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    sku: z.string().optional(),
    metaData: z.any().optional()
});

// Helper function to generate unique product slug
async function generateProductSlug(name: string, supplierId: string): Promise<string> {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await db.select()
            .from(products)
            .where(eq(products.slug, slug))
            .limit(1);

        if (existing.length === 0) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

// Get supplier's products
router.get('/products', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { status, search, categoryId, limit, offset } = req.query;

        const conditions = [eq(products.supplierId, supplierId)];

        if (status) {
            conditions.push(eq(products.approvalStatus, status as string));
        }
        if (categoryId) {
            conditions.push(eq(products.categoryId, categoryId as string));
        }
        if (search) {
            conditions.push(
                or(
                    ilike(products.name, `%${search}%`),
                    ilike(products.description, `%${search}%`),
                    ilike(products.shortDescription, `%${search}%`)
                )!
            );
        }

        let baseProductsQuery = db.select({
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
            leadTime: products.leadTime,
            inStock: products.inStock,
            stockQuantity: products.stockQuantity,
            isPublished: products.isPublished,
            isFeatured: products.isFeatured,
            views: products.views,
            inquiries: products.inquiries,
            approvalStatus: products.approvalStatus,
            rejectionReason: products.rejectionReason,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            // Category info
            categoryName: categories.name
        })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .$dynamic();

        // Apply conditions
        if (conditions.length > 0) {
            baseProductsQuery = baseProductsQuery.where(and(...conditions));
        }

        // Apply ordering
        baseProductsQuery = baseProductsQuery.orderBy(desc(products.createdAt));

        // Apply pagination
        if (limit) {
            baseProductsQuery = baseProductsQuery.limit(parseInt(limit as string));
        }
        if (offset) {
            baseProductsQuery = baseProductsQuery.offset(parseInt(offset as string));
        }

        const supplierProducts = await baseProductsQuery;

        // Get total count
        const countConditions = [eq(products.supplierId, supplierId)];

        if (status) {
            countConditions.push(eq(products.approvalStatus, status as string));
        }
        if (categoryId) {
            countConditions.push(eq(products.categoryId, categoryId as string));
        }
        if (search) {
            countConditions.push(
                or(
                    ilike(products.name, `%${search}%`),
                    ilike(products.description, `%${search}%`),
                    ilike(products.shortDescription, `%${search}%`)
                )!
            );
        }

        const countQuery = db.select({ count: sql`count(*)` })
            .from(products)
            .where(countConditions.length > 0 ? and(...countConditions) : undefined);

        const [{ count }] = await countQuery;

        res.json({
            success: true,
            products: supplierProducts,
            total: parseInt(count as string),
            page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
            limit: limit ? parseInt(limit as string) : supplierProducts.length
        });

    } catch (error: any) {
        console.error('Get supplier products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product by ID
router.get('/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const product = await db.select()
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(and(
                eq(products.id, req.params.id),
                eq(products.supplierId, supplierId)
            ))
            .limit(1);

        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            product: {
                ...product[0].products,
                category: product[0].categories
            }
        });

    } catch (error: any) {
        console.error('Get supplier product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
router.post('/products', authMiddleware, checkSupplierRestriction, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId and check status
        const supplierProfile = await db.select({
            id: supplierProfiles.id,
            status: supplierProfiles.status,
            isVerified: supplierProfiles.isVerified,
            isActive: supplierProfiles.isActive
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplier = supplierProfile[0];

        // Check if supplier is approved
        if (supplier.status !== 'approved') {
            return res.status(403).json({
                error: 'Cannot create products. Supplier must be approved by admin first.',
                currentStatus: supplier.status
            });
        }

        const validatedData = productSchema.parse(req.body);

        // Generate unique slug
        const slug = await generateProductSlug(validatedData.name, supplier.id);

        // Check if slug already exists
        const existingProduct = await db.select()
            .from(products)
            .where(eq(products.slug, slug))
            .limit(1);

        if (existingProduct.length > 0) {
            return res.status(409).json({ error: 'Product with this name already exists' });
        }

        // Create product with supplier ID and pending approval
        const productData: InsertProduct = {
            ...validatedData,
            slug,
            supplierId: supplier.id,
            approvalStatus: 'pending',
            isPublished: false, // Will be set to true when approved
            views: 0,
            inquiries: 0,
            // Convert samplePrice to string if present
            samplePrice: validatedData.samplePrice !== undefined ? validatedData.samplePrice.toString() : undefined
        };

        const newProduct = await db.insert(products).values(productData).returning();

        res.status(201).json({
            success: true,
            message: 'Product created successfully. It is now pending admin approval.',
            product: newProduct[0]
        });

    } catch (error: any) {
        console.error('Create product error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        // Check if product exists and belongs to supplier
        const existingProduct = await db.select()
            .from(products)
            .where(and(
                eq(products.id, req.params.id),
                eq(products.supplierId, supplierId)
            ))
            .limit(1);

        if (existingProduct.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const validatedData = productSchema.partial().parse(req.body);

        // Generate new slug if name is being updated
        let updateData: any = {
            ...validatedData,
            updatedAt: new Date()
        };

        if (validatedData.name && validatedData.name !== existingProduct[0].name) {
            updateData.slug = await generateProductSlug(validatedData.name, supplierId);
        }

        // If product was previously approved and is being updated, set back to pending
        if (existingProduct[0].approvalStatus === 'approved') {
            updateData.approvalStatus = 'pending';
            updateData.isPublished = false;
            updateData.rejectionReason = null;
        }

        const updatedProduct = await db.update(products)
            .set(updateData)
            .where(and(
                eq(products.id, req.params.id),
                eq(products.supplierId, supplierId)
            ))
            .returning();

        if (updatedProduct.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: existingProduct[0].approvalStatus === 'approved'
                ? 'Product updated successfully. It is now pending re-approval.'
                : 'Product updated successfully.',
            product: updatedProduct[0]
        });

    } catch (error: any) {
        console.error('Update product error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        const result = await db.delete(products)
            .where(and(
                eq(products.id, req.params.id),
                eq(products.supplierId, supplierId)
            ));

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Bulk product upload
router.post('/products/bulk', authMiddleware, checkSupplierRestriction, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplierId and check status
        const supplierProfile = await db.select({
            id: supplierProfiles.id,
            status: supplierProfiles.status,
            isVerified: supplierProfiles.isVerified
        })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplier = supplierProfile[0];

        // Check if supplier is approved
        if (supplier.status !== 'approved') {
            return res.status(403).json({
                error: 'Cannot create products. Supplier must be approved by admin first.',
                currentStatus: supplier.status
            });
        }

        const bulkSchema = z.object({
            products: z.array(productSchema).min(1, 'At least one product is required').max(100, 'Maximum 100 products allowed per batch')
        });

        const { products: productList } = bulkSchema.parse(req.body);

        const createdProducts = [];
        const errors = [];

        for (let i = 0; i < productList.length; i++) {
            try {
                const productData = productList[i];

                // Generate unique slug
                const slug = await generateProductSlug(productData.name, supplier.id);

                // Check if slug already exists
                const existingProduct = await db.select()
                    .from(products)
                    .where(eq(products.slug, slug))
                    .limit(1);

                if (existingProduct.length > 0) {
                    errors.push({
                        index: i,
                        name: productData.name,
                        error: 'Product with this name already exists'
                    });
                    continue;
                }

                // Create product
                const newProductData: InsertProduct = {
                    ...productData,
                    slug,
                    supplierId: supplier.id,
                    approvalStatus: 'pending',
                    isPublished: false,
                    views: 0,
                    inquiries: 0,
                    // Convert samplePrice to string if present
                    samplePrice: productData.samplePrice !== undefined ? productData.samplePrice.toString() : undefined
                };

                const [newProduct] = await db.insert(products).values(newProductData).returning();
                createdProducts.push(newProduct);

            } catch (error: any) {
                errors.push({
                    index: i,
                    name: productList[i].name,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Bulk upload completed. ${createdProducts.length} products created, ${errors.length} errors.`,
            created: createdProducts.length,
            errors: errors.length,
            products: createdProducts,
            errorDetails: errors
        });

    } catch (error: any) {
        console.error('Bulk product upload error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to upload products' });
    }
});

// This route was removed - duplicate of the one below

// Admin: Update supplier status (approve, reject, suspend)
router.put('/admin/suppliers/:supplierId/status', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const statusUpdateSchema = z.object({
            status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
            rejectionReason: z.string().optional()
        });

        const validatedData = statusUpdateSchema.parse(req.body);

        const updateData: any = {
            status: validatedData.status,
            updatedAt: new Date()
        };

        // If approving, activate the supplier
        if (validatedData.status === 'approved') {
            updateData.isActive = true;
        }

        // If rejecting, add rejection reason and deactivate
        if (validatedData.status === 'rejected') {
            if (!validatedData.rejectionReason) {
                return res.status(400).json({ error: 'Rejection reason is required when rejecting supplier' });
            }
            updateData.isActive = false;
            // Store rejection reason in verification documents for now
            const currentProfile = await db.select()
                .from(supplierProfiles)
                .where(eq(supplierProfiles.id, req.params.supplierId))
                .limit(1);

            if (currentProfile.length > 0) {
                const existingDocs = (currentProfile[0].verificationDocuments as any) || {};
                updateData.verificationDocuments = {
                    ...existingDocs,
                    rejectionReason: validatedData.rejectionReason,
                    rejectedAt: new Date().toISOString()
                };
            }
        }

        // If suspending, deactivate
        if (validatedData.status === 'suspended') {
            updateData.isActive = false;
        }

        const updatedSupplier = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.id, req.params.supplierId))
            .returning();

        if (updatedSupplier.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({
            success: true,
            message: `Supplier ${validatedData.status} successfully`,
            supplier: updatedSupplier[0]
        });

    } catch (error: any) {
        console.error('Admin update supplier status error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update supplier status' });
    }
});

// Admin: Update supplier verification level
router.put('/admin/suppliers/:supplierId/verification', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const verificationUpdateSchema = z.object({
            verificationLevel: z.enum(['none', 'basic', 'business', 'premium']),
            isVerified: z.boolean().optional()
        });

        const validatedData = verificationUpdateSchema.parse(req.body);

        const updateData: any = {
            verificationLevel: validatedData.verificationLevel,
            updatedAt: new Date()
        };

        // Auto-set isVerified based on verification level
        if (validatedData.verificationLevel !== 'none') {
            updateData.isVerified = validatedData.isVerified !== undefined ? validatedData.isVerified : true;
            updateData.verifiedAt = new Date();
        } else {
            updateData.isVerified = false;
            updateData.verifiedAt = null;
        }

        const updatedSupplier = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.id, req.params.supplierId))
            .returning();

        if (updatedSupplier.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({
            success: true,
            message: 'Supplier verification updated successfully',
            verification: {
                verificationLevel: updatedSupplier[0].verificationLevel,
                isVerified: updatedSupplier[0].isVerified,
                verifiedAt: updatedSupplier[0].verifiedAt
            }
        });

    } catch (error: any) {
        console.error('Admin update supplier verification error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update supplier verification' });
    }
});

// Admin: Update supplier performance metrics (system use)
router.put('/admin/suppliers/:supplierId/metrics', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const metricsUpdateSchema = z.object({
            rating: z.number().min(0).max(5).optional(),
            totalReviews: z.number().min(0).optional(),
            responseRate: z.number().min(0).max(100).optional(),
            responseTime: z.string().optional(),
            totalSales: z.number().min(0).optional(),
            totalOrders: z.number().min(0).optional(),
            isFeatured: z.boolean().optional()
        });

        const validatedData = metricsUpdateSchema.parse(req.body);

        // Convert number fields to strings for decimal columns
        const updateData: any = {
            updatedAt: new Date(),
            isFeatured: validatedData.isFeatured
        };

        if (validatedData.rating !== undefined) {
            updateData.rating = validatedData.rating.toString();
        }
        if (validatedData.totalReviews !== undefined) {
            updateData.totalReviews = validatedData.totalReviews;
        }
        if (validatedData.responseRate !== undefined) {
            updateData.responseRate = validatedData.responseRate.toString();
        }
        if (validatedData.responseTime !== undefined) {
            updateData.responseTime = validatedData.responseTime;
        }
        if (validatedData.totalSales !== undefined) {
            updateData.totalSales = validatedData.totalSales.toString();
        }
        if (validatedData.totalOrders !== undefined) {
            updateData.totalOrders = validatedData.totalOrders;
        }

        const updatedSupplier = await db.update(supplierProfiles)
            .set(updateData)
            .where(eq(supplierProfiles.id, req.params.supplierId))
            .returning();

        if (updatedSupplier.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({
            success: true,
            message: 'Supplier metrics updated successfully',
            metrics: {
                rating: updatedSupplier[0].rating,
                totalReviews: updatedSupplier[0].totalReviews,
                responseRate: updatedSupplier[0].responseRate,
                responseTime: updatedSupplier[0].responseTime,
                totalSales: updatedSupplier[0].totalSales,
                totalOrders: updatedSupplier[0].totalOrders,
                isFeatured: updatedSupplier[0].isFeatured
            }
        });

    } catch (error: any) {
        console.error('Admin update supplier metrics error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to update supplier metrics' });
    }
});

// Admin: Bulk supplier operations
router.post('/admin/suppliers/bulk-action', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const bulkActionSchema = z.object({
            supplierIds: z.array(z.string()).min(1),
            action: z.enum(['approve', 'reject', 'suspend', 'activate', 'verify']),
            rejectionReason: z.string().optional()
        });

        const validatedData = bulkActionSchema.parse(req.body);

        if (validatedData.action === 'reject' && !validatedData.rejectionReason) {
            return res.status(400).json({ error: 'Rejection reason is required for bulk rejection' });
        }

        const updatedSuppliers = [];
        const errors = [];

        for (const supplierId of validatedData.supplierIds) {
            try {
                let updateData: any = { updatedAt: new Date() };

                switch (validatedData.action) {
                    case 'approve':
                        updateData.status = 'approved';
                        updateData.isActive = true;
                        break;
                    case 'reject':
                        updateData.status = 'rejected';
                        updateData.isActive = false;
                        break;
                    case 'suspend':
                        updateData.status = 'suspended';
                        updateData.isActive = false;
                        break;
                    case 'activate':
                        updateData.isActive = true;
                        break;
                    case 'verify':
                        updateData.verificationLevel = 'basic';
                        updateData.isVerified = true;
                        updateData.verifiedAt = new Date();
                        break;
                }

                const updated = await db.update(supplierProfiles)
                    .set(updateData)
                    .where(eq(supplierProfiles.id, supplierId))
                    .returning();

                if (updated.length > 0) {
                    updatedSuppliers.push(updated[0]);
                }
            } catch (error: any) {
                errors.push({ supplierId, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `Bulk ${validatedData.action} completed`,
            updated: updatedSuppliers.length,
            errorCount: errors.length,
            updatedSuppliers,
            errors
        });

    } catch (error: any) {
        console.error('Admin bulk supplier action error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        res.status(500).json({ error: 'Failed to perform bulk action' });
    }
});

// ==================== QUOTATION ANALYTICS FOR SUPPLIER DASHBOARD ====================

// Get quotation analytics summary for supplier dashboard
router.get('/analytics/quotations-summary', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;

        // Get RFQ quotations analytics
        const rfqQuotationsStats = await db.select({
            status: quotations.status,
            count: sql`count(*)`
        })
            .from(quotations)
            .where(eq(quotations.supplierId, supplierId))
            .groupBy(quotations.status);

        // Get inquiry quotations analytics
        const inquiryQuotationsStats = await db.select({
            status: inquiryQuotations.status,
            count: sql`count(*)`
        })
            .from(inquiryQuotations)
            .where(eq(inquiryQuotations.supplierId, supplierId))
            .groupBy(inquiryQuotations.status);

        // Get total quotations count
        const totalRfqQuotations = await db.select({
            count: sql`count(*)`
        })
            .from(quotations)
            .where(eq(quotations.supplierId, supplierId));

        const totalInquiryQuotations = await db.select({
            count: sql`count(*)`
        })
            .from(inquiryQuotations)
            .where(eq(inquiryQuotations.supplierId, supplierId));

        // Get recent quotations (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentRfqQuotations = await db.select({
            count: sql`count(*)`
        })
            .from(quotations)
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, sevenDaysAgo)
            ));

        const recentInquiryQuotations = await db.select({
            count: sql`count(*)`
        })
            .from(inquiryQuotations)
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, sevenDaysAgo)
            ));

        // Calculate acceptance rate
        const acceptedRfqQuotations = rfqQuotationsStats.find(stat => stat.status === 'accepted');
        const acceptedInquiryQuotations = inquiryQuotationsStats.find(stat => stat.status === 'accepted');

        const totalRfqCount = parseInt(totalRfqQuotations[0]?.count as string || '0');
        const totalInquiryCount = parseInt(totalInquiryQuotations[0]?.count as string || '0');
        const totalQuotations = totalRfqCount + totalInquiryCount;

        const acceptedRfqCount = parseInt(acceptedRfqQuotations?.count as string || '0');
        const acceptedInquiryCount = parseInt(acceptedInquiryQuotations?.count as string || '0');
        const totalAccepted = acceptedRfqCount + acceptedInquiryCount;

        const acceptanceRate = totalQuotations > 0 ? (totalAccepted / totalQuotations) * 100 : 0;

        // Get average response time (this would need to be calculated based on timestamps)
        // For now, we'll use a placeholder
        const averageResponseTime = '< 2 hours'; // This should be calculated from actual data

        const analytics = {
            totalQuotations,
            totalRfqQuotations: totalRfqCount,
            totalInquiryQuotations: totalInquiryCount,
            acceptanceRate: Math.round(acceptanceRate * 100) / 100,
            recentQuotations: parseInt(recentRfqQuotations[0]?.count as string || '0') +
                parseInt(recentInquiryQuotations[0]?.count as string || '0'),
            averageResponseTime,
            statusBreakdown: {
                rfq: rfqQuotationsStats.reduce((acc, stat) => {
                    acc[stat.status as string] = parseInt(stat.count as string);
                    return acc;
                }, {} as Record<string, number>),
                inquiry: inquiryQuotationsStats.reduce((acc, stat) => {
                    acc[stat.status as string] = parseInt(stat.count as string);
                    return acc;
                }, {} as Record<string, number>)
            }
        };

        res.json({
            success: true,
            analytics
        });

    } catch (error: any) {
        console.error('Get quotation analytics summary error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation analytics' });
    }
});

// Get detailed quotation performance metrics
router.get('/analytics/quotation-performance', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        // Get supplier profile to get supplier ID
        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { period = '30' } = req.query;
        const periodDays = parseInt(period as string);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Get quotation trends over time
        const quotationTrends = await db.select({
            date: sql`DATE(${quotations.createdAt}) as date`,
            rfqCount: sql`count(${quotations.id})`,
            inquiryCount: sql`0`
        })
            .from(quotations)
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, startDate)
            ))
            .groupBy(sql`DATE(${quotations.createdAt})`)
            .union(
                db.select({
                    date: sql`DATE(${inquiryQuotations.createdAt}) as date`,
                    rfqCount: sql`0`,
                    inquiryCount: sql`count(${inquiryQuotations.id})`
                })
                    .from(inquiryQuotations)
                    .where(and(
                        eq(inquiryQuotations.supplierId, supplierId),
                        gte(inquiryQuotations.createdAt, startDate)
                    ))
                    .groupBy(sql`DATE(${inquiryQuotations.createdAt})`)
            )
            .orderBy(sql`date`);

        // Get conversion rates by quotation type
        const rfqConversion = await db.select({
            total: sql`count(*)`,
            accepted: sql`sum(case when ${quotations.status} = 'accepted' then 1 else 0 end)`
        })
            .from(quotations)
            .where(and(
                eq(quotations.supplierId, supplierId),
                gte(quotations.createdAt, startDate)
            ));

        const inquiryConversion = await db.select({
            total: sql`count(*)`,
            accepted: sql`sum(case when ${inquiryQuotations.status} = 'accepted' then 1 else 0 end)`
        })
            .from(inquiryQuotations)
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, startDate)
            ));

        const performance = {
            period: periodDays,
            trends: quotationTrends,
            conversion: {
                rfq: {
                    total: parseInt(rfqConversion[0]?.total as string || '0'),
                    accepted: parseInt(rfqConversion[0]?.accepted as string || '0'),
                    rate: rfqConversion[0]?.total ?
                        (parseInt(rfqConversion[0].accepted as string || '0') / parseInt(rfqConversion[0].total as string)) * 100 : 0
                },
                inquiry: {
                    total: parseInt(inquiryConversion[0]?.total as string || '0'),
                    accepted: parseInt(inquiryConversion[0]?.accepted as string || '0'),
                    rate: inquiryConversion[0]?.total ?
                        (parseInt(inquiryConversion[0].accepted as string || '0') / parseInt(inquiryConversion[0].total as string)) * 100 : 0
                }
            }
        };

        res.json({
            success: true,
            performance
        });

    } catch (error: any) {
        console.error('Get quotation performance error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation performance' });
    }
});

// ==================== QUOTATION ACCEPTANCE WORKFLOW ====================

// Accept RFQ quotation and create order (Buyer endpoint - moved from main routes)
router.post('/quotations/:id/accept', authMiddleware, async (req, res) => {
    try {
        const { shippingAddress } = req.body;
        const quotationId = req.params.id;

        console.log('=== SUPPLIER: ACCEPTING RFQ QUOTATION ===');
        console.log('Quotation ID:', quotationId);

        // Get quotation with supplier and RFQ details
        const quotationResult = await db.select({
            id: quotations.id,
            rfqId: quotations.rfqId,
            supplierId: quotations.supplierId,
            pricePerUnit: quotations.pricePerUnit,
            totalPrice: quotations.totalPrice,
            moq: quotations.moq,
            leadTime: quotations.leadTime,
            paymentTerms: quotations.paymentTerms,
            message: quotations.message,
            status: quotations.status,
            // RFQ details
            rfqBuyerId: rfqs.buyerId,
            rfqProductId: rfqs.productId,
            rfqTitle: rfqs.title,
            rfqQuantity: rfqs.quantity,
            // Supplier details
            supplierName: supplierProfiles.businessName,
            storeName: supplierProfiles.storeName
        })
            .from(quotations)
            .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
            .leftJoin(supplierProfiles, eq(quotations.supplierId, supplierProfiles.id))
            .where(eq(quotations.id, quotationId))
            .limit(1);

        if (quotationResult.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        const quotation = quotationResult[0];

        // Verify buyer has permission to accept this quotation
        if (req.user?.role === 'buyer' && quotation.rfqBuyerId !== req.user.id) {
            return res.status(403).json({ error: 'You can only accept your own quotations' });
        }

        if (quotation.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending quotations can be accepted' });
        }

        // Validate required fields
        if (!quotation.rfqBuyerId || !quotation.supplierId || !quotation.rfqId) {
            return res.status(400).json({ error: 'Invalid quotation data: missing required fields' });
        }

        // Create order from quotation
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const orderItems = [{
            productId: quotation.rfqProductId || 'rfq-custom',
            productName: quotation.rfqTitle,
            quantity: quotation.rfqQuantity,
            unitPrice: parseFloat(quotation.pricePerUnit || '0'),
            totalPrice: parseFloat(quotation.totalPrice || '0'),
            specifications: {
                moq: quotation.moq,
                leadTime: quotation.leadTime,
                paymentTerms: quotation.paymentTerms
            }
        }];

        const newOrder = await db.insert(orders).values({
            orderNumber,
            buyerId: quotation.rfqBuyerId,
            supplierId: quotation.supplierId,
            rfqId: quotation.rfqId,
            quotationId: quotation.id,
            productId: quotation.rfqProductId || undefined,
            quantity: quotation.rfqQuantity || undefined,
            unitPrice: quotation.pricePerUnit || undefined,
            totalAmount: quotation.totalPrice,
            items: orderItems,
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined,
            notes: `Order created from RFQ quotation. Supplier: ${quotation.supplierName || 'Unknown'}`
        }).returning();

        const order = newOrder[0];

        // Calculate and create commission record
        try {
            await calculateCommission(
                order.id,
                quotation.supplierId,
                parseFloat(order.totalAmount)
            );
            console.log('✅ Commission calculated for order:', order.id);
        } catch (error) {
            console.error('⚠️ Failed to calculate commission:', error);
            // Don't fail the order creation if commission calculation fails
        }

        // Update quotation status to accepted
        await db.update(quotations)
            .set({
                status: 'accepted',
                message: `${quotation.message || ''}\n\nOrder Created: ${order.id}`
            })
            .where(eq(quotations.id, quotationId));

        // Update RFQ status to closed
        await db.update(rfqs)
            .set({ status: 'closed' })
            .where(eq(rfqs.id, quotation.rfqId));

        console.log('✅ RFQ quotation accepted and order created successfully');

        res.json({
            success: true,
            message: 'Quotation accepted and order created successfully!',
            order: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                status: order.status
            }
        });

    } catch (error: any) {
        console.error('❌ Error accepting RFQ quotation:', error);
        res.status(500).json({
            error: error.message || 'Failed to accept quotation. Please try again.'
        });
    }
});

// Accept inquiry quotation and create order (Buyer endpoint - moved from main routes)
router.post('/inquiry-quotations/:id/accept', authMiddleware, async (req, res) => {
    try {
        const { shippingAddress } = req.body;
        const quotationId = req.params.id;

        console.log('=== SUPPLIER: ACCEPTING INQUIRY QUOTATION ===');
        console.log('Quotation ID:', quotationId);

        // Get quotation with supplier and inquiry details
        const quotationResult = await db.select({
            id: inquiryQuotations.id,
            inquiryId: inquiryQuotations.inquiryId,
            supplierId: inquiryQuotations.supplierId,
            pricePerUnit: inquiryQuotations.pricePerUnit,
            totalPrice: inquiryQuotations.totalPrice,
            moq: inquiryQuotations.moq,
            leadTime: inquiryQuotations.leadTime,
            paymentTerms: inquiryQuotations.paymentTerms,
            message: inquiryQuotations.message,
            status: inquiryQuotations.status,
            // Inquiry details
            inquiryBuyerId: inquiries.buyerId,
            inquiryProductId: inquiries.productId,
            inquiryQuantity: inquiries.quantity,
            inquiryMessage: inquiries.message,
            // Product details
            productName: products.name,
            // Supplier details
            supplierName: supplierProfiles.businessName,
            storeName: supplierProfiles.storeName
        })
            .from(inquiryQuotations)
            .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
            .leftJoin(products, eq(inquiries.productId, products.id))
            .leftJoin(supplierProfiles, eq(inquiryQuotations.supplierId, supplierProfiles.id))
            .where(eq(inquiryQuotations.id, quotationId))
            .limit(1);

        if (quotationResult.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        const quotation = quotationResult[0];

        // Verify buyer has permission to accept this quotation
        if (req.user?.role === 'buyer' && quotation.inquiryBuyerId !== req.user.id) {
            return res.status(403).json({ error: 'You can only accept your own quotations' });
        }

        if (quotation.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending quotations can be accepted' });
        }

        // Validate required fields
        if (!quotation.inquiryBuyerId || !quotation.supplierId || !quotation.inquiryId) {
            return res.status(400).json({ error: 'Invalid quotation data: missing required fields' });
        }

        // Create order from quotation
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const orderItems = [{
            productId: quotation.inquiryProductId,
            productName: quotation.productName,
            quantity: quotation.inquiryQuantity,
            unitPrice: parseFloat(quotation.pricePerUnit || '0'),
            totalPrice: parseFloat(quotation.totalPrice || '0'),
            specifications: {
                moq: quotation.moq,
                leadTime: quotation.leadTime,
                paymentTerms: quotation.paymentTerms
            }
        }];

        const newOrder = await db.insert(orders).values({
            orderNumber,
            buyerId: quotation.inquiryBuyerId,
            supplierId: quotation.supplierId,
            inquiryId: quotation.inquiryId,
            quotationId: quotation.id,
            productId: quotation.inquiryProductId || undefined,
            quantity: quotation.inquiryQuantity || undefined,
            unitPrice: quotation.pricePerUnit || undefined,
            totalAmount: quotation.totalPrice,
            items: orderItems,
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined,
            notes: `Order created from inquiry quotation. Supplier: ${quotation.supplierName || 'Unknown'}`
        }).returning();

        const order = newOrder[0];

        // Calculate and create commission record
        try {
            await calculateCommission(
                order.id,
                quotation.supplierId,
                parseFloat(order.totalAmount)
            );
            console.log('✅ Commission calculated for order:', order.id);
        } catch (error) {
            console.error('⚠️ Failed to calculate commission:', error);
            // Don't fail the order creation if commission calculation fails
        }

        // Update quotation status to accepted
        await db.update(inquiryQuotations)
            .set({
                status: 'accepted'
            })
            .where(eq(inquiryQuotations.id, quotationId));

        // Update inquiry status to closed
        await db.update(inquiries)
            .set({ status: 'closed' })
            .where(eq(inquiries.id, quotation.inquiryId));

        console.log('✅ Inquiry quotation accepted and order created successfully');

        res.json({
            success: true,
            message: 'Quotation accepted and order created successfully!',
            order: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                status: order.status
            }
        });

    } catch (error: any) {
        console.error('❌ Error accepting inquiry quotation:', error);
        res.status(500).json({
            error: error.message || 'Failed to accept quotation. Please try again.'
        });
    }
});

// ==================== PUBLIC SUPPLIER DISCOVERY API ====================

// Get supplier directory (public - no auth required)
router.get('/directory', async (req, res) => {
    try {
        const {
            search,
            country,
            businessType,
            verificationLevel,
            verified,
            featured,
            sortBy = 'rating',
            limit = '20',
            offset = '0'
        } = req.query;

        // Build conditions for filtering
        const conditions = [
            eq(supplierProfiles.status, 'approved'),
            eq(supplierProfiles.isActive, true)
        ];

        if (search) {
            conditions.push(
                or(
                    ilike(supplierProfiles.storeName, `%${search}%`),
                    ilike(supplierProfiles.businessName, `%${search}%`),
                    ilike(supplierProfiles.storeDescription, `%${search}%`)
                )!
            );
        }

        if (country) {
            conditions.push(eq(supplierProfiles.country, country as string));
        }

        if (businessType) {
            conditions.push(eq(supplierProfiles.businessType, businessType as string));
        }

        if (verificationLevel) {
            conditions.push(eq(supplierProfiles.verificationLevel, verificationLevel as string));
        }

        if (verified === 'true') {
            conditions.push(eq(supplierProfiles.isVerified, true));
        }

        if (featured === 'true') {
            conditions.push(eq(supplierProfiles.isFeatured, true));
        }

        // Determine sort order
        let orderByClause;
        switch (sortBy) {
            case 'orders':
                orderByClause = desc(supplierProfiles.totalOrders);
                break;
            case 'newest':
                orderByClause = desc(supplierProfiles.createdAt);
                break;
            case 'name':
                orderByClause = asc(supplierProfiles.storeName);
                break;
            case 'rating':
            default:
                orderByClause = desc(supplierProfiles.rating);
                break;
        }

        // Build and execute query
        const suppliers = await db.select({
            id: supplierProfiles.id,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeDescription: supplierProfiles.storeDescription,
            storeLogo: supplierProfiles.storeLogo,
            storeBanner: supplierProfiles.storeBanner,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            country: supplierProfiles.country,
            city: supplierProfiles.city,
            mainProducts: supplierProfiles.mainProducts,
            exportMarkets: supplierProfiles.exportMarkets,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            isFeatured: supplierProfiles.isFeatured,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            responseRate: supplierProfiles.responseRate,
            responseTime: supplierProfiles.responseTime,
            totalOrders: supplierProfiles.totalOrders,
            yearEstablished: supplierProfiles.yearEstablished,
            createdAt: supplierProfiles.createdAt
        })
            .from(supplierProfiles)
            .where(and(...conditions))
            .orderBy(orderByClause)
            .limit(parseInt(limit as string))
            .offset(parseInt(offset as string));

        // Get total count for pagination
        const [{ count }] = await db.select({ count: sql`count(*)` })
            .from(supplierProfiles)
            .where(and(...conditions));

        res.json({
            success: true,
            suppliers,
            total: parseInt(count as string),
            page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
            limit: parseInt(limit as string)
        });

    } catch (error: any) {
        console.error('Get supplier directory error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier directory' });
    }
});

// Get featured suppliers (public - no auth required)
router.get('/featured', async (req, res) => {
    try {
        const { limit = '6' } = req.query;

        const featuredSuppliers = await db.select({
            id: supplierProfiles.id,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeDescription: supplierProfiles.storeDescription,
            storeLogo: supplierProfiles.storeLogo,
            storeBanner: supplierProfiles.storeBanner,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            country: supplierProfiles.country,
            city: supplierProfiles.city,
            mainProducts: supplierProfiles.mainProducts,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            responseRate: supplierProfiles.responseRate,
            responseTime: supplierProfiles.responseTime,
            totalOrders: supplierProfiles.totalOrders
        })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.status, 'approved'),
                eq(supplierProfiles.isActive, true),
                eq(supplierProfiles.isFeatured, true)
            ))
            .orderBy(desc(supplierProfiles.rating))
            .limit(parseInt(limit as string));

        res.json({
            success: true,
            suppliers: featuredSuppliers
        });

    } catch (error: any) {
        console.error('Get featured suppliers error:', error);
        res.status(500).json({ error: 'Failed to fetch featured suppliers' });
    }
});

// Get individual supplier store by slug (public - no auth required)
router.get('/store/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const supplier = await db.select({
            id: supplierProfiles.id,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeDescription: supplierProfiles.storeDescription,
            storeLogo: supplierProfiles.storeLogo,
            storeBanner: supplierProfiles.storeBanner,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            contactPerson: supplierProfiles.contactPerson,
            phone: supplierProfiles.phone,
            whatsapp: supplierProfiles.whatsapp,
            address: supplierProfiles.address,
            city: supplierProfiles.city,
            country: supplierProfiles.country,
            website: supplierProfiles.website,
            yearEstablished: supplierProfiles.yearEstablished,
            employeesCount: supplierProfiles.employeesCount,
            annualRevenue: supplierProfiles.annualRevenue,
            mainProducts: supplierProfiles.mainProducts,
            exportMarkets: supplierProfiles.exportMarkets,
            verificationLevel: supplierProfiles.verificationLevel,
            isVerified: supplierProfiles.isVerified,
            verifiedAt: supplierProfiles.verifiedAt,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews,
            responseRate: supplierProfiles.responseRate,
            responseTime: supplierProfiles.responseTime,
            totalSales: supplierProfiles.totalSales,
            totalOrders: supplierProfiles.totalOrders,
            storePolicies: supplierProfiles.storePolicies,
            operatingHours: supplierProfiles.operatingHours,
            createdAt: supplierProfiles.createdAt
        })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.storeSlug, slug),
                eq(supplierProfiles.status, 'approved'),
                eq(supplierProfiles.isActive, true)
            ))
            .limit(1);

        if (supplier.length === 0) {
            return res.status(404).json({ error: 'Supplier store not found' });
        }

        // Get supplier's products
        const supplierProducts = await db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            images: products.images,
            minOrderQuantity: products.minOrderQuantity,
            priceRanges: products.priceRanges,
            inStock: products.inStock,
            stockQuantity: products.stockQuantity,
            leadTime: products.leadTime,
            certifications: products.certifications,
            hasTradeAssurance: products.hasTradeAssurance,
            sampleAvailable: products.sampleAvailable,
            customizationAvailable: products.customizationAvailable,
            createdAt: products.createdAt
        })
            .from(products)
            .where(and(
                eq(products.supplierId, supplier[0].id),
                eq(products.isPublished, true),
                eq(products.approvalStatus, 'approved')
            ))
            .orderBy(desc(products.createdAt))
            .limit(20);

        res.json({
            success: true,
            supplier: supplier[0],
            products: supplierProducts,
            productCount: supplierProducts.length
        });

    } catch (error: any) {
        console.error('Get supplier store error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier store' });
    }
});

// Get supplier's products by supplier ID (public - no auth required)
router.get('/:supplierId/products', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { limit = '20', offset = '0', sortBy = 'newest' } = req.query;

        // Verify supplier exists and is active
        const supplier = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.id, supplierId),
                eq(supplierProfiles.status, 'approved'),
                eq(supplierProfiles.isActive, true)
            ))
            .limit(1);

        if (supplier.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Determine sort order for products
        let productOrderBy;
        switch (sortBy) {
            case 'popular':
                productOrderBy = desc(products.views);
                break;
            case 'inquiries':
                productOrderBy = desc(products.inquiries);
                break;
            case 'newest':
            default:
                productOrderBy = desc(products.createdAt);
                break;
        }

        // Build and execute query for products
        const supplierProducts = await db.select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            description: products.description,
            images: products.images,
            categoryId: products.categoryId,
            minOrderQuantity: products.minOrderQuantity,
            priceRanges: products.priceRanges,
            inStock: products.inStock,
            stockQuantity: products.stockQuantity,
            leadTime: products.leadTime,
            port: products.port,
            paymentTerms: products.paymentTerms,
            certifications: products.certifications,
            hasTradeAssurance: products.hasTradeAssurance,
            sampleAvailable: products.sampleAvailable,
            customizationAvailable: products.customizationAvailable,
            views: products.views,
            inquiries: products.inquiries,
            createdAt: products.createdAt
        })
            .from(products)
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.isPublished, true),
                eq(products.approvalStatus, 'approved')
            ))
            .orderBy(productOrderBy)
            .limit(parseInt(limit as string))
            .offset(parseInt(offset as string));

        // Get total count
        const [{ count }] = await db.select({ count: sql`count(*)` })
            .from(products)
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.isPublished, true),
                eq(products.approvalStatus, 'approved')
            ));

        res.json({
            success: true,
            products: supplierProducts,
            total: parseInt(count as string),
            page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
            limit: parseInt(limit as string)
        });

    } catch (error: any) {
        console.error('Get supplier products error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier products' });
    }
});

// Search suppliers (public - no auth required)
router.get('/search', async (req, res) => {
    try {
        const { q, limit = '10' } = req.query;

        if (!q || (q as string).trim().length === 0) {
            return res.json({
                success: true,
                suppliers: []
            });
        }

        const searchResults = await db.select({
            id: supplierProfiles.id,
            storeName: supplierProfiles.storeName,
            storeSlug: supplierProfiles.storeSlug,
            storeLogo: supplierProfiles.storeLogo,
            businessName: supplierProfiles.businessName,
            businessType: supplierProfiles.businessType,
            country: supplierProfiles.country,
            city: supplierProfiles.city,
            mainProducts: supplierProfiles.mainProducts,
            isVerified: supplierProfiles.isVerified,
            verificationLevel: supplierProfiles.verificationLevel,
            rating: supplierProfiles.rating,
            totalReviews: supplierProfiles.totalReviews
        })
            .from(supplierProfiles)
            .where(and(
                eq(supplierProfiles.status, 'approved'),
                eq(supplierProfiles.isActive, true),
                or(
                    ilike(supplierProfiles.storeName, `%${q}%`),
                    ilike(supplierProfiles.businessName, `%${q}%`),
                    ilike(supplierProfiles.storeDescription, `%${q}%`)
                )!
            ))
            .orderBy(desc(supplierProfiles.rating))
            .limit(parseInt(limit as string));

        res.json({
            success: true,
            suppliers: searchResults
        });

    } catch (error: any) {
        console.error('Search suppliers error:', error);
        res.status(500).json({ error: 'Failed to search suppliers' });
    }
});

// Get public reviews for a supplier (no auth required)
router.get('/:supplierId/reviews', async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { limit = '10', offset = '0', sortBy = 'newest' } = req.query;

        // Verify supplier exists
        const supplier = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.id, supplierId))
            .limit(1);

        if (supplier.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Determine sort order for reviews
        let reviewOrderBy;
        switch (sortBy) {
            case 'highest':
                reviewOrderBy = desc(reviews.rating);
                break;
            case 'lowest':
                reviewOrderBy = asc(reviews.rating);
                break;
            case 'newest':
            default:
                reviewOrderBy = desc(reviews.createdAt);
                break;
        }

        // Get reviews for this supplier
        const supplierReviews = await db.select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            orderReference: reviews.orderReference,
            createdAt: reviews.createdAt,
            // Buyer info (limited for privacy)
            buyerName: users.firstName,
            buyerCompany: users.companyName,
            // Product info (if product-specific review)
            productId: reviews.productId,
            productName: products.name
        })
            .from(reviews)
            .leftJoin(users, eq(reviews.buyerId, users.id))
            .leftJoin(products, eq(reviews.productId, products.id))
            .where(eq(reviews.supplierId, supplierId))
            .orderBy(reviewOrderBy)
            .limit(parseInt(limit as string))
            .offset(parseInt(offset as string));

        // Get total count and rating statistics
        const [stats] = await db.select({
            count: sql`count(*)`,
            avgRating: sql`COALESCE(AVG(CAST(${reviews.rating} AS DECIMAL)), 0)`,
            rating5: sql`count(*) filter (where ${reviews.rating} = 5)`,
            rating4: sql`count(*) filter (where ${reviews.rating} = 4)`,
            rating3: sql`count(*) filter (where ${reviews.rating} = 3)`,
            rating2: sql`count(*) filter (where ${reviews.rating} = 2)`,
            rating1: sql`count(*) filter (where ${reviews.rating} = 1)`
        })
            .from(reviews)
            .where(eq(reviews.supplierId, supplierId));

        res.json({
            success: true,
            reviews: supplierReviews,
            total: parseInt(stats.count as string),
            averageRating: parseFloat(stats.avgRating as string),
            ratingDistribution: {
                5: parseInt(stats.rating5 as string),
                4: parseInt(stats.rating4 as string),
                3: parseInt(stats.rating3 as string),
                2: parseInt(stats.rating2 as string),
                1: parseInt(stats.rating1 as string)
            },
            page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
            limit: parseInt(limit as string)
        });

    } catch (error: any) {
        console.error('Get supplier reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch supplier reviews' });
    }
});

// ==================== SUPPLIER ANALYTICS API ====================

// Get analytics overview
router.get('/analytics/overview', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { days = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        // Get order statistics
        const [orderStats] = await db.select({
            totalOrders: sql`count(*)`,
            totalRevenue: sql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            completedOrders: sql`count(*) filter (where ${orders.status} = 'delivered')`
        })
            .from(orders)
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ));

        // Get product views
        const [productStats] = await db.select({
            totalViews: sql`COALESCE(SUM(${products.views}), 0)`
        })
            .from(products)
            .where(eq(products.supplierId, supplierId));

        // Get inquiry statistics
        const [inquiryStats] = await db.select({
            totalInquiries: sql`count(*)`,
            repliedInquiries: sql`count(*) filter (where ${inquiries.status} IN ('replied', 'quoted'))`
        })
            .from(inquiries)
            .where(and(
                eq(inquiries.supplierId, supplierId),
                gte(inquiries.createdAt, daysAgo)
            ));

        // Get quotation statistics
        const [quotationStats] = await db.select({
            totalQuotations: sql`count(*)`,
            acceptedQuotations: sql`count(*) filter (where ${inquiryQuotations.status} = 'accepted')`
        })
            .from(inquiryQuotations)
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, daysAgo)
            ));

        // Calculate response time (average hours to first reply)
        // Using quotation creation time as proxy for response time
        const [responseTimeStats] = await db.select({
            avgResponseTime: sql`COALESCE(AVG(EXTRACT(EPOCH FROM (${inquiryQuotations.createdAt} - ${inquiries.createdAt})) / 3600), 0)`
        })
            .from(inquiryQuotations)
            .leftJoin(inquiries, eq(inquiryQuotations.inquiryId, inquiries.id))
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, daysAgo)
            ));

        const totalOrders = parseInt(orderStats.totalOrders as string || '0');
        const totalRevenue = parseFloat(orderStats.totalRevenue as string || '0');
        const totalInquiries = parseInt(inquiryStats.totalInquiries as string || '0');
        const repliedInquiries = parseInt(inquiryStats.repliedInquiries as string || '0');
        const totalQuotations = parseInt(quotationStats.totalQuotations as string || '0');
        const acceptedQuotations = parseInt(quotationStats.acceptedQuotations as string || '0');

        const overview = {
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            conversionRate: totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0,
            totalViews: parseInt(productStats.totalViews as string || '0'),
            totalInquiries,
            totalQuotations,
            responseRate: totalInquiries > 0 ? (repliedInquiries / totalInquiries) * 100 : 0,
            averageResponseTime: parseFloat(responseTimeStats.avgResponseTime as string || '0'),
            inquiryToQuotationRate: totalInquiries > 0 ? (totalQuotations / totalInquiries) * 100 : 0,
            quotationToOrderRate: totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0
        };

        res.json(overview);

    } catch (error: any) {
        console.error('Get analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics overview' });
    }
});

// Get analytics trends
router.get('/analytics/trends', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { days = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        // Get daily trends for orders
        const orderTrends = await db.select({
            date: sql`DATE(${orders.createdAt})`,
            revenue: sql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orders: sql`count(*)`
        })
            .from(orders)
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ))
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(asc(sql`DATE(${orders.createdAt})`));

        // Get daily trends for inquiries
        const inquiryTrends = await db.select({
            date: sql`DATE(${inquiries.createdAt})`,
            inquiries: sql`count(*)`
        })
            .from(inquiries)
            .where(and(
                eq(inquiries.supplierId, supplierId),
                gte(inquiries.createdAt, daysAgo)
            ))
            .groupBy(sql`DATE(${inquiries.createdAt})`)
            .orderBy(asc(sql`DATE(${inquiries.createdAt})`));

        // Get daily trends for quotations
        const quotationTrends = await db.select({
            date: sql`DATE(${inquiryQuotations.createdAt})`,
            quotations: sql`count(*)`
        })
            .from(inquiryQuotations)
            .where(and(
                eq(inquiryQuotations.supplierId, supplierId),
                gte(inquiryQuotations.createdAt, daysAgo)
            ))
            .groupBy(sql`DATE(${inquiryQuotations.createdAt})`)
            .orderBy(asc(sql`DATE(${inquiryQuotations.createdAt})`));

        // Merge all trends by date
        const trendsMap = new Map();

        orderTrends.forEach((item: any) => {
            const dateStr = item.date.toISOString().split('T')[0];
            trendsMap.set(dateStr, {
                date: dateStr,
                revenue: parseFloat(item.revenue as string || '0'),
                orders: parseInt(item.orders as string || '0'),
                inquiries: 0,
                quotations: 0,
                views: 0
            });
        });

        inquiryTrends.forEach((item: any) => {
            const dateStr = item.date.toISOString().split('T')[0];
            const existing = trendsMap.get(dateStr) || {
                date: dateStr,
                revenue: 0,
                orders: 0,
                inquiries: 0,
                quotations: 0,
                views: 0
            };
            existing.inquiries = parseInt(item.inquiries as string || '0');
            trendsMap.set(dateStr, existing);
        });

        quotationTrends.forEach((item: any) => {
            const dateStr = item.date.toISOString().split('T')[0];
            const existing = trendsMap.get(dateStr) || {
                date: dateStr,
                revenue: 0,
                orders: 0,
                inquiries: 0,
                quotations: 0,
                views: 0
            };
            existing.quotations = parseInt(item.quotations as string || '0');
            trendsMap.set(dateStr, existing);
        });

        // Fill in missing dates with zeros
        const startDate = new Date(daysAgo);
        const endDate = new Date();
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (!trendsMap.has(dateStr)) {
                trendsMap.set(dateStr, {
                    date: dateStr,
                    revenue: 0,
                    orders: 0,
                    inquiries: 0,
                    quotations: 0,
                    views: 0
                });
            }
        }

        const trends = Array.from(trendsMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        res.json(trends);

    } catch (error: any) {
        console.error('Get analytics trends error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics trends' });
    }
});

// Get product performance analytics
router.get('/analytics/products', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { days = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        // Get product performance data
        const productPerformance = await db.select({
            productId: products.id,
            productName: products.name,
            views: products.views,
            inquiries: products.inquiries,
            quotations: sql`COALESCE((
                SELECT count(*)
                FROM ${inquiryQuotations}
                INNER JOIN ${inquiries} ON ${inquiryQuotations.inquiryId} = ${inquiries.id}
                WHERE ${inquiries.productId} = ${products.id}
                AND ${inquiryQuotations.supplierId} = ${supplierId}
                AND ${inquiryQuotations.createdAt} >= ${daysAgo}
            ), 0)`,
            orders: sql`COALESCE((
                SELECT count(*)
                FROM ${orders}
                WHERE ${orders.productId} = ${products.id}
                AND ${orders.supplierId} = ${supplierId}
                AND ${orders.createdAt} >= ${daysAgo}
            ), 0)`,
            revenue: sql`COALESCE((
                SELECT SUM(CAST(${orders.totalAmount} AS DECIMAL))
                FROM ${orders}
                WHERE ${orders.productId} = ${products.id}
                AND ${orders.supplierId} = ${supplierId}
                AND ${orders.createdAt} >= ${daysAgo}
            ), 0)`
        })
            .from(products)
            .where(eq(products.supplierId, supplierId))
            .orderBy(desc(sql`COALESCE((
                SELECT SUM(CAST(${orders.totalAmount} AS DECIMAL))
                FROM ${orders}
                WHERE ${orders.productId} = ${products.id}
                AND ${orders.supplierId} = ${supplierId}
                AND ${orders.createdAt} >= ${daysAgo}
            ), 0)`))
            .limit(50);

        const formattedPerformance = productPerformance.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            views: parseInt(item.views as string || '0'),
            inquiries: parseInt(item.inquiries as string || '0'),
            quotations: parseInt(item.quotations as string || '0'),
            orders: parseInt(item.orders as string || '0'),
            revenue: parseFloat(item.revenue as string || '0')
        }));

        res.json(formattedPerformance);

    } catch (error: any) {
        console.error('Get product performance error:', error);
        res.status(500).json({ error: 'Failed to fetch product performance' });
    }
});

// Get top buyers analytics
router.get('/analytics/buyers', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { days = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        // Get top buyers by revenue
        const topBuyers = await db.select({
            buyerId: orders.buyerId,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerCompany: users.companyName,
            totalOrders: sql`count(*)`,
            totalRevenue: sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`
        })
            .from(orders)
            .leftJoin(users, eq(orders.buyerId, users.id))
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ))
            .groupBy(orders.buyerId, users.firstName, users.lastName, users.companyName)
            .orderBy(desc(sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`))
            .limit(20);

        const formattedBuyers = topBuyers.map((item: any) => ({
            buyerId: item.buyerId,
            buyerName: `${item.buyerName || ''} ${item.buyerLastName || ''}`.trim(),
            buyerCompany: item.buyerCompany || 'N/A',
            totalOrders: parseInt(item.totalOrders as string || '0'),
            totalRevenue: parseFloat(item.totalRevenue as string || '0')
        }));

        res.json(formattedBuyers);

    } catch (error: any) {
        console.error('Get top buyers error:', error);
        res.status(500).json({ error: 'Failed to fetch top buyers' });
    }
});

// Export analytics data as CSV
router.get('/analytics/export', authMiddleware, async (req, res) => {
    try {
        if (req.user?.role !== 'supplier') {
            return res.status(403).json({ error: 'Access denied. Supplier role required.' });
        }

        const supplierProfile = await db.select({ id: supplierProfiles.id })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.userId, req.user.id))
            .limit(1);

        if (supplierProfile.length === 0) {
            return res.status(404).json({ error: 'Supplier profile not found' });
        }

        const supplierId = supplierProfile[0].id;
        const { days = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

        // Get all orders for the period
        const ordersData = await db.select({
            orderNumber: orders.orderNumber,
            date: orders.createdAt,
            buyerName: users.firstName,
            buyerLastName: users.lastName,
            buyerCompany: users.companyName,
            productName: products.name,
            quantity: orders.quantity,
            unitPrice: orders.unitPrice,
            totalAmount: orders.totalAmount,
            status: orders.status
        })
            .from(orders)
            .leftJoin(users, eq(orders.buyerId, users.id))
            .leftJoin(products, eq(orders.productId, products.id))
            .where(and(
                eq(orders.supplierId, supplierId),
                gte(orders.createdAt, daysAgo)
            ))
            .orderBy(desc(orders.createdAt));

        // Generate CSV
        const csvHeaders = [
            'Order Number',
            'Date',
            'Buyer Name',
            'Company',
            'Product',
            'Quantity',
            'Unit Price',
            'Total Amount',
            'Status'
        ];

        const csvRows = ordersData.map((order: any) => [
            order.orderNumber,
            new Date(order.date).toISOString().split('T')[0],
            `${order.buyerName || ''} ${order.buyerLastName || ''}`.trim(),
            order.buyerCompany || 'N/A',
            order.productName || 'N/A',
            order.quantity,
            order.unitPrice,
            order.totalAmount,
            order.status
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${days}days-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);

    } catch (error: any) {
        console.error('Export analytics error:', error);
        res.status(500).json({ error: 'Failed to export analytics' });
    }
});

export default router;
