import { db } from "./db";
import { contentModerationService } from "./contentModerationService";

// ==================== INTERFACES ====================

export interface ProductReviewItem {
  id: string;
  productId: string;
  productTitle: string;
  productDescription: string;
  productImages: string[];
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  
  // Review Status
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Automated Screening Results
  screeningScore: number;
  screeningRecommendation: 'approve' | 'review' | 'reject';
  screeningFlags: any[];
  
  // Review Assignment
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: Date;
  
  // Review Decision
  reviewDecision?: 'approve' | 'reject' | 'request_changes';
  reviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  
  // Escalation
  escalatedReason?: string;
  escalatedAt?: Date;
  escalatedBy?: string;
  
  // Timestamps
  submittedAt: Date;
  updatedAt: Date;
}

export interface ReviewerAssignment {
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  specializations: string[];
  currentWorkload: number;
  maxWorkload: number;
  averageReviewTime: number; // in minutes
  qualityScore: number; // 0-100
  isActive: boolean;
}

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  priority: number;
  isActive: boolean;
}

export interface EscalationCondition {
  type: 'score_threshold' | 'flag_count' | 'review_time' | 'supplier_tier' | 'content_type';
  operator: 'less_than' | 'greater_than' | 'equals' | 'contains';
  value: any;
}

export interface EscalationAction {
  type: 'assign_senior_reviewer' | 'notify_manager' | 'increase_priority' | 'require_multiple_reviews';
  parameters: Record<string, any>;
}

export interface ReviewQueueFilters {
  status?: string[];
  priority?: string[];
  assignedReviewer?: string;
  supplierTier?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  screeningScore?: { min?: number; max?: number };
  hasFlags?: boolean;
}

export interface ReviewDecision {
  decision: 'approve' | 'reject' | 'request_changes';
  notes: string;
  requiredChanges?: string[];
  reviewerId: string;
  reviewTime: number; // minutes spent reviewing
}

// ==================== PRODUCT APPROVAL SERVICE ====================

export class ProductApprovalService {
  
