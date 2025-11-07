import { emailTemplateService, EmailTemplate } from './emailTemplateService';

/**
 * Initialize default system email templates
 */
export async function initializeDefaultTemplates(): Promise<void> {
  try {
    console.log('Initializing default email templates...');
    
    const defaultTemplates: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Email Verification Template
      {
        name: 'Email Verification',
        description: 'Email verification template for new user registrations',
        category: 'authentication',
        type: 'verification',
        subject: 'Verify Your Email Address - {{companyName}}',
        content: `
Hello {{firstName}},

Thank you for registering with {{companyName}}!

To complete your registration, please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>Thank you for registering with <strong>{{companyName}}</strong>!</p>
<p>To complete your registration, please verify your email address by clicking the button below:</p>
<div style="text-align: center;">
  <a href="{{verificationUrl}}" class="email-button">Verify Email Address</a>
</div>
<p style="font-size: 14px; color: #6b7280;">This link will expire in 24 hours.</p>
<p>If you didn't create this account, you can safely ignore this email.</p>
        `.trim(),
        variables: ['firstName', 'companyName', 'verificationUrl', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          companyName: 'B2B Marketplace',
          verificationUrl: 'https://example.com/verify',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'all',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Welcome Email Template
      {
        name: 'Welcome Email',
        description: 'Welcome email sent after successful email verification',
        category: 'authentication',
        type: 'welcome',
        subject: 'Welcome to {{companyName}}!',
        content: `
Hello {{firstName}},

Welcome to {{companyName}}! We're excited to have you on board.

Your account has been successfully activated and you can now access all features.

Get Started:
- Complete your profile
- Explore our marketplace
- Connect with {{userType === 'buyer' ? 'suppliers' : 'buyers'}}

If you have any questions, our support team is here to help.

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>Welcome to <strong>{{companyName}}</strong>! We're excited to have you on board.</p>
<div class="badge badge-success">✅ Account Activated</div>
<p>Your account has been successfully activated and you can now access all features.</p>
<div class="info-box">
  <h3>🚀 Get Started:</h3>
  <ul>
    <li>Complete your profile</li>
    <li>Explore our marketplace</li>
    <li>Connect with partners</li>
  </ul>
</div>
<div style="text-align: center;">
  <a href="{{dashboardUrl}}" class="email-button">Go to Dashboard</a>
</div>
<p>If you have any questions, our support team is here to help.</p>
        `.trim(),
        variables: ['firstName', 'companyName', 'userType', 'dashboardUrl', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          companyName: 'B2B Marketplace',
          userType: 'buyer',
          dashboardUrl: 'https://example.com/dashboard',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'all',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Supplier Approval Template
      {
        name: 'Supplier Application Approved',
        description: 'Notification sent when supplier application is approved',
        category: 'authentication',
        type: 'approval',
        subject: '🎉 Your Supplier Application Has Been Approved!',
        content: `
Hello {{firstName}},

Great news! Your supplier application for {{businessName}} has been approved.

Your store is now active on our marketplace and you can start selling immediately.

Next Steps:
1. Set up your store profile
2. Add your first products
3. Configure payment and shipping settings
4. Start receiving inquiries and orders

Access your supplier dashboard: {{dashboardUrl}}

Welcome to the {{companyName}} family!

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h1>🎉 Congratulations!</h1>
<p>Your supplier application has been approved</p>
<h2>Hello {{firstName}},</h2>
<div class="badge badge-success">✅ {{businessName}} - APPROVED</div>
<p>Great news! Your supplier application has been approved and your store is now active on our marketplace.</p>
<div class="info-box">
  <h3>🚀 Next Steps to Get Started:</h3>
  <ol>
    <li><strong>Set up your store:</strong> Add your logo, banner, and store description</li>
    <li><strong>Add products:</strong> Upload your first products with detailed descriptions</li>
    <li><strong>Configure settings:</strong> Set up payment methods and shipping options</li>
    <li><strong>Start selling:</strong> Respond to inquiries and send quotations</li>
  </ol>
</div>
<div style="text-align: center;">
  <a href="{{dashboardUrl}}" class="email-button">Access Your Supplier Dashboard</a>
</div>
<p>Welcome to the {{companyName}} family! We're excited to help you grow your business.</p>
        `.trim(),
        variables: ['firstName', 'businessName', 'dashboardUrl', 'companyName', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          businessName: 'Example Business',
          dashboardUrl: 'https://example.com/supplier/dashboard',
          companyName: 'B2B Marketplace',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'supplier',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Supplier Rejection Template
      {
        name: 'Supplier Application Rejected',
        description: 'Notification sent when supplier application is rejected',
        category: 'authentication',
        type: 'rejection',
        subject: 'Supplier Application Update - {{companyName}}',
        content: `
Hello {{firstName}},

Thank you for your interest in joining {{companyName}} as a supplier for {{businessName}}.

After careful review, we are unable to approve your application at this time.

Reason: {{rejectionReason}}

What you can do:
- Address the issues mentioned above
- Gather any missing documentation
- Reapply once you've resolved the concerns

If you have any questions about this decision, please contact our support team.

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>Thank you for your interest in joining {{companyName}} as a supplier for <strong>{{businessName}}</strong>.</p>
<p>After careful review, we are unable to approve your application at this time.</p>
<div class="info-box" style="border-left-color: #f59e0b;">
  <h3>Reason for Decision:</h3>
  <p>{{rejectionReason}}</p>
</div>
<div class="info-box">
  <h3>What you can do:</h3>
  <ul>
    <li>Address the issues mentioned above</li>
    <li>Gather any missing documentation</li>
    <li>Reapply once you've resolved the concerns</li>
  </ul>
</div>
<div style="text-align: center;">
  <a href="{{reapplyUrl}}" class="email-button">Apply Again</a>
</div>
<p>If you have any questions about this decision, please contact our support team.</p>
        `.trim(),
        variables: ['firstName', 'businessName', 'rejectionReason', 'reapplyUrl', 'companyName', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          businessName: 'Example Business',
          rejectionReason: 'Incomplete documentation',
          reapplyUrl: 'https://example.com/supplier/signup',
          companyName: 'B2B Marketplace',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'supplier',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Password Reset Template
      {
        name: 'Password Reset',
        description: 'Password reset request email',
        category: 'authentication',
        type: 'password_reset',
        subject: 'Reset Your Password - {{companyName}}',
        content: `
Hello {{firstName}},

We received a request to reset your password for your {{companyName}} account.

To reset your password, click the link below:

{{resetUrl}}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>We received a request to reset your password for your {{companyName}} account.</p>
<p>To reset your password, click the button below:</p>
<div style="text-align: center;">
  <a href="{{resetUrl}}" class="email-button">Reset Password</a>
</div>
<div class="info-box" style="border-left-color: #f59e0b;">
  <p><strong>⚠️ Security Notice:</strong></p>
  <ul>
    <li>This link will expire in 1 hour</li>
    <li>If you didn't request this, ignore this email</li>
    <li>Your password will remain unchanged</li>
  </ul>
</div>
<p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
<p style="font-size: 12px; word-break: break-all; color: #6b7280;">{{resetUrl}}</p>
        `.trim(),
        variables: ['firstName', 'resetUrl', 'companyName', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          resetUrl: 'https://example.com/reset-password',
          companyName: 'B2B Marketplace',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'all',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Order Confirmation Template
      {
        name: 'Order Confirmation',
        description: 'Order confirmation email for buyers',
        category: 'transactional',
        type: 'order_confirmation',
        subject: 'Order Confirmation #{{orderNumber}} - {{companyName}}',
        content: `
Hello {{firstName}},

Thank you for your order! We've received your order and it's being processed.

Order Details:
Order Number: {{orderNumber}}
Order Date: {{orderDate}}
Total Amount: {{totalAmount}}

You can track your order status at: {{orderTrackingUrl}}

If you have any questions about your order, please contact the supplier or our support team.

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>Thank you for your order! We've received your order and it's being processed.</p>
<div class="badge badge-success">✅ Order Confirmed</div>
<div class="info-box">
  <h3>Order Details:</h3>
  <ul>
    <li><strong>Order Number:</strong> {{orderNumber}}</li>
    <li><strong>Order Date:</strong> {{orderDate}}</li>
    <li><strong>Total Amount:</strong> {{totalAmount}}</li>
  </ul>
</div>
<div style="text-align: center;">
  <a href="{{orderTrackingUrl}}" class="email-button">Track Your Order</a>
</div>
<p>If you have any questions about your order, please contact the supplier or our support team.</p>
        `.trim(),
        variables: ['firstName', 'orderNumber', 'orderDate', 'totalAmount', 'orderTrackingUrl', 'companyName', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          orderNumber: 'ORD-12345',
          orderDate: new Date().toLocaleDateString(),
          totalAmount: '$1,000.00',
          orderTrackingUrl: 'https://example.com/orders/12345',
          companyName: 'B2B Marketplace',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'buyer',
        isActive: true,
        isSystemTemplate: true
      },
      
      // Quotation Received Template
      {
        name: 'Quotation Received',
        description: 'Notification when buyer receives a quotation',
        category: 'transactional',
        type: 'quotation_received',
        subject: 'New Quotation from {{supplierName}} - {{companyName}}',
        content: `
Hello {{firstName}},

You've received a new quotation from {{supplierName}} for your inquiry.

Quotation Details:
Product: {{productName}}
Quantity: {{quantity}}
Unit Price: {{unitPrice}}
Total Price: {{totalPrice}}
Valid Until: {{validUntil}}

View and respond to this quotation: {{quotationUrl}}

Best regards,
The {{companyName}} Team
        `.trim(),
        htmlContent: `
<h2>Hello {{firstName}},</h2>
<p>You've received a new quotation from <strong>{{supplierName}}</strong> for your inquiry.</p>
<div class="badge badge-info">📋 New Quotation</div>
<div class="info-box">
  <h3>Quotation Details:</h3>
  <ul>
    <li><strong>Product:</strong> {{productName}}</li>
    <li><strong>Quantity:</strong> {{quantity}}</li>
    <li><strong>Unit Price:</strong> {{unitPrice}}</li>
    <li><strong>Total Price:</strong> {{totalPrice}}</li>
    <li><strong>Valid Until:</strong> {{validUntil}}</li>
  </ul>
</div>
<div style="text-align: center;">
  <a href="{{quotationUrl}}" class="email-button">View Quotation</a>
</div>
<p>Review the quotation and respond to the supplier directly through our platform.</p>
        `.trim(),
        variables: ['firstName', 'supplierName', 'productName', 'quantity', 'unitPrice', 'totalPrice', 'validUntil', 'quotationUrl', 'companyName', 'recipientEmail'],
        defaultValues: {
          firstName: 'User',
          supplierName: 'Example Supplier',
          productName: 'Sample Product',
          quantity: '100 units',
          unitPrice: '$10.00',
          totalPrice: '$1,000.00',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          quotationUrl: 'https://example.com/quotations/12345',
          companyName: 'B2B Marketplace',
          recipientEmail: 'user@example.com'
        },
        targetAudience: 'buyer',
        isActive: true,
        isSystemTemplate: true
      }
    ];
    
    // Create templates if they don't exist
    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        const existing = await emailTemplateService.getTemplateByType(template.type);
        
        if (!existing) {
          await emailTemplateService.createTemplate(template as EmailTemplate, 'system');
          console.log(`✓ Created template: ${template.name}`);
        } else {
          console.log(`- Template already exists: ${template.name}`);
        }
      } catch (error) {
        console.error(`✗ Failed to create template ${template.name}:`, error);
      }
    }
    
    console.log('Default email templates initialization complete');
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
}
