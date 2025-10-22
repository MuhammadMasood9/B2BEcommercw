#!/usr/bin/env node

/**
 * Excel Template Generator for Bulk Product Upload
 * 
 * This script generates an Excel template file for bulk product uploads.
 * 
 * Usage:
 * node generate-excel-template.js
 * 
 * Output: product-template.xlsx
 */

import XLSX from 'xlsx';

function generateExcelTemplate() {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Sample product data
  const sampleProducts = [
    {
      name: "Wireless Bluetooth Earbuds",
      sku: "WBE-001",
      shortDescription: "High-quality wireless earbuds with noise cancellation",
      description: "Premium wireless earbuds featuring active noise cancellation, 30-hour battery life, and crystal-clear sound quality.",
      categoryId: "cat-electronics",
      minOrderQuantity: 100,
      sampleAvailable: true,
      samplePrice: 5.00,
      customizationAvailable: true,
      customizationDetails: "Custom colors and engraving available",
      leadTime: "15-20 days",
      port: "Shanghai Port",
      paymentTerms: "T/T,L/C",
      inStock: true,
      stockQuantity: 500,
      isPublished: true,
      isFeatured: false,
      colors: "Black,White,Blue",
      sizes: "S,M,L",
      keyFeatures: "Noise Cancellation,30h Battery,Water Resistant",
      certifications: "CE,FCC",
      tags: "electronics,audio,wireless",
      hasTradeAssurance: true,
      specifications: '{"Battery Life": "30 hours", "Connectivity": "Bluetooth 5.0"}',
      // Price tiers as separate columns
      priceTier1MinQty: 100,
      priceTier1MaxQty: 499,
      priceTier1Price: 25.00,
      priceTier2MinQty: 500,
      priceTier2MaxQty: 999,
      priceTier2Price: 22.00,
      priceTier3MinQty: 1000,
      priceTier3MaxQty: "",
      priceTier3Price: 20.00,
      // Image filenames (with text prefix to prevent Google Sheets from treating as images)
      mainImage: "FILE: earbuds-main.jpg",
      image1: "FILE: earbuds-detail1.jpg",
      image2: "FILE: earbuds-detail2.jpg",
      image3: "FILE: earbuds-packaging.jpg",
      image4: "FILE: earbuds-color-variants.jpg",
      image5: ""
    },
    {
      name: "Smart Watch Series 5",
      sku: "SWS-005",
      shortDescription: "Advanced smartwatch with health monitoring",
      description: "Revolutionary smartwatch with ECG, blood oxygen monitoring, and fitness tracking.",
      categoryId: "cat-electronics",
      minOrderQuantity: 50,
      sampleAvailable: true,
      samplePrice: 10.00,
      customizationAvailable: true,
      customizationDetails: "Custom watch faces and bands",
      leadTime: "20-25 days",
      port: "Ningbo Port",
      paymentTerms: "T/T,Western Union",
      inStock: true,
      stockQuantity: 200,
      isPublished: true,
      isFeatured: true,
      colors: "Black,Silver,Gold",
      sizes: "42mm,44mm",
      keyFeatures: "Health Monitoring,GPS,Cellular",
      certifications: "FDA,CE",
      tags: "wearables,health,fitness",
      hasTradeAssurance: true,
      specifications: '{"Display": "Always-on Retina", "Water Rating": "50m"}',
      // Price tiers
      priceTier1MinQty: 50,
      priceTier1MaxQty: 199,
      priceTier1Price: 299.00,
      priceTier2MinQty: 200,
      priceTier2MaxQty: 499,
      priceTier2Price: 279.00,
      priceTier3MinQty: 500,
      priceTier3MaxQty: "",
      priceTier3Price: 259.00,
      // Image filenames (with text prefix to prevent Google Sheets from treating as images)
      mainImage: "FILE: watch-main.jpg",
      image1: "FILE: watch-screen.jpg",
      image2: "FILE: watch-health-features.jpg",
      image3: "FILE: watch-band-options.jpg",
      image4: "FILE: watch-sport-mode.jpg",
      image5: "FILE: watch-charging.jpg"
    }
  ];
  
  // Create worksheet from sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleProducts);
  
  // Force image columns to be text format
  const imageColumns = ['mainImage', 'image1', 'image2', 'image3', 'image4', 'image5'];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  imageColumns.forEach(colName => {
    const colIndex = sampleProducts[0] ? Object.keys(sampleProducts[0]).indexOf(colName) : -1;
    if (colIndex >= 0) {
      const colLetter = XLSX.utils.encode_col(colIndex);
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = colLetter + (row + 1);
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].t = 's'; // Force string type
          worksheet[cellAddress].v = worksheet[cellAddress].v.toString(); // Ensure string value
        }
      }
    }
  });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Create a format guide sheet
  const formatGuide = [
    { Field: "name", Type: "String", Required: "Yes", Description: "Product name", Example: "Wireless Bluetooth Earbuds" },
    { Field: "sku", Type: "String", Required: "Yes", Description: "Product SKU", Example: "WBE-001" },
    { Field: "shortDescription", Type: "String", Required: "No", Description: "Brief product description", Example: "High-quality wireless earbuds" },
    { Field: "description", Type: "String", Required: "No", Description: "Full product description", Example: "Premium wireless earbuds featuring..." },
    { Field: "categoryId", Type: "String", Required: "Yes", Description: "Category ID", Example: "cat-electronics" },
    { Field: "minOrderQuantity", Type: "Number", Required: "Yes", Description: "Minimum Order Quantity", Example: "100" },
    { Field: "sampleAvailable", Type: "Boolean", Required: "No", Description: "Sample available", Example: "true" },
    { Field: "samplePrice", Type: "Number", Required: "No", Description: "Sample price", Example: "5.00" },
    { Field: "customizationAvailable", Type: "Boolean", Required: "No", Description: "Customization available", Example: "true" },
    { Field: "customizationDetails", Type: "String", Required: "No", Description: "Customization details", Example: "Custom colors available" },
    { Field: "leadTime", Type: "String", Required: "No", Description: "Lead time", Example: "15-20 days" },
    { Field: "port", Type: "String", Required: "No", Description: "Port", Example: "Shanghai Port" },
    { Field: "paymentTerms", Type: "String", Required: "No", Description: "Payment terms (comma-separated)", Example: "T/T,L/C" },
    { Field: "inStock", Type: "Boolean", Required: "No", Description: "In stock", Example: "true" },
    { Field: "stockQuantity", Type: "Number", Required: "No", Description: "Stock quantity", Example: "500" },
    { Field: "isPublished", Type: "Boolean", Required: "No", Description: "Is published", Example: "true" },
    { Field: "isFeatured", Type: "Boolean", Required: "No", Description: "Is featured", Example: "false" },
    { Field: "colors", Type: "String", Required: "No", Description: "Colors (comma-separated)", Example: "Black,White,Blue" },
    { Field: "sizes", Type: "String", Required: "No", Description: "Sizes (comma-separated)", Example: "S,M,L" },
    { Field: "keyFeatures", Type: "String", Required: "No", Description: "Key features (comma-separated)", Example: "Noise Cancellation,30h Battery" },
    { Field: "certifications", Type: "String", Required: "No", Description: "Certifications (comma-separated)", Example: "CE,FCC" },
    { Field: "tags", Type: "String", Required: "No", Description: "Tags (comma-separated)", Example: "electronics,audio" },
    { Field: "hasTradeAssurance", Type: "Boolean", Required: "No", Description: "Has trade assurance", Example: "true" },
    { Field: "specifications", Type: "JSON", Required: "No", Description: "Technical specifications (JSON)", Example: '{"Battery": "30 hours"}' },
    { Field: "priceTier1MinQty", Type: "Number", Required: "No", Description: "Price tier 1 minimum quantity", Example: "100" },
    { Field: "priceTier1MaxQty", Type: "Number", Required: "No", Description: "Price tier 1 maximum quantity", Example: "499" },
    { Field: "priceTier1Price", Type: "Number", Required: "No", Description: "Price tier 1 price per unit", Example: "25.00" },
    { Field: "priceTier2MinQty", Type: "Number", Required: "No", Description: "Price tier 2 minimum quantity", Example: "500" },
    { Field: "priceTier2MaxQty", Type: "Number", Required: "No", Description: "Price tier 2 maximum quantity", Example: "999" },
    { Field: "priceTier2Price", Type: "Number", Required: "No", Description: "Price tier 2 price per unit", Example: "22.00" },
    { Field: "priceTier3MinQty", Type: "Number", Required: "No", Description: "Price tier 3 minimum quantity", Example: "1000" },
    { Field: "priceTier3MaxQty", Type: "Number", Required: "No", Description: "Price tier 3 maximum quantity (empty for unlimited)", Example: "" },
    { Field: "priceTier3Price", Type: "Number", Required: "No", Description: "Price tier 3 price per unit", Example: "20.00" },
    { Field: "mainImage", Type: "String", Required: "No", Description: "Main image filename", Example: "product-main.jpg" },
    { Field: "image1", Type: "String", Required: "No", Description: "Additional image 1 filename", Example: "product-detail1.jpg" },
    { Field: "image2", Type: "String", Required: "No", Description: "Additional image 2 filename", Example: "product-detail2.jpg" },
    { Field: "image3", Type: "String", Required: "No", Description: "Additional image 3 filename", Example: "product-packaging.jpg" },
    { Field: "image4", Type: "String", Required: "No", Description: "Additional image 4 filename", Example: "product-variants.jpg" },
    { Field: "image5", Type: "String", Required: "No", Description: "Additional image 5 filename", Example: "product-features.jpg" }
  ];
  
  const formatWorksheet = XLSX.utils.json_to_sheet(formatGuide);
  XLSX.utils.book_append_sheet(workbook, formatWorksheet, 'Format Guide');
  
  // Write the file
  XLSX.writeFile(workbook, 'product-template.xlsx');
  
  console.log('✅ Excel template generated successfully!');
  console.log('📁 File: product-template.xlsx');
  console.log('');
  console.log('📋 Template includes:');
  console.log('   • Sample products with all fields');
  console.log('   • Format guide with field descriptions');
  console.log('   • Price tiers configuration');
  console.log('   • Image filename references');
  console.log('');
  console.log('🚀 Usage:');
  console.log('   1. Open product-template.xlsx');
  console.log('   2. Edit the Products sheet with your data');
  console.log('   3. Prepare image files with matching filenames');
  console.log('   4. Upload Excel file and images via the web interface');
}

// Run the generator
try {
  generateExcelTemplate();
} catch (error) {
  console.error('❌ Error generating Excel template:', error.message);
  console.log('');
  console.log('💡 Make sure you have the xlsx package installed:');
  console.log('   npm install xlsx');
  process.exit(1);
}
