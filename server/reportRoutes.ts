import { Router } from 'express';
import { adminMiddleware } from './auth';
import { logAdminActivity } from './adminOversightService';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// ==================== REPORT MANAGEMENT ROUTES ====================

// GET /api/admin/reports/templates - Get report templates
router.get('/templates', async (req, res) => {
  try {
    console.log('📊 Report templates endpoint hit');
    
    // TODO: Implement report_templates table and fetch from database
    const templates: any[] = [];
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'View Report Templates',
      'Viewed report templates list',
      'report_management',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      templates,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
});

// POST /api/admin/reports/templates - Create report template
router.post('/templates', async (req, res) => {
  try {
    const templateData = req.body;
    console.log('📊 Creating report template:', templateData.name);
    
    // In production, this would save to database
    const newTemplate = {
      id: `template_${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Create Report Template',
      `Created report template: ${templateData.name}`,
      'report_management',
      newTemplate.id,
      'report_template',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      template: newTemplate,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error creating report template:', error);
    res.status(500).json({ error: 'Failed to create report template' });
  }
});

// PUT /api/admin/reports/templates/:id - Update report template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    console.log(`📊 Updating report template: ${id}`);
    
    // In production, this would update in database
    const updatedTemplate = {
      id,
      ...templateData,
      updatedAt: new Date(),
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Update Report Template',
      `Updated report template: ${templateData.name}`,
      'report_management',
      id,
      'report_template',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      template: updatedTemplate,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error updating report template:', error);
    res.status(500).json({ error: 'Failed to update report template' });
  }
});

// DELETE /api/admin/reports/templates/:id - Delete report template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Deleting report template: ${id}`);
    
    // In production, this would delete from database
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Delete Report Template',
      `Deleted report template: ${id}`,
      'report_management',
      id,
      'report_template',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error deleting report template:', error);
    res.status(500).json({ error: 'Failed to delete report template' });
  }
});

// GET /api/admin/reports/generated - Get generated reports
router.get('/generated', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    console.log('📊 Generated reports endpoint hit');
    
    // TODO: Implement generated_reports table and fetch from database
    const reports: any[] = [];
    
    const limitedReports = reports.slice(0, parseInt(limit as string));
    
    res.json({
      success: true,
      reports: limitedReports,
      total: reports.length,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching generated reports:', error);
    res.status(500).json({ error: 'Failed to fetch generated reports' });
  }
});

// POST /api/admin/reports/generate - Generate report
router.post('/generate', async (req, res) => {
  try {
    const { templateId, ...customParams } = req.body;
    console.log(`📊 Generating report from template: ${templateId}`);
    
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }
    
    // In production, this would queue a background job
    const newReport = {
      id: `report_${Date.now()}`,
      templateId,
      templateName: 'Generated Report',
      status: 'generating',
      format: 'pdf',
      size: 0,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    
    await logAdminActivity(
      req.user!.id,
      req.user!.firstName || req.user!.email || 'Admin',
      'Generate Report',
      `Started report generation from template: ${templateId}`,
      'report_generation',
      newReport.id,
      'report',
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      report: newReport,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/admin/reports/status/:id - Get report status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Checking report status: ${id}`);
    
    // Mock status check (in production, this would check job status)
    const report = {
      id,
      templateId: 'template_1',
      templateName: 'Generated Report',
      status: Math.random() > 0.5 ? 'completed' : 'generating',
      format: 'pdf',
      size: 1024576,
      downloadUrl: Math.random() > 0.5 ? `/api/admin/reports/download/${id}` : undefined,
      generatedAt: new Date(Date.now() - 10 * 60 * 1000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    
    res.json({
      success: true,
      report,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error checking report status:', error);
    res.status(500).json({ error: 'Failed to check report status' });
  }
});

// GET /api/admin/reports/metrics - Get available metrics
router.get('/metrics', async (req, res) => {
  try {
    console.log('📊 Available metrics endpoint hit');
    
    // Mock metrics (in production, this would come from configuration)
    const metrics = [
      { id: 'total_revenue', name: 'Total Revenue', description: 'Total platform revenue', category: 'Financial', dataType: 'currency', aggregation: 'sum' },
      { id: 'total_orders', name: 'Total Orders', description: 'Total number of orders', category: 'Sales', dataType: 'number', aggregation: 'count' },
      { id: 'active_suppliers', name: 'Active Suppliers', description: 'Number of active suppliers', category: 'Suppliers', dataType: 'number', aggregation: 'count' },
      { id: 'active_users', name: 'Active Users', description: 'Number of active users', category: 'Users', dataType: 'number', aggregation: 'count' },
      { id: 'conversion_rate', name: 'Conversion Rate', description: 'Order conversion rate', category: 'Performance', dataType: 'percentage' },
      { id: 'avg_order_value', name: 'Average Order Value', description: 'Average value per order', category: 'Sales', dataType: 'currency', aggregation: 'avg' },
      { id: 'supplier_retention', name: 'Supplier Retention', description: 'Supplier retention rate', category: 'Suppliers', dataType: 'percentage' },
      { id: 'user_engagement', name: 'User Engagement', description: 'User engagement score', category: 'Users', dataType: 'percentage' },
    ];
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error fetching available metrics:', error);
    res.status(500).json({ error: 'Failed to fetch available metrics' });
  }
});

// GET /api/admin/reports/download/:id - Download report
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Downloading report: ${id}`);
    
    // In production, this would serve the actual file
    // For now, return a mock response
    res.json({
      success: true,
      message: 'Report download would start here',
      reportId: id,
      timestamp: new Date(),
    });
    
  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

export { router as reportRoutes };