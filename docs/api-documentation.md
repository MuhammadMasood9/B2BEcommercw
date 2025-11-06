# B2B Marketplace API Documentation

## Overview

This document provides comprehensive documentation for the B2B Marketplace API endpoints. The API follows RESTful principles and supports role-based access control for Buyers, Suppliers, and Admins.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:5000/api
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "buyer|supplier|admin",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer|supplier",
  "companyName": "Company Name"
}
```

#### POST /auth/logout
Logout and invalidate the current session.

---

## Buyer API Endpoints

### Product Discovery

#### GET /api/buyer/products
Get products with advanced filtering and search capabilities.

**Query Parameters:**
- `search` (string): Search term for product name, description, or supplier
- `categoryId` (string): Filter by category ID
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `minMoq` (number): Minimum order quantity filter
- `maxMoq` (number): Maximum order quantity filter
- `supplierCountries` (string): Comma-separated list of supplier countries
- `supplierTypes` (string): Comma-separated list of supplier types
- `verifiedOnly` (boolean): Show only verified suppliers
- `tradeAssuranceOnly` (boolean): Show only products with trade assurance
- `readyToShipOnly` (boolean): Show only ready-to-ship products
- `sampleAvailableOnly` (boolean): Show only products with samples available
- `customizationAvailableOnly` (boolean): Show only customizable products
- `inStockOnly` (boolean): Show only in-stock products
- `certifications` (string): Comma-separated list of required certifications
- `paymentTerms` (string): Comma-separated list of payment terms
- `leadTimeRange` (string): Lead time range (1-7, 8-15, 16-30, 31-60, 60+)
- `minRating` (number): Minimum supplier rating
- `sort` (string): Sort by (relevance, price-low, price-high, newest, moq-low, moq-high, popularity, rating, lead-time)
- `limit` (number): Number of results per page (max 100)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "product-id",
      "name": "Product Name",
      "slug": "product-slug",
      "shortDescription": "Brief description",
      "images": ["image1.jpg", "image2.jpg"],
      "minOrderQuantity": 100,
      "priceRanges": [
        {
          "minQty": 100,
          "maxQty": 499,
          "pricePerUnit": 10.50
        }
      ],
      "sampleAvailable": true,
      "samplePrice": 5.00,
      "leadTime": "15-30 days",
      "views": 1250,
      "inquiries": 45,
      "isFeatured": false,
      "hasTradeAssurance": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "supplierBusinessName": "Supplier Company",
      "supplierStoreName": "Store Name",
      "supplierStoreSlug": "store-slug",
      "supplierStoreLogo": "logo.jpg",
      "supplierVerificationLevel": "business",
      "supplierIsVerified": true,
      "supplierRating": 4.5,
      "supplierResponseRate": 95.5,
      "supplierMembershipTier": "gold",
      "supplierCountry": "China",
      "categoryName": "Electronics"
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### GET /api/buyer/products/:id
Get detailed information about a specific product.

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "product-id",
    "name": "Product Name",
    "slug": "product-slug",
    "shortDescription": "Brief description",
    "description": "Detailed product description",
    "specifications": {
      "material": "Aluminum",
      "color": "Black",
      "weight": "2.5kg"
    },
    "images": ["image1.jpg", "image2.jpg"],
    "videos": ["video1.mp4"],
    "minOrderQuantity": 100,
    "priceRanges": [
      {
        "minQty": 100,
        "maxQty": 499,
        "pricePerUnit": 10.50
      }
    ],
    "sampleAvailable": true,
    "samplePrice": 5.00,
    "customizationAvailable": true,
    "leadTime": "15-30 days",
    "port": "Shanghai",
    "paymentTerms": ["T/T", "L/C"],
    "inStock": true,
    "stockQuantity": 5000,
    "colors": ["Black", "White", "Blue"],
    "sizes": ["S", "M", "L"],
    "keyFeatures": ["Durable", "Lightweight", "Waterproof"],
    "certifications": ["CE", "RoHS", "ISO9001"],
    "hasTradeAssurance": true,
    "supplier": {
      "id": "supplier-id",
      "businessName": "Supplier Company",
      "storeName": "Store Name",
      "storeSlug": "store-slug",
      "storeLogo": "logo.jpg",
      "verificationLevel": "business",
      "isVerified": true,
      "rating": 4.5,
      "responseRate": 95.5,
      "membershipTier": "gold",
      "country": "China"
    },
    "category": {
      "id": "category-id",
      "name": "Electronics",
      "slug": "electronics"
    }
  }
}
```

