# 📦 BULK PRODUCT UPLOAD FORMAT GUIDE

## 🎯 **OVERVIEW**

This guide provides comprehensive instructions for bulk uploading products with multiple images using the enhanced CSV format and image file upload system.

## 📋 **CSV FORMAT SPECIFICATION**

### **Required Fields**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Product name (required) | "Wireless Bluetooth Earbuds" |
| `sku` | String | Unique SKU (required) | "WBE-001" |
| `categoryId` | String | Category ID (required) | "cat-electronics" |

### **Core Product Information**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `shortDescription` | String | Brief product description | "High-quality wireless earbuds with noise cancellation" |
| `description` | String | Full product description | "Premium wireless earbuds featuring..." |
| `specifications` | JSON | Technical specifications | `{"Battery Life": "30 hours", "Connectivity": "Bluetooth 5.0"}` |

### **B2B Specific Fields**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `minOrderQuantity` | Number | Minimum Order Quantity (MOQ) | 100 |
| `sampleAvailable` | Boolean | Sample available | true/false |
| `samplePrice` | Number | Sample price | 5.00 |
| `customizationAvailable` | Boolean | Customization available | true/false |
| `customizationDetails` | String | Customization details | "Custom colors and engraving available" |

### **Price Tiers (3 Tiers Supported)**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `priceTier1MinQty` | Number | Tier 1 minimum quantity | 100 |
| `priceTier1MaxQty` | Number | Tier 1 maximum quantity | 499 |
| `priceTier1Price` | Number | Tier 1 price per unit | 25.00 |
| `priceTier2MinQty` | Number | Tier 2 minimum quantity | 500 |
| `priceTier2MaxQty` | Number | Tier 2 maximum quantity | 999 |
| `priceTier2Price` | Number | Tier 2 price per unit | 22.00 |
| `priceTier3MinQty` | Number | Tier 3 minimum quantity | 1000 |
| `priceTier3MaxQty` | Number | Tier 3 maximum quantity (empty for unlimited) | "" |
| `priceTier3Price` | Number | Tier 3 price per unit | 20.00 |

### **Shipping & Delivery**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `leadTime` | String | Lead time | "15-20 days" |
| `port` | String | Shipping port | "Shanghai Port" |
| `paymentTerms` | Array | Payment terms (comma-separated) | "T/T,L/C" |

### **Stock & Status**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `inStock` | Boolean | In stock status | true/false |
| `stockQuantity` | Number | Stock quantity | 500 |
| `isPublished` | Boolean | Published status | true/false |
| `isFeatured` | Boolean | Featured status | true/false |

### **Product Variants (Arrays - Comma-separated)**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `colors` | Array | Available colors | "Black,White,Blue" |
| `sizes` | Array | Available sizes | "S,M,L" |
| `keyFeatures` | Array | Key features | "Noise Cancellation,30h Battery,Water Resistant" |
| `certifications` | Array | Certifications | "CE,FCC" |
| `tags` | Array | Product tags | "electronics,audio,wireless" |

