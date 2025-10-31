import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentModerationService } from '../contentModerationService';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => ({
  db: {
    query: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('Content Moderation Tests', () => {
  let contentModerationService: ContentModerationService;

  beforeEach(() => {
    vi.clearAllMocks();
    contentModerationService = new ContentModerationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeTextContent', () => {
    it('should analyze text content and return high score for good content', async () => {
      const goodContent = 'This is a high-quality product description with detailed information about the features and specifications.';
      
      // Mock database query for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(goodContent, 'description');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('contentType', 'description');
      expect(result).toHaveProperty('analysisType', 'text');
      expect(result.score).toBeGreaterThan(80);
      expect(result.flags).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should flag short content as quality issue', async () => {
      const shortContent = 'Short';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(shortContent, 'description');

      expect(result.score).toBeLessThan(70);
      expect(result.flags).toHaveLength(1);
      expect(result.flags[0].type).toBe('quality_issue');
      expect(result.flags[0].severity).toBe('medium');
      expect(result.flags[0].description).toContain('too short');
    });

    it('should flag inappropriate content', async () => {
      const inappropriateContent = 'This is a spam product with fake reviews and illegal content.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(inappropriateContent, 'description');

      expect(result.score).toBeLessThan(50);
      expect(result.flags.length).toBeGreaterThan(0);
      
      const inappropriateFlag = result.flags.find(f => f.type === 'inappropriate');
      expect(inappropriateFlag).toBeDefined();
      expect(inappropriateFlag?.severity).toBe('high');
    });

    it('should flag excessive capitalization', async () => {
      const capsContent = 'THIS PRODUCT IS AMAZING AND YOU SHOULD BUY IT NOW!!!';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(capsContent, 'title');

      const qualityFlag = result.flags.find(f => f.type === 'quality_issue' && f.description.includes('capitalization'));
      expect(qualityFlag).toBeDefined();
      expect(result.score).toBeLessThan(80);
    });

    it('should detect spam content', async () => {
      const spamContent = 'BUY NOW!!! Limited time offer! Act fast! Guaranteed results! Free shipping today only!!!';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(spamContent, 'description');

      const spamFlag = result.flags.find(f => f.type === 'spam');
      expect(spamFlag).toBeDefined();
      expect(spamFlag?.severity).toBe('high');
      expect(spamFlag?.suggestedAction).toBe('reject');
      expect(result.score).toBeLessThan(40);
    });

    it('should flag policy violations', async () => {
      const violatingContent = 'This is a counterfeit replica of the original product, a perfect copy.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(violatingContent, 'description');

      const policyFlag = result.flags.find(f => f.type === 'policy_violation');
      expect(policyFlag).toBeDefined();
      expect(policyFlag?.severity).toBe('critical');
      expect(result.score).toBeLessThan(30);
    });

    it('should generate appropriate recommendations', async () => {
      const poorContent = 'Bad';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(poorContent, 'description');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('improvement'))).toBe(true);
    });

    it('should handle database storage errors gracefully', async () => {
      const content = 'Test content for database error handling';
      
      (db.query as any).mockRejectedValue(new Error('Database connection failed'));

      // Should not throw error even if storage fails
      const result = await contentModerationService.analyzeTextContent(content, 'description');
      
      expect(result).toHaveProperty('id');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('analyzeImageContent', () => {
    it('should analyze image and return quality metrics', async () => {
      const imageUrl = 'https://example.com/product-image.jpg';

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      expect(result).toHaveProperty('imageUrl', imageUrl);
      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('appropriatenessScore');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('recommendations');

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
      expect(result.appropriatenessScore).toBeGreaterThanOrEqual(0);
      expect(result.appropriatenessScore).toBeLessThanOrEqual(100);
    });

    it('should flag low resolution images', async () => {
      const imageUrl = 'https://example.com/low-res-image.jpg';
      
      // Mock Math.random to ensure low resolution
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Will generate width/height < 300

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      const lowQualityFlag = result.flags.find(f => f.type === 'low_quality' && f.description.includes('resolution'));
      expect(lowQualityFlag).toBeDefined();
      expect(result.qualityScore).toBeLessThan(70);

      Math.random = originalRandom;
    });

    it('should flag large file sizes', async () => {
      const imageUrl = 'https://example.com/large-image.jpg';
      
      // Mock Math.random to ensure large file size
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.9); // Will generate large file size

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      const largeSizeFlag = result.flags.find(f => f.type === 'low_quality' && f.description.includes('file size'));
      expect(largeSizeFlag).toBeDefined();
      expect(result.qualityScore).toBeLessThan(80);

      Math.random = originalRandom;
    });

    it('should flag watermarked images', async () => {
      const imageUrl = 'https://example.com/watermarked-image.jpg';
      
      // Mock Math.random to ensure watermark detection
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Will trigger watermark detection

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      const watermarkFlag = result.flags.find(f => f.type === 'watermark');
      expect(watermarkFlag).toBeDefined();
      expect(result.appropriatenessScore).toBeLessThan(60);

      Math.random = originalRandom;
    });

    it('should flag text-heavy images', async () => {
      const imageUrl = 'https://example.com/text-heavy-image.jpg';
      
      // Mock Math.random to ensure text detection
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Will trigger text detection

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      const textFlag = result.flags.find(f => f.type === 'text_heavy');
      expect(textFlag).toBeDefined();
      expect(result.qualityScore).toBeLessThan(90);

      Math.random = originalRandom;
    });

    it('should generate appropriate image recommendations', async () => {
      const imageUrl = 'https://example.com/problematic-image.jpg';
      
      // Mock to generate multiple issues
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1);

      const result = await contentModerationService.analyzeImageContent(imageUrl);

      expect(result.recommendations.length).toBeGreaterThan(0);
      
      Math.random = originalRandom;
    });
  });

  describe('detectDuplicateContent', () => {
    it('should detect no duplicates for unique content', async () => {
      const uniqueContent = 'This is completely unique product content that has never been seen before.';
      
      const result = await contentModerationService.detectDuplicateContent(uniqueContent, 'product');

      expect(result.isDuplicate).toBe(false);
      expect(result.similarity).toBe(0);
      expect(result.duplicateType).toBe('similar');
      expect(result.matchedFields).toHaveLength(0);
    });

    it('should return consistent hash for same content', async () => {
      const content = 'Test content for hashing';
      
      // Test that the same content generates the same hash
      const result1 = await contentModerationService.detectDuplicateContent(content, 'product');
      const result2 = await contentModerationService.detectDuplicateContent(content, 'product');

      expect(result1.similarity).toBe(result2.similarity);
    });
  });

  describe('runAutomatedScreening', () => {
    it('should run comprehensive screening for a product', async () => {
      const productId = 'product-123';
      const mockProduct = {
        id: productId,
        title: 'High Quality Product',
        description: 'This is a detailed description of a high-quality product with all necessary information.',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        supplierId: 'supplier-1'
      };

      // Mock database query for product
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockProduct.id,
          title: mockProduct.title,
          description: mockProduct.description,
          images: mockProduct.images,
          supplier_id: mockProduct.supplierId
        }]
      });

      // Mock database queries for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.runAutomatedScreening(productId);

      expect(result).toHaveProperty('textAnalysis');
      expect(result).toHaveProperty('imageAnalysis');
      expect(result).toHaveProperty('duplicateCheck');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('flags');

      expect(result.textAnalysis).toHaveLength(2); // Title and description
      expect(result.imageAnalysis).toHaveLength(2); // Two images
      expect(['approve', 'review', 'reject']).toContain(result.recommendation);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should recommend rejection for poor quality content', async () => {
      const productId = 'product-456';
      const mockProduct = {
        id: productId,
        title: 'SPAM!!!',
        description: 'BUY NOW!!! This is a fake counterfeit product!!!',
        images: ['https://example.com/bad-image.jpg'],
        supplierId: 'supplier-2'
      };

      // Mock database query for product
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockProduct.id,
          title: mockProduct.title,
          description: mockProduct.description,
          images: mockProduct.images,
          supplier_id: mockProduct.supplierId
        }]
      });

      // Mock database queries for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.runAutomatedScreening(productId);

      expect(result.recommendation).toBe('reject');
      expect(result.overallScore).toBeLessThan(50);
      expect(result.flags.length).toBeGreaterThan(0);
      
      const criticalFlags = result.flags.filter(f => f.severity === 'critical');
      expect(criticalFlags.length).toBeGreaterThan(0);
    });

    it('should recommend review for moderate quality content', async () => {
      const productId = 'product-789';
      const mockProduct = {
        id: productId,
        title: 'Decent Product',
        description: 'This product is okay but could use some improvement in the description quality.',
        images: ['https://example.com/medium-image.jpg'],
        supplierId: 'supplier-3'
      };

      // Mock database query for product
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockProduct.id,
          title: mockProduct.title,
          description: mockProduct.description,
          images: mockProduct.images,
          supplier_id: mockProduct.supplierId
        }]
      });

      // Mock database queries for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.runAutomatedScreening(productId);

      expect(['review', 'approve']).toContain(result.recommendation);
      expect(result.overallScore).toBeGreaterThan(30);
    });

    it('should handle products without images', async () => {
      const productId = 'product-no-images';
      const mockProduct = {
        id: productId,
        title: 'Product Without Images',
        description: 'This is a product that does not have any images uploaded yet.',
        images: null,
        supplierId: 'supplier-4'
      };

      // Mock database query for product
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockProduct.id,
          title: mockProduct.title,
          description: mockProduct.description,
          images: mockProduct.images,
          supplier_id: mockProduct.supplierId
        }]
      });

      // Mock database queries for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.runAutomatedScreening(productId);

      expect(result.imageAnalysis).toHaveLength(0);
      expect(result.textAnalysis).toHaveLength(2); // Title and description
    });

    it('should handle products without description', async () => {
      const productId = 'product-no-desc';
      const mockProduct = {
        id: productId,
        title: 'Product Without Description',
        description: null,
        images: ['https://example.com/image.jpg'],
        supplierId: 'supplier-5'
      };

      // Mock database query for product
      (db.query as any).mockResolvedValueOnce({
        rows: [{
          id: mockProduct.id,
          title: mockProduct.title,
          description: mockProduct.description,
          images: mockProduct.images,
          supplier_id: mockProduct.supplierId
        }]
      });

      // Mock database queries for storing results
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.runAutomatedScreening(productId);

      expect(result.textAnalysis).toHaveLength(1); // Only title
      expect(result.imageAnalysis).toHaveLength(1);
    });

    it('should throw error for non-existent product', async () => {
      const productId = 'non-existent-product';

      // Mock database query returning no product
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      await expect(
        contentModerationService.runAutomatedScreening(productId)
      ).rejects.toThrow('Product not found');
    });

    it('should handle database errors gracefully', async () => {
      const productId = 'product-db-error';

      // Mock database error
      (db.query as any).mockRejectedValue(new Error('Database connection failed'));

      await expect(
        contentModerationService.runAutomatedScreening(productId)
      ).rejects.toThrow('Automated screening failed');
    });
  });

  describe('Policy Compliance Checks', () => {
    it('should pass compliant content', async () => {
      const compliantContent = 'This is a genuine, high-quality product with detailed specifications and authentic materials.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(compliantContent, 'description');

      const policyFlags = result.flags.filter(f => f.type === 'policy_violation');
      expect(policyFlags).toHaveLength(0);
    });

    it('should flag prohibited terms', async () => {
      const prohibitedContent = 'This counterfeit replica is a perfect copy of the original brand.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(prohibitedContent, 'description');

      const policyFlags = result.flags.filter(f => f.type === 'policy_violation');
      expect(policyFlags.length).toBeGreaterThan(0);
      expect(policyFlags[0].severity).toBe('critical');
    });

    it('should flag insufficient product information', async () => {
      const insufficientContent = 'Product.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(insufficientContent, 'description');

      const policyFlags = result.flags.filter(f => f.type === 'policy_violation');
      expect(policyFlags.length).toBeGreaterThan(0);
      
      const insufficientInfoFlag = policyFlags.find(f => f.description.includes('insufficient'));
      expect(insufficientInfoFlag).toBeDefined();
    });
  });

  describe('Spam Detection', () => {
    it('should not flag normal content as spam', async () => {
      const normalContent = 'This product offers excellent value and quality for customers looking for reliable solutions.';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(normalContent, 'description');

      const spamFlags = result.flags.filter(f => f.type === 'spam');
      expect(spamFlags).toHaveLength(0);
    });

    it('should detect promotional spam patterns', async () => {
      const spamContent = 'BUY NOW limited time offer guaranteed results act fast free discount sale today!!!';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(spamContent, 'description');

      const spamFlags = result.flags.filter(f => f.type === 'spam');
      expect(spamFlags.length).toBeGreaterThan(0);
      expect(spamFlags[0].confidence).toBeGreaterThan(0.6);
    });

    it('should detect excessive punctuation as spam indicator', async () => {
      const spamContent = 'Amazing product!!! You must buy this now!!! Limited offer!!!';
      
      (db.query as any).mockResolvedValue({ rows: [] });

      const result = await contentModerationService.analyzeTextContent(spamContent, 'description');

      const spamFlags = result.flags.filter(f => f.type === 'spam');
      expect(spamFlags.length).toBeGreaterThan(0);
    });
  });
});