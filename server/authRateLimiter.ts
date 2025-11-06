import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { authenticationAuditLogs, users } from '@shared/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { AuditLogService } from './auditLogService';

// Configuration
const LOGIN_RATE_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT || '5'); // 5 attempts per window
const LOGIN_WINDOW_MS = parseInt(process.env.LOGIN_WINDOW_MS || '900000'); // 15 minutes
const PASSWORD_RESET_RATE_LIMIT = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT || '3'); // 3 attempts per window
const PASSWORD_RESET_WINDOW_MS = parseInt(process.env.PASSWORD_RESET_WINDOW_MS || '3600000'); // 1 hour
const REGISTRATION_RATE_LIMIT = parseInt(process.env.REGISTRATION_RATE_LIMIT || '10'); // 10 attempts per window
const REGISTRATION_WINDOW_MS = parseInt(process.env.REGISTRATION_WINDOW_MS || '3600000'); // 1 hour

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockoutUntil?: number;
}

class AuthRateLimiter {
  private static store: Map<string, RateLimitEntry> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize cleanup interval
   */
  static initialize(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000); // Cleanup every 5 minutes
    }
  }

  /**
   * Cleanup expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.lockoutUntil || entry.lockoutUntil < now)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get rate limit key for IP-based limiting
   */
  private static getIPKey(req: Request, action: string): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${action}:ip:${ip}`;
  }

  /**
   * Get rate limit key for email-based limiting
   */
  private static getEmailKey(email: string, action: string): string {
    return `${action}:email:${email}`;
  }

  /**
   * Check and update rate limit
   */
  private static checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    progressiveLockout: boolean = false
  ): { allowed: boolean; resetTime: number; remaining: number; lockoutUntil?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      this.store.set(key, newEntry);
      
      return {
        allowed: true,
        resetTime: newEntry.resetTime,
        remaining: limit - 1
      };
    }

    // Check if currently locked out
    if (entry.lockoutUntil && entry.lockoutUntil > now) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
        lockoutUntil: entry.lockoutUntil
      };
    }

    // Increment count
    entry.count++;

    if (entry.count > limit) {
      // Apply progressive lockout if enabled
      if (progressiveLockout) {
        const lockoutDuration = this.calculateLockoutDuration(entry.count - limit);
        entry.lockoutUntil = now + lockoutDuration;
      }

      this.store.set(key, entry);
      
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
        lockoutUntil: entry.lockoutUntil
      };
    }

    this.store.set(key, entry);
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: limit - entry.count
    };
  }

  /**
   * Calculate progressive lockout duration
   */
  private static calculateLockoutDuration(excessAttempts: number): number {
    // Progressive lockout: 5 min, 15 min, 1 hour, 4 hours, 24 hours
    const durations = [
      5 * 60 * 1000,      // 5 minutes
      15 * 60 * 1000,     // 15 minutes
      60 * 60 * 1000,     // 1 hour
      4 * 60 * 60 * 1000, // 4 hours
      24 * 60 * 60 * 1000 // 24 hours
    ];
    
    const index = Math.min(excessAttempts - 1, durations.length - 1);
    return durations[index];
  }

  /**
   * Login rate limiter middleware
   */
  static loginRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const { email } = req.body;

        // IP-based rate limiting
        const ipKey = this.getIPKey(req, 'login');
        const ipLimit = this.checkRateLimit(ipKey, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS, true);

        if (!ipLimit.allowed) {
          await AuditLogService.logEvent(
            'login_rate_limit_exceeded',
            ip,
            req.headers['user-agent'],
            undefined,
            email,
            undefined,
            false,
            'IP rate limit exceeded',
            undefined,
            undefined,
            { 
              rateLimitType: 'ip',
              lockoutUntil: ipLimit.lockoutUntil?.toISOString(),
              resetTime: new Date(ipLimit.resetTime).toISOString()
            }
          );

          return res.status(429).json({
            success: false,
            error: 'Too many login attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: new Date(ipLimit.resetTime).toISOString(),
            lockoutUntil: ipLimit.lockoutUntil ? new Date(ipLimit.lockoutUntil).toISOString() : undefined
          });
        }

        // Email-based rate limiting (if email provided)
        if (email) {
          const emailKey = this.getEmailKey(email, 'login');
          const emailLimit = this.checkRateLimit(emailKey, LOGIN_RATE_LIMIT * 2, LOGIN_WINDOW_MS, true);

          if (!emailLimit.allowed) {
            await AuditLogService.logEvent(
              'login_rate_limit_exceeded',
              ip,
              req.headers['user-agent'],
              undefined,
              email,
              undefined,
              false,
              'Email rate limit exceeded',
              undefined,
              undefined,
              { 
                rateLimitType: 'email',
                lockoutUntil: emailLimit.lockoutUntil?.toISOString(),
                resetTime: new Date(emailLimit.resetTime).toISOString()
              }
            );

            return res.status(429).json({
              success: false,
              error: 'Too many login attempts for this account. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
              resetTime: new Date(emailLimit.resetTime).toISOString(),
              lockoutUntil: emailLimit.lockoutUntil ? new Date(emailLimit.lockoutUntil).toISOString() : undefined
            });
          }
        }

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': LOGIN_RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': ipLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(ipLimit.resetTime).toISOString()
        });

        next();
      } catch (error) {
        console.error('Login rate limiter error:', error);
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  /**
   * Password reset rate limiter middleware
   */
  static passwordResetRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const { email } = req.body;

        // IP-based rate limiting
        const ipKey = this.getIPKey(req, 'password_reset');
        const ipLimit = this.checkRateLimit(ipKey, PASSWORD_RESET_RATE_LIMIT, PASSWORD_RESET_WINDOW_MS);

        if (!ipLimit.allowed) {
          await AuditLogService.logEvent(
            'password_reset_rate_limit_exceeded',
            ip,
            req.headers['user-agent'],
            undefined,
            email,
            undefined,
            false,
            'IP rate limit exceeded for password reset',
            undefined,
            undefined,
            { 
              rateLimitType: 'ip',
              resetTime: new Date(ipLimit.resetTime).toISOString()
            }
          );

          return res.status(429).json({
            success: false,
            error: 'Too many password reset attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: new Date(ipLimit.resetTime).toISOString()
          });
        }

        // Email-based rate limiting (if email provided)
        if (email) {
          const emailKey = this.getEmailKey(email, 'password_reset');
          const emailLimit = this.checkRateLimit(emailKey, PASSWORD_RESET_RATE_LIMIT, PASSWORD_RESET_WINDOW_MS);

          if (!emailLimit.allowed) {
            await AuditLogService.logEvent(
              'password_reset_rate_limit_exceeded',
              ip,
              req.headers['user-agent'],
              undefined,
              email,
              undefined,
              false,
              'Email rate limit exceeded for password reset',
              undefined,
              undefined,
              { 
                rateLimitType: 'email',
                resetTime: new Date(emailLimit.resetTime).toISOString()
              }
            );

            return res.status(429).json({
              success: false,
              error: 'Too many password reset attempts for this email. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
              resetTime: new Date(emailLimit.resetTime).toISOString()
            });
          }
        }

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': PASSWORD_RESET_RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': ipLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(ipLimit.resetTime).toISOString()
        });

        next();
      } catch (error) {
        console.error('Password reset rate limiter error:', error);
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  /**
   * Registration rate limiter middleware
   */
  static registrationRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const { email } = req.body;

        // IP-based rate limiting
        const ipKey = this.getIPKey(req, 'registration');
        const ipLimit = this.checkRateLimit(ipKey, REGISTRATION_RATE_LIMIT, REGISTRATION_WINDOW_MS);

        if (!ipLimit.allowed) {
          await AuditLogService.logEvent(
            'registration_rate_limit_exceeded',
            ip,
            req.headers['user-agent'],
            undefined,
            email,
            undefined,
            false,
            'IP rate limit exceeded for registration',
            undefined,
            undefined,
            { 
              rateLimitType: 'ip',
              resetTime: new Date(ipLimit.resetTime).toISOString()
            }
          );

          return res.status(429).json({
            success: false,
            error: 'Too many registration attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: new Date(ipLimit.resetTime).toISOString()
          });
        }

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': REGISTRATION_RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': ipLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(ipLimit.resetTime).toISOString()
        });

        next();
      } catch (error) {
        console.error('Registration rate limiter error:', error);
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  /**
   * Reset rate limit for a specific key (useful for successful operations)
   */
  static resetRateLimit(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current rate limit status
   */
  static getRateLimitStatus(key: string): { count: number; resetTime: number; lockoutUntil?: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      lockoutUntil: entry.lockoutUntil
    };
  }

  /**
   * Shutdown cleanup
   */
  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export { AuthRateLimiter };