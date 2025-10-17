import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, User } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      phone?: string;
      role: string;
      emailVerified: boolean;
      isActive: boolean;
      createdAt: Date;
    }
  }
}

// Configure passport local strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done: any) => {
    try {
      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (userResult.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const user = userResult[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (userResult.length === 0) {
      return done(null, false);
    }

    const user = userResult[0];
    const { password: _, ...userWithoutPassword } = user;
    done(null, userWithoutPassword);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export { passport };
