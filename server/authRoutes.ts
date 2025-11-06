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
import { EnhancedAuthService } from './enhancedAuthService';
import { PasswordSecurityService } from './passwordSecurityService';
import { AuthRateLimiter } from './authRateLimiter';
import { AuthSecurityMonitor } from './authSecurityMonitor';
import { securityHeaders, securityMonitoring } from './securityHeaders';

const router = Router();

// Apply security headers and monitoring to all auth routes
router.use(securityHeaders());
router.use(securityMonitoring());

// Enhanced login route with comprehensive security
router.post('/login', AuthRateLimiter.loginRateLimit(), async (req, res) => {
  try {
    const { email, password, useJWT = true } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const result = await EnhancedAuthService.login(
      email, 
      password, 
      ipAddress, 
      userAgent, 
      useJWT
    );

    // Monitor authentication event
    await AuthSecurityMonitor.monitorAuthEvent(
      result.success ? 'login_success' : 'login_failure',
      ipAddress,
      userAgent,
      result.user?.id,
      email,
      result.success,
      { useJWT, errorCode: result.errorCode }
    );

    if (!result.success) {
      const statusCode = result.errorCode === 'ACCOUNT_LOCKED' ? 423 : 401;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.errorCode,
        lockoutUntil: result.lockoutUntil
      });
    }

    if (useJWT && result.accessToken && result.refreshToken) {
      return res.json({
        success: true,
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: {
          id: result.user!.id,
          email: result.user!.email,
          role: result.user!.role,
          firstName: result.user!.firstName,
          lastName: result.user!.lastName,
          companyName: result.user!.companyName,
          phone: result.user!.phone,
          emailVerified: result.user!.emailVerified,
          isActive: result.user!.isActive,
          createdAt: result.user!.createdAt
        }
      });
    } else {
      // Session-based authentication (legacy)
      req.logIn(result.user!, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        
        return res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: result.user!.id,
            email: result.user!.email,
            role: result.user!.role,
            firstName: result.user!.firstName,
            lastName: result.user!.lastName,
            companyName: result.user!.companyName,
            phone: result.user!.phone,
            emailVerified: result.user!.emailVerified,
            isActive: result.user!.isActive,
            createdAt: result.user!.createdAt
          }
        });
      });
    }
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Register route
router.post('/register', AuthRateLimiter.registrationRateLimit(), async (req, res) => {
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

    // Validate role
    if (!['buyer', 'admin', 'supplier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Validate password strength
    const passwordValidation = PasswordSecurityService.validatePassword(password, {
      email,
      firstName,
      lastName,
      companyName
    });

    if (!passwordValidation.isValid) {
      return res.status(422).json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Hash password
    const hashedPassword = await PasswordSecurityService.hashPassword(password);

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

    // Monitor registration event
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    await AuthSecurityMonitor.monitorAuthEvent(
      'registration_success',
      ipAddress,
      userAgent,
      user.id,
      email,
      true,
      { role }
    );

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

    // Return user without password and generate JWT tokens
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate JWT tokens for immediate login after signup
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
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: '15m'
      });
    } catch (tokenError) {
      console.error('Token generation error after signup:', tokenError);
      // Fallback to registration without tokens
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword
      });
    }

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

// Unified /me endpoint supporting both session and JWT authentication
router.get('/me', (req, res, next) => {
  // Check for JWT token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return jwtAuthMiddleware(req, res, () => {
      if (req.user) {
        const { password: _, ...userWithoutPassword } = req.user as any;
        return res.json({
          success: true,
          user: userWithoutPassword,
          authType: 'jwt'
        });
      } else {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NO_SESSION'
        });
      }
    });
  }
  
  // Fallback to session-based authentication
  if (req.isAuthenticated()) {
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json({
      success: true,
      user: userWithoutPassword,
      authType: 'session'
    });
  } else {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_SESSION'
    });
  }
});

// Enhanced token refresh route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refresh token required' 
      });
    }
    
    const result = await handleTokenRefresh(refreshToken, ipAddress, userAgent);
    
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
    res.status(401).json({ 
      success: false, 
      error: 'Invalid refresh token' 
    });
  }
});

// Enhanced logout route
router.post('/logout', async (req, res) => {
  try {
    const result = await handleLogout(req);
    
    res.json({ 
      success: result.success, 
      message: result.message || 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
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
