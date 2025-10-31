import express from "express";
import { contentModerationService } from "./contentModerationService";
import { productApprovalService } from "./productApprovalService";
import { requireAuth, requireRole } from "./auth";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const contentAnalysisSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(['product', 'description', 'image', 'title']),
});

const imageAnalysisSchema = z.object({
  imageUrl: z.string().url(),
});

const automatedScreeningSchema = z.object({
  productId: z.string(),
});

const bulkScreeningSchema = z.object({
  productIds: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

const reviewQueueFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  assignedReviewer: z.string().optional(),
  supplierTier: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  screeningScore: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  hasFlags: z.boolean().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
});

const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes']),
  notes: z.string().min(1),
  requiredChanges: z.array(z.string()).optional(),
  reviewTime: z.number().min(0)
});

const assignReviewerSchema = z.object({
  reviewerId: z.string()
});

const escalateReviewSchema = z.object({
  reason: z.string().min(1)
});

// ==================== AUTOMATED CONTENT SCREENING ====================

/**
 * POST /api/admin/moderation/automated-screening
 * Run comprehensive automated screening on a product
 */
router.post("/automated-screening", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { productId } = automatedScreeningSchema.parse(req.body);
    
    console.log(`🔍 Running automated screening for product: ${productId}`);
    
    const screeningResult = await contentModerationService.runAutomatedScreening(productId);
    
    console.log(`✅ Automated screening completed for product ${productId}:`, {
      overallScore: screeningResult.overallScore,
      recommendation: screeningResult.recommendation,
      flagsCount: screeningResult.flags.length
    });
    
    res.json({
      success: true,
      productId,
      screening: screeningResult,
      summary: {
        overallScore: screeningResult.overallScore,
        recommendation: screeningResult.recommendation,
        flagsCount: screeningResult.flags.length,
        textAnalysisCount: screeningResult.textAnalysis.length,
        imageAnalysisCount: screeningResult.imageAnalysis.length,
        hasDuplicates: screeningResult.duplicateCheck.isDuplicate
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error in automated screening:", error);
    res.status(500).json({ 
      error: "Failed to run automated screening",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/bulk-screening
 * Run automated screening on multiple products
 */
router.post("/bulk-screening", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { productIds, priority } = bulkScreeningSchema.parse(req.body);
    
    console.log(`🔍 Running bulk automated screening for ${productIds.length} products`);
    
    const results = [];
    const errors = [];
    
    for (const productId of productIds) {
      try {
        const screeningResult = await contentModerationService.runAutomatedScreening(productId);
        results.push({
          productId,
          success: true,
          screening: screeningResult
        });
      } catch (error) {
        console.error(`Error screening product ${productId}:`, error);
        errors.push({
          productId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    console.log(`✅ Bulk screening completed: ${results.length} successful, ${errors.length} failed`);
    
    res.json({
      success: true,
      summary: {
        totalProducts: productIds.length,
        successful: results.length,
        failed: errors.length,
        priority
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error in bulk screening:", error);
    res.status(500).json({ 
      error: "Failed to run bulk screening",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ==================== CONTENT ANALYSIS ENDPOINTS ====================

/**
 * POST /api/admin/moderation/analyze/content
 * Analyze text content for policy compliance and quality
 */
router.post("/analyze/content", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { content, contentType } = contentAnalysisSchema.parse(req.body);
    
    console.log(`📝 Analyzing ${contentType} content (${content.length} characters)`);
    
    const analysisResult = await contentModerationService.analyzeTextContent(content, contentType);
    
    console.log(`✅ Content analysis completed:`, {
      score: analysisResult.score,
      flagsCount: analysisResult.flags.length,
      confidence: analysisResult.confidence
    });
    
    res.json({
      success: true,
      analysis: analysisResult,
      summary: {
        score: analysisResult.score,
        flagsCount: analysisResult.flags.length,
        confidence: analysisResult.confidence,
        processingTime: analysisResult.processingTime
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error analyzing content:", error);
    res.status(500).json({ 
      error: "Failed to analyze content",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/analyze/images
 * Analyze image content for quality and appropriateness
 */
router.post("/analyze/images", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { imageUrl } = imageAnalysisSchema.parse(req.body);
    
    console.log(`🖼️ Analyzing image: ${imageUrl}`);
    
    const analysisResult = await contentModerationService.analyzeImageContent(imageUrl);
    
    console.log(`✅ Image analysis completed:`, {
      qualityScore: analysisResult.qualityScore,
      appropriatenessScore: analysisResult.appropriatenessScore,
      flagsCount: analysisResult.flags.length
    });
    
    res.json({
      success: true,
      analysis: analysisResult,
      summary: {
        qualityScore: analysisResult.qualityScore,
        appropriatenessScore: analysisResult.appropriatenessScore,
        flagsCount: analysisResult.flags.length,
        overallScore: Math.min(analysisResult.qualityScore, analysisResult.appropriatenessScore)
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error analyzing image:", error);
    res.status(500).json({ 
      error: "Failed to analyze image",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/detect-duplicates
 * Detect duplicate content
 */
router.post("/detect-duplicates", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { content, contentType } = contentAnalysisSchema.parse(req.body);
    
    console.log(`🔍 Detecting duplicates for ${contentType} content`);
    
    const duplicateResult = await contentModerationService.detectDuplicateContent(content, contentType);
    
    console.log(`✅ Duplicate detection completed:`, {
      isDuplicate: duplicateResult.isDuplicate,
      similarity: duplicateResult.similarity,
      duplicateType: duplicateResult.duplicateType
    });
    
    res.json({
      success: true,
      duplicateCheck: duplicateResult,
      summary: {
        isDuplicate: duplicateResult.isDuplicate,
        similarity: duplicateResult.similarity,
        duplicateType: duplicateResult.duplicateType,
        duplicateCount: duplicateResult.duplicateOf?.length || 0
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error detecting duplicates:", error);
    res.status(500).json({ 
      error: "Failed to detect duplicates",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ==================== POLICY MANAGEMENT ====================

/**
 * GET /api/admin/moderation/policies
 * Get all content moderation policies
 */
router.get("/policies", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    console.log("📋 Fetching content moderation policies");
    
    // Mock policies data (in real implementation, would fetch from database)
    const policies = [
      {
        id: "general_content_policy",
        name: "General Content Policy",
        description: "Basic content guidelines for all product listings",
        rules: [
          "No inappropriate or offensive content",
          "No spam or promotional language",
          "Accurate product descriptions required",
          "High-quality images only"
        ],
        severity: "high",
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-15")
      },
      {
        id: "image_quality_policy",
        name: "Image Quality Policy",
        description: "Standards for product image quality and appropriateness",
        rules: [
          "Minimum resolution 300x300 pixels",
          "No watermarks or copyright violations",
          "Clear product visibility required",
          "Maximum file size 5MB"
        ],
        severity: "medium",
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-10")
      },
      {
        id: "duplicate_content_policy",
        name: "Duplicate Content Policy",
        description: "Prevention of duplicate and plagiarized content",
        rules: [
          "No exact duplicates allowed",
          "Similarity threshold 80%",
          "Original content required",
          "Proper attribution for shared content"
        ],
        severity: "high",
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-05")
      }
    ];
    
    res.json({
      success: true,
      policies,
      summary: {
        totalPolicies: policies.length,
        activePolicies: policies.filter(p => p.active).length,
        highSeverityPolicies: policies.filter(p => p.severity === "high").length
      }
    });
    
  } catch (error) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ 
      error: "Failed to fetch policies",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PUT /api/admin/moderation/policies/:id
 * Update a content moderation policy
 */
router.put("/policies/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating policy: ${id}`);
    
    // Mock policy update (in real implementation, would update database)
    const updatedPolicy = {
      id,
      ...updateData,
      updatedAt: new Date()
    };
    
    console.log(`✅ Policy updated: ${id}`);
    
    res.json({
      success: true,
      policy: updatedPolicy,
      message: "Policy updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ 
      error: "Failed to update policy",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ==================== SCREENING HISTORY AND REPORTS ====================

/**
 * GET /api/admin/moderation/screening-history
 * Get screening history and statistics
 */
router.get("/screening-history", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { 
      limit = "50", 
      offset = "0", 
      dateFrom, 
      dateTo,
      recommendation 
    } = req.query;
    
    console.log("📊 Fetching screening history");
    
    // Mock screening history (in real implementation, would fetch from database)
    const screeningHistory = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
      id: `screening_${Date.now()}_${i}`,
      productId: `product_${1000 + i}`,
      productTitle: `Sample Product ${i + 1}`,
      overallScore: 60 + Math.random() * 40,
      recommendation: ['approve', 'review', 'reject'][Math.floor(Math.random() * 3)],
      flagsCount: Math.floor(Math.random() * 5),
      screenedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      screenedBy: "automated_system"
    }));
    
    const statistics = {
      totalScreenings: 1250,
      approvedCount: 850,
      reviewCount: 300,
      rejectedCount: 100,
      averageScore: 75.5,
      averageProcessingTime: 2.3
    };
    
    res.json({
      success: true,
      screeningHistory,
      statistics,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: statistics.totalScreenings
      }
    });
    
  } catch (error) {
    console.error("Error fetching screening history:", error);
    res.status(500).json({ 
      error: "Failed to fetch screening history",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/moderation/quality-metrics
 * Get content quality metrics and trends
 */
router.get("/quality-metrics", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;
    
    console.log(`📈 Fetching quality metrics for ${timeRange}`);
    
    // Mock quality metrics (in real implementation, would calculate from database)
    const qualityMetrics = {
      overallQualityScore: 78.5,
      qualityTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        score: 70 + Math.random() * 20
      })),
      categoryBreakdown: {
        textQuality: 82.3,
        imageQuality: 75.8,
        policyCompliance: 88.1,
        duplicateRate: 5.2
      },
      improvementSuggestions: [
        "Focus on improving image quality standards",
        "Provide better guidelines for product descriptions",
        "Implement automated duplicate detection",
        "Enhance policy compliance training"
      ],
      topIssues: [
        { issue: "Low image resolution", count: 45, percentage: 18.2 },
        { issue: "Insufficient product details", count: 38, percentage: 15.4 },
        { issue: "Policy violations", count: 22, percentage: 8.9 },
        { issue: "Duplicate content", count: 15, percentage: 6.1 }
      ]
    };
    
    res.json({
      success: true,
      metrics: qualityMetrics,
      timeRange,
      generatedAt: new Date()
    });
    
  } catch (error) {
    console.error("Error fetching quality metrics:", error);
    res.status(500).json({ 
      error: "Failed to fetch quality metrics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ==================== QUALITY CONTROL SYSTEM ====================

/**
 * POST /api/admin/moderation/quality/run-checks
 * Run quality control checks on content
 */
router.post("/quality/run-checks", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { contentIds, checkTypes } = z.object({
      contentIds: z.array(z.string()).optional(),
      checkTypes: z.array(z.enum(['image_quality', 'text_quality', 'policy_compliance', 'duplicate_detection'])).optional()
    }).parse(req.body);
    
    console.log(`🔍 Running quality control checks`);
    
    // Mock quality control results
    const qualityChecks = [
      {
        id: 'qc_001',
        type: 'image_quality',
        severity: 'warning',
        title: 'Low Resolution Images Detected',
        description: '15 products have images below 300x300 pixels',
        affectedCount: 15,
        recommendations: [
          'Request suppliers to upload higher resolution images',
          'Set minimum image resolution requirements',
          'Provide image quality guidelines'
        ],
        createdAt: new Date()
      },
      {
        id: 'qc_002',
        type: 'text_quality',
        severity: 'info',
        title: 'Short Product Descriptions',
        description: '8 products have descriptions shorter than 50 characters',
        affectedCount: 8,
        recommendations: [
          'Encourage more detailed product descriptions',
          'Provide description templates',
          'Set minimum description length requirements'
        ],
        createdAt: new Date()
      },
      {
        id: 'qc_003',
        type: 'policy_compliance',
        severity: 'critical',
        title: 'Policy Violations Found',
        description: '3 products contain prohibited terms',
        affectedCount: 3,
        recommendations: [
          'Review and remove prohibited content immediately',
          'Enhance automated policy checking',
          'Provide policy compliance training'
        ],
        createdAt: new Date()
      }
    ];
    
    res.json({
      success: true,
      qualityChecks,
      summary: {
        totalChecks: qualityChecks.length,
        criticalIssues: qualityChecks.filter(c => c.severity === 'critical').length,
        warningIssues: qualityChecks.filter(c => c.severity === 'warning').length,
        infoIssues: qualityChecks.filter(c => c.severity === 'info').length,
        totalAffectedItems: qualityChecks.reduce((sum, c) => sum + c.affectedCount, 0)
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error running quality checks:", error);
    res.status(500).json({ 
      error: "Failed to run quality checks",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/moderation/quality/standards
 * Get quality standards and thresholds
 */
router.get("/quality/standards", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    console.log("📋 Fetching quality standards");
    
    const qualityStandards = [
      {
        id: 'text_quality_standard',
        name: 'Text Quality Standard',
        description: 'Minimum quality requirements for product text content',
        category: 'text',
        rules: [
          {
            id: 'min_description_length',
            name: 'Minimum Description Length',
            threshold: 50,
            currentValue: 65,
            unit: 'characters',
            status: 'passing'
          },
          {
            id: 'max_description_length',
            name: 'Maximum Description Length',
            threshold: 2000,
            currentValue: 850,
            unit: 'characters',
            status: 'passing'
          },
          {
            id: 'spelling_accuracy',
            name: 'Spelling Accuracy',
            threshold: 95,
            currentValue: 92,
            unit: 'percentage',
            status: 'warning'
          }
        ],
        overallScore: 85.5,
        status: 'passing',
        lastUpdated: new Date()
      },
      {
        id: 'image_quality_standard',
        name: 'Image Quality Standard',
        description: 'Minimum quality requirements for product images',
        category: 'image',
        rules: [
          {
            id: 'min_resolution',
            name: 'Minimum Resolution',
            threshold: 300,
            currentValue: 420,
            unit: 'pixels',
            status: 'passing'
          },
          {
            id: 'max_file_size',
            name: 'Maximum File Size',
            threshold: 5,
            currentValue: 2.8,
            unit: 'MB',
            status: 'passing'
          },
          {
            id: 'image_clarity',
            name: 'Image Clarity Score',
            threshold: 70,
            currentValue: 68,
            unit: 'score',
            status: 'warning'
          }
        ],
        overallScore: 78.2,
        status: 'passing',
        lastUpdated: new Date()
      },
      {
        id: 'policy_compliance_standard',
        name: 'Policy Compliance Standard',
        description: 'Compliance with platform policies and guidelines',
        category: 'policy',
        rules: [
          {
            id: 'prohibited_content',
            name: 'Prohibited Content Detection',
            threshold: 0,
            currentValue: 2,
            unit: 'violations',
            status: 'failing'
          },
          {
            id: 'content_appropriateness',
            name: 'Content Appropriateness',
            threshold: 90,
            currentValue: 94,
            unit: 'percentage',
            status: 'passing'
          }
        ],
        overallScore: 72.1,
        status: 'warning',
        lastUpdated: new Date()
      }
    ];
    
    res.json({
      success: true,
      standards: qualityStandards,
      summary: {
        totalStandards: qualityStandards.length,
        passingStandards: qualityStandards.filter(s => s.status === 'passing').length,
        warningStandards: qualityStandards.filter(s => s.status === 'warning').length,
        failingStandards: qualityStandards.filter(s => s.status === 'failing').length,
        averageScore: qualityStandards.reduce((sum, s) => sum + s.overallScore, 0) / qualityStandards.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching quality standards:", error);
    res.status(500).json({ 
      error: "Failed to fetch quality standards",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PUT /api/admin/moderation/quality/standards/:id
 * Update quality standard thresholds
 */
router.put("/quality/standards/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating quality standard: ${id}`);
    
    // Mock update (in real implementation, would update database)
    const updatedStandard = {
      id,
      ...updateData,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      standard: updatedStandard,
      message: "Quality standard updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating quality standard:", error);
    res.status(500).json({ 
      error: "Failed to update quality standard",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/moderation/quality/reports
 * Generate quality control reports
 */
router.get("/quality/reports", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { 
      reportType = "summary", 
      timeRange = "30d",
      format = "json"
    } = req.query;
    
    console.log(`📊 Generating quality report: ${reportType} for ${timeRange}`);
    
    const qualityReport = {
      reportId: `qr_${Date.now()}`,
      reportType,
      timeRange,
      generatedAt: new Date(),
      summary: {
        totalItemsReviewed: 1250,
        averageQualityScore: 78.5,
        improvementRate: 12.3,
        issuesResolved: 89,
        issuesPending: 23
      },
      categoryScores: {
        textQuality: 82.3,
        imageQuality: 75.8,
        policyCompliance: 88.1,
        duplicateRate: 5.2
      },
      trendData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        score: 70 + Math.random() * 20,
        issuesFound: Math.floor(Math.random() * 10),
        issuesResolved: Math.floor(Math.random() * 8)
      })),
      topIssues: [
        { issue: "Low image resolution", count: 45, trend: "decreasing" },
        { issue: "Insufficient product details", count: 38, trend: "stable" },
        { issue: "Policy violations", count: 22, trend: "decreasing" },
        { issue: "Duplicate content", count: 15, trend: "increasing" }
      ],
      recommendations: [
        "Implement stricter image quality requirements",
        "Provide better content creation guidelines",
        "Enhance automated duplicate detection",
        "Increase policy compliance training frequency"
      ]
    };
    
    if (format === 'csv') {
      // In real implementation, would generate CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quality-report-${Date.now()}.csv"`);
      res.send('CSV data would be generated here');
    } else {
      res.json({
        success: true,
        report: qualityReport
      });
    }
    
  } catch (error) {
    console.error("Error generating quality report:", error);
    res.status(500).json({ 
      error: "Failed to generate quality report",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/quality/improvement-suggestions
 * Generate improvement suggestions based on quality analysis
 */
router.post("/quality/improvement-suggestions", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { contentIds, analysisType } = z.object({
      contentIds: z.array(z.string()).optional(),
      analysisType: z.enum(['comprehensive', 'targeted', 'quick']).optional().default('comprehensive')
    }).parse(req.body);
    
    console.log(`💡 Generating improvement suggestions (${analysisType} analysis)`);
    
    const suggestions = [
      {
        id: 'suggestion_001',
        category: 'image_quality',
        priority: 'high',
        title: 'Improve Image Resolution Standards',
        description: 'Many products have images below optimal resolution',
        impact: 'High - Better images increase conversion rates by 15-20%',
        effort: 'Medium - Requires supplier education and guideline updates',
        actionItems: [
          'Update image upload requirements to minimum 800x600 pixels',
          'Create image quality guidelines for suppliers',
          'Implement automatic image quality scoring',
          'Provide image optimization tools'
        ],
        estimatedTimeframe: '2-3 weeks',
        expectedImprovement: '25% reduction in low-quality image flags'
      },
      {
        id: 'suggestion_002',
        category: 'text_quality',
        priority: 'medium',
        title: 'Enhance Product Description Guidelines',
        description: 'Product descriptions lack consistency and detail',
        impact: 'Medium - Better descriptions improve search and user experience',
        effort: 'Low - Template creation and supplier communication',
        actionItems: [
          'Create product description templates by category',
          'Implement description quality scoring',
          'Provide writing guidelines and examples',
          'Add description length recommendations'
        ],
        estimatedTimeframe: '1-2 weeks',
        expectedImprovement: '30% improvement in description quality scores'
      },
      {
        id: 'suggestion_003',
        category: 'policy_compliance',
        priority: 'critical',
        title: 'Strengthen Policy Violation Detection',
        description: 'Some policy violations are not being caught automatically',
        impact: 'Critical - Policy violations can lead to legal and brand issues',
        effort: 'High - Requires AI model training and rule updates',
        actionItems: [
          'Update prohibited content detection algorithms',
          'Add new policy violation categories',
          'Implement multi-language policy checking',
          'Create escalation workflows for violations'
        ],
        estimatedTimeframe: '4-6 weeks',
        expectedImprovement: '90% reduction in undetected policy violations'
      }
    ];
    
    res.json({
      success: true,
      suggestions,
      analysisType,
      summary: {
        totalSuggestions: suggestions.length,
        criticalPriority: suggestions.filter(s => s.priority === 'critical').length,
        highPriority: suggestions.filter(s => s.priority === 'high').length,
        mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
        estimatedTotalTimeframe: '6-8 weeks for all improvements'
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error generating improvement suggestions:", error);
    res.status(500).json({ 
      error: "Failed to generate improvement suggestions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ==================== PRODUCT APPROVAL WORKFLOW ====================

/**
 * GET /api/admin/moderation/products/queue
 * Get product review queue with filtering and pagination
 */
router.get("/products/queue", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const filters = reviewQueueFiltersSchema.parse(req.query);
    
    const limit = parseInt(filters.limit || "50");
    const offset = parseInt(filters.offset || "0");
    
    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
    };
    
    console.log(`📋 Fetching product review queue (limit: ${limit}, offset: ${offset})`);
    
    const queueData = await productApprovalService.getReviewQueue(
      processedFilters,
      limit,
      offset
    );
    
    console.log(`✅ Retrieved ${queueData.items.length} review items`);
    
    res.json({
      success: true,
      queue: queueData.items,
      total: queueData.total,
      summary: queueData.summary,
      pagination: {
        limit,
        offset,
        hasMore: offset + queueData.items.length < queueData.total
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request parameters", 
        details: error.errors 
      });
    }
    
    console.error("Error fetching review queue:", error);
    res.status(500).json({ 
      error: "Failed to fetch review queue",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/products/:id/submit-review
 * Submit a product for review
 */
router.post("/products/:id/submit-review", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id: productId } = req.params;
    
    console.log(`📝 Submitting product ${productId} for review`);
    
    const reviewItem = await productApprovalService.submitProductForReview(productId);
    
    console.log(`✅ Product ${productId} submitted for review with ID: ${reviewItem.id}`);
    
    res.json({
      success: true,
      review: reviewItem,
      message: "Product submitted for review successfully"
    });
    
  } catch (error) {
    console.error("Error submitting product for review:", error);
    res.status(500).json({ 
      error: "Failed to submit product for review",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/products/:id/assign-reviewer
 * Assign a reviewer to a product review
 */
router.post("/products/:id/assign-reviewer", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { reviewerId } = assignReviewerSchema.parse(req.body);
    
    console.log(`👤 Assigning reviewer ${reviewerId} to review ${reviewId}`);
    
    await productApprovalService.assignReviewer(reviewId, reviewerId);
    
    console.log(`✅ Reviewer assigned successfully`);
    
    res.json({
      success: true,
      message: "Reviewer assigned successfully"
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error assigning reviewer:", error);
    res.status(500).json({ 
      error: "Failed to assign reviewer",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/products/:id/review-decision
 * Process a review decision
 */
router.post("/products/:id/review-decision", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const reviewDecision = reviewDecisionSchema.parse(req.body);
    
    // Add reviewer ID from auth context
    const reviewDecisionWithReviewer = {
      ...reviewDecision,
      reviewerId: (req as any).user.id
    };
    
    console.log(`⚖️ Processing review decision for ${reviewId}: ${reviewDecision.decision}`);
    
    await productApprovalService.processReviewDecision(reviewId, reviewDecisionWithReviewer);
    
    console.log(`✅ Review decision processed successfully`);
    
    res.json({
      success: true,
      message: "Review decision processed successfully"
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error processing review decision:", error);
    res.status(500).json({ 
      error: "Failed to process review decision",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/products/:id/escalate
 * Escalate a product review
 */
router.post("/products/:id/escalate", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { reason } = escalateReviewSchema.parse(req.body);
    const escalatedBy = (req as any).user.id;
    
    console.log(`⚠️ Escalating review ${reviewId}: ${reason}`);
    
    await productApprovalService.escalateReview(reviewId, reason, escalatedBy);
    
    console.log(`✅ Review escalated successfully`);
    
    res.json({
      success: true,
      message: "Review escalated successfully"
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error escalating review:", error);
    res.status(500).json({ 
      error: "Failed to escalate review",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/admin/moderation/products/bulk/moderate
 * Bulk moderate products (approve/reject multiple products)
 */
router.post("/products/bulk/moderate", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const { reviewIds, decision, notes } = z.object({
      reviewIds: z.array(z.string()),
      decision: z.enum(['approve', 'reject']),
      notes: z.string().optional()
    }).parse(req.body);
    
    const reviewerId = (req as any).user.id;
    
    console.log(`📦 Bulk moderating ${reviewIds.length} products: ${decision}`);
    
    const results = [];
    const errors = [];
    
    for (const reviewId of reviewIds) {
      try {
        await productApprovalService.processReviewDecision(reviewId, {
          decision,
          notes: notes || `Bulk ${decision} action`,
          reviewerId,
          reviewTime: 1 // Minimal time for bulk actions
        });
        
        results.push({
          reviewId,
          success: true,
          decision
        });
      } catch (error) {
        console.error(`Error processing bulk decision for ${reviewId}:`, error);
        errors.push({
          reviewId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    console.log(`✅ Bulk moderation completed: ${results.length} successful, ${errors.length} failed`);
    
    res.json({
      success: true,
      summary: {
        totalReviews: reviewIds.length,
        successful: results.length,
        failed: errors.length,
        decision
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }
    
    console.error("Error in bulk moderation:", error);
    res.status(500).json({ 
      error: "Failed to process bulk moderation",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/moderation/reviewers/available
 * Get available reviewers for assignment
 */
router.get("/reviewers/available", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    console.log("👥 Fetching available reviewers");
    
    // Mock available reviewers (in real implementation, would fetch from database)
    const availableReviewers = [
      {
        reviewerId: "reviewer_001",
        reviewerName: "Alice Johnson",
        reviewerEmail: "alice.johnson@company.com",
        specializations: ["electronics", "fashion"],
        currentWorkload: 3,
        maxWorkload: 10,
        averageReviewTime: 25,
        qualityScore: 92,
        isActive: true
      },
      {
        reviewerId: "reviewer_002",
        reviewerName: "Bob Smith",
        reviewerEmail: "bob.smith@company.com",
        specializations: ["home_garden", "sports"],
        currentWorkload: 7,
        maxWorkload: 12,
        averageReviewTime: 18,
        qualityScore: 88,
        isActive: true
      },
      {
        reviewerId: "reviewer_003",
        reviewerName: "Carol Davis",
        reviewerEmail: "carol.davis@company.com",
        specializations: ["books", "toys"],
        currentWorkload: 2,
        maxWorkload: 8,
        averageReviewTime: 32,
        qualityScore: 95,
        isActive: true
      }
    ];
    
    res.json({
      success: true,
      reviewers: availableReviewers,
      summary: {
        totalReviewers: availableReviewers.length,
        averageWorkload: availableReviewers.reduce((sum, r) => sum + (r.currentWorkload / r.maxWorkload), 0) / availableReviewers.length,
        averageQualityScore: availableReviewers.reduce((sum, r) => sum + r.qualityScore, 0) / availableReviewers.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching available reviewers:", error);
    res.status(500).json({ 
      error: "Failed to fetch available reviewers",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;