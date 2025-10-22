# 📦 **EXCEL/JSON BULK UPLOAD GUIDE**

## 🎯 **OVERVIEW**

This guide covers the **Excel/JSON bulk upload system** for adding multiple products with **actual image files** (not Base64). The system supports both Excel file import and manual product creation with drag-and-drop image uploads.

## 📋 **SUPPORTED METHODS**

### **1. Excel/JSON Upload (Recommended)**
- **Excel File Import**: Upload `.xlsx` or `.xls` files
- **JSON Template**: Use downloadable JSON template
- **Actual Image Files**: Upload separate image files, matched by filename
- **Visual Interface**: Edit products before uploading

### **2. Manual Entry**
- **Individual Products**: Add products one by one
- **Full Control**: Complete field editing
- **Image Upload**: Drag-and-drop image interface

### **3. CSV Upload (Legacy)**
- **Base64 Images**: Images embedded in CSV
- **Limited**: Less user-friendly than Excel/JSON method

## 📊 **EXCEL/JSON FORMAT**

### **Required Fields**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Product name | "Wireless Bluetooth Earbuds" |
| `sku` | String | Product SKU | "WBE-001" |
| `categoryId` | String | Category ID | "cat-electronics" |
| `minOrderQuantity` | Number | Minimum Order Quantity | 100 |

### **B2B Specific Fields**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sampleAvailable` | Boolean | Sample available | true/false |
| `samplePrice` | Number | Sample price | 5.00 |
| `customizationAvailable` | Boolean | Customization available | true/false |
| `customizationDetails` | String | Customization details | "Custom colors and engraving available" |

### **Price Tiers (Array Format)**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `priceTiers` | Array | Price tier objects | `[{minQty: 100, maxQty: 499, pricePerUnit: 25.00}]` |

**Price Tier Object:**
```json
{
  "minQty": 100,
  "maxQty": 499,
  "pricePerUnit": 25.00
}
```

### **Image Fields (Filename References)**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `mainImage` | String | Main image filename | "FILE: product-main.jpg" |
| `image1` | String | Additional image 1 | "FILE: product-detail1.jpg" |
| `image2` | String | Additional image 2 | "FILE: product-detail2.jpg" |
| `image3` | String | Additional image 3 | "FILE: product-packaging.jpg" |
| `image4` | String | Additional image 4 | "FILE: product-variants.jpg" |
| `image5` | String | Additional image 5 | "FILE: product-features.jpg" |

**Note:** Use "FILE:" prefix to prevent Google Sheets from treating filenames as image URLs.

### **Product Variants (Array Format)**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `colors` | Array | Available colors | `["Black", "White", "Blue"]` |
| `sizes` | Array | Available sizes | `["S", "M", "L"]` |
| `keyFeatures` | Array | Key features | `["Noise Cancellation", "30h Battery"]` |
| `certifications` | Array | Certifications | `["CE", "FCC"]` |
| `tags` | Array | Product tags | `["electronics", "audio", "wireless"]` |

## 📁 **IMAGE UPLOAD SYSTEM**

### **How Images Work**
- **Excel/JSON Image Fields**: Include image filenames in Excel/JSON fields
- **File Upload**: Upload corresponding image files separately
- **Filename Matching**: Images are matched to products by filename
- **File Formats**: Supports JPG, PNG, WebP
- **Maximum**: Up to 6 images per product (mainImage + image1-5)
- **Path**: Images are stored in `/uploads/` directory

### **Image Assignment Logic**
```
Excel/JSON Example:
mainImage: "FILE: product-main.jpg"
image1: "FILE: product-detail1.jpg"
image2: "FILE: product-detail2.jpg"

Upload Files:
- product-main.jpg
- product-detail1.jpg  
- product-detail2.jpg

Result: Product gets all 3 images assigned correctly
```

## 📝 **JSON TEMPLATE EXAMPLE**