### **Additional Fields**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `hasTradeAssurance` | Boolean | Trade assurance | true/false |
| `mainImage` | String | Main product image (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |
| `image1` | String | Additional image 1 (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |
| `image2` | String | Additional image 2 (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |
| `image3` | String | Additional image 3 (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |
| `image4` | String | Additional image 4 (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |
| `image5` | String | Additional image 5 (Base64) | "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..." |

## 📁 **IMAGE UPLOAD SYSTEM**

### **How Images Work**
- **Base64 Encoding**: Images are embedded directly in CSV as Base64 data
- **Format**: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
- **File Formats**: Supports JPG, PNG, WebP
- **Maximum**: Up to 6 images per product (mainImage + image1-5)
- **Automatic Processing**: Images are automatically saved to `/uploads/` directory

### **Image Assignment Logic**
```
CSV Example:
mainImage,image1,image2
"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."

Result: Product gets all 3 images processed and stored automatically
```

## 📝 **CSV TEMPLATE EXAMPLE**

```csv
name,sku,shortDescription,description,categoryId,minOrderQuantity,sampleAvailable,samplePrice,customizationAvailable,customizationDetails,leadTime,port,paymentTerms,inStock,stockQuantity,isPublished,isFeatured,colors,sizes,keyFeatures,certifications,tags,hasTradeAssurance,specifications,priceTier1MinQty,priceTier1MaxQty,priceTier1Price,priceTier2MinQty,priceTier2MaxQty,priceTier2Price,priceTier3MinQty,priceTier3MaxQty,priceTier3Price,mainImage,image1,image2,image3,image4,image5
"Wireless Bluetooth Earbuds","WBE-001","High-quality wireless earbuds with noise cancellation","Premium wireless earbuds featuring active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for professionals and music lovers.","cat-electronics","100","true","5.00","true","Custom colors and engraving available","15-20 days","Shanghai Port","T/T,L/C","true","500","true","false","Black,White,Blue","S,M,L","Noise Cancellation,30h Battery,Water Resistant","CE,FCC","electronics,audio,wireless","true","{\"Battery Life\": \"30 hours\", \"Connectivity\": \"Bluetooth 5.0\", \"Water Rating\": \"IPX7\"}","100","499","25.00","500","999","22.00","1000","","20.00","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",""
"Smart Watch Series 5","SWS-005","Advanced smartwatch with health monitoring","Revolutionary smartwatch with ECG, blood oxygen monitoring, and fitness tracking. Built-in GPS and cellular connectivity.","cat-electronics","50","true","10.00","true","Custom watch faces and bands","20-25 days","Ningbo Port","T/T,Western Union","true","200","true","true","Black,Silver,Gold","42mm,44mm","Health Monitoring,GPS,Cellular","FDA,CE","wearables,health,fitness","true","{\"Display\": \"Always-on Retina\", \"Water Rating\": \"50m\", \"Battery\": \"18 hours\"}","50","199","299.00","200","499","279.00","500","","259.00","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...","data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
```

## 🔧 **USAGE INSTRUCTIONS**

### **Step 1: Prepare CSV File**
1. Download the template using the "Download Template" button
2. Fill in your product data following the format guide
3. Ensure proper CSV formatting with quotes around values containing commas

### **Step 2: Prepare Images**
1. Convert images to Base64 format
2. Use online tools or scripts to convert images
3. Format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
4. Supported formats: JPG, PNG, WebP

### **Step 3: Upload**
1. Select your CSV file with embedded images
2. Click "Upload Products"
3. Monitor the progress and review results

## ⚠️ **IMPORTANT NOTES**

### **CSV Formatting Rules**
- Use comma-separated values with proper quoting
- First row must contain headers exactly as specified
- Arrays should be comma-separated within quotes
- Boolean values: use `true` or `false`
- JSON fields: Use proper JSON format with escaped quotes
- Numbers: Use decimal format (e.g., `5.00` not `5`)

### **Data Validation**
- SKU must be unique across all products
- Category ID must exist in the system
- All numeric fields are validated
- Boolean fields accept `true`/`false` or `1`/`0`
- Arrays are automatically parsed from comma-separated strings

### **Error Handling**
- Validation errors are reported with row numbers
- Partial uploads are supported (valid products are created)
- Detailed error messages help identify issues
- Images are processed even if some products fail validation

## 🚀 **ADVANCED FEATURES**

### **Bulk Operations**
- Upload up to 100 products at once
- Process up to 50 images simultaneously
- Automatic slug generation from product names
- Intelligent image distribution

### **Data Processing**
- Automatic array parsing from CSV strings
- JSON specification validation
- Boolean value normalization
- Numeric field validation and conversion

### **Performance Optimization**
- Batch database operations
- Parallel image processing
- Memory-efficient file handling
- Progress tracking and reporting

## 📊 **SUCCESS METRICS**

After successful upload, you'll see:
- Number of products created
- Number of images processed
- Any validation errors (if applicable)
- Processing time and performance metrics

## 🔍 **TROUBLESHOOTING**

### **Common Issues**
1. **CSV Parse Errors**: Check for proper quoting and comma separation
2. **Validation Errors**: Verify field types and required values
3. **Image Upload Issues**: Check file formats and sizes
4. **Category Errors**: Ensure category IDs exist in the system

### **Best Practices**
1. Test with small batches first
2. Validate CSV format before upload
3. Optimize images for web use
4. Use descriptive file names
5. Keep backup of original data

---

**Need Help?** Contact the development team for assistance with bulk upload issues or custom requirements.
