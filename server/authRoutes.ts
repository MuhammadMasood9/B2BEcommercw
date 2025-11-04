import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, buyerProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  handleTokenRefresh, 
  handleLogout,
  jwtAuthMiddleware 
} from './authMiddleware';

const router = Router();

// Login route with JWT support
router.post('/login', (req, res, next) => {
  const { useJWT } = req.body;
  
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Authentication failed' });
    }
    
    if (useJWT) {
      // JWT-based authentication
      try {
        const sessionId = `session-${user.id}-${Date.now()}`;
        
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          sessionId
        });
        
        const refreshToken = generateRefreshToken({
          userId: user.id,
          sessionId,
          tokenVersion: 1
        });
        
        return res.json({
          success: true,
          message: 'Login successful',
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: '15m',
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
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
        return res.status(500).json({ error: 'Token generation failed' });
      }
    } else {
      // Session-based authentication (legacy)
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
    }
  })(req, res, next);
});

// Register route
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

// Token refresh route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    const result = await handleTokenRefresh(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: result.user
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Enhanced logout route
router.post('/logout', async (req, res) => {
  try {
    await handleLogout(req);
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user route with JWT support
router.get('/me', jwtAuthMiddleware, (req, res) => {
  if (req.user) {
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json({
      success: true,
      user: userWithoutPassword,
      tokenData: req.tokenData
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Check authentication status (hybrid support)
router.get('/status', (req, res) => {
  // Check JWT first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return jwtAuthMiddleware(req, res, () => {
      res.json({
        authenticated: !!req.user,
        authType: 'jwt',
        user: req.user || null,
        tokenData: req.tokenData
      });
    });
  }
  
  // Fall back to session
  res.json({
    authenticated: req.isAuthenticated(),
    authType: 'session',
    user: req.isAuthenticated() ? (req.user as any) : null
  });
});

// Validate token endpoint
router.post('/validate', jwtAuthMiddleware, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    tokenData: req.tokenData
  });
});

export { router as authRoutes };
