#!/usr/bin/env node

/**
 * Image to Base64 Converter for Bulk Product Upload
 * 
 * This script converts image files to Base64 format for use in CSV bulk upload.
 * 
 * Usage:
 * node convert-images.js <image-directory>
 * 
 * Example:
 * node convert-images.js ./product-images
 */

const fs = require('fs');
const path = require('path');

function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting ${imagePath}:`, error.message);
    return null;
  }
}

function processDirectory(dirPath) {
  const results = {};
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory ${dirPath} does not exist`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });
  
  console.log(`Found ${imageFiles.length} image files:`);
  
  imageFiles.forEach((file, index) => {
    const fullPath = path.join(dirPath, file);
    const base64 = convertImageToBase64(fullPath);
    
    if (base64) {
      const fieldName = index === 0 ? 'mainImage' : `image${index}`;
      results[fieldName] = base64;
      console.log(`✓ ${file} -> ${fieldName}`);
    }
  });
  
  return results;
}

function generateCSVRow(productData, imageData) {
  const fields = [
    productData.name || '',
    productData.sku || '',
    productData.shortDescription || '',
    productData.description || '',
    productData.categoryId || '',
    productData.minOrderQuantity || '1',
    productData.sampleAvailable || 'false',
    productData.samplePrice || '0.00',
    productData.customizationAvailable || 'false',
    productData.customizationDetails || '',
    productData.leadTime || '',
    productData.port || '',
    productData.paymentTerms || '',
    productData.inStock || 'true',
    productData.stockQuantity || '0',
    productData.isPublished || 'true',
    productData.isFeatured || 'false',
    productData.colors || '',
    productData.sizes || '',
    productData.keyFeatures || '',
    productData.certifications || '',
    productData.tags || '',
    productData.hasTradeAssurance || 'false',
    productData.specifications || '{}',
    // Price tiers
    productData.priceTier1MinQty || '',
    productData.priceTier1MaxQty || '',
    productData.priceTier1Price || '',
    productData.priceTier2MinQty || '',
    productData.priceTier2MaxQty || '',
    productData.priceTier2Price || '',
    productData.priceTier3MinQty || '',
    productData.priceTier3MaxQty || '',
    productData.priceTier3Price || '',
    // Images
    imageData.mainImage || '',
    imageData.image1 || '',
    imageData.image2 || '',
    imageData.image3 || '',
    imageData.image4 || '',
    imageData.image5 || ''
  ];
  
  return fields.map(field => `"${field}"`).join(',');
}

function generateCSVHeader() {
  return [
    'name', 'sku', 'shortDescription', 'description', 'categoryId', 'minOrderQuantity',
    'sampleAvailable', 'samplePrice', 'customizationAvailable', 'customizationDetails',
    'leadTime', 'port', 'paymentTerms', 'inStock', 'stockQuantity', 'isPublished',
    'isFeatured', 'colors', 'sizes', 'keyFeatures', 'certifications', 'tags',
    'hasTradeAssurance', 'specifications',
    'priceTier1MinQty', 'priceTier1MaxQty', 'priceTier1Price',
    'priceTier1MinQty', 'priceTier2MaxQty', 'priceTier2Price',
    'priceTier3MinQty', 'priceTier3MaxQty', 'priceTier3Price',
    'mainImage', 'image1', 'image2', 'image3', 'image4', 'image5'
  ].join(',');
}

// Main execution
if (process.argv.length < 3) {
  console.log(`
Usage: node convert-images.js <image-directory>

This script converts images to Base64 format for CSV bulk upload.

Example:
  node convert-images.js ./product-images

The script will:
1. Find all image files in the directory
2. Convert them to Base64 format
3. Generate CSV-ready data
4. Output the results to console

Supported formats: JPG, PNG, WebP, GIF
  `);
  process.exit(1);
}

const imageDir = process.argv[2];
const imageData = processDirectory(imageDir);

if (imageData && Object.keys(imageData).length > 0) {
  console.log('\n=== CSV READY DATA ===');
  console.log('Copy this data into your CSV file:');
  console.log('');
  
  Object.entries(imageData).forEach(([field, base64]) => {
    console.log(`${field}: "${base64.substring(0, 50)}..."`);
  });
  
  console.log('\n=== SAMPLE CSV ROW ===');
  const sampleProduct = {
    name: 'Sample Product',
    sku: 'SAMPLE-001',
    shortDescription: 'Sample description',
    description: 'Full product description',
    categoryId: 'cat-sample',
    minOrderQuantity: '100',
    sampleAvailable: 'true',
    samplePrice: '5.00',
    customizationAvailable: 'true',
    customizationDetails: 'Custom options available',
    leadTime: '15-20 days',
    port: 'Shanghai Port',
    paymentTerms: 'T/T,L/C',
    inStock: 'true',
    stockQuantity: '500',
    isPublished: 'true',
    isFeatured: 'false',
    colors: 'Black,White,Blue',
    sizes: 'S,M,L',
    keyFeatures: 'Feature1,Feature2',
    certifications: 'CE,FCC',
    tags: 'electronics,sample',
    hasTradeAssurance: 'true',
    specifications: '{"Battery": "30 hours"}',
    priceTier1MinQty: '100',
    priceTier1MaxQty: '499',
    priceTier1Price: '25.00',
    priceTier2MinQty: '500',
    priceTier2MaxQty: '999',
    priceTier2Price: '22.00',
    priceTier3MinQty: '1000',
    priceTier3MaxQty: '',
    priceTier3Price: '20.00'
  };
  
  console.log(generateCSVHeader());
  console.log(generateCSVRow(sampleProduct, imageData));
} else {
  console.log('No images found or processed.');
}
