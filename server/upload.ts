import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Create multer instance with NO LIMITS for bulk uploads
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fieldNameSize: 1000,
    fieldSize: Infinity, // Max field value size - NO LIMIT
    fields: Infinity,
    fileSize: Infinity,
    files: Infinity,
    parts: Infinity,
    headerPairs: 2000
  }
});

// Single image upload
export const uploadSingle = upload.single('image');

// Single file upload with 'files' field name (for compatibility)
export const uploadSingleFile = upload.single('files');

// Multiple images upload
export const uploadMultiple = upload.array('images', 10); // Max 10 images

// Completely unrestricted upload for bulk operations - NO LIMITS AT ALL
export const uploadUnrestricted = multer({
  storage: storage,
  limits: {
    fieldNameSize: 1000, // Max field name size
    fieldSize: Infinity, // Max field value size - NO LIMIT
    fields: Infinity, // Max number of non-file fields - NO LIMIT
    fileSize: Infinity, // Max file size - NO LIMIT
    files: Infinity, // Max number of file fields - NO LIMIT
    parts: Infinity, // Max number of parts (fields + files) - NO LIMIT
    headerPairs: 2000 // Max number of header key-value pairs
  }
  // No fileFilter - accepts all file types
});

