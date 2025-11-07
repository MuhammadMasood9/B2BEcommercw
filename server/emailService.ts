import { emailTemplateService, EmailTemplateType, TemplateVariables } from './emailTemplateService';

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@b2bmarketplace.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@b2bmarketplace.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Mock email sending for development
const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  console.log('=== EMAIL SENT ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html.substring(0, 200) + '...');
  console.log('==================');
  
  // In production, you would integrate with a real email service like:
  // - SendGrid: https://www.npmjs.com/package/@sendgrid/mail
  // - Resend: https://www.npmjs.com/package/resend
  // - AWS SES: https://www.npmjs.com/package/@aws-sdk/client-ses
  // - Mailgun: https://www.npmjs.com/package/mailgun-js
  // 
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: FROM_EMAIL, subject, html, text });
  
  return Promise.resolve();
};

/**
 * Send email using template
 */
const sendTemplateEmail = async (
  to: string,
  templateType: EmailTemplateType,
  variables: TemplateVariables
): Promise<void> => {
  try {
    // Get template by type
    const template = await emailTemplateService.getTemplateByType(templateType);
    
    if (!template) {
      console.error(`Template not found for type: ${templateType}`);
      // Fallback to legacy email methods
      return;
    }
    
    // Add recipient email to variables
    variables.recipientEmail = to;
    
    // Render template
    const rendered = emailTemplateService.renderTemplateContent(
      template.subject,
      template.htmlContent,
      template.content,
      {
        variables,
        includeFooter: true,
        includeUnsubscribeLink: false
      }
    );
    
    // Send email
    await sendEmail(to, rendered.subject, rendered.html, rendered.text);
  } catch (error) {
    console.error('Error sending template email:', error);
    throw error;
  }
};