### RFQ Management

#### GET /api/buyer/rfqs
Get buyer's RFQs with filtering and pagination.

**Query Parameters:**
- `search` (string): Search in RFQ title and description
- `status` (string): Filter by status (open, closed, expired)
- `filter` (string): Filter by type (active, closed, expired, all)
- `categoryId` (string): Filter by category
- `sortBy` (string): Sort by field (createdAt, title, status, expiresAt)
- `sortOrder` (string): Sort order (asc, desc)
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "rfqs": [
    {
      "id": "rfq-id",
      "title": "RFQ Title",
      "description": "RFQ description",
      "categoryId": "category-id",
      "specifications": {
        "material": "Steel",
        "size": "Large"
      },
      "quantity": 1000,
      "targetPrice": 15.00,
      "budgetRange": {
        "min": 10000,
        "max": 20000
      },
      "deliveryLocation": "New York, USA",
      "requiredDeliveryDate": "2024-06-01T00:00:00Z",
      "paymentTerms": "T/T 30 days",
      "status": "open",
      "expiresAt": "2024-05-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "categoryName": "Industrial Equipment",
      "quotationCount": 5,
      "lastQuotationDate": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### POST /api/buyer/rfqs
Create a new RFQ.

**Request Body:**
```json
{
  "title": "RFQ for Industrial Equipment",
  "description": "Looking for high-quality industrial equipment",
  "categoryId": "category-id",
  "specifications": {
    "material": "Steel",
    "size": "Large"
  },
  "quantity": 1000,
  "targetPrice": 15.00,
  "budgetRange": {
    "min": 10000,
    "max": 20000
  },
  "deliveryLocation": "New York, USA",
  "requiredDeliveryDate": "2024-06-01",
  "paymentTerms": "T/T 30 days",
  "expiresAt": "2024-05-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFQ created successfully",
  "rfq": {
    "id": "new-rfq-id",
    "title": "RFQ for Industrial Equipment",
    "status": "open",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Inquiry Management

#### GET /api/buyer/inquiries
Get buyer's inquiries with filtering.

**Query Parameters:**
- `search` (string): Search in subject and message
- `status` (string): Filter by status (pending, responded, closed)
- `supplierId` (string): Filter by supplier
- `productId` (string): Filter by product
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "inquiries": [
    {
      "id": "inquiry-id",
      "subject": "Product Inquiry",
      "message": "I'm interested in this product",
      "quantity": 500,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z",
      "product": {
        "id": "product-id",
        "name": "Product Name",
        "images": ["image1.jpg"]
      },
      "supplier": {
        "id": "supplier-id",
        "businessName": "Supplier Company",
        "storeName": "Store Name",
        "storeLogo": "logo.jpg"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### POST /api/buyer/inquiries
Send a new inquiry to a supplier.

**Request Body:**
```json
{
  "supplierId": "supplier-id",
  "productId": "product-id",
  "subject": "Product Inquiry",
  "message": "I'm interested in this product. Can you provide more details?",
  "quantity": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inquiry sent successfully",
  "inquiry": {
    "id": "new-inquiry-id",
    "subject": "Product Inquiry",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Quotation Management

#### GET /api/buyer/quotations
Get quotations for buyer's RFQs.

**Query Parameters:**
- `rfqId` (string): Filter by RFQ ID
- `status` (string): Filter by status
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "quotations": [
    {
      "id": "quotation-id",
      "unitPrice": 12.50,
      "totalPrice": 12500.00,
      "moq": 100,
      "leadTime": "20-25 days",
      "paymentTerms": "T/T 30 days",
      "validityPeriod": 30,
      "termsConditions": "Standard terms apply",
      "attachments": ["quote.pdf"],
      "status": "sent",
      "createdAt": "2024-01-01T00:00:00Z",
      "rfq": {
        "id": "rfq-id",
        "title": "RFQ Title",
        "quantity": 1000
      },
      "supplier": {
        "id": "supplier-id",
        "businessName": "Supplier Company",
        "storeName": "Store Name",
        "storeLogo": "logo.jpg",
        "rating": 4.5,
        "isVerified": true,
        "verificationLevel": "business",
        "responseRate": 95.5
      }
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### GET /api/buyer/quotations/compare
Compare multiple quotations side by side.

**Query Parameters:**
- `quotationIds` (string): Comma-separated list of quotation IDs (2-5 IDs)

**Response:**
```json
{
  "success": true,
  "comparison": [
    {
      "id": "quotation-1",
      "unitPrice": 12.50,
      "totalPrice": 12500.00,
      "moq": 100,
      "leadTime": "20-25 days",
      "paymentTerms": "T/T 30 days",
      "supplier": {
        "businessName": "Supplier A",
        "rating": 4.5,
        "responseRate": 95.5
      }
    },
    {
      "id": "quotation-2",
      "unitPrice": 11.80,
      "totalPrice": 11800.00,
      "moq": 200,
      "leadTime": "25-30 days",
      "paymentTerms": "T/T 45 days",
      "supplier": {
        "businessName": "Supplier B",
        "rating": 4.2,
        "responseRate": 88.0
      }
    }
  ]
}
```

---

## Supplier API Endpoints

### RFQ Management

#### GET /api/supplier/rfqs
Get relevant RFQs for the supplier.

**Query Parameters:**
- `search` (string): Search in RFQ title and description
- `status` (string): Filter by status (open, quoted)
- `categoryId` (string): Filter by category
- `minQuantity` (number): Minimum quantity filter
- `maxQuantity` (number): Maximum quantity filter
- `minBudget` (number): Minimum budget filter
- `maxBudget` (number): Maximum budget filter
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "rfqs": [
    {
      "id": "rfq-id",
      "title": "RFQ Title",
      "description": "RFQ description",
      "quantity": 1000,
      "targetPrice": 15.00,
      "budgetRange": {
        "min": 10000,
        "max": 20000
      },
      "deliveryLocation": "New York, USA",
      "requiredDeliveryDate": "2024-06-01T00:00:00Z",
      "paymentTerms": "T/T 30 days",
      "status": "open",
      "expiresAt": "2024-05-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company",
        "industry": "Manufacturing",
        "businessType": "Manufacturer"
      },
      "categoryName": "Industrial Equipment",
      "quotationCount": 5,
      "hasQuoted": false
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### GET /api/supplier/rfqs/:id
Get detailed information about a specific RFQ.

**Response:**
```json
{
  "success": true,
  "rfq": {
    "id": "rfq-id",
    "title": "RFQ Title",
    "description": "Detailed RFQ description",
    "specifications": {
      "material": "Steel",
      "size": "Large"
    },
    "quantity": 1000,
    "targetPrice": 15.00,
    "budgetRange": {
      "min": 10000,
      "max": 20000
    },
    "deliveryLocation": "New York, USA",
    "requiredDeliveryDate": "2024-06-01T00:00:00Z",
    "paymentTerms": "T/T 30 days",
    "status": "open",
    "expiresAt": "2024-05-01T00:00:00Z",
    "buyer": {
      "id": "buyer-id",
      "companyName": "Buyer Company",
      "industry": "Manufacturing",
      "businessType": "Manufacturer",
      "annualVolume": 5000000.00
    },
    "categoryName": "Industrial Equipment",
    "quotationCount": 5,
    "myQuotation": null
  }
}
```

### Inquiry Management

#### GET /api/supplier/inquiries
Get inquiries received by the supplier.

**Query Parameters:**
- `search` (string): Search in subject and message
- `status` (string): Filter by status
- `productId` (string): Filter by product
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "inquiries": [
    {
      "id": "inquiry-id",
      "subject": "Product Inquiry",
      "message": "I'm interested in this product",
      "quantity": 500,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z",
      "product": {
        "id": "product-id",
        "name": "Product Name",
        "images": ["image1.jpg"]
      },
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company",
        "industry": "Manufacturing",
        "businessType": "Retailer"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### PUT /api/supplier/inquiries/:id/respond
Respond to a buyer inquiry.

**Request Body:**
```json
{
  "response": "Thank you for your inquiry. We can provide this product with the following specifications..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inquiry response sent successfully"
}
```

### Quotation Management

#### GET /api/supplier/quotations
Get supplier's quotations.

**Query Parameters:**
- `search` (string): Search in RFQ title and description
- `status` (string): Filter by status
- `rfqId` (string): Filter by RFQ
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "quotations": [
    {
      "id": "quotation-id",
      "unitPrice": 12.50,
      "totalPrice": 12500.00,
      "moq": 100,
      "leadTime": "20-25 days",
      "paymentTerms": "T/T 30 days",
      "validityPeriod": 30,
      "status": "sent",
      "createdAt": "2024-01-01T00:00:00Z",
      "rfq": {
        "id": "rfq-id",
        "title": "RFQ Title",
        "quantity": 1000,
        "status": "open"
      },
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company",
        "industry": "Manufacturing"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### POST /api/supplier/quotations
Create a quotation for an RFQ.

**Request Body:**
```json
{
  "rfqId": "rfq-id",
  "unitPrice": 12.50,
  "moq": 100,
  "leadTime": "20-25 days",
  "paymentTerms": "T/T 30 days",
  "validityPeriod": 30,
  "termsConditions": "Standard terms and conditions apply",
  "attachments": ["quote.pdf", "specifications.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quotation submitted successfully",
  "quotation": {
    "id": "new-quotation-id",
    "unitPrice": 12.50,
    "totalPrice": 12500.00,
    "status": "sent",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/supplier/quotations/:id
Update an existing quotation.

**Request Body:**
```json
{
  "unitPrice": 11.80,
  "moq": 150,
  "leadTime": "18-22 days",
  "paymentTerms": "T/T 45 days",
  "validityPeriod": 45,
  "termsConditions": "Updated terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quotation updated successfully"
}
```

### Order Management

#### GET /api/supplier/orders
Get supplier's orders.

**Query Parameters:**
- `search` (string): Search in order number and RFQ title
- `status` (string): Filter by order status
- `paymentStatus` (string): Filter by payment status
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-id",
      "orderNumber": "ORD-2024-001",
      "totalAmount": 15000.00,
      "status": "confirmed",
      "paymentStatus": "paid",
      "createdAt": "2024-01-01T00:00:00Z",
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company",
        "industry": "Manufacturing"
      },
      "rfq": {
        "id": "rfq-id",
        "title": "RFQ Title"
      }
    }
  ],
  "pagination": {
    "total": 30,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### PUT /api/supplier/orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "processing",
  "notes": "Order is being processed and will ship soon"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

---

## Admin API Endpoints

### Dispute Management

#### GET /api/admin/disputes
Get all disputes for admin management.

**Query Parameters:**
- `search` (string): Search in dispute description, order number, company names
- `status` (string): Filter by dispute status
- `disputeType` (string): Filter by dispute type
- `priority` (string): Filter by priority
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "disputes": [
    {
      "id": "dispute-id",
      "disputeType": "quality",
      "description": "Product quality issues",
      "status": "open",
      "createdAt": "2024-01-01T00:00:00Z",
      "order": {
        "id": "order-id",
        "orderNumber": "ORD-2024-001",
        "totalAmount": 15000.00
      },
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company"
      },
      "supplier": {
        "id": "supplier-id",
        "businessName": "Supplier Company",
        "storeName": "Store Name"
      },
      "admin": null
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

#### GET /api/admin/disputes/:id
Get detailed information about a specific dispute.

**Response:**
```json
{
  "success": true,
  "dispute": {
    "id": "dispute-id",
    "disputeType": "quality",
    "description": "Detailed dispute description",
    "buyerEvidence": [
      {
        "filename": "evidence1.jpg",
        "originalName": "product_issue.jpg",
        "uploadedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "supplierEvidence": [],
    "adminNotes": null,
    "status": "open",
    "resolution": null,
    "refundAmount": null,
    "resolvedAt": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "order": {
      "id": "order-id",
      "orderNumber": "ORD-2024-001",
      "totalAmount": 15000.00,
      "items": [
        {
          "productName": "Product Name",
          "quantity": 100,
          "unitPrice": 150.00
        }
      ]
    },
    "buyer": {
      "id": "buyer-id",
      "companyName": "Buyer Company",
      "industry": "Manufacturing",
      "businessType": "Retailer"
    },
    "supplier": {
      "id": "supplier-id",
      "businessName": "Supplier Company",
      "storeName": "Store Name",
      "contactPerson": "John Smith",
      "phone": "+1234567890",
      "email": "supplier@example.com"
    },
    "admin": null
  }
}
```

#### PUT /api/admin/disputes/:id/assign
Assign dispute to current admin.

**Response:**
```json
{
  "success": true,
  "message": "Dispute assigned successfully"
}
```

#### PUT /api/admin/disputes/:id/resolve
Resolve a dispute.

**Request Body:**
```json
{
  "resolution": "After reviewing the evidence, we found that the product quality issue is valid. A partial refund will be processed.",
  "refundAmount": 5000.00,
  "adminNotes": "Buyer provided clear evidence of quality issues. Supplier agreed to partial refund."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute resolved successfully"
}
```

#### POST /api/admin/disputes/:id/evidence
Upload evidence for a dispute (admin).

**Request Body:** (multipart/form-data)
- `evidence` (files): Evidence files (max 5 files)
- `notes` (string): Admin notes about the evidence

**Response:**
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "evidence": [
    {
      "filename": "evidence_admin_001.jpg",
      "originalName": "investigation_photo.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg",
      "uploadedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Chat API Endpoints

### Conversation Management

#### GET /api/chat/conversations
Get user's conversations.

**Query Parameters:**
- `type` (string): Filter by conversation type (buyer_supplier, buyer_admin, supplier_admin)
- `status` (string): Filter by status (active, archived, closed)
- `search` (string): Search in subject and participant names
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conversation-id",
      "type": "buyer_supplier",
      "subject": "Product Inquiry Discussion",
      "status": "active",
      "lastMessageAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company",
        "industry": "Manufacturing"
      },
      "supplier": {
        "id": "supplier-id",
        "businessName": "Supplier Company",
        "storeName": "Store Name",
        "storeLogo": "logo.jpg"
      },
      "admin": null,
      "unreadCount": 2,
      "lastMessage": {
        "id": "message-id",
        "message": "Thank you for the information",
        "senderType": "buyer",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### POST /api/chat/conversations
Create a new conversation.

**Request Body:**
```json
{
  "type": "buyer_supplier",
  "supplierId": "supplier-id",
  "subject": "Product Inquiry Discussion",
  "initialMessage": "Hello, I'm interested in your products and would like to discuss pricing and specifications."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "conversation": {
    "id": "new-conversation-id",
    "type": "buyer_supplier",
    "subject": "Product Inquiry Discussion",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "initialMessage": {
    "id": "message-id",
    "message": "Hello, I'm interested in your products...",
    "senderType": "buyer",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/chat/conversations/:id
Get detailed information about a specific conversation.

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conversation-id",
    "type": "buyer_supplier",
    "subject": "Product Inquiry Discussion",
    "status": "active",
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "buyer": {
      "id": "buyer-id",
      "companyName": "Buyer Company",
      "industry": "Manufacturing"
    },
    "supplier": {
      "id": "supplier-id",
      "businessName": "Supplier Company",
      "storeName": "Store Name",
      "storeLogo": "logo.jpg"
    },
    "admin": null
  }
}
```

### Message Management

#### GET /api/chat/messages
Get messages for a conversation.

**Query Parameters:**
- `conversationId` (string, required): Conversation ID
- `search` (string): Search in message content
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order (asc, desc)
- `limit` (number): Results per page (max 100)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message-id",
      "message": "Hello, I'm interested in your products",
      "senderType": "buyer",
      "attachments": [],
      "productReferences": [],
      "isRead": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "sender": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "referencedProducts": []
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### POST /api/chat/messages
Send a new message.

**Request Body:** (multipart/form-data)
- `conversationId` (string, required): Conversation ID
- `message` (string, required): Message content
- `productReferences` (string): JSON array of product IDs
- `attachments` (files): File attachments (max 5 files)

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageData": {
    "id": "new-message-id",
    "message": "Thank you for your inquiry",
    "senderType": "supplier",
    "attachments": [
      {
        "filename": "catalog.pdf",
        "originalName": "product_catalog.pdf",
        "size": 2048000,
        "mimetype": "application/pdf"
      }
    ],
    "productReferences": ["product-id-1", "product-id-2"],
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/chat/conversations/:id/status
Update conversation status.

**Request Body:**
```json
{
  "status": "archived"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation status updated successfully"
}
```

---

## Dispute API Endpoints (Buyer/Supplier)

#### POST /api/disputes
Create a new dispute.

**Request Body:**
```json
{
  "orderId": "order-id",
  "disputeType": "quality",
  "description": "The product received does not match the specifications agreed upon. The material quality is substandard.",
  "evidence": [
    {
      "filename": "evidence1.jpg",
      "description": "Photo showing quality issues"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "dispute": {
    "id": "new-dispute-id",
    "disputeType": "quality",
    "status": "open",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/disputes/my
Get user's disputes (buyer or supplier).

**Query Parameters:**
- `status` (string): Filter by status
- `disputeType` (string): Filter by dispute type
- `sortBy` (string): Sort by field
- `sortOrder` (string): Sort order
- `limit` (number): Results per page
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "disputes": [
    {
      "id": "dispute-id",
      "disputeType": "quality",
      "description": "Product quality issues",
      "buyerEvidence": [
        {
          "filename": "evidence1.jpg",
          "uploadedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "supplierEvidence": [],
      "status": "open",
      "createdAt": "2024-01-01T00:00:00Z",
      "order": {
        "id": "order-id",
        "orderNumber": "ORD-2024-001",
        "totalAmount": 15000.00
      },
      "buyer": {
        "id": "buyer-id",
        "companyName": "Buyer Company"
      },
      "supplier": {
        "id": "supplier-id",
        "businessName": "Supplier Company",
        "storeName": "Store Name"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": false
  }
}
```

#### POST /api/disputes/:id/evidence
Upload evidence for a dispute.

**Request Body:** (multipart/form-data)
- `evidence` (files): Evidence files (max 5 files)
- `notes` (string): Notes about the evidence

**Response:**
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "evidence": [
    {
      "filename": "evidence_001.jpg",
      "originalName": "quality_issue.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg",
      "notes": "Photo showing the quality defect",
      "uploadedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Categories

1. **Authentication Errors**
   - `INVALID_CREDENTIALS`: Invalid email/password
   - `TOKEN_EXPIRED`: JWT token expired
   - `TOKEN_INVALID`: Invalid JWT token

2. **Authorization Errors**
   - `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
   - `ROLE_RESTRICTION`: Action not allowed for user role
   - `RESOURCE_ACCESS_DENIED`: Cannot access specific resource

3. **Validation Errors**
   - `MISSING_REQUIRED_FIELDS`: Required fields not provided
   - `INVALID_FORMAT`: Data format validation failed
   - `VALUE_OUT_OF_RANGE`: Numeric values outside allowed range

4. **Business Logic Errors**
   - `RFQ_EXPIRED`: RFQ has expired
   - `INSUFFICIENT_INVENTORY`: Not enough stock available
   - `DUPLICATE_QUOTATION`: Quotation already exists for RFQ
   - `MINIMUM_ORDER_NOT_MET`: Order quantity below MOQ

5. **System Errors**
   - `DATABASE_ERROR`: Database operation failed
   - `EXTERNAL_SERVICE_ERROR`: Third-party service unavailable
   - `FILE_UPLOAD_ERROR`: File upload failed

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute per user
- **Search endpoints**: 60 requests per minute per user
- **File upload endpoints**: 20 requests per minute per user
- **Authentication endpoints**: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

All list endpoints support pagination with consistent parameters:

- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

Pagination information is included in responses:
```json
{
  "pagination": {
    "total": 1500,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "hasMore": true
  }
}
```

---

## File Uploads

File upload endpoints accept multipart/form-data with the following constraints:

- **Maximum file size**: 10MB per file
- **Maximum files per request**: 5 files
- **Allowed file types**: 
  - Images: jpg, jpeg, png, gif, webp
  - Documents: pdf, doc, docx, xls, xlsx
  - Archives: zip, rar

File information is returned in responses:
```json
{
  "filename": "uploaded_file_001.jpg",
  "originalName": "product_image.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

---

## WebSocket Events (Real-time Features)

The API supports real-time features through WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('wss://your-domain.com/ws');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'your-jwt-token'
}));
```

### Events

#### Chat Messages
```json
{
  "type": "chat_message",
  "data": {
    "conversationId": "conversation-id",
    "message": {
      "id": "message-id",
      "message": "New message content",
      "senderType": "buyer",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### RFQ Notifications
```json
{
  "type": "rfq_notification",
  "data": {
    "rfqId": "rfq-id",
    "action": "new_quotation",
    "message": "You received a new quotation for your RFQ"
  }
}
```

#### Order Updates
```json
{
  "type": "order_update",
  "data": {
    "orderId": "order-id",
    "status": "shipped",
    "message": "Your order has been shipped"
  }
}
```

---

## API Versioning

The API uses URL versioning:
- Current version: `v1` (default)
- Future versions: `v2`, `v3`, etc.

Example:
```
/api/v1/buyer/products
/api/v2/buyer/products
```

When no version is specified, the latest stable version is used.

---

## SDK and Code Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class B2BMarketplaceAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getProducts(filters = {}) {
    const response = await this.client.get('/buyer/products', {
      params: filters
    });
    return response.data;
  }

  async createRFQ(rfqData) {
    const response = await this.client.post('/buyer/rfqs', rfqData);
    return response.data;
  }

  async sendMessage(conversationId, message, attachments = []) {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('message', message);
    
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await this.client.post('/chat/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

// Usage
const api = new B2BMarketplaceAPI('https://api.example.com/api', 'your-jwt-token');

// Get products with filters
const products = await api.getProducts({
  search: 'electronics',
  minPrice: 10,
  maxPrice: 100,
  verifiedOnly: true
});

// Create an RFQ
const rfq = await api.createRFQ({
  title: 'Looking for Electronics Components',
  description: 'Need high-quality components for manufacturing',
  quantity: 1000,
  targetPrice: 15.00
});
```

### Python Example

```python
import requests
from typing import Dict, List, Optional

class B2BMarketplaceAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_products(self, filters: Dict = None) -> Dict:
        response = requests.get(
            f'{self.base_url}/buyer/products',
            headers=self.headers,
            params=filters or {}
        )
        response.raise_for_status()
        return response.json()
    
    def create_rfq(self, rfq_data: Dict) -> Dict:
        response = requests.post(
            f'{self.base_url}/buyer/rfqs',
            headers=self.headers,
            json=rfq_data
        )
        response.raise_for_status()
        return response.json()
    
    def get_quotations(self, rfq_id: Optional[str] = None) -> Dict:
        params = {'rfqId': rfq_id} if rfq_id else {}
        response = requests.get(
            f'{self.base_url}/buyer/quotations',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
api = B2BMarketplaceAPI('https://api.example.com/api', 'your-jwt-token')

# Get products
products = api.get_products({
    'search': 'electronics',
    'minPrice': 10,
    'maxPrice': 100,
    'verifiedOnly': True
})

# Create RFQ
rfq = api.create_rfq({
    'title': 'Looking for Electronics Components',
    'description': 'Need high-quality components',
    'quantity': 1000,
    'targetPrice': 15.00
})
```

---

This comprehensive API documentation covers all the major endpoints and functionality of the B2B Marketplace system. For additional support or questions, please contact the development team.