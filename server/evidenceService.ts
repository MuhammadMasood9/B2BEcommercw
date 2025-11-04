import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { disputes } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export interface EvidenceFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
  uploadedBy: string;
  userType: 'buyer' | 'supplier' | 'admin';
  notes?: string;
}

export class EvidenceService {
  private readonly uploadPath = 'public/uploads/evidence';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi',
    'video/quicktime'
  ];

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await access(this.uploadPath);
    } catch {
      await mkdir(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Validate file for evidence upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(originalName);
    return `${timestamp}_${random}${extension}`;
  }

  /**
   * Upload evidence file for dispute
   */
  async uploadEvidence(
    disputeId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    userType: 'buyer' | 'supplier' | 'admin',
    notes?: string
  ): Promise<EvidenceFile> {
    try {
      // Validate file
      this.validateFile(file);

      // Verify dispute exists
      const dispute = await db
        .select({ id: disputes.id })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      // Generate unique filename
      const filename = this.generateFilename(file.originalname);
      const filePath = path.join(this.uploadPath, filename);

      // Save file to disk
      await writeFile(filePath, file.buffer);

      // Create evidence record
      const evidenceFile: EvidenceFile = {
        id: `evidence_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy,
        userType,
        notes
      };

      // Update dispute with new evidence
      await this.addEvidenceToDispute(disputeId, evidenceFile, userType);

      return evidenceFile;
    } catch (error) {
      console.error("Error uploading evidence:", error);
      throw error;
    }
  }

  /**
   * Add evidence to dispute record
   */
  private async addEvidenceToDispute(
    disputeId: string,
    evidenceFile: EvidenceFile,
    userType: 'buyer' | 'supplier' | 'admin'
  ): Promise<void> {
    try {
      // Get current evidence
      const dispute = await db
        .select({
          evidence: disputes.evidence,
          buyerEvidence: disputes.buyerEvidence,
          supplierEvidence: disputes.supplierEvidence
        })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      const currentDispute = dispute[0];
      let updateData: any = {};

      if (userType === 'buyer') {
        const currentEvidence = Array.isArray(currentDispute.buyerEvidence) 
          ? currentDispute.buyerEvidence 
          : [];
        updateData.buyerEvidence = [...currentEvidence, evidenceFile];
      } else if (userType === 'supplier') {
        const currentEvidence = Array.isArray(currentDispute.supplierEvidence) 
          ? currentDispute.supplierEvidence 
          : [];
        updateData.supplierEvidence = [...currentEvidence, evidenceFile];
      } else if (userType === 'admin') {
        const currentEvidence = Array.isArray(currentDispute.evidence) 
          ? currentDispute.evidence 
          : [];
        updateData.evidence = [...currentEvidence, evidenceFile];
      }

      updateData.updatedAt = new Date();

      await db
        .update(disputes)
        .set(updateData)
        .where(eq(disputes.id, disputeId));
    } catch (error) {
      console.error("Error adding evidence to dispute:", error);
      throw error;
    }
  }

  /**
   * Get all evidence for a dispute
   */
  async getDisputeEvidence(disputeId: string): Promise<{
    adminEvidence: EvidenceFile[];
    buyerEvidence: EvidenceFile[];
    supplierEvidence: EvidenceFile[];
  }> {
    try {
      const dispute = await db
        .select({
          evidence: disputes.evidence,
          buyerEvidence: disputes.buyerEvidence,
          supplierEvidence: disputes.supplierEvidence
        })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      const currentDispute = dispute[0];

      return {
        adminEvidence: Array.isArray(currentDispute.evidence) ? currentDispute.evidence : [],
        buyerEvidence: Array.isArray(currentDispute.buyerEvidence) ? currentDispute.buyerEvidence : [],
        supplierEvidence: Array.isArray(currentDispute.supplierEvidence) ? currentDispute.supplierEvidence : []
      };
    } catch (error) {
      console.error("Error fetching dispute evidence:", error);
      throw error;
    }
  }

  /**
   * Remove evidence file
   */
  async removeEvidence(
    disputeId: string,
    evidenceId: string,
    userType: 'buyer' | 'supplier' | 'admin'
  ): Promise<void> {
    try {
      // Get current evidence
      const dispute = await db
        .select({
          evidence: disputes.evidence,
          buyerEvidence: disputes.buyerEvidence,
          supplierEvidence: disputes.supplierEvidence
        })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length === 0) {
        throw new Error("Dispute not found");
      }

      const currentDispute = dispute[0];
      let updateData: any = {};
      let evidenceToRemove: EvidenceFile | null = null;

      if (userType === 'buyer') {
        const currentEvidence = Array.isArray(currentDispute.buyerEvidence) 
          ? currentDispute.buyerEvidence 
          : [];
        evidenceToRemove = currentEvidence.find((e: EvidenceFile) => e.id === evidenceId);
        updateData.buyerEvidence = currentEvidence.filter((e: EvidenceFile) => e.id !== evidenceId);
      } else if (userType === 'supplier') {
        const currentEvidence = Array.isArray(currentDispute.supplierEvidence) 
          ? currentDispute.supplierEvidence 
          : [];
        evidenceToRemove = currentEvidence.find((e: EvidenceFile) => e.id === evidenceId);
        updateData.supplierEvidence = currentEvidence.filter((e: EvidenceFile) => e.id !== evidenceId);
      } else if (userType === 'admin') {
        const currentEvidence = Array.isArray(currentDispute.evidence) 
          ? currentDispute.evidence 
          : [];
        evidenceToRemove = currentEvidence.find((e: EvidenceFile) => e.id === evidenceId);
        updateData.evidence = currentEvidence.filter((e: EvidenceFile) => e.id !== evidenceId);
      }

      if (!evidenceToRemove) {
        throw new Error("Evidence file not found");
      }

      // Remove file from disk
      const filePath = path.join(this.uploadPath, evidenceToRemove.filename);
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.warn("Could not delete file from disk:", error);
      }

      // Update database
      updateData.updatedAt = new Date();
      await db
        .update(disputes)
        .set(updateData)
        .where(eq(disputes.id, disputeId));
    } catch (error) {
      console.error("Error removing evidence:", error);
      throw error;
    }
  }

  /**
   * Get evidence file path
   */
  getEvidenceFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  /**
   * Validate evidence completeness for dispute resolution
   */
  async validateEvidenceCompleteness(disputeId: string): Promise<{
    isComplete: boolean;
    missingEvidence: string[];
    recommendations: string[];
  }> {
    try {
      const evidence = await this.getDisputeEvidence(disputeId);
      const missingEvidence: string[] = [];
      const recommendations: string[] = [];

      // Check if both parties have provided evidence
      if (evidence.buyerEvidence.length === 0) {
        missingEvidence.push("Buyer evidence");
        recommendations.push("Request buyer to provide supporting documentation");
      }

      if (evidence.supplierEvidence.length === 0) {
        missingEvidence.push("Supplier evidence");
        recommendations.push("Request supplier to provide supporting documentation");
      }

      // Check for specific evidence types based on dispute type
      const dispute = await db
        .select({ type: disputes.type })
        .from(disputes)
        .where(eq(disputes.id, disputeId))
        .limit(1);

      if (dispute.length > 0) {
        const disputeType = dispute[0].type;
        
        if (disputeType === 'product_quality') {
          const hasImages = [...evidence.buyerEvidence, ...evidence.supplierEvidence]
            .some(e => e.mimetype.startsWith('image/'));
          
          if (!hasImages) {
            missingEvidence.push("Product images");
            recommendations.push("Request photos of the product showing quality issues");
          }
        }

        if (disputeType === 'shipping_delay') {
          const hasShippingDocs = [...evidence.buyerEvidence, ...evidence.supplierEvidence]
            .some(e => e.originalName.toLowerCase().includes('shipping') || 
                      e.originalName.toLowerCase().includes('tracking'));
          
          if (!hasShippingDocs) {
            missingEvidence.push("Shipping documentation");
            recommendations.push("Request shipping receipts and tracking information");
          }
        }
      }

      return {
        isComplete: missingEvidence.length === 0,
        missingEvidence,
        recommendations
      };
    } catch (error) {
      console.error("Error validating evidence completeness:", error);
      throw error;
    }
  }

  /**
   * Get evidence statistics
   */
  async getEvidenceStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypeDistribution: { [key: string]: number };
    averageFilesPerDispute: number;
  }> {
    try {
      const allDisputes = await db
        .select({
          evidence: disputes.evidence,
          buyerEvidence: disputes.buyerEvidence,
          supplierEvidence: disputes.supplierEvidence
        })
        .from(disputes);

      let totalFiles = 0;
      let totalSize = 0;
      const fileTypeDistribution: { [key: string]: number } = {};

      allDisputes.forEach(dispute => {
        const allEvidence = [
          ...(Array.isArray(dispute.evidence) ? dispute.evidence : []),
          ...(Array.isArray(dispute.buyerEvidence) ? dispute.buyerEvidence : []),
          ...(Array.isArray(dispute.supplierEvidence) ? dispute.supplierEvidence : [])
        ];

        allEvidence.forEach((evidence: EvidenceFile) => {
          totalFiles++;
          totalSize += evidence.size;
          
          const fileType = evidence.mimetype.split('/')[0];
          fileTypeDistribution[fileType] = (fileTypeDistribution[fileType] || 0) + 1;
        });
      });

      return {
        totalFiles,
        totalSize,
        fileTypeDistribution,
        averageFilesPerDispute: allDisputes.length > 0 ? totalFiles / allDisputes.length : 0
      };
    } catch (error) {
      console.error("Error getting evidence statistics:", error);
      throw error;
    }
  }
}

export const evidenceService = new EvidenceService();