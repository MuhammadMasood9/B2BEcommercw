import { eq, and, or, desc, count } from "drizzle-orm";
import { db } from "./db";
import { 
  disputes,
  disputeMessages,
  orders,
  buyers,
  supplierProfiles,
  users,
  InsertDisputeMessage
} from "@shared/schema";
import { evidenceService } from "./evidenceService";

export interface ResolutionDecision {
  resolutionType: 'refund' | 'replacement' | 'partial_refund' | 'no_action' | 'custom';
  resolutionSummary: string;
  refundAmount?: number;
  refundPercentage?: number;
  actionRequired?: string;
  timeline?: string;
  conditions?: string[];
}

export interface ResolutionRecommendation {
  recommendedAction: string;
  reasoning: string;
  confidence: number; // 0-100
  alternativeOptions: string[];
  riskAssessment: {
    buyerSatisfaction: number;
    supplierImpact: number;
    platformRisk: number;
  };
}

export class ResolutionService {
  /**
   * Analyze dispute and provide resolution recommendations
   */
  async analyzeDispute(disputeId: string): Promise<ResolutionRecommendation> {
    try {
      // Get dispute details
      const dispute = await db
        .select({
          dispute: disputes,
          order: orders
        })
        .from(disputes)
        .leftJoin(orders, eq(disputes.orderId, orders.id))
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      const { dispute: disputeData, order } = dispute[0];

      // Get evidence completeness
      const evidenceAnalysis = await evidenceService.validateEvidenceCompleteness(disputeId);

      // Analyze dispute based on type, evidence, and order value
      const recommendation = this.generateRecommendation(disputeData, order, evidenceAnalysis);

      return recommendation;
    } catch (error) {
      console.error("Error analyzing dispute:", error);
      throw error;
    }
  }

  /**
   * Generate resolution recommendation based on dispute analysis
   */
  private generateRecommendation(
    dispute: any,
    order: any,
    evidenceAnalysis: any
  ): ResolutionRecommendation {
    let recommendedAction = '';
    let reasoning = '';
    let confidence = 50;
    let alternativeOptions: string[] = [];
    let riskAssessment = {
      buyerSatisfaction: 50,
      supplierImpact: 50,
      platformRisk: 30
    };

    const orderAmount = parseFloat(order?.totalAmount || '0');
    const disputeAmount = parseFloat(dispute.amount || '0');

    // Analyze based on dispute type
    switch (dispute.type) {
      case 'product_quality':
        if (evidenceAnalysis.isComplete) {
          recommendedAction = 'partial_refund';
          reasoning = 'Quality issues with evidence provided. Partial refund maintains supplier relationship while compensating buyer.';
          confidence = 80;
          riskAssessment.buyerSatisfaction = 75;
          riskAssessment.supplierImpact = 40;
        } else {
          recommendedAction = 'request_more_evidence';
          reasoning = 'Insufficient evidence to make informed decision. Request additional documentation.';
          confidence = 90;
        }
        alternativeOptions = ['full_refund', 'replacement', 'store_credit'];
        break;

      case 'shipping_delay':
        if (orderAmount > 1000) {
          recommendedAction = 'partial_refund';
          reasoning = 'Significant order value with shipping delay. Partial compensation recommended.';
          confidence = 70;
          riskAssessment.buyerSatisfaction = 70;
          riskAssessment.supplierImpact = 30;
        } else {
          recommendedAction = 'store_credit';
          reasoning = 'Minor shipping delay. Store credit maintains customer relationship with minimal supplier impact.';
          confidence = 75;
          riskAssessment.buyerSatisfaction = 60;
          riskAssessment.supplierImpact = 20;
        }
        alternativeOptions = ['shipping_refund', 'expedited_shipping', 'discount_coupon'];
        break;

      case 'wrong_item':
        recommendedAction = 'replacement';
        reasoning = 'Clear supplier error. Replacement is standard resolution for wrong item delivery.';
        confidence = 95;
        riskAssessment.buyerSatisfaction = 90;
        riskAssessment.supplierImpact = 60;
        alternativeOptions = ['full_refund', 'partial_refund_plus_keep_item'];
        break;

      case 'payment_issue':
        recommendedAction = 'investigate_payment';
        reasoning = 'Payment disputes require careful investigation of transaction records.';
        confidence = 60;
        riskAssessment.platformRisk = 70;
        alternativeOptions = ['refund_if_double_charged', 'payment_plan', 'dispute_with_processor'];
        break;

      case 'communication':
        recommendedAction = 'mediation';
        reasoning = 'Communication issues best resolved through mediated discussion.';
        confidence = 85;
        riskAssessment.buyerSatisfaction = 70;
        riskAssessment.supplierImpact = 30;
        riskAssessment.platformRisk = 20;
        alternativeOptions = ['warning_to_supplier', 'communication_training', 'account_review'];
        break;

      default:
        recommendedAction = 'case_by_case_review';
        reasoning = 'Unique dispute requires individual assessment by senior mediator.';
        confidence = 40;
        alternativeOptions = ['escalate_to_senior', 'request_more_info', 'schedule_call'];
    }

    // Adjust confidence based on evidence quality
    if (evidenceAnalysis.isComplete) {
      confidence += 15;
    } else {
      confidence -= 10;
    }

    // Adjust based on dispute priority
    if (dispute.priority === 'urgent') {
      riskAssessment.platformRisk += 20;
    }

    // Adjust based on escalation level
    if (dispute.escalationLevel > 0) {
      riskAssessment.platformRisk += (dispute.escalationLevel * 10);
      confidence -= (dispute.escalationLevel * 5);
    }

    return {
      recommendedAction,
      reasoning,
      confidence: Math.max(0, Math.min(100, confidence)),
      alternativeOptions,
      riskAssessment: {
        buyerSatisfaction: Math.max(0, Math.min(100, riskAssessment.buyerSatisfaction)),
        supplierImpact: Math.max(0, Math.min(100, riskAssessment.supplierImpact)),
        platformRisk: Math.max(0, Math.min(100, riskAssessment.platformRisk))
      }
    };
  }

