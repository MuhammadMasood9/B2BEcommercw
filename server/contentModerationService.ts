import { db } from "./db";

// ==================== INTERFACES ====================

export interface ContentAnalysisResult {
  id: string;
  contentId: string;
  contentType: 'product' | 'description' | 'image' | 'title';
  analysisType: 'text' | 'image' | 'policy' | 'duplicate';
  score: number; // 0-100, higher is better
  flags: ContentFlag[];
  recommendations: string[];
  confidence: number; // 0-1
  processingTime: number; // milliseconds
  createdAt: Date;
}

export interface ContentFlag {
  type: 'inappropriate' | 'spam' | 'policy_violation' | 'quality_issue' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  suggestedAction: 'approve' | 'review' | 'reject' | 'edit';
}

export interface PolicyComplianceCheck {
  policyId: string;
  policyName: string;
  compliant: boolean;
  violations: PolicyViolation[];
  score: number;
  recommendations: string[];
}

export interface PolicyViolation {
  type: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  location?: string; // where in content the violation occurs
  suggestedFix?: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOf?: string[];
  similarity: number; // 0-1
  duplicateType: 'exact' | 'near_duplicate' | 'similar';
  matchedFields: string[];
}

export interface ImageAnalysisResult {
  imageUrl: string;
  qualityScore: number; // 0-100
  appropriatenessScore: number; // 0-100
  flags: ImageFlag[];
  metadata: ImageMetadata;
  recommendations: string[];
}

export interface ImageFlag {
  type: 'low_quality' | 'inappropriate' | 'watermark' | 'text_heavy' | 'blurry';
  confidence: number;
  description: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  hasWatermark: boolean;
  textDetected: boolean;
  dominantColors: string[];
}

// ==================== CONTENT ANALYSIS SERVICE ====================

export class ContentModerationService {
  
  /**
   * Analyze text content for policy compliance and quality
   */
  async analyzeTextContent(content: string, contentType: string): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const flags: ContentFlag[] = [];
      let score = 100;
      
      // Basic text analysis
      const textAnalysis = this.performTextAnalysis(content);
      flags.push(...textAnalysis.flags);
      score = Math.min(score, textAnalysis.score);
      
      // Policy compliance check
      const policyCheck = await this.checkPolicyCompliance(content, contentType);
      if (!policyCheck.compliant) {
        flags.push(...policyCheck.violations.map(v => ({
          type: 'policy_violation' as const,
          severity: v.severity === 'critical' ? 'critical' as const : 
                   v.severity === 'major' ? 'high' as const : 'medium' as const,
          description: v.description,
          confidence: 0.9,
          suggestedAction: v.severity === 'critical' ? 'reject' as const : 'review' as const
        })));
        score = Math.min(score, policyCheck.score);
      }
      
      // Spam detection
      const spamCheck = this.detectSpam(content);
      if (spamCheck.isSpam) {
        flags.push({
          type: 'spam',
          severity: 'high',
          description: 'Content appears to be spam or promotional',
          confidence: spamCheck.confidence,
          suggestedAction: 'reject'
        });
        score = Math.min(score, 30);
      }
      
      const processingTime = Date.now() - startTime;
      
