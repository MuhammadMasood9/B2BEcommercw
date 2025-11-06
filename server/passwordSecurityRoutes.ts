import { Router } from 'express';
import { PasswordSecurityService } from './passwordSecurityService';
import { jwtAuthMiddleware } from './authMiddleware';
import { AuthRateLimiter } from './authRateLimiter';
import { AuthSecurityMonitor } from './authSecurityMonitor';

const router = Router();

// Validate password strength (public endpoint)
router.post('/validate', async (req, res) => {
  try {
    const { password, userInfo } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const validation = PasswordSecurityService.validatePassword(password, userInfo);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate password'
    });
  }
});

// Initiate password reset
router.post('/reset/initiate', AuthRateLimiter.passwordResetRateLimit(), async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await PasswordSecurityService.initiatePasswordReset(
      email,
      ipAddress,
      userAgent
    );

    // Monitor password reset request
    await AuthSecurityMonitor.monitorAuthEvent(
      'password_reset_request',
      ipAddress,
      userAgent,
      undefined,
      email,
      result.success,
      { result: result.success ? 'sent' : 'failed' }
    );

    if (result.success) {
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error initiating password reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate password reset'
    });
  }
});

// Reset password using token
router.post('/reset/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    const result = await PasswordSecurityService.resetPassword(
      token,
      newPassword,
      ipAddress,
      userAgent
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } else {
      const statusCode = result.errorCode === 'INVALID_TOKEN' || result.errorCode === 'TOKEN_EXPIRED' ? 400 : 422;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.errorCode
      });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// Change password (authenticated users)
router.post('/change', jwtAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const result = await PasswordSecurityService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Password has been changed successfully'
      });
    } else {
      const statusCode = result.errorCode === 'INVALID_CURRENT_PASSWORD' ? 401 : 422;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.errorCode
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Generate email verification token (authenticated users)
router.post('/email/verify/generate', jwtAuthMiddleware, async (req, res) => {
  try {
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    const result = await PasswordSecurityService.generateEmailVerificationToken(
      req.user!.id,
      ipAddress,
      userAgent
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Verification email has been sent',
        // Don't expose token in response for security
        expiresAt: result.expiresAt
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating email verification token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate verification token'
    });
  }
});

// Verify email using token
router.post('/email/verify/confirm', async (req, res) => {
  try {
    const { token } = req.body;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
    const userAgent = req.headers['user-agent'];

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    const result = await PasswordSecurityService.verifyEmail(
      token,
      ipAddress,
      userAgent
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Email has been verified successfully'
      });
    } else {
      const statusCode = result.errorCode === 'INVALID_TOKEN' || result.errorCode === 'TOKEN_EXPIRED' ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.errorCode
      });
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email'
    });
  }
});

export { router as passwordSecurityRoutes };