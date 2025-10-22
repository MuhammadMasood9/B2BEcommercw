# 🖼️ EXCEL IMAGE UPLOAD GUIDE

## How to Add Images to Excel Files

### Method 1: Embed Images Directly (Recommended)
1. **Open your Excel file** in Google Sheets or Excel
2. **Click on the image cell** (e.g., mainImage, image1, etc.)
3. **Insert → Image → Upload from computer**
4. **Select your image file** and insert it
5. **The system will automatically extract** the image data when you upload

### Method 2: Use Text Filenames
1. **Type the filename** in the image cell (e.g., `product-main.jpg`)
2. **Upload the image files separately** via the file upload interface
3. **The system will match** filenames with uploaded files

## ✅ What Works Now

### Frontend Processing:
- **Extracts embedded images** from Excel cells
- **Converts to base64** and includes in payload
- **Shows visual feedback** about found images
- **Handles both methods** (embedded + filenames)

### Server Processing:
- **Detects base64 image data** in payload
- **Saves images as files** in `/uploads/` directory
- **Generates unique filenames** to avoid conflicts
- **Creates proper image URLs** for products

## 🎯 Expected Payload Now:

```json
[{
  "id": 1,
  "name": "Wireless Bluetooth Earbuds",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "earbuds-packaging.jpg"
  ]
}]
```

## 🚀 How to Test:

1. **Open Excel template** in Google Sheets
2. **Add actual images** to mainImage, image1, image2 cells
3. **Upload the Excel file** via the web interface
4. **Check browser console** for extraction logs
5. **Verify payload** contains image data
6. **Check uploads folder** for saved images

## 📁 Files Updated:

- `client/src/pages/admin/AdminBulkUpload.tsx` - Image extraction logic
- `server/routes.ts` - Base64 image processing
- Excel template - Proper formatting

The system now handles **actual embedded images** from Excel files! 🎉