```json
{
  "name": "Wireless Bluetooth Earbuds",
  "sku": "WBE-001",
  "shortDescription": "High-quality wireless earbuds with noise cancellation",
  "description": "Premium wireless earbuds featuring active noise cancellation, 30-hour battery life, and crystal-clear sound quality.",
  "categoryId": "cat-electronics",
  "minOrderQuantity": 100,
  "sampleAvailable": true,
  "samplePrice": 5.00,
  "customizationAvailable": true,
  "customizationDetails": "Custom colors and engraving available",
  "leadTime": "15-20 days",
  "port": "Shanghai Port",
  "paymentTerms": ["T/T", "L/C"],
  "inStock": true,
  "stockQuantity": 500,
  "isPublished": true,
  "isFeatured": false,
  "colors": ["Black", "White", "Blue"],
  "sizes": ["S", "M", "L"],
  "keyFeatures": ["Noise Cancellation", "30h Battery", "Water Resistant"],
  "certifications": ["CE", "FCC"],
  "tags": ["electronics", "audio", "wireless"],
  "hasTradeAssurance": true,
  "specifications": {
    "Battery Life": "30 hours",
    "Connectivity": "Bluetooth 5.0",
    "Water Rating": "IPX7"
  },
  "priceTiers": [
    {
      "minQty": 100,
      "maxQty": 499,
      "pricePerUnit": 25.00
    },
    {
      "minQty": 500,
      "maxQty": 999,
      "pricePerUnit": 22.00
    },
    {
      "minQty": 1000,
      "maxQty": null,
      "pricePerUnit": 20.00
    }
  ],
  "mainImage": "FILE: earbuds-main.jpg",
  "image1": "FILE: earbuds-detail1.jpg",
  "image2": "FILE: earbuds-detail2.jpg",
  "image3": "FILE: earbuds-packaging.jpg",
  "image4": "FILE: earbuds-color-variants.jpg",
  "image5": ""
}
```

## 🔧 **USAGE INSTRUCTIONS**

### **Method 1: Excel/JSON Upload**

**Step 1: Prepare Excel/JSON File**
1. Download the JSON template using the "Download JSON Template" button
2. Fill in your product data following the format guide
3. Ensure proper JSON formatting

**Step 2: Prepare Images**
1. Collect all product images
2. Name them exactly as specified in Excel/JSON image fields
3. Ensure images are optimized (recommended: under 2MB each)
4. Supported formats: JPG, PNG, WebP

**Step 3: Upload**
1. Select your Excel/JSON file
2. Select your image files
3. Click "Upload Products"

### **Method 2: Manual Entry**

**Step 1: Add Products**
1. Click "Add Product" button
2. Fill in product details in the visual interface
3. Upload images using drag-and-drop

**Step 2: Configure Pricing**
1. Add price tiers using the interface
2. Set minimum and maximum quantities
3. Set prices per unit

**Step 3: Upload**
1. Review all products
2. Click "Upload Products"

## ⚠️ **IMPORTANT NOTES**

### **Excel/JSON Formatting Rules**
- Use proper JSON format for Excel/JSON files
- Arrays should be proper JSON arrays: `["item1", "item2"]`
- Boolean values: `true`/`false`
- Numbers: Use actual numbers, not strings
- Objects: Use proper JSON object format

### **Images**
- Include image filenames in Excel/JSON fields: mainImage, image1, image2, etc.
- Upload corresponding image files separately
- Supported formats: JPG, PNG, WebP
- Images are matched by filename to Excel/JSON entries
- Maximum 6 images per product (mainImage + image1-5)
- Images are automatically optimized and stored

### **Price Tiers**
- Use array format: `[{minQty: 100, maxQty: 499, pricePerUnit: 25.00}]`
- Set `maxQty` to `null` for unlimited quantity
- At least one price tier is required

### **Arrays**
- Colors: `["Black", "White", "Blue"]`
- Sizes: `["S", "M", "L"]`
- Key Features: `["Feature 1", "Feature 2"]`
- Certifications: `["CE", "FCC"]`
- Tags: `["electronics", "audio"]`
- Payment Terms: `["T/T", "L/C"]`

## 🚀 **BENEFITS OF EXCEL/JSON METHOD**

- **Actual Image Files**: No Base64 encoding needed
- **Visual Interface**: Edit products before uploading
- **Flexible Format**: Support for both Excel and JSON
- **Better Performance**: Faster processing than CSV
- **User Friendly**: Drag-and-drop image uploads
- **Error Prevention**: Visual validation before upload
- **Batch Editing**: Edit multiple products at once

## 🔄 **MIGRATION FROM CSV**

If you're currently using CSV upload:

1. **Download JSON Template**: Use the new template format
2. **Convert Data**: Transform CSV data to JSON format
3. **Prepare Images**: Separate image files from CSV
4. **Upload**: Use the new Excel/JSON interface

The system maintains backward compatibility with CSV upload for legacy users.
