#!/usr/bin/env node

/**
 * Sample Image Creator for Testing Bulk Upload
 * 
 * This script creates sample image files for testing the bulk upload system.
 * 
 * Usage:
 * node create-sample-images.js
 */

import fs from 'fs';
import path from 'path';

function createSampleImages() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Sample image filenames from the Excel template
  const imageFiles = [
    'earbuds-main.jpg',
    'earbuds-detail1.jpg',
    'earbuds-detail2.jpg',
    'earbuds-packaging.jpg',
    'earbuds-color-variants.jpg',
    'watch-main.jpg',
    'watch-screen.jpg',
    'watch-health-features.jpg',
    'watch-band-options.jpg',
    'watch-sport-mode.jpg',
    'watch-charging.jpg'
  ];
  
  console.log('🖼️ Creating sample image files...');
  
  imageFiles.forEach((filename, index) => {
    const filePath = path.join(uploadsDir, filename);
    
    // Create a simple placeholder image (1x1 pixel PNG)
    const placeholderImage = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // checksum
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82  // checksum
    ]);
    
    fs.writeFileSync(filePath, placeholderImage);
    console.log(`✅ Created: ${filename}`);
  });
  
  console.log('');
  console.log('🎉 Sample images created successfully!');
  console.log(`📁 Location: ${uploadsDir}`);
  console.log('');
  console.log('🚀 Now you can:');
  console.log('   1. Open the Excel template (product-template.xlsx)');
  console.log('   2. The image fields should now show "FILE: filename.jpg"');
  console.log('   3. Upload the Excel file and images via the web interface');
  console.log('   4. The system will match filenames and assign images correctly');
}

// Run the creator
try {
  createSampleImages();
} catch (error) {
  console.error('❌ Error creating sample images:', error.message);
  process.exit(1);
}
