import { Router } from "express";
import { eq, and, desc, ilike } from "drizzle-orm";
import { db } from "./db";
import { inquiryTemplates, type InquiryTemplate } from "@shared/schema";

const router = Router();

// GET /api/inquiry-templates - Get public inquiry templates for buyers
router.get("/", async (req, res) => {
  try {
    const { category, search, limit = "10" } = req.query;

    // For now, return default templates since we don't have supplier-specific templates for buyers
    // In a real implementation, you might want to get popular templates from suppliers
    const defaultTemplates = [
      {
        id: 'pricing',
        name: 'Pricing Inquiry',
        subject: 'Pricing Information Request',
        message: 'Hello,\n\nI am interested in your product and would like to get detailed pricing information for different quantities. Could you please provide:\n\n- Unit price for different quantity tiers\n- Minimum order quantity\n- Payment terms\n- Lead time\n\nThank you for your time.',
        category: 'pricing',
        isDefault: true,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'samples',
        name: 'Sample Request',
        subject: 'Sample Request',
        message: 'Hello,\n\nI would like to request samples of this product to evaluate quality before placing a larger order. Please let me know:\n\n- Sample availability and cost\n- Shipping arrangements\n- Sample lead time\n- Customization options\n\nLooking forward to your response.',
        category: 'samples',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'customization',
        name: 'Customization Inquiry',
        subject: 'Product Customization Options',
        message: 'Hello,\n\nI am interested in customizing this product for my business needs. Could you please provide information about:\n\n- Available customization options\n- Minimum quantities for custom orders\n- Additional costs for customization\n- Design and approval process\n- Production timeline\n\nThank you.',
        category: 'customization',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'shipping',
        name: 'Shipping & Logistics',
        subject: 'Shipping and Delivery Information',
        message: 'Hello,\n\nI need detailed information about shipping and logistics for this product:\n\n- Shipping methods available\n- Shipping costs to my location\n- Delivery timeframes\n- Packaging details\n- Insurance options\n\nPlease provide a comprehensive quote including all costs.',
        category: 'logistics',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bulk',
        name: 'Bulk Order Inquiry',
        subject: 'Bulk Order Pricing Request',
        message: 'Hello,\n\nI am planning to place a large order and would like to discuss:\n\n- Volume discounts available\n- Bulk pricing tiers\n- Payment terms for large orders\n- Production capacity and lead times\n- Quality assurance processes\n\nI look forward to establishing a long-term business relationship.',
        category: 'bulk',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'quality',
        name: 'Quality & Certifications',
        subject: 'Product Quality and Certification Inquiry',
        message: 'Hello,\n\nI am interested in your product and need information about quality standards and certifications:\n\n- Quality control processes\n- Available certifications (ISO, CE, FDA, etc.)\n- Testing procedures\n- Quality guarantees\n- Compliance documentation\n\nPlease provide detailed information about your quality assurance.',
        category: 'quality',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'technical',
        name: 'Technical Specifications',
        subject: 'Technical Specifications Request',
        message: 'Hello,\n\nI need detailed technical specifications for this product:\n\n- Complete technical drawings or specifications\n- Material composition and properties\n- Performance parameters\n- Operating conditions and limitations\n- Compatibility information\n\nPlease provide comprehensive technical documentation.',
        category: 'technical',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'partnership',
        name: 'Partnership Inquiry',
        subject: 'Business Partnership Opportunity',
        message: 'Hello,\n\nI represent a company interested in establishing a business partnership. We would like to discuss:\n\n- Distribution opportunities\n- Exclusive territory rights\n- Volume commitments and pricing\n- Marketing support\n- Long-term collaboration terms\n\nWe believe there is significant potential for mutual growth.',
        category: 'partnership',
        isDefault: false,
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    let filteredTemplates = defaultTemplates;

    // Apply category filter
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.subject.toLowerCase().includes(searchLower) ||
        t.message.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    filteredTemplates = filteredTemplates.slice(0, limitNum);

    res.json({
      templates: filteredTemplates,
      total: filteredTemplates.length
    });
  } catch (error) {
    console.error("Error fetching inquiry templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// GET /api/inquiry-templates/categories - Get available template categories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      { id: 'pricing', name: 'Pricing & Quotes', description: 'Templates for pricing inquiries and quote requests' },
      { id: 'samples', name: 'Samples & Testing', description: 'Templates for sample requests and product testing' },
      { id: 'customization', name: 'Customization', description: 'Templates for custom product inquiries' },
      { id: 'logistics', name: 'Shipping & Logistics', description: 'Templates for shipping and delivery inquiries' },
      { id: 'bulk', name: 'Bulk Orders', description: 'Templates for large volume orders' },
      { id: 'quality', name: 'Quality & Certifications', description: 'Templates for quality and certification inquiries' },
      { id: 'technical', name: 'Technical Specs', description: 'Templates for technical specification requests' },
      { id: 'partnership', name: 'Business Partnership', description: 'Templates for partnership and distribution inquiries' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error("Error fetching template categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;