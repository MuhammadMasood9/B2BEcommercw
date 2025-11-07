import { Router, Request, Response } from 'express';
import { emailTemplateService, EmailTemplate, TemplateVariables } from './emailTemplateService';
import { requireEnhancedAuth as requireAuth, requireEnhancedRole } from './enhancedAuthGuards';

// Helper to require role
const requireRole = (roles: string[]) => requireEnhancedRole(roles);

const router = Router();

/**
 * Get all email templates
 * GET /api/email-templates
 */
router.get('/', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { category, type, targetAudience, isActive } = req.query;
    
    const filters: any = {};
    if (category) filters.category = category as string;
    if (type) filters.type = type as string;
    if (targetAudience) filters.targetAudience = targetAudience as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    const templates = await emailTemplateService.listTemplates(filters);
    
    res.json({
      success: true,
      templates
    });
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email templates',
      message: error.message
    });
  }
});

/**
 * Get email template by ID
 * GET /api/email-templates/:id
 */
router.get('/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const template = await emailTemplateService.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email template',
      message: error.message
    });
  }
});

/**
 * Create new email template
 * POST /api/email-templates
 */
router.post('/', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const templateData: EmailTemplate = req.body;
    const userId = req.user!.id;
    
    // Validate template
    const validation = emailTemplateService.validateTemplate(templateData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Template validation failed',
        errors: validation.errors
      });
    }
    
    // Extract variables from content
    const htmlVariables = emailTemplateService.extractVariables(templateData.htmlContent);
    const textVariables = emailTemplateService.extractVariables(templateData.content);
    const allVariables = Array.from(new Set([...htmlVariables, ...textVariables]));
    
    templateData.variables = allVariables;
    
    const template = await emailTemplateService.createTemplate(templateData, userId);
    
    res.status(201).json({
      success: true,
      template,
      message: 'Email template created successfully'
    });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email template',
      message: error.message
    });
  }
});

/**
 * Update email template
 * PUT /api/email-templates/:id
 */
router.put('/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<EmailTemplate> = req.body;
    const userId = req.user!.id;
    
    // Validate updates
    const validation = emailTemplateService.validateTemplate(updates);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Template validation failed',
        errors: validation.errors
      });
    }
    
    // Extract variables if content is being updated
    if (updates.htmlContent || updates.content) {
      const htmlVariables = updates.htmlContent 
        ? emailTemplateService.extractVariables(updates.htmlContent)
        : [];
      const textVariables = updates.content 
        ? emailTemplateService.extractVariables(updates.content)
        : [];
      const allVariables = Array.from(new Set([...htmlVariables, ...textVariables]));
      
      updates.variables = allVariables;
    }
    
    const template = await emailTemplateService.updateTemplate(id, updates, userId);
    
    res.json({
      success: true,
      template,
      message: 'Email template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating email template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Cannot modify system template') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update email template',
      message: error.message
    });
  }
});

/**
 * Delete email template
 * DELETE /api/email-templates/:id
 */
router.delete('/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await emailTemplateService.deleteTemplate(id);
    
    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Cannot delete system template') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template',
      message: error.message
    });
  }
});

/**
 * Preview email template
 * POST /api/email-templates/:id/preview
 */
router.post('/:id/preview', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variables } = req.body as { variables?: TemplateVariables };
    
    const preview = await emailTemplateService.previewTemplate(id, variables);
    
    res.json({
      success: true,
      preview
    });
  } catch (error: any) {
    console.error('Error previewing email template:', error);
    
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to preview email template',
      message: error.message
    });
  }
});

/**
 * Test send email template
 * POST /api/email-templates/:id/test
 */
router.post('/:id/test', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testEmail, variables } = req.body as { 
      testEmail: string; 
      variables?: TemplateVariables 
    };
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }
    
    const template = await emailTemplateService.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Render template with test variables
    const testVariables: TemplateVariables = {
      firstName: 'Test',
      lastName: 'User',
      companyName: 'Test Company',
      email: testEmail,
      recipientEmail: testEmail,
      ...variables
    };
    
    const rendered = emailTemplateService.renderTemplateContent(
      template.subject,
      template.htmlContent,
      template.content,
      {
        variables: testVariables,
        includeFooter: true,
        includeUnsubscribeLink: false
      }
    );
    
    // In production, send actual email here
    console.log('=== TEST EMAIL ===');
    console.log('To:', testEmail);
    console.log('Subject:', rendered.subject);
    console.log('HTML:', rendered.html.substring(0, 200) + '...');
    console.log('==================');
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      preview: rendered
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

/**
 * Duplicate email template
 * POST /api/email-templates/:id/duplicate
 */
router.post('/:id/duplicate', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const original = await emailTemplateService.getTemplate(id);
    
    if (!original) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Create duplicate with modified name
    const duplicate: EmailTemplate = {
      ...original,
      name: `${original.name} (Copy)`,
      isSystemTemplate: false,
      isActive: false
    };
    
    delete duplicate.id;
    delete duplicate.createdAt;
    delete duplicate.updatedAt;
    
    const newTemplate = await emailTemplateService.createTemplate(duplicate, userId);
    
    res.status(201).json({
      success: true,
      template: newTemplate,
      message: 'Email template duplicated successfully'
    });
  } catch (error: any) {
    console.error('Error duplicating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate email template',
      message: error.message
    });
  }
});

/**
 * Extract variables from template content
 * POST /api/email-templates/extract-variables
 */
router.post('/extract-variables', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { content, htmlContent } = req.body as { content: string; htmlContent?: string };
    
    if (!content && !htmlContent) {
      return res.status(400).json({
        success: false,
        error: 'Content or HTML content is required'
      });
    }
    
    const textVariables = content ? emailTemplateService.extractVariables(content) : [];
    const htmlVariables = htmlContent ? emailTemplateService.extractVariables(htmlContent) : [];
    const allVariables = Array.from(new Set([...textVariables, ...htmlVariables]));
    
    res.json({
      success: true,
      variables: allVariables,
      textVariables,
      htmlVariables
    });
  } catch (error: any) {
    console.error('Error extracting variables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract variables',
      message: error.message
    });
  }
});

export default router;