      const result: ContentAnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId: `content_${Date.now()}`,
        contentType: contentType as any,
        analysisType: 'text',
        score,
        flags,
        recommendations: this.generateRecommendations(flags, score),
        confidence: this.calculateOverallConfidence(flags),
        processingTime,
        createdAt: new Date()
      };
      
      // Store analysis result
      await this.storeAnalysisResult(result);
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing text content:', error);
      throw new Error('Content analysis failed');
    }
  }
  
  /**
   * Analyze image content for quality and appropriateness
   */
  async analyzeImageContent(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      const flags: ImageFlag[] = [];
      let qualityScore = 100;
      let appropriatenessScore = 100;
      
      // Simulate image analysis (in real implementation, would use AI services)
      const metadata = await this.extractImageMetadata(imageUrl);
      
      // Quality checks
      if (metadata.width < 300 || metadata.height < 300) {
        flags.push({
          type: 'low_quality',
          confidence: 0.9,
          description: 'Image resolution is too low for good display quality'
        });
        qualityScore = Math.min(qualityScore, 60);
      }
      
      if (metadata.fileSize > 5 * 1024 * 1024) { // 5MB
        flags.push({
          type: 'low_quality',
          confidence: 0.8,
          description: 'Image file size is too large, may affect loading performance'
        });
        qualityScore = Math.min(qualityScore, 70);
      }
      
      if (metadata.hasWatermark) {
        flags.push({
          type: 'watermark',
          confidence: 0.85,
          description: 'Image contains watermarks which may indicate copyright issues'
        });
        appropriatenessScore = Math.min(appropriatenessScore, 50);
      }
      
      if (metadata.textDetected) {
        flags.push({
          type: 'text_heavy',
          confidence: 0.7,
          description: 'Image contains significant text overlay'
        });
        qualityScore = Math.min(qualityScore, 80);
      }
      
      const result: ImageAnalysisResult = {
        imageUrl,
        qualityScore,
        appropriatenessScore,
        flags,
        metadata,
        recommendations: this.generateImageRecommendations(flags, qualityScore, appropriatenessScore)
      };
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing image content:', error);
      throw new Error('Image analysis failed');
    }
  }
  
  /**
   * Check for duplicate content
   */
  async detectDuplicateContent(content: string, contentType: string): Promise<DuplicateDetectionResult> {
    try {
      // Simulate duplicate detection (in real implementation, would use vector similarity)
      const contentHash = this.generateContentHash(content);
      
      // Check against existing content
      const existingContent = await this.findSimilarContent(contentHash, contentType);
      
      if (existingContent.length > 0) {
        const similarity = this.calculateSimilarity(content, existingContent[0].content);
        
        return {
          isDuplicate: similarity > 0.8,
          duplicateOf: existingContent.map(c => c.id),
          similarity,
          duplicateType: similarity > 0.95 ? 'exact' : similarity > 0.8 ? 'near_duplicate' : 'similar',
          matchedFields: ['title', 'description']
        };
      }
      
      return {
        isDuplicate: false,
        similarity: 0,
        duplicateType: 'similar',
        matchedFields: []
      };
      
    } catch (error) {
      console.error('Error detecting duplicate content:', error);
      throw new Error('Duplicate detection failed');
    }
  }
  
  /**
   * Run comprehensive automated screening
   */
  async runAutomatedScreening(productId: string): Promise<{
    textAnalysis: ContentAnalysisResult[];
    imageAnalysis: ImageAnalysisResult[];
    duplicateCheck: DuplicateDetectionResult;
    overallScore: number;
    recommendation: 'approve' | 'review' | 'reject';
    flags: ContentFlag[];
  }> {
    try {
      // Get product data
      const product = await this.getProductForScreening(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const textAnalysis: ContentAnalysisResult[] = [];
      const imageAnalysis: ImageAnalysisResult[] = [];
      const allFlags: ContentFlag[] = [];
      
      // Analyze text content
      if (product.title) {
        const titleAnalysis = await this.analyzeTextContent(product.title, 'title');
        textAnalysis.push(titleAnalysis);
        allFlags.push(...titleAnalysis.flags);
      }
      
      if (product.description) {
        const descAnalysis = await this.analyzeTextContent(product.description, 'description');
        textAnalysis.push(descAnalysis);
        allFlags.push(...descAnalysis.flags);
      }
      
      // Analyze images
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          const imgAnalysis = await this.analyzeImageContent(imageUrl);
          imageAnalysis.push(imgAnalysis);
          
          // Convert image flags to content flags
          imgAnalysis.flags.forEach(flag => {
            allFlags.push({
              type: flag.type === 'inappropriate' ? 'inappropriate' : 'quality_issue',
              severity: flag.confidence > 0.8 ? 'high' : 'medium',
              description: flag.description,
              confidence: flag.confidence,
              suggestedAction: flag.type === 'inappropriate' ? 'reject' : 'review'
            });
          });
        }
      }
      
      // Check for duplicates
      const duplicateCheck = await this.detectDuplicateContent(
        `${product.title} ${product.description}`, 
        'product'
      );
      
      if (duplicateCheck.isDuplicate) {
        allFlags.push({
          type: 'duplicate',
          severity: duplicateCheck.duplicateType === 'exact' ? 'critical' : 'high',
          description: `Content appears to be ${duplicateCheck.duplicateType} of existing product`,
          confidence: duplicateCheck.similarity,
          suggestedAction: duplicateCheck.duplicateType === 'exact' ? 'reject' : 'review'
        });
      }
      
      // Calculate overall score
      const textScores = textAnalysis.map(a => a.score);
      const imageScores = imageAnalysis.map(a => Math.min(a.qualityScore, a.appropriatenessScore));
      const allScores = [...textScores, ...imageScores];
      const overallScore = allScores.length > 0 ? 
        allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 100;
      
      // Determine recommendation
      const criticalFlags = allFlags.filter(f => f.severity === 'critical');
      const highFlags = allFlags.filter(f => f.severity === 'high');
      
      let recommendation: 'approve' | 'review' | 'reject';
      if (criticalFlags.length > 0 || overallScore < 30) {
        recommendation = 'reject';
      } else if (highFlags.length > 0 || overallScore < 70) {
        recommendation = 'review';
      } else {
        recommendation = 'approve';
      }
      
      // Store screening result
      await this.storeScreeningResult(productId, {
        textAnalysis,
        imageAnalysis,
        duplicateCheck,
        overallScore,
        recommendation,
        flags: allFlags,
        screenedAt: new Date()
      });
      
      return {
        textAnalysis,
        imageAnalysis,
        duplicateCheck,
        overallScore,
        recommendation,
        flags: allFlags
      };
      
    } catch (error) {
      console.error('Error running automated screening:', error);
      throw new Error('Automated screening failed');
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  private performTextAnalysis(content: string): { flags: ContentFlag[]; score: number } {
    const flags: ContentFlag[] = [];
    let score = 100;
    
    // Length checks
    if (content.length < 10) {
      flags.push({
        type: 'quality_issue',
        severity: 'medium',
        description: 'Content is too short to be meaningful',
        confidence: 0.9,
        suggestedAction: 'review'
      });
      score = Math.min(score, 60);
    }
    
    if (content.length > 5000) {
      flags.push({
        type: 'quality_issue',
        severity: 'low',
        description: 'Content is very long and may be difficult to read',
        confidence: 0.7,
        suggestedAction: 'review'
      });
      score = Math.min(score, 80);
    }
    
    // Inappropriate content detection (basic)
    const inappropriateWords = ['spam', 'scam', 'fake', 'illegal'];
    const foundInappropriate = inappropriateWords.filter(word => 
      content.toLowerCase().includes(word)
    );
    
    if (foundInappropriate.length > 0) {
      flags.push({
        type: 'inappropriate',
        severity: 'high',
        description: `Content contains potentially inappropriate terms: ${foundInappropriate.join(', ')}`,
        confidence: 0.8,
        suggestedAction: 'review'
      });
      score = Math.min(score, 40);
    }
    
    // Excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      flags.push({
        type: 'quality_issue',
        severity: 'low',
        description: 'Content contains excessive capitalization',
        confidence: 0.7,
        suggestedAction: 'review'
      });
      score = Math.min(score, 70);
    }
    
    return { flags, score };
  }
  
  private async checkPolicyCompliance(content: string, contentType: string): Promise<PolicyComplianceCheck> {
    // Simulate policy compliance check
    const violations: PolicyViolation[] = [];
    
    // Check for prohibited content
    const prohibitedTerms = ['counterfeit', 'replica', 'copy', 'clone'];
    const foundProhibited = prohibitedTerms.filter(term => 
      content.toLowerCase().includes(term)
    );
    
    if (foundProhibited.length > 0) {
      violations.push({
        type: 'prohibited_content',
        description: `Content contains prohibited terms: ${foundProhibited.join(', ')}`,
        severity: 'critical',
        suggestedFix: 'Remove prohibited terms and ensure product authenticity'
      });
    }
    
    // Check for missing required information
    if (contentType === 'description' && content.length < 50) {
      violations.push({
        type: 'insufficient_information',
        description: 'Product description is too brief and lacks required details',
        severity: 'major',
        suggestedFix: 'Provide more detailed product information including specifications and features'
      });
    }
    
    const score = violations.length === 0 ? 100 : 
      violations.some(v => v.severity === 'critical') ? 20 :
      violations.some(v => v.severity === 'major') ? 50 : 80;
    
    return {
      policyId: 'general_content_policy',
      policyName: 'General Content Policy',
      compliant: violations.length === 0,
      violations,
      score,
      recommendations: violations.map(v => v.suggestedFix || 'Review and correct policy violation')
    };
  }
  
  private detectSpam(content: string): { isSpam: boolean; confidence: number } {
    // Simple spam detection
    const spamIndicators = [
      /\b(buy now|limited time|act fast|urgent|guaranteed)\b/gi,
      /\b(free|discount|sale|offer|deal)\b.*\b(now|today|limited)\b/gi,
      /[!]{3,}/g, // Multiple exclamation marks
      /[A-Z]{5,}/g, // Long sequences of capitals
    ];
    
    let spamScore = 0;
    spamIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length * 0.2;
      }
    });
    
    const isSpam = spamScore > 0.6;
    return { isSpam, confidence: Math.min(spamScore, 1) };
  }
  
  private generateRecommendations(flags: ContentFlag[], score: number): string[] {
    const recommendations: string[] = [];
    
    if (score < 50) {
      recommendations.push('Content requires significant improvement before approval');
    } else if (score < 70) {
      recommendations.push('Content needs minor improvements for better quality');
    }
    
    const qualityFlags = flags.filter(f => f.type === 'quality_issue');
    if (qualityFlags.length > 0) {
      recommendations.push('Review content for quality issues and make necessary improvements');
    }
    
    const policyFlags = flags.filter(f => f.type === 'policy_violation');
    if (policyFlags.length > 0) {
      recommendations.push('Address policy violations before resubmission');
    }
    
    if (flags.some(f => f.type === 'spam')) {
      recommendations.push('Remove promotional language and focus on product features');
    }
    
    return recommendations;
  }
  
  private generateImageRecommendations(flags: ImageFlag[], qualityScore: number, appropriatenessScore: number): string[] {
    const recommendations: string[] = [];
    
    if (qualityScore < 70) {
      recommendations.push('Improve image quality by using higher resolution images');
    }
    
    if (appropriatenessScore < 70) {
      recommendations.push('Review image content for appropriateness and policy compliance');
    }
    
    if (flags.some(f => f.type === 'watermark')) {
      recommendations.push('Remove watermarks and use original product images');
    }
    
    if (flags.some(f => f.type === 'text_heavy')) {
      recommendations.push('Reduce text overlay and focus on product visualization');
    }
    
    return recommendations;
  }
  
  private calculateOverallConfidence(flags: ContentFlag[]): number {
    if (flags.length === 0) return 0.9;
    
    const avgConfidence = flags.reduce((sum, flag) => sum + flag.confidence, 0) / flags.length;
    return avgConfidence;
  }
  
  private generateContentHash(content: string): string {
    // Simple hash generation (in real implementation, would use proper hashing)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  private async extractImageMetadata(imageUrl: string): Promise<ImageMetadata> {
    // Simulate image metadata extraction
    return {
      width: 800 + Math.floor(Math.random() * 400),
      height: 600 + Math.floor(Math.random() * 400),
      format: 'JPEG',
      fileSize: 500000 + Math.floor(Math.random() * 2000000),
      hasWatermark: Math.random() > 0.8,
      textDetected: Math.random() > 0.7,
      dominantColors: ['#FF5733', '#33FF57', '#3357FF']
    };
  }
  
  private calculateSimilarity(content1: string, content2: string): number {
    // Simple similarity calculation (in real implementation, would use proper algorithms)
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }
  
  private async getProductForScreening(productId: string): Promise<any> {
    try {
      const result = await db.query(
        'SELECT id, title, description, images, supplier_id FROM products WHERE id = $1',
        [productId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const product = result.rows[0];
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        images: product.images || [],
        supplierId: product.supplier_id
      };
    } catch (error) {
      console.error('Error fetching product for screening:', error);
      throw error;
    }
  }
  
  private async findSimilarContent(contentHash: string, contentType: string): Promise<any[]> {
    // Simulate finding similar content
    return [];
  }
  
  private async storeAnalysisResult(result: ContentAnalysisResult): Promise<void> {
    try {
      await db.query(`
        INSERT INTO content_analysis_results (
          id, content_id, content_type, analysis_type, score, flags, 
          recommendations, confidence, processing_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        result.id,
        result.contentId,
        result.contentType,
        result.analysisType,
        result.score,
        JSON.stringify(result.flags),
        JSON.stringify(result.recommendations),
        result.confidence,
        result.processingTime,
        result.createdAt
      ]);
    } catch (error) {
      console.error('Error storing analysis result:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
  
  private async storeScreeningResult(productId: string, result: any): Promise<void> {
    try {
      await db.query(`
        INSERT INTO product_screening_results (
          product_id, text_analysis, image_analysis, duplicate_check,
          overall_score, recommendation, flags, screened_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (product_id) DO UPDATE SET
          text_analysis = EXCLUDED.text_analysis,
          image_analysis = EXCLUDED.image_analysis,
          duplicate_check = EXCLUDED.duplicate_check,
          overall_score = EXCLUDED.overall_score,
          recommendation = EXCLUDED.recommendation,
          flags = EXCLUDED.flags,
          screened_at = EXCLUDED.screened_at
      `, [
        productId,
        JSON.stringify(result.textAnalysis),
        JSON.stringify(result.imageAnalysis),
        JSON.stringify(result.duplicateCheck),
        result.overallScore,
        result.recommendation,
        JSON.stringify(result.flags),
        result.screenedAt
      ]);
    } catch (error) {
      console.error('Error storing screening result:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();