  /**
   * Resolve dispute with decision
   */
  async resolveDispute(
    disputeId: string,
    decision: ResolutionDecision,
    mediatorId: string
  ): Promise<void> {
    try {
      // Validate dispute exists and is resolvable
      const dispute = await db
        .select({
          dispute: disputes,
          order: orders
        })
        .from(disputes)
        .leftJoin(orders, eq(disputes.orderId, orders.id))
        .where(and(
          eq(disputes.id, disputeId),
          or(
            eq(disputes.status, 'open'),
            eq(disputes.status, 'under_review'),
            eq(disputes.status, 'mediation')
          )
        ))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found or already resolved");
      }

      const { dispute: disputeData, order } = dispute[0];

      // Process refund if required
      if (decision.resolutionType === 'refund' || decision.resolutionType === 'partial_refund') {
        if (!decision.refundAmount && !decision.refundPercentage) {
          throw new Error("Refund amount or percentage is required for refund resolutions");
        }

        let refundAmount = decision.refundAmount || 0;
        if (decision.refundPercentage && order) {
          refundAmount = (parseFloat(order.totalAmount) * decision.refundPercentage) / 100;
        }

        // Import refundService dynamically to avoid circular dependency
        const { refundService } = await import("./refundService");
        await refundService.processRefund({
          orderId: disputeData.orderId,
          disputeId: disputeId,
          buyerId: disputeData.buyerId,
          supplierId: disputeData.supplierId,
          adminId: mediatorId,
          refundAmount: refundAmount.toString(),
          originalAmount: order?.totalAmount || '0',
          refundType: decision.resolutionType === 'refund' ? 'full' : 'partial',
          reason: decision.resolutionSummary
        });
      }

      // Update dispute with resolution
      await db
        .update(disputes)
        .set({
          status: 'resolved',
          assignedMediator: mediatorId,
          resolutionType: decision.resolutionType,
          resolutionSummary: decision.resolutionSummary,
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(disputes.id, disputeId));

      // Add resolution message
      await this.addResolutionMessage(disputeId, decision, mediatorId);

      // Send notifications to involved parties
      await this.sendResolutionNotifications(disputeId, decision);

    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw error;
    }
  }

  /**
   * Add resolution message to dispute
   */
  private async addResolutionMessage(
    disputeId: string,
    decision: ResolutionDecision,
    mediatorId: string
  ): Promise<void> {
    const messageContent = `
Dispute Resolution:

Resolution Type: ${decision.resolutionType.replace('_', ' ').toUpperCase()}

Summary: ${decision.resolutionSummary}

${decision.refundAmount ? `Refund Amount: $${decision.refundAmount}` : ''}
${decision.refundPercentage ? `Refund Percentage: ${decision.refundPercentage}%` : ''}
${decision.actionRequired ? `Action Required: ${decision.actionRequired}` : ''}
${decision.timeline ? `Timeline: ${decision.timeline}` : ''}
${decision.conditions && decision.conditions.length > 0 ? `Conditions: ${decision.conditions.join(', ')}` : ''}

This dispute has been resolved. If you have any questions about this resolution, please contact our support team.
    `.trim();

    const messageData: InsertDisputeMessage = {
      disputeId,
      senderId: mediatorId,
      senderType: 'admin',
      message: messageContent,
      attachments: [],
      isInternal: false
    };

    await db.insert(disputeMessages).values(messageData);
  }

  /**
   * Send resolution notifications
   */
  private async sendResolutionNotifications(
    disputeId: string,
    decision: ResolutionDecision
  ): Promise<void> {
    // This would integrate with the notification service
    // For now, we'll just log the notification
    console.log(`Resolution notification sent for dispute ${disputeId}:`, {
      resolutionType: decision.resolutionType,
      summary: decision.resolutionSummary
    });
  }