  /**
   * Get product review queue with filtering and pagination
   */
  async getReviewQueue(
    filters: ReviewQueueFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    items: ProductReviewItem[];
    total: number;
    summary: {
      pendingCount: number;
      inReviewCount: number;
      highPriorityCount: number;
      averageWaitTime: number;
    };
  }> {
    try {
      let whereConditions = ['pr.status != $1']; // Exclude completed items
      let queryParams: any[] = ['completed'];
      let paramIndex = 2;
      
      // Build WHERE conditions based on filters
      if (filters.status && filters.status.length > 0) {
        whereConditions.push(`pr.status = ANY($${paramIndex})`);
        queryParams.push(filters.status);
        paramIndex++;
      }
      
      if (filters.priority && filters.priority.length > 0) {
        whereConditions.push(`pr.priority = ANY($${paramIndex})`);
        queryParams.push(filters.priority);
        paramIndex++;
      }
      
      if (filters.assignedReviewer) {
        whereConditions.push(`pr.assigned_reviewer_id = $${paramIndex}`);
        queryParams.push(filters.assignedReviewer);
        paramIndex++;
      }
      
      if (filters.supplierTier && filters.supplierTier.length > 0) {
        whereConditions.push(`s.membership_tier = ANY($${paramIndex})`);
        queryParams.push(filters.supplierTier);
        paramIndex++;
      }
      
      if (filters.dateFrom) {
        whereConditions.push(`pr.submitted_at >= $${paramIndex}`);
        queryParams.push(filters.dateFrom);
        paramIndex++;
      }
      
      if (filters.dateTo) {
        whereConditions.push(`pr.submitted_at <= $${paramIndex}`);
        queryParams.push(filters.dateTo);
        paramIndex++;
      }
      
      if (filters.screeningScore) {
        if (filters.screeningScore.min !== undefined) {
          whereConditions.push(`pr.screening_score >= $${paramIndex}`);
          queryParams.push(filters.screeningScore.min);
          paramIndex++;
        }
        if (filters.screeningScore.max !== undefined) {
          whereConditions.push(`pr.screening_score <= $${paramIndex}`);
          queryParams.push(filters.screeningScore.max);
          paramIndex++;
        }
      }
      
      if (filters.hasFlags !== undefined) {
        if (filters.hasFlags) {
          whereConditions.push(`jsonb_array_length(pr.screening_flags) > 0`);
        } else {
          whereConditions.push(`jsonb_array_length(pr.screening_flags) = 0`);
        }
      }
      
      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          pr.*,
          p.title as product_title,
          p.description as product_description,
          p.images as product_images,
          s.id as supplier_id,
          s.business_name as supplier_name,
          s.membership_tier as supplier_tier,
          ar.name as assigned_reviewer_name
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN admin_users ar ON pr.assigned_reviewer_id = ar.id
        ${whereClause}
        ORDER BY 
          CASE pr.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
          END,
          pr.submitted_at ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      const items: ProductReviewItem[] = dataResult.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productTitle: row.product_title,
        productDescription: row.product_description,
        productImages: row.product_images || [],
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        supplierTier: row.supplier_tier,
        status: row.status,
        priority: row.priority,
        screeningScore: row.screening_score,
        screeningRecommendation: row.screening_recommendation,
        screeningFlags: row.screening_flags || [],
        assignedReviewerId: row.assigned_reviewer_id,
        assignedReviewerName: row.assigned_reviewer_name,
        assignedAt: row.assigned_at,
        reviewDecision: row.review_decision,
        reviewNotes: row.review_notes,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        escalatedReason: row.escalated_reason,
        escalatedAt: row.escalated_at,
        escalatedBy: row.escalated_by,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at
      }));
      
      // Calculate summary statistics
      const summaryQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_count,
          COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_count,
          AVG(EXTRACT(EPOCH FROM (COALESCE(assigned_at, NOW()) - submitted_at))/3600) as avg_wait_hours
        FROM product_reviews pr
        WHERE pr.status IN ('pending', 'in_review')
      `;
      
      const summaryResult = await db.query(summaryQuery);
      const summaryRow = summaryResult.rows[0];
      
      const summary = {
        pendingCount: parseInt(summaryRow.pending_count) || 0,
        inReviewCount: parseInt(summaryRow.in_review_count) || 0,
        highPriorityCount: parseInt(summaryRow.high_priority_count) || 0,
        averageWaitTime: parseFloat(summaryRow.avg_wait_hours) || 0
      };
      
      return { items, total, summary };
      
    } catch (error) {
      console.error('Error fetching review queue:', error);
      throw new Error('Failed to fetch review queue');
    }
  }
  
  /**
   * Submit product for review
   */
  async submitProductForReview(productId: string): Promise<ProductReviewItem> {
    try {
      // Check if product already has a pending review
      const existingReview = await db.query(
        'SELECT id FROM product_reviews WHERE product_id = $1 AND status IN ($2, $3)',
        [productId, 'pending', 'in_review']
      );
      
      if (existingReview.rows.length > 0) {
        throw new Error('Product already has a pending review');
      }
      
      // Run automated screening
      const screeningResult = await contentModerationService.runAutomatedScreening(productId);
      
      // Determine priority based on screening results
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      
      if (screeningResult.flags.some(f => f.severity === 'critical')) {
        priority = 'urgent';
      } else if (screeningResult.overallScore < 50 || screeningResult.flags.length > 3) {
        priority = 'high';
      } else if (screeningResult.overallScore > 80 && screeningResult.flags.length === 0) {
        priority = 'low';
      }
      
      // Create review record
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.query(`
        INSERT INTO product_reviews (
          id, product_id, status, priority, screening_score, 
          screening_recommendation, screening_flags, submitted_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        reviewId,
        productId,
        'pending',
        priority,
        screeningResult.overallScore,
        screeningResult.recommendation,
        JSON.stringify(screeningResult.flags),
        new Date(),
        new Date()
      ]);
      
      // Auto-assign reviewer if screening recommendation is approve and score is high
      if (screeningResult.recommendation === 'approve' && screeningResult.overallScore > 85) {
        await this.autoAssignReviewer(reviewId);
      }
      
      // Check escalation rules
      await this.checkEscalationRules(reviewId);
      
      // Fetch and return the created review
      const reviewResult = await db.query(`
        SELECT 
          pr.*,
          p.title as product_title,
          p.description as product_description,
          p.images as product_images,
          s.id as supplier_id,
          s.business_name as supplier_name,
          s.membership_tier as supplier_tier
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pr.id = $1
      `, [reviewId]);
      
      const row = reviewResult.rows[0];
      
      return {
        id: row.id,
        productId: row.product_id,
        productTitle: row.product_title,
        productDescription: row.product_description,
        productImages: row.product_images || [],
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        supplierTier: row.supplier_tier,
        status: row.status,
        priority: row.priority,
        screeningScore: row.screening_score,
        screeningRecommendation: row.screening_recommendation,
        screeningFlags: row.screening_flags || [],
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at
      };
      
    } catch (error) {
      console.error('Error submitting product for review:', error);
      throw error;
    }
  }
  
  /**
   * Assign reviewer to a product review
   */
  async assignReviewer(reviewId: string, reviewerId: string): Promise<void> {
    try {
      // Check reviewer availability
      const reviewer = await this.getReviewerById(reviewerId);
      if (!reviewer || !reviewer.isActive) {
        throw new Error('Reviewer not available');
      }
      
      if (reviewer.currentWorkload >= reviewer.maxWorkload) {
        throw new Error('Reviewer workload is at capacity');
      }
      
      // Assign reviewer
      await db.query(`
        UPDATE product_reviews 
        SET assigned_reviewer_id = $1, assigned_at = $2, status = $3, updated_at = $4
        WHERE id = $5
      `, [reviewerId, new Date(), 'in_review', new Date(), reviewId]);
      
      // Update reviewer workload
      await db.query(`
        UPDATE admin_users 
        SET current_workload = current_workload + 1
        WHERE id = $1
      `, [reviewerId]);
      
      console.log(`✅ Assigned reviewer ${reviewerId} to review ${reviewId}`);
      
    } catch (error) {
      console.error('Error assigning reviewer:', error);
      throw error;
    }
  }
  
  /**
   * Auto-assign reviewer based on workload and specialization
   */
  async autoAssignReviewer(reviewId: string): Promise<void> {
    try {
      // Get available reviewers
      const reviewers = await this.getAvailableReviewers();
      
      if (reviewers.length === 0) {
        console.log('No available reviewers for auto-assignment');
        return;
      }
      
      // Sort by workload and quality score
      reviewers.sort((a, b) => {
        const workloadDiff = (a.currentWorkload / a.maxWorkload) - (b.currentWorkload / b.maxWorkload);
        if (Math.abs(workloadDiff) < 0.1) {
          return b.qualityScore - a.qualityScore; // Higher quality score first
        }
        return workloadDiff; // Lower workload percentage first
      });
      
      const selectedReviewer = reviewers[0];
      await this.assignReviewer(reviewId, selectedReviewer.reviewerId);
      
    } catch (error) {
      console.error('Error auto-assigning reviewer:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
  
  /**
   * Process review decision
   */
  async processReviewDecision(reviewId: string, decision: ReviewDecision): Promise<void> {
    try {
      const { decision: reviewDecision, notes, requiredChanges, reviewerId, reviewTime } = decision;
      
      // Update review record
      await db.query(`
        UPDATE product_reviews 
        SET 
          review_decision = $1,
          review_notes = $2,
          required_changes = $3,
          reviewed_at = $4,
          reviewed_by = $5,
          review_time_minutes = $6,
          status = $7,
          updated_at = $8
        WHERE id = $9
      `, [
        reviewDecision,
        notes,
        JSON.stringify(requiredChanges || []),
        new Date(),
        reviewerId,
        reviewTime,
        reviewDecision === 'request_changes' ? 'pending_changes' : 'completed',
        new Date(),
        reviewId
      ]);
      
      // Update product status based on decision
      const reviewResult = await db.query(
        'SELECT product_id FROM product_reviews WHERE id = $1',
        [reviewId]
      );
      
      if (reviewResult.rows.length > 0) {
        const productId = reviewResult.rows[0].product_id;
        
        let productStatus: string;
        switch (reviewDecision) {
          case 'approve':
            productStatus = 'approved';
            break;
          case 'reject':
            productStatus = 'rejected';
            break;
          case 'request_changes':
            productStatus = 'pending_changes';
            break;
          default:
            productStatus = 'pending_review';
        }
        
        await db.query(
          'UPDATE products SET approval_status = $1, updated_at = $2 WHERE id = $3',
          [productStatus, new Date(), productId]
        );
      }
      
      // Update reviewer workload
      await db.query(`
        UPDATE admin_users 
        SET 
          current_workload = GREATEST(0, current_workload - 1),
          total_reviews = total_reviews + 1,
          avg_review_time = (avg_review_time * (total_reviews - 1) + $1) / total_reviews
        WHERE id = $2
      `, [reviewTime, reviewerId]);
      
      console.log(`✅ Processed review decision for ${reviewId}: ${reviewDecision}`);
      
    } catch (error) {
      console.error('Error processing review decision:', error);
      throw error;
    }
  }
  
  /**
   * Escalate review
   */
  async escalateReview(reviewId: string, reason: string, escalatedBy: string): Promise<void> {
    try {
      await db.query(`
        UPDATE product_reviews 
        SET 
          status = $1,
          escalated_reason = $2,
          escalated_at = $3,
          escalated_by = $4,
          priority = CASE 
            WHEN priority = 'low' THEN 'medium'
            WHEN priority = 'medium' THEN 'high'
            ELSE 'urgent'
          END,
          updated_at = $5
        WHERE id = $6
      `, ['escalated', reason, new Date(), escalatedBy, new Date(), reviewId]);
      
      console.log(`⚠️ Escalated review ${reviewId}: ${reason}`);
      
    } catch (error) {
      console.error('Error escalating review:', error);
      throw error;
    }
  }
  
  /**
   * Check escalation rules for a review
   */
  async checkEscalationRules(reviewId: string): Promise<void> {
    try {
      const review = await this.getReviewById(reviewId);
      if (!review) return;
      
      const escalationRules = await this.getActiveEscalationRules();
      
      for (const rule of escalationRules) {
        if (await this.evaluateEscalationRule(rule, review)) {
          await this.executeEscalationActions(rule, review);
        }
      }
      
    } catch (error) {
      console.error('Error checking escalation rules:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  private async getReviewById(reviewId: string): Promise<ProductReviewItem | null> {
    try {
      const result = await db.query(`
        SELECT 
          pr.*,
          p.title as product_title,
          p.description as product_description,
          p.images as product_images,
          s.id as supplier_id,
          s.business_name as supplier_name,
          s.membership_tier as supplier_tier
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pr.id = $1
      `, [reviewId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        productTitle: row.product_title,
        productDescription: row.product_description,
        productImages: row.product_images || [],
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        supplierTier: row.supplier_tier,
        status: row.status,
        priority: row.priority,
        screeningScore: row.screening_score,
        screeningRecommendation: row.screening_recommendation,
        screeningFlags: row.screening_flags || [],
        assignedReviewerId: row.assigned_reviewer_id,
        assignedAt: row.assigned_at,
        reviewDecision: row.review_decision,
        reviewNotes: row.review_notes,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        escalatedReason: row.escalated_reason,
        escalatedAt: row.escalated_at,
        escalatedBy: row.escalated_by,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error fetching review by ID:', error);
      return null;
    }
  }
  
  private async getReviewerById(reviewerId: string): Promise<ReviewerAssignment | null> {
    try {
      const result = await db.query(`
        SELECT 
          id, name, email, specializations, current_workload, 
          max_workload, avg_review_time, quality_score, is_active
        FROM admin_users 
        WHERE id = $1 AND role = 'content_moderator'
      `, [reviewerId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        reviewerId: row.id,
        reviewerName: row.name,
        reviewerEmail: row.email,
        specializations: row.specializations || [],
        currentWorkload: row.current_workload || 0,
        maxWorkload: row.max_workload || 10,
        averageReviewTime: row.avg_review_time || 30,
        qualityScore: row.quality_score || 80,
        isActive: row.is_active !== false
      };
    } catch (error) {
      console.error('Error fetching reviewer by ID:', error);
      return null;
    }
  }
  
  private async getAvailableReviewers(): Promise<ReviewerAssignment[]> {
    try {
      const result = await db.query(`
        SELECT 
          id, name, email, specializations, current_workload, 
          max_workload, avg_review_time, quality_score, is_active
        FROM admin_users 
        WHERE role = 'content_moderator' 
          AND is_active = true 
          AND current_workload < max_workload
        ORDER BY (current_workload::float / max_workload), quality_score DESC
      `);
      
      return result.rows.map(row => ({
        reviewerId: row.id,
        reviewerName: row.name,
        reviewerEmail: row.email,
        specializations: row.specializations || [],
        currentWorkload: row.current_workload || 0,
        maxWorkload: row.max_workload || 10,
        averageReviewTime: row.avg_review_time || 30,
        qualityScore: row.quality_score || 80,
        isActive: row.is_active !== false
      }));
    } catch (error) {
      console.error('Error fetching available reviewers:', error);
      return [];
    }
  }
  
  private async getActiveEscalationRules(): Promise<EscalationRule[]> {
    // Mock escalation rules (in real implementation, would fetch from database)
    return [
      {
        id: 'critical_flags_rule',
        name: 'Critical Flags Escalation',
        description: 'Escalate reviews with critical flags',
        conditions: [
          {
            type: 'flag_count',
            operator: 'greater_than',
            value: 0
          }
        ],
        actions: [
          {
            type: 'increase_priority',
            parameters: { newPriority: 'urgent' }
          },
          {
            type: 'notify_manager',
            parameters: { managerId: 'manager_001' }
          }
        ],
        priority: 1,
        isActive: true
      },
      {
        id: 'low_score_rule',
        name: 'Low Score Escalation',
        description: 'Escalate reviews with very low screening scores',
        conditions: [
          {
            type: 'score_threshold',
            operator: 'less_than',
            value: 30
          }
        ],
        actions: [
          {
            type: 'assign_senior_reviewer',
            parameters: { seniorReviewerId: 'senior_reviewer_001' }
          }
        ],
        priority: 2,
        isActive: true
      }
    ];
  }
  
  private async evaluateEscalationRule(rule: EscalationRule, review: ProductReviewItem): Promise<boolean> {
    for (const condition of rule.conditions) {
      switch (condition.type) {
        case 'score_threshold':
          if (condition.operator === 'less_than' && review.screeningScore >= condition.value) {
            return false;
          }
          if (condition.operator === 'greater_than' && review.screeningScore <= condition.value) {
            return false;
          }
          break;
          
        case 'flag_count':
          const flagCount = review.screeningFlags.filter(f => f.severity === 'critical').length;
          if (condition.operator === 'greater_than' && flagCount <= condition.value) {
            return false;
          }
          break;
          
        case 'supplier_tier':
          if (condition.operator === 'equals' && review.supplierTier !== condition.value) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }
  
  private async executeEscalationActions(rule: EscalationRule, review: ProductReviewItem): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'increase_priority':
            await db.query(
              'UPDATE product_reviews SET priority = $1, updated_at = $2 WHERE id = $3',
              [action.parameters.newPriority, new Date(), review.id]
            );
            break;
            
          case 'assign_senior_reviewer':
            if (action.parameters.seniorReviewerId) {
              await this.assignReviewer(review.id, action.parameters.seniorReviewerId);
            }
            break;
            
          case 'notify_manager':
            // In real implementation, would send notification
            console.log(`📧 Notifying manager about escalated review: ${review.id}`);
            break;
        }
      } catch (error) {
        console.error(`Error executing escalation action ${action.type}:`, error);
      }
    }
  }
}

// Export singleton instance
export const productApprovalService = new ProductApprovalService();