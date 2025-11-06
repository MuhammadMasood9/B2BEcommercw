import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import { users, passwordHistory, InsertPasswordHistory } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { AuditLogService } from './auditLogService';

// Password security configuration
const PASSWORD_HISTORY_LIMIT = 5;
const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Password strength requirements
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

export interface PasswordResetResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export class PasswordSecurityService {
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbidCommonPasswords: true,
    forbidPersonalInfo: true
  };

  // Common weak passwords to reject
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'admin123', 'root', 'toor', 'pass', '12345678'
  ];

  /**
   * Validate password strength and requirements
   */
  static validatePassword(
    password: string, 
    userInfo?: { email?: string; firstName?: string; lastName?: string; companyName?: string },
    requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS
  ): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    } else {
      score += Math.min(password.length * 2, 20); // Max 20 points for length
    }

    // Check uppercase requirement
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    // Check lowercase requirement
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    // Check numbers requirement
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 10;
    }

    // Check special characters requirement
    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Check against common passwords
    if (requirements.forbidCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (this.COMMON_PASSWORDS.includes(lowerPassword)) {
        errors.push('Password is too common and easily guessable');
        score = Math.max(0, score - 30);
      }
    }

    // Check against personal information
    if (requirements.forbidPersonalInfo && userInfo) {
      const personalInfo = [
        userInfo.email?.split('@')[0],
        userInfo.firstName,
        userInfo.lastName,
        userInfo.companyName
      ].filter(Boolean).map(info => info!.toLowerCase());

      for (const info of personalInfo) {
        if (password.toLowerCase().includes(info)) {
          errors.push('Password should not contain personal information');
          score = Math.max(0, score - 20);
          break;
        }
      }
    }

    // Additional complexity checks
    const hasRepeatingChars = /(.)\1{2,}/.test(password);
    if (hasRepeatingChars) {
      score = Math.max(0, score - 10);
    }

    const hasSequentialChars = this.hasSequentialCharacters(password);
    if (hasSequentialChars) {
      score = Math.max(0, score - 10);
    }

    // Bonus for mixed character types
    const charTypes = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ].filter(Boolean).length;

    if (charTypes >= 3) {
      score += 10;
    }

    // Determine strength based on score
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 30) {
      strength = 'weak';
    } else if (score < 50) {
      strength = 'fair';
    } else if (score < 70) {
      strength = 'good';
    } else {
      strength = 'strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.min(100, score)
    };
  }

  /**
   * Check for sequential characters (abc, 123, etc.)
   */
  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (lowerPassword.includes(subseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check if password is in user's history
   */
  static async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
    try {
      const history = await db.select({ passwordHash: passwordHistory.passwordHash })
        .from(passwordHistory)
        .where(eq(passwordHistory.userId, userId))
        .orderBy(desc(passwordHistory.createdAt))
        .limit(PASSWORD_HISTORY_LIMIT);

      for (const entry of history) {
        const isMatch = await bcrypt.compare(newPassword, entry.passwordHash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking password history:', error);
      return false;
    }
  }

  /**
   * Add password to history
   */
  static async addPasswordToHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      const historyEntry: InsertPasswordHistory = {
        userId,
        passwordHash
      };

      await db.insert(passwordHistory).values(historyEntry);

      // Clean up old password history (keep only last 5)
      const oldEntries = await db.select({ id: passwordHistory.id })
        .from(passwordHistory)
        .where(eq(passwordHistory.userId, userId))
        .orderBy(desc(passwordHistory.createdAt))
        .offset(PASSWORD_HISTORY_LIMIT);

      if (oldEntries.length > 0) {
        for (const entry of oldEntries) {
          await db.delete(passwordHistory).where(eq(passwordHistory.id, entry.id));
        }
      }
    } catch (error) {
      console.error('Error adding password to history:', error);
    }
  }

  /**
   * Generate secure password reset token
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Initiate password reset process
   */
  static async initiatePasswordReset(
    email: string, 
    ipAddress: string, 
    userAgent?: string
  ): Promise<PasswordResetResult> {
    try {
      // Find user by email
      const userResult = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive
      }).from(users).where(eq(users.email, email)).limit(1);

      if (userResult.length === 0) {
        // Don't reveal that user doesn't exist for security
        await AuditLogService.logEvent(
          'password_reset_request',
          ipAddress,
          userAgent,
          undefined,
          email,
          undefined,
          false,
          'User not found'
        );
        
        return { 
          success: true // Return success to prevent email enumeration
        };
      }

      const user = userResult[0];

      if (!user.isActive) {
        await AuditLogService.logEvent(
          'password_reset_request',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Account inactive'
        );
        
        return { 
          success: false, 
          error: 'Account is inactive' 
        };
      }

      // Generate secure token
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Update user with reset token
      await db.update(users)
        .set({
          passwordResetToken: token,
          passwordResetExpires: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      await AuditLogService.logEvent(
        'password_reset_request',
        ipAddress,
        userAgent,
        user.id,
        user.email,
        user.role,
        true,
        undefined,
        undefined,
        undefined,
        { tokenExpiry: expiresAt.toISOString() }
      );

      return {
        success: true,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Error initiating password reset:', error);
      return {
        success: false,
        error: 'Failed to initiate password reset'
      };
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<PasswordChangeResult> {
    try {
      // Find user by reset token
      const userResult = await db.select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (userResult.length === 0) {
        await AuditLogService.logEvent(
          'password_reset_attempt',
          ipAddress,
          userAgent,
          undefined,
          undefined,
          undefined,
          false,
          'Invalid token'
        );
        
        return {
          success: false,
          error: 'Invalid or expired reset token',
          errorCode: 'INVALID_TOKEN'
        };
      }

      const user = userResult[0];

      // Check if token is expired
      if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
        await AuditLogService.logEvent(
          'password_reset_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Token expired'
        );
        
        return {
          success: false,
          error: 'Reset token has expired',
          errorCode: 'TOKEN_EXPIRED'
        };
      }

      // Validate new password
      const validation = this.validatePassword(newPassword, {
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        companyName: user.companyName || undefined
      });

      if (!validation.isValid) {
        await AuditLogService.logEvent(
          'password_reset_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Password validation failed'
        );
        
        return {
          success: false,
          error: validation.errors.join(', '),
          errorCode: 'INVALID_PASSWORD'
        };
      }

      // Check password history
      const isInHistory = await this.isPasswordInHistory(user.id, newPassword);
      if (isInHistory) {
        await AuditLogService.logEvent(
          'password_reset_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Password in history'
        );
        
        return {
          success: false,
          error: `Password cannot be one of your last ${PASSWORD_HISTORY_LIMIT} passwords`,
          errorCode: 'PASSWORD_IN_HISTORY'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Add old password to history
      await this.addPasswordToHistory(user.id, user.password);

      // Update user with new password and clear reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
          loginAttempts: 0, // Reset login attempts
          lockedUntil: null, // Unlock account if locked
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      await AuditLogService.logEvent(
        'password_reset_success',
        ipAddress,
        userAgent,
        user.id,
        user.email,
        user.role,
        true,
        undefined,
        undefined,
        undefined,
        { passwordStrength: validation.strength }
      );

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: 'Failed to reset password',
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<PasswordChangeResult> {
    try {
      // Get user
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND'
        };
      }

      const user = userResult[0];

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        await AuditLogService.logEvent(
          'password_change_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Invalid current password'
        );
        
        return {
          success: false,
          error: 'Current password is incorrect',
          errorCode: 'INVALID_CURRENT_PASSWORD'
        };
      }

      // Validate new password
      const validation = this.validatePassword(newPassword, {
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        companyName: user.companyName || undefined
      });

      if (!validation.isValid) {
        await AuditLogService.logEvent(
          'password_change_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Password validation failed'
        );
        
        return {
          success: false,
          error: validation.errors.join(', '),
          errorCode: 'INVALID_PASSWORD'
        };
      }

      // Check if new password is same as current
      const isSamePassword = await this.verifyPassword(newPassword, user.password);
      if (isSamePassword) {
        return {
          success: false,
          error: 'New password must be different from current password',
          errorCode: 'SAME_PASSWORD'
        };
      }

      // Check password history
      const isInHistory = await this.isPasswordInHistory(user.id, newPassword);
      if (isInHistory) {
        await AuditLogService.logEvent(
          'password_change_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Password in history'
        );
        
        return {
          success: false,
          error: `Password cannot be one of your last ${PASSWORD_HISTORY_LIMIT} passwords`,
          errorCode: 'PASSWORD_IN_HISTORY'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Add old password to history
      await this.addPasswordToHistory(user.id, user.password);

      // Update user with new password
      await db.update(users)
        .set({
          password: hashedPassword,
          passwordChangedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      await AuditLogService.logEvent(
        'password_change_success',
        ipAddress,
        userAgent,
        user.id,
        user.email,
        user.role,
        true,
        undefined,
        undefined,
        undefined,
        { passwordStrength: validation.strength }
      );

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: 'Failed to change password',
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Generate email verification token
   */
  static async generateEmailVerificationToken(
    userId: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<{ success: boolean; token?: string; expiresAt?: Date; error?: string }> {
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await db.update(users)
        .set({
          emailVerificationToken: token,
          emailVerificationExpires: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      const user = await db.select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length > 0) {
        await AuditLogService.logEvent(
          'email_verification_token_generated',
          ipAddress,
          userAgent,
          userId,
          user[0].email,
          user[0].role,
          true,
          undefined,
          undefined,
          undefined,
          { tokenExpiry: expiresAt.toISOString() }
        );
      }

      return {
        success: true,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Error generating email verification token:', error);
      return {
        success: false,
        error: 'Failed to generate verification token'
      };
    }
  }

  /**
   * Verify email using token
   */
  static async verifyEmail(
    token: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      const userResult = await db.select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (userResult.length === 0) {
        await AuditLogService.logEvent(
          'email_verification_attempt',
          ipAddress,
          userAgent,
          undefined,
          undefined,
          undefined,
          false,
          'Invalid token'
        );
        
        return {
          success: false,
          error: 'Invalid verification token',
          errorCode: 'INVALID_TOKEN'
        };
      }

      const user = userResult[0];

      // Check if token is expired
      if (!user.emailVerificationExpires || new Date() > user.emailVerificationExpires) {
        await AuditLogService.logEvent(
          'email_verification_attempt',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Token expired'
        );
        
        return {
          success: false,
          error: 'Verification token has expired',
          errorCode: 'TOKEN_EXPIRED'
        };
      }

      // Update user as verified and clear token
      await db.update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      await AuditLogService.logEvent(
        'email_verification_success',
        ipAddress,
        userAgent,
        user.id,
        user.email,
        user.role,
        true
      );

      return { success: true };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        error: 'Failed to verify email',
        errorCode: 'SYSTEM_ERROR'
      };
    }
  }
}

export default PasswordSecurityService;