  /**
   * Get resolution statistics
   */
  async getResolutionStatistics(): Promise<{
    totalResolved: number;
    resolutionTypes: { [key: string]: number };
    averageResolutionTime: number;
    resolutionRate: number;
  }> {
    try {
      // Get total resolved disputes
      const resolvedDisputes = await db
        .select({
          resolutionType: disputes.resolutionType,
          createdAt: disputes.createdAt,
          resolvedAt: disputes.resolvedAt
        })
        .from(disputes)
        .where(eq(disputes.status, 'resolved'));

      // Get total disputes
      const [{ count: totalDisputes }] = await db
        .select({ count: count() })
        .from(disputes);

      // Calculate statistics
      const totalResolved = resolvedDisputes.length;
      const resolutionTypes: { [key: string]: number } = {};
      let totalResolutionTime = 0;

      resolvedDisputes.forEach(dispute => {
        // Count resolution types
        if (dispute.resolutionType) {
          resolutionTypes[dispute.resolutionType] = (resolutionTypes[dispute.resolutionType] || 0) + 1;
        }

        // Calculate resolution time
        if (dispute.createdAt && dispute.resolvedAt) {
          const resolutionTime = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
          totalResolutionTime += resolutionTime;
        }
      });

      const averageResolutionTime = totalResolved > 0 
        ? totalResolutionTime / totalResolved / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      const resolutionRate = totalDisputes > 0 
        ? (totalResolved / totalDisputes) * 100 
        : 0;

      return {
        totalResolved,
        resolutionTypes,
        averageResolutionTime,
        resolutionRate
      };
    } catch (error) {
      console.error("Error getting resolution statistics:", error);
      throw error;
    }
  }

  /**
   * Get mediator performance statistics
   */
  async getMediatorPerformance(mediatorId?: string): Promise<any> {
    try {
      const conditions = [eq(disputes.status, 'resolved')];
      
      if (mediatorId) {
        conditions.push(eq(disputes.assignedMediator, mediatorId));
      }

      const query = db
        .select({
          mediatorId: disputes.assignedMediator,
          resolutionType: disputes.resolutionType,
          createdAt: disputes.createdAt,
          resolvedAt: disputes.resolvedAt,
          escalationLevel: disputes.escalationLevel
        })
        .from(disputes)
        .where(and(...conditions));

      const resolvedDisputes = await query;

      // Group by mediator
      const mediatorStats: { [key: string]: any } = {};

      resolvedDisputes.forEach(dispute => {
        const id = dispute.mediatorId || 'unassigned';
        
        if (!mediatorStats[id]) {
          mediatorStats[id] = {
            totalResolved: 0,
            totalResolutionTime: 0,
            resolutionTypes: {},
            escalatedCases: 0
          };
        }

        mediatorStats[id].totalResolved++;

        if (dispute.resolutionType) {
          mediatorStats[id].resolutionTypes[dispute.resolutionType] = 
            (mediatorStats[id].resolutionTypes[dispute.resolutionType] || 0) + 1;
        }

        if (dispute.escalationLevel && dispute.escalationLevel > 0) {
          mediatorStats[id].escalatedCases++;
        }

        if (dispute.createdAt && dispute.resolvedAt) {
          const resolutionTime = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
          mediatorStats[id].totalResolutionTime += resolutionTime;
        }
      });

      // Calculate averages
      Object.keys(mediatorStats).forEach(id => {
        const stats = mediatorStats[id];
        stats.averageResolutionTime = stats.totalResolved > 0 
          ? stats.totalResolutionTime / stats.totalResolved / (1000 * 60 * 60 * 24) // Days
          : 0;
        stats.escalationRate = stats.totalResolved > 0 
          ? (stats.escalatedCases / stats.totalResolved) * 100 
          : 0;
      });

      return mediatorStats;
    } catch (error) {
      console.error("Error getting mediator performance:", error);
      throw error;
    }
  }

  /**
   * Reopen resolved dispute
   */
  async reopenDispute(disputeId: string, reason: string, reopenedBy: string): Promise<void> {
    try {
      // Verify dispute is resolved
      const dispute = await db
        .select({ status: disputes.status })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      if (dispute[0].status !== 'resolved') {
        throw new Error("Only resolved disputes can be reopened");
      }

      // Update dispute status
      await db
        .update(disputes)
        .set({
          status: 'under_review',
          updatedAt: new Date()
        })
        .where(eq(disputes.id, disputeId));

      // Add reopening message
      const messageData: InsertDisputeMessage = {
        disputeId,
        senderId: reopenedBy,
        senderType: 'admin',
        message: `Dispute reopened. Reason: ${reason}`,
        attachments: [],
        isInternal: false
      };

      await db.insert(disputeMessages).values(messageData);
    } catch (error) {
      console.error("Error reopening dispute:", error);
      throw error;
    }
  }
}

export const resolutionService = new ResolutionService();