import { Router } from "express";
import { eq, and, or, desc, asc, ilike, sql, gte, lte, isNull, ne, count, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  conversations,
  messages,
  buyers,
  supplierProfiles,
  users,
  products,
  InsertConversation,
  InsertMessage,
  Conversation,
  Message
} from "@shared/schema";
import { authMiddleware } from "./auth";
import { upload } from "./upload";
import { notificationService } from "./notificationService";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ==================== CONVERSATION MANAGEMENT ROUTES ====================

// GET /api/chat/conversations - Get user's conversations
router.get("/conversations", async (req, res) => {
  try {
    const {
      type,
      status = 'active',
      search,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
      limit = '20',
      offset = '0'
    } = req.query;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = db
      .select({
        conversation: conversations,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeLogo: supplierProfiles.storeLogo
        },
        admin: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        unreadCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${messages}
          WHERE ${messages.conversationId} = ${conversations.id}
          AND ${messages.senderId} != ${req.user.id}
          AND ${messages.isRead} = false
        )`.as('unreadCount'),
        lastMessage: sql<any>`(
          SELECT row_to_json(m.*)
          FROM ${messages} m
          WHERE m.${messages.conversationId} = ${conversations.id}
          ORDER BY m.${messages.createdAt} DESC
          LIMIT 1
        )`.as('lastMessage')
      })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(conversations.adminId, users.id));

    const conditions = [];

    // Filter by user involvement
    if (req.user.role === 'buyer') {
      // Get buyer profile
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);

      if (buyerProfile.length === 0) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }

      conditions.push(eq(conversations.buyerId, buyerProfile[0].id));
    } else if (req.user.role === 'supplier') {
      // Get supplier profile
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);

      if (supplierProfile.length === 0) {
        return res.status(404).json({ error: "Supplier profile not found" });
      }

      conditions.push(eq(conversations.supplierId, supplierProfile[0].id));
    } else if (req.user.role === 'admin') {
      conditions.push(
        or(
          eq(conversations.adminId, req.user.id),
          eq(conversations.type, 'buyer_admin'),
          eq(conversations.type, 'supplier_admin')
        )
      );
    }

    // Type filter
    if (type && typeof type === 'string') {
      conditions.push(eq(conversations.type, type));
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(conversations.status, status));
    }

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(conversations.subject, `%${search}%`),
          ilike(buyers.companyName, `%${search}%`),
          ilike(supplierProfiles.businessName, `%${search}%`),
          ilike(supplierProfiles.storeName, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'subject' ? conversations.subject :
                      sortBy === 'status' ? conversations.status :
                      sortBy === 'createdAt' ? conversations.createdAt :
                      conversations.lastMessageAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedConversations = result.map(row => ({
      ...row.conversation,
      buyer: row.buyer,
      supplier: row.supplier,
      admin: row.admin,
      unreadCount: row.unreadCount,
      lastMessage: row.lastMessage
    }));

    res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// POST /api/chat/conversations - Create new conversation
router.post("/conversations", async (req, res) => {
  try {
    const {
      type,
      buyerId,
      supplierId,
      adminId,
      subject,
      initialMessage
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate required fields
    if (!type || !subject || !initialMessage) {
      return res.status(400).json({ 
        error: "Missing required fields: type, subject, initialMessage" 
      });
    }

    const validTypes = ['buyer_supplier', 'buyer_admin', 'supplier_admin'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid conversation type" });
    }

    // Validate participants based on conversation type and user role
    let conversationData: InsertConversation = {
      type,
      subject: subject.trim(),
      status: 'active'
    };

    if (type === 'buyer_supplier') {
      if (req.user.role === 'buyer') {
        if (!supplierId) {
          return res.status(400).json({ error: "supplierId is required for buyer_supplier conversation" });
        }
        
        // Get buyer profile
        const buyerProfile = await db
          .select({ id: buyers.id })
          .from(buyers)
          .where(eq(buyers.userId, req.user.id))
          .limit(1);

        if (buyerProfile.length === 0) {
          return res.status(404).json({ error: "Buyer profile not found" });
        }

        conversationData.buyerId = buyerProfile[0].id;
        conversationData.supplierId = supplierId;
      } else if (req.user.role === 'supplier') {
        if (!buyerId) {
          return res.status(400).json({ error: "buyerId is required for buyer_supplier conversation" });
        }

        // Get supplier profile
        const supplierProfile = await db
          .select({ id: supplierProfiles.id })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.userId, req.user.id))
          .limit(1);

        if (supplierProfile.length === 0) {
          return res.status(404).json({ error: "Supplier profile not found" });
        }

        conversationData.buyerId = buyerId;
        conversationData.supplierId = supplierProfile[0].id;
      } else {
        return res.status(403).json({ error: "Only buyers and suppliers can create buyer_supplier conversations" });
      }
    } else if (type === 'buyer_admin') {
      if (req.user.role === 'buyer') {
        // Get buyer profile
        const buyerProfile = await db
          .select({ id: buyers.id })
          .from(buyers)
          .where(eq(buyers.userId, req.user.id))
          .limit(1);

        if (buyerProfile.length === 0) {
          return res.status(404).json({ error: "Buyer profile not found" });
        }

        conversationData.buyerId = buyerProfile[0].id;
        conversationData.adminId = adminId || null; // Admin can be assigned later
      } else if (req.user.role === 'admin') {
        if (!buyerId) {
          return res.status(400).json({ error: "buyerId is required for buyer_admin conversation" });
        }
        conversationData.buyerId = buyerId;
        conversationData.adminId = req.user.id;
      } else {
        return res.status(403).json({ error: "Only buyers and admins can create buyer_admin conversations" });
      }
    } else if (type === 'supplier_admin') {
      if (req.user.role === 'supplier') {
        // Get supplier profile
        const supplierProfile = await db
          .select({ id: supplierProfiles.id })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.userId, req.user.id))
          .limit(1);

        if (supplierProfile.length === 0) {
          return res.status(404).json({ error: "Supplier profile not found" });
        }

        conversationData.supplierId = supplierProfile[0].id;
        conversationData.adminId = adminId || null; // Admin can be assigned later
      } else if (req.user.role === 'admin') {
        if (!supplierId) {
          return res.status(400).json({ error: "supplierId is required for supplier_admin conversation" });
        }
        conversationData.supplierId = supplierId;
        conversationData.adminId = req.user.id;
      } else {
        return res.status(403).json({ error: "Only suppliers and admins can create supplier_admin conversations" });
      }
    }

    // Check if similar conversation already exists
    const existingConversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.type, type),
        conversationData.buyerId ? eq(conversations.buyerId, conversationData.buyerId) : isNull(conversations.buyerId),
        conversationData.supplierId ? eq(conversations.supplierId, conversationData.supplierId) : isNull(conversations.supplierId),
        conversationData.adminId ? eq(conversations.adminId, conversationData.adminId) : isNull(conversations.adminId),
        eq(conversations.status, 'active')
      ))
      .limit(1);

    if (existingConversation.length > 0) {
      return res.status(400).json({ 
        error: "An active conversation already exists between these participants",
        conversationId: existingConversation[0].id
      });
    }

    // Create conversation
    const [newConversation] = await db.insert(conversations).values(conversationData).returning();

    // Create initial message
    const messageData: InsertMessage = {
      conversationId: newConversation.id,
      senderId: req.user.id,
      senderType: req.user.role,
      message: initialMessage.trim(),
      attachments: [],
      productReferences: [],
      isRead: false
    };

    const [newMessage] = await db.insert(messages).values(messageData).returning();

    // Update conversation with last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, newConversation.id));

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation: newConversation,
      initialMessage: newMessage
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/chat/conversations/:id - Get specific conversation details
router.get("/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await db
      .select({
        conversation: conversations,
        buyer: {
          id: buyers.id,
          companyName: buyers.companyName,
          industry: buyers.industry
        },
        supplier: {
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeLogo: supplierProfiles.storeLogo
        },
        admin: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(conversations.adminId, users.id))
      .where(eq(conversations.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { conversation, buyer, supplier, admin } = result[0];

    // Check if user has access to this conversation
    let hasAccess = false;

    if (req.user.role === 'buyer' && buyer) {
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);
      
      hasAccess = buyerProfile.length > 0 && buyerProfile[0].id === buyer.id;
    } else if (req.user.role === 'supplier' && supplier) {
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);
      
      hasAccess = supplierProfile.length > 0 && supplierProfile[0].id === supplier.id;
    } else if (req.user.role === 'admin') {
      hasAccess = !admin || admin.id === req.user.id || conversation.type.includes('admin');
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    const conversationData = {
      ...conversation,
      buyer,
      supplier,
      admin
    };

    res.json({
      success: true,
      conversation: conversationData
    });
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    res.status(500).json({ error: "Failed to fetch conversation details" });
  }
});

// ==================== MESSAGE MANAGEMENT ROUTES ====================

// GET /api/chat/messages - Get messages for a conversation
router.get("/messages", async (req, res) => {
  try {
    const {
      conversationId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      limit = '50',
      offset = '0'
    } = req.query;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Verify user has access to the conversation
    const conversationResult = await db
      .select({
        conversation: conversations,
        buyer: buyers,
        supplier: supplierProfiles,
        admin: users
      })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(conversations.adminId, users.id))
      .where(eq(conversations.id, conversationId as string))
      .limit(1);

    if (conversationResult.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { conversation, buyer, supplier, admin } = conversationResult[0];

    // Check access (same logic as conversation details)
    let hasAccess = false;

    if (req.user.role === 'buyer' && buyer) {
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);
      
      hasAccess = buyerProfile.length > 0 && buyerProfile[0].id === buyer.id;
    } else if (req.user.role === 'supplier' && supplier) {
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);
      
      hasAccess = supplierProfile.length > 0 && supplierProfile[0].id === supplier.id;
    } else if (req.user.role === 'admin') {
      hasAccess = !admin || admin.id === req.user.id || conversation.type.includes('admin');
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    let query = db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        referencedProducts: sql<any>`(
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', p.id,
                'name', p.name,
                'images', p.images
              )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          )
          FROM unnest(${messages.productReferences}) AS ref_id
          LEFT JOIN ${products} p ON p.id = ref_id::uuid
        )`.as('referencedProducts')
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId as string));

    const conditions = [eq(messages.conversationId, conversationId as string)];

    // Search filter
    if (search && typeof search === 'string') {
      conditions.push(ilike(messages.message, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sortBy === 'senderType' ? messages.senderType : messages.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    query = query.limit(limitNum).offset(offsetNum);

    const result = await query;

    // Mark messages as read for the current user
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId as string),
        ne(messages.senderId, req.user.id),
        eq(messages.isRead, false)
      ));

    // Get total count
    let countQuery = db.select({ count: count() })
      .from(messages)
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    const formattedMessages = result.map(row => ({
      ...row.message,
      sender: row.sender,
      referencedProducts: row.referencedProducts || []
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        page: Math.floor(offsetNum / limitNum) + 1,
        hasMore: offsetNum + limitNum < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/chat/messages - Send new message
router.post("/messages", upload.array('attachments', 5), async (req, res) => {
  try {
    const { conversationId, message, productReferences } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate required fields
    if (!conversationId || !message) {
      return res.status(400).json({ 
        error: "Missing required fields: conversationId, message" 
      });
    }

    // Verify conversation exists and user has access (same logic as above)
    const conversationResult = await db
      .select({
        conversation: conversations,
        buyer: buyers,
        supplier: supplierProfiles,
        admin: users
      })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(conversations.adminId, users.id))
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversationResult.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { conversation, buyer, supplier, admin } = conversationResult[0];

    // Check access
    let hasAccess = false;

    if (req.user.role === 'buyer' && buyer) {
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);
      
      hasAccess = buyerProfile.length > 0 && buyerProfile[0].id === buyer.id;
    } else if (req.user.role === 'supplier' && supplier) {
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);
      
      hasAccess = supplierProfile.length > 0 && supplierProfile[0].id === supplier.id;
    } else if (req.user.role === 'admin') {
      hasAccess = !admin || admin.id === req.user.id || conversation.type.includes('admin');
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    // Process attachments
    const attachments = files ? files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Parse product references
    let productRefs = [];
    if (productReferences) {
      try {
        productRefs = Array.isArray(productReferences) ? productReferences : JSON.parse(productReferences);
      } catch (error) {
        console.error("Error parsing product references:", error);
      }
    }

    // Create message
    const messageData: InsertMessage = {
      conversationId,
      senderId: req.user.id,
      senderType: req.user.role,
      message: message.trim(),
      attachments,
      productReferences: productRefs,
      isRead: false
    };

    const [newMessage] = await db.insert(messages).values(messageData).returning();

    // Update conversation last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Send real-time notification
    notificationService.sendChatMessage(conversationId, newMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageData: newMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// PUT /api/chat/conversations/:id/status - Update conversation status
router.put("/conversations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['active', 'archived', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Verify conversation exists and user has access
    const conversationResult = await db
      .select({
        conversation: conversations,
        buyer: buyers,
        supplier: supplierProfiles,
        admin: users
      })
      .from(conversations)
      .leftJoin(buyers, eq(conversations.buyerId, buyers.id))
      .leftJoin(supplierProfiles, eq(conversations.supplierId, supplierProfiles.id))
      .leftJoin(users, eq(conversations.adminId, users.id))
      .where(eq(conversations.id, id))
      .limit(1);

    if (conversationResult.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { conversation, buyer, supplier, admin } = conversationResult[0];

    // Check access (same logic as above)
    let hasAccess = false;

    if (req.user.role === 'buyer' && buyer) {
      const buyerProfile = await db
        .select({ id: buyers.id })
        .from(buyers)
        .where(eq(buyers.userId, req.user.id))
        .limit(1);
      
      hasAccess = buyerProfile.length > 0 && buyerProfile[0].id === buyer.id;
    } else if (req.user.role === 'supplier' && supplier) {
      const supplierProfile = await db
        .select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.userId, req.user.id))
        .limit(1);
      
      hasAccess = supplierProfile.length > 0 && supplierProfile[0].id === supplier.id;
    } else if (req.user.role === 'admin') {
      hasAccess = true; // Admins can update any conversation status
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this conversation" });
    }

    // Update conversation status
    await db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id));

    res.json({
      success: true,
      message: "Conversation status updated successfully"
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({ error: "Failed to update conversation status" });
  }
});

export default router;