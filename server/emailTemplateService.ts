import { db } from './db';
import { communicationTemplates } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

// Email template types
export type EmailTemplateType = 
  | 'verification'
  | 'welcome'
  | 'approval'
  | 'rejection'
  | 'password_reset'
  | 'order_confirmation'
  | 'quotation_received'
  | 'inquiry_response'
  | 'account_suspended'
  | 'staff_invitation'
  | 'notification';

// Template categories
export type TemplateCategory = 
  | 'authentication'
  | 'transactional'
  | 'marketing'
  | 'system'
  | 'notification';

// Template variables interface
export interface TemplateVariables {
  [key: string]: string | number | boolean | Date | undefined;
}

// Base email template structure
export interface EmailTemplate {
  id?: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  type: EmailTemplateType;
  subject: string;
  content: string;
  htmlContent: string;
  variables: string[];
  defaultValues: Record<string, any>;
  targetAudience: 'buyer' | 'supplier' | 'admin' | 'all';
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// Email template rendering options
export interface RenderOptions {
  variables: TemplateVariables;
  includeUnsubscribeLink?: boolean;
  includeFooter?: boolean;
  customStyles?: string;
}

export class EmailTemplateService {
  private readonly FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  private readonly COMPANY_NAME = 'B2B Marketplace';
  private readonly SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com';

  /**
   * Get base HTML template structure
   */
  private getBaseTemplate(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>{{subject}}</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
        <style>
          /* Reset styles */
          body {
            margin: 0;
            padding: 0;
            min-width: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
          }
          
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          
          /* Container styles */
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          /* Header styles */
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
          }
          
          .email-header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
            line-height: 1.2;
          }
          
