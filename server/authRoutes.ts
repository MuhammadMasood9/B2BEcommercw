import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, buyerProfiles, supplierProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Authentication failed' });
    }
    
    // Additional checks for supplier users
    if (user.role === 'supplier') {
      try {
        const supplierProfile = await db.select({
          status: supplierProfiles.status,
          isActive: supplierProfiles.isActive
        })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, user.id))
        .limit(1);
        
        if (supplierProfile.length === 0) {
          return res.status(401).json({ error: 'Supplier profile not found' });
        }
        
        const profile = supplierProfile[0];
        
        if (profile.status === 'rejected') {
          return res.status(401).json({ 
            error: 'Your supplier account has been rejected. Please contact support.' 
          });
        }
        
        if (profile.status === 'suspended') {
          return res.status(401).json({ 
            error: 'Your supplier account has been suspended. Please contact support.' 
          });
        }
        
        if (profile.status === 'pending') {
          return res.status(401).json({ 
            error: 'Your supplier account is pending approval. You will be notified once approved.' 
          });
        }
        
        if (!profile.isActive) {
          return res.status(401).json({ 
            error: 'Your supplier account is inactive. Please contact support.' 
          });
        }
      } catch (error) {
        console.error('Supplier login check error:', error);
        return res.status(500).json({ error: 'Login validation failed' });
      }
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          phone: user.phone,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    });
  })(req, res, next);
});

// Register route (for buyers and admins only - suppliers use separate endpoint)
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      companyName, 
      phone, 
      role, 
      businessType,
      industry,
      position,
      mainProducts
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent supplier registration through this endpoint
    if (role === 'supplier') {
      return res.status(400).json({ 
        error: 'Suppliers must register through the supplier registration endpoint' 
      });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      companyName: companyName || null,
      phone: phone || null,
      role,
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const user = newUser[0];

    // Create profile based on role
    if (role === 'buyer') {
      await db.insert(buyerProfiles).values({
        userId: user.id,
        companyName: companyName || '',
        fullName: `${firstName} ${lastName}`,
        phone: phone || null,
        country: null,
        industry: industry || '',
        buyingPreferences: null,
        isVerified: false,
        createdAt: new Date()
      });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// Get current user route
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? (req.user as any) : null
  });
});

export { router as authRoutes };