export class EmailService {
  /**
   * Send supplier registration verification email
   */
  static async sendSupplierRegistrationEmail(
    email: string,
    firstName: string,
    businessName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    // Try to use template first
    try {
      await sendTemplateEmail(email, 'verification', {
        firstName,
        companyName: 'B2B Marketplace',
        businessName,
        verificationUrl,
        recipientEmail: email
      });
      return;
    } catch (error) {
      console.log('Template not available, using legacy email');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to B2B Marketplace</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status-badge { background: #e3f2fd; color: #1976d2; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to B2B Marketplace!</h1>
            <p>Your supplier registration is almost complete</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Thank you for registering <strong>${businessName}</strong> as a supplier on our B2B marketplace!</p>
            
            <div class="status-badge">📋 Registration Status: Pending Verification</div>
            
            <p>To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>✅ Verify your email address (click button above)</li>
              <li>⏳ Wait for admin approval of your supplier application</li>
              <li>🎉 Start selling once approved!</li>
            </ol>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will review your application and uploaded documents</li>
              <li>You'll receive an email notification once your application is approved</li>
              <li>Once approved, you can start adding products and managing your store</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The B2B Marketplace Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. If you didn't register for this account, please ignore this email.</p>
            <p>© 2024 B2B Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to B2B Marketplace!
      
      Hello ${firstName},
      
      Thank you for registering ${businessName} as a supplier on our B2B marketplace!
      
      To complete your registration, please verify your email address by visiting:
      ${verificationUrl}
      
      Next Steps:
      1. Verify your email address
      2. Wait for admin approval of your supplier application
      3. Start selling once approved!
      
      What happens next?
      - Our team will review your application and uploaded documents
      - You'll receive an email notification once your application is approved
      - Once approved, you can start adding products and managing your store
      
      If you have any questions, please contact our support team.
      
      Best regards,
      The B2B Marketplace Team
    `;

    await sendEmail(
      email,
      'Welcome to B2B Marketplace - Verify Your Email',
      htmlContent,
      textContent
    );
  }

  /**
   * Send buyer registration verification email
   */
  static async sendBuyerRegistrationEmail(
    email: string,
    firstName: string,
    companyName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to B2B Marketplace</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .feature-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to B2B Marketplace!</h1>
            <p>Your buyer account is ready to activate</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Welcome to the world's leading B2B marketplace! Your account for <strong>${companyName}</strong> has been created successfully.</p>
            
            <p>To start exploring and connecting with suppliers, please verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email & Start Exploring</a>
            </div>
            
            <div class="feature-list">
              <h3>🚀 What you can do now:</h3>
              <ul>
                <li>Browse millions of products from verified suppliers</li>
                <li>Send inquiries and request quotations</li>
                <li>Create RFQs (Request for Quotations)</li>
                <li>Connect directly with suppliers worldwide</li>
                <li>Access trade assurance protection</li>
                <li>Get 24/7 customer support</li>
              </ul>
            </div>
            
            <p>Your account is immediately active after email verification - no waiting for approval needed!</p>
            
            <p>Best regards,<br>The B2B Marketplace Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. If you didn't create this account, please ignore this email.</p>
            <p>© 2024 B2B Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to B2B Marketplace!
      
      Hello ${firstName},
      
      Welcome to the world's leading B2B marketplace! Your account for ${companyName} has been created successfully.
      
      To start exploring and connecting with suppliers, please verify your email address:
      ${verificationUrl}
      
      What you can do now:
      - Browse millions of products from verified suppliers
      - Send inquiries and request quotations
      - Create RFQs (Request for Quotations)
      - Connect directly with suppliers worldwide
      - Access trade assurance protection
      - Get 24/7 customer support
      
      Your account is immediately active after email verification - no waiting for approval needed!
      
      Best regards,
      The B2B Marketplace Team
    `;

    await sendEmail(
      email,
      'Welcome to B2B Marketplace - Verify Your Email',
      htmlContent,
      textContent
    );
  }

  /**
   * Send admin notification for new supplier application
   */
  static async sendAdminSupplierApplicationNotification(
    businessName: string,
    email: string,
    supplierId: string
  ): Promise<void> {
    const reviewUrl = `${FRONTEND_URL}/admin/suppliers/pending`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Supplier Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #2196f3; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Supplier Application</h1>
            <p>Action Required: Review Pending Application</p>
          </div>
          <div class="content">
            <h2>New Supplier Registration</h2>
            <p>A new supplier has registered and is awaiting approval.</p>
            
            <div class="info-box">
              <h3>Application Details:</h3>
              <ul>
                <li><strong>Business Name:</strong> ${businessName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Supplier ID:</strong> ${supplierId}</li>
                <li><strong>Status:</strong> Pending Review</li>
              </ul>
            </div>
            
            <p>Please review the application, verify uploaded documents, and approve or reject the supplier registration.</p>
            
            <div style="text-align: center;">
              <a href="${reviewUrl}" class="button">Review Application</a>
            </div>
            
            <p><strong>Review Checklist:</strong></p>
            <ul>
              <li>Verify business license and registration documents</li>
              <li>Check tax registration certificate</li>
              <li>Validate identity documents</li>
              <li>Review business information for completeness</li>
              <li>Approve or reject with appropriate feedback</li>
            </ul>
            
            <p>Best regards,<br>B2B Marketplace System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      ADMIN_EMAIL,
      `New Supplier Application: ${businessName}`,
      htmlContent
    );
  }

  /**
   * Send supplier approval notification
   */
  static async sendSupplierApprovalEmail(
    email: string,
    firstName: string,
    businessName: string
  ): Promise<void> {
    const dashboardUrl = `${FRONTEND_URL}/supplier/dashboard`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Supplier Application Approved!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .success-badge { background: #e8f5e8; color: #2e7d32; padding: 12px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: bold; }
          .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your supplier application has been approved</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            
            <div class="success-badge">✅ ${businessName} - APPROVED</div>
            
            <p>Great news! Your supplier application has been approved and your store is now active on our B2B marketplace.</p>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Access Your Supplier Dashboard</a>
            </div>
            
            <div class="next-steps">
              <h3>🚀 Next Steps to Get Started:</h3>
              <ol>
                <li><strong>Set up your store:</strong> Add your logo, banner, and store description</li>
                <li><strong>Add products:</strong> Upload your first products with detailed descriptions</li>
                <li><strong>Configure settings:</strong> Set up payment methods and shipping options</li>
                <li><strong>Start selling:</strong> Respond to inquiries and send quotations</li>
              </ol>
            </div>
            
            <p><strong>Your Benefits:</strong></p>
            <ul>
              <li>Access to millions of global buyers</li>
              <li>Professional supplier dashboard</li>
              <li>Order management system</li>
              <li>Analytics and reporting tools</li>
              <li>24/7 customer support</li>
            </ul>
            
            <p>Welcome to the B2B Marketplace family! We're excited to help you grow your business.</p>
            
            <p>Best regards,<br>The B2B Marketplace Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      '🎉 Your Supplier Application Has Been Approved!',
      htmlContent
    );
  }

  /**
   * Send supplier rejection notification
   */
  static async sendSupplierRejectionEmail(
    email: string,
    firstName: string,
    businessName: string,
    rejectionReason: string
  ): Promise<void> {
    const reapplyUrl = `${FRONTEND_URL}/supplier/signup`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Supplier Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .reason-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
            <p>Regarding your supplier application</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            
            <p>Thank you for your interest in joining our B2B marketplace as a supplier for <strong>${businessName}</strong>.</p>
            
            <p>After careful review, we are unable to approve your application at this time.</p>
            
            <div class="reason-box">
              <h3>Reason for Decision:</h3>
              <p>${rejectionReason}</p>
            </div>
            
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Address the issues mentioned above</li>
              <li>Gather any missing documentation</li>
              <li>Reapply once you've resolved the concerns</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${reapplyUrl}" class="button">Apply Again</a>
            </div>
            
            <p>If you have any questions about this decision or need clarification, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The B2B Marketplace Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      'Supplier Application Update - B2B Marketplace',
      htmlContent
    );
  }

  /**
   * Send admin welcome email
   */
  static async sendAdminWelcomeEmail(
    email: string,
    firstName: string,
    verificationToken: string,
    createdBy: string
  ): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const adminDashboardUrl = `${FRONTEND_URL}/admin/dashboard`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .security-notice { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
          .setup-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Admin Account Created</h1>
            <p>Welcome to the B2B Marketplace Admin Panel</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            
            <p>An admin account has been created for you by <strong>${createdBy}</strong> on the B2B Marketplace platform.</p>
            
            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p>As an admin, you have elevated privileges. Please ensure you:</p>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication</li>
                <li>Never share your login credentials</li>
                <li>Log out when finished</li>
              </ul>
            </div>
            
            <p>To activate your admin account, please verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email & Activate Account</a>
            </div>
            
            <div class="setup-steps">
              <h3>📋 Setup Checklist:</h3>
              <ol>
                <li><strong>Verify Email:</strong> Click the button above</li>
                <li><strong>First Login:</strong> Access the admin dashboard</li>
                <li><strong>Enable 2FA:</strong> Set up two-factor authentication</li>
                <li><strong>Review Permissions:</strong> Understand your access level</li>
                <li><strong>Update Profile:</strong> Complete your admin profile</li>
              </ol>
            </div>
            
            <p>Once verified, you can access the admin dashboard at:</p>
            <p><a href="${adminDashboardUrl}">${adminDashboardUrl}</a></p>
            
            <p><strong>Admin Responsibilities:</strong></p>
            <ul>
              <li>Review and approve supplier applications</li>
              <li>Monitor platform activity and security</li>
              <li>Manage user accounts and permissions</li>
              <li>Handle disputes and customer support</li>
              <li>Maintain platform settings and configuration</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact the super admin who created your account.</p>
            
            <p>Best regards,<br>The B2B Marketplace System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Admin Account Created - B2B Marketplace
      
      Hello ${firstName},
      
      An admin account has been created for you by ${createdBy} on the B2B Marketplace platform.
      
      SECURITY NOTICE:
      As an admin, you have elevated privileges. Please ensure you:
      - Use a strong, unique password
      - Enable two-factor authentication
      - Never share your login credentials
      - Log out when finished
      
      To activate your admin account, please verify your email address:
      ${verificationUrl}
      
      Setup Checklist:
      1. Verify Email: Click the link above
      2. First Login: Access the admin dashboard
      3. Enable 2FA: Set up two-factor authentication
      4. Review Permissions: Understand your access level
      5. Update Profile: Complete your admin profile
      
      Admin Dashboard: ${adminDashboardUrl}
      
      Admin Responsibilities:
      - Review and approve supplier applications
      - Monitor platform activity and security
      - Manage user accounts and permissions
      - Handle disputes and customer support
      - Maintain platform settings and configuration
      
      If you have any questions, please contact the super admin who created your account.
      
      Best regards,
      The B2B Marketplace System
    `;

    await sendEmail(
      email,
      '🔐 Admin Account Created - B2B Marketplace',
      htmlContent,
      textContent
    );
  }

  /**
   * Send email verification confirmation
   */
  static async sendEmailVerificationSuccess(
    email: string,
    firstName: string,
    role: 'buyer' | 'supplier'
  ): Promise<void> {
    const dashboardUrl = role === 'supplier' 
      ? `${FRONTEND_URL}/supplier/dashboard` 
      : `${FRONTEND_URL}/buyer/dashboard`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Verified!</h1>
            <p>Your email address has been successfully verified</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            
            <p>Great! Your email address has been successfully verified.</p>
            
            ${role === 'supplier' 
              ? '<p>Your supplier application is now under review. You will receive another email once the review is complete.</p>'
              : '<p>Your buyer account is now fully active and ready to use!</p>'
            }
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <p>Thank you for joining B2B Marketplace!</p>
            
            <p>Best regards,<br>The B2B Marketplace Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      'Email Verified Successfully - B2B Marketplace',
      htmlContent
    );
  }
}

export default EmailService;