          .email-header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
          }
          
          /* Content styles */
          .email-content {
            padding: 40px 30px;
            background-color: #f9fafb;
          }
          
          .email-content h2 {
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 600;
            color: #111827;
          }
          
          .email-content p {
            margin: 0 0 16px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #374151;
          }
          
          /* Button styles */
          .email-button {
            display: inline-block;
            padding: 14px 32px;
            margin: 24px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
          }
          
          .email-button:hover {
            opacity: 0.9;
          }
          
          /* Info box styles */
          .info-box {
            background-color: #ffffff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          
          .info-box h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          
          .info-box ul {
            margin: 0;
            padding-left: 20px;
          }
          
          .info-box li {
            margin-bottom: 8px;
            color: #374151;
          }
          
          /* Badge styles */
          .badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 12px 0;
          }
          
          .badge-success {
            background-color: #d1fae5;
            color: #065f46;
          }
          
          .badge-warning {
            background-color: #fef3c7;
            color: #92400e;
          }
          
          .badge-info {
            background-color: #dbeafe;
            color: #1e40af;
          }
          
          .badge-error {
            background-color: #fee2e2;
            color: #991b1b;
          }
          
          /* Footer styles */
          .email-footer {
            padding: 30px;
            text-align: center;
            background-color: #f3f4f6;
            border-top: 1px solid #e5e7eb;
          }
          
          .email-footer p {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
          }
          
          .email-footer a {
            color: #667eea;
            text-decoration: none;
          }
          
          .email-footer a:hover {
            text-decoration: underline;
          }
          
          /* Responsive styles */
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
            
            .email-header,
            .email-content,
            .email-footer {
              padding: 20px !important;
            }
            
            .email-header h1 {
              font-size: 24px !important;
            }
            
            .email-button {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box;
            }
          }
          
          /* Custom styles placeholder */
          {{customStyles}}
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0">
                {{content}}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Get standard email footer
   */
  private getEmailFooter(includeUnsubscribe: boolean = false): string {
    const unsubscribeLink = includeUnsubscribe 
      ? `<p><a href="${this.FRONTEND_URL}/unsubscribe?token={{unsubscribeToken}}">Unsubscribe</a> from these emails</p>`
      : '';
    
    return `
      <tr>
        <td class="email-footer">
          <p>© ${new Date().getFullYear()} ${this.COMPANY_NAME}. All rights reserved.</p>
          <p>
            <a href="${this.FRONTEND_URL}">Visit our website</a> | 
            <a href="${this.FRONTEND_URL}/help">Help Center</a> | 
            <a href="mailto:${this.SUPPORT_EMAIL}">Contact Support</a>
          </p>
          ${unsubscribeLink}
          <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
            This email was sent to {{recipientEmail}}. 
            If you didn't expect this email, you can safely ignore it.
          </p>
        </td>
      </tr>
    `;
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const replacement = value !== undefined && value !== null ? String(value) : '';
      result = result.replace(regex, replacement);
    });
    
    // Remove any remaining unreplaced variables
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  /**
   * Render email template
   */
  async renderTemplate(
    templateId: string,
    options: RenderOptions
  ): Promise<{ subject: string; html: string; text: string }> {
    try {
      // Get template from database
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      if (!template.isActive) {
        throw new Error('Template is not active');
      }
      
      return this.renderTemplateContent(
        template.subject || '',
        template.htmlContent || template.content,
        template.content,
        options
      );
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Render template content directly
   */
  renderTemplateContent(
    subject: string,
    htmlContent: string,
    textContent: string,
    options: RenderOptions
  ): { subject: string; html: string; text: string } {
    // Replace variables in subject
    const renderedSubject = this.replaceVariables(subject, options.variables);
    
    // Replace variables in HTML content
    let renderedHtml = this.replaceVariables(htmlContent, options.variables);
    
    // Wrap in base template if needed
    if (!renderedHtml.includes('<!DOCTYPE html>')) {
      const baseTemplate = this.getBaseTemplate();
      const footer = options.includeFooter !== false 
        ? this.getEmailFooter(options.includeUnsubscribeLink)
        : '';
      
      const fullContent = `
        <tr>
          <td class="email-header">
            ${renderedHtml.includes('<h1>') ? '' : '<h1>' + renderedSubject + '</h1>'}
          </td>
        </tr>
        <tr>
          <td class="email-content">
            ${renderedHtml}
          </td>
        </tr>
        ${footer}
      `;
      
      renderedHtml = baseTemplate
        .replace('{{subject}}', renderedSubject)
        .replace('{{content}}', fullContent)
        .replace('{{customStyles}}', options.customStyles || '');
    }
    
    // Replace variables in text content
    const renderedText = this.replaceVariables(textContent, options.variables);
    
    return {
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText
    };
  }

  /**
   * Create a new email template
   */
  async createTemplate(template: EmailTemplate, createdBy: string): Promise<EmailTemplate> {
    try {
      const [created] = await db.insert(communicationTemplates).values({
        name: template.name,
        description: template.description,
        category: template.category,
        type: template.type,
        subject: template.subject,
        content: template.content,
        htmlContent: template.htmlContent,
        variables: template.variables,
        defaultValues: template.defaultValues,
        targetAudience: template.targetAudience,
        isActive: template.isActive,
        isSystemTemplate: template.isSystemTemplate,
        requiresApproval: false,
        isAbTest: false,
        abTestConfig: {},
        audienceCriteria: {},
        createdBy
      }).returning();
      
      return created as EmailTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create email template');
    }
  }

  /**
   * Update an email template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>,
    updatedBy: string
  ): Promise<EmailTemplate> {
    try {
      // Check if template is system template
      const [existing] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      if (!existing) {
        throw new Error('Template not found');
      }
      
      if (existing.isSystemTemplate) {
        throw new Error('Cannot modify system template');
      }
      
      const [updated] = await db.update(communicationTemplates)
        .set({
          ...updates,
          updatedBy,
          updatedAt: new Date()
        })
        .where(eq(communicationTemplates.id, templateId))
        .returning();
      
      return updated as EmailTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      return template as EmailTemplate || null;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  /**
   * Get template by type
   */
  async getTemplateByType(type: EmailTemplateType): Promise<EmailTemplate | null> {
    try {
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(
          and(
            eq(communicationTemplates.type, type),
            eq(communicationTemplates.isActive, true)
          )
        )
        .orderBy(desc(communicationTemplates.createdAt))
        .limit(1);
      
      return template as EmailTemplate || null;
    } catch (error) {
      console.error('Error fetching template by type:', error);
      throw error;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(filters?: {
    category?: TemplateCategory;
    type?: EmailTemplateType;
    targetAudience?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]> {
    try {
      let conditions = [];
      
      if (filters?.category) {
        conditions.push(eq(communicationTemplates.category, filters.category));
      }
      
      if (filters?.type) {
        conditions.push(eq(communicationTemplates.type, filters.type));
      }
      
      if (filters?.targetAudience) {
        conditions.push(eq(communicationTemplates.targetAudience, filters.targetAudience));
      }
      
      if (filters?.isActive !== undefined) {
        conditions.push(eq(communicationTemplates.isActive, filters.isActive));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const templates = await db.select()
        .from(communicationTemplates)
        .where(whereClause)
        .orderBy(asc(communicationTemplates.name));
      
      return templates as EmailTemplate[];
    } catch (error) {
      console.error('Error listing templates:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      // Check if template is system template
      const [template] = await db.select()
        .from(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      if (template.isSystemTemplate) {
        throw new Error('Cannot delete system template');
      }
      
      await db.delete(communicationTemplates)
        .where(eq(communicationTemplates.id, templateId));
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(
    templateId: string,
    sampleVariables?: TemplateVariables
  ): Promise<{ subject: string; html: string; text: string }> {
    try {
      const template = await this.getTemplate(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Use sample variables or default values
      const variables = sampleVariables || template.defaultValues || {};
      
      // Add common default values if not provided
      const defaultVariables: TemplateVariables = {
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corporation',
        email: 'john.doe@example.com',
        recipientEmail: 'john.doe@example.com',
        ...variables
      };
      
      return this.renderTemplateContent(
        template.subject,
        template.htmlContent,
        template.content,
        {
          variables: defaultVariables,
          includeFooter: true,
          includeUnsubscribeLink: false
        }
      );
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  /**
   * Validate template
   */
  validateTemplate(template: Partial<EmailTemplate>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }
    
    if (!template.subject || template.subject.trim().length === 0) {
      errors.push('Template subject is required');
    }
    
    if (!template.content || template.content.trim().length === 0) {
      errors.push('Template content is required');
    }
    
    if (!template.category) {
      errors.push('Template category is required');
    }
    
    if (!template.type) {
      errors.push('Template type is required');
    }
    
    // Extract and validate variables
    if (template.htmlContent) {
      const htmlVariables = this.extractVariables(template.htmlContent);
      const contentVariables = this.extractVariables(template.content || '');
      
      // Check if all HTML variables are also in text content
      const missingInText = htmlVariables.filter(v => !contentVariables.includes(v));
      if (missingInText.length > 0) {
        errors.push(`Variables missing in text content: ${missingInText.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const emailTemplateService = new EmailTemplateService();
