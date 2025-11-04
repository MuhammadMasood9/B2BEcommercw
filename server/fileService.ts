import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { Request } from 'express';

export interface FileUploadResult {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

class FileService {
  private uploadDir: string;
  private baseUrl: string;
  private defaultValidation: FileValidationOptions;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
    this.baseUrl = '/uploads/chat';
    this.defaultValidation = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
    };
  }

  /**
   * Initialize upload directory
   */
  async initializeUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig(validation?: FileValidationOptions): multer.Multer {
    const options = { ...this.defaultValidation, ...validation };

    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        await this.initializeUploadDir();
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueId = randomUUID();
        const ext = path.extname(file.originalname);
        const filename = `${uniqueId}${ext}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return cb(new Error(`File size exceeds limit of ${options.maxSize} bytes`));
      }

      // Check MIME type
      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed`));
      }

      // Check file extension
      if (options.allowedExtensions) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!options.allowedExtensions.includes(ext)) {
          return cb(new Error(`File extension ${ext} is not allowed`));
        }
      }

      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize,
        files: 5 // Maximum 5 files per upload
      }
    });
  }

  /**
   * Process uploaded files and return file information
   */
  async processUploadedFiles(files: Express.Multer.File[]): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];

    for (const file of files) {
      const fileResult: FileUploadResult = {
        id: randomUUID(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        url: `${this.baseUrl}/${file.filename}`
      };

      results.push(fileResult);
    }

    return results;
  }

  /**
   * Upload files from base64 data (for drag & drop or paste)
   */
  async uploadFromBase64(
    base64Data: string,
    originalName: string,
    mimeType: string,
    validation?: FileValidationOptions
  ): Promise<FileUploadResult> {
    const options = { ...this.defaultValidation, ...validation };

    // Validate MIME type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Validate file extension
    if (options.allowedExtensions) {
      const ext = path.extname(originalName).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        throw new Error(`File extension ${ext} is not allowed`);
      }
    }

    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // Validate file size
    if (options.maxSize && buffer.length > options.maxSize) {
      throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
    }

    await this.initializeUploadDir();

    const uniqueId = randomUUID();
    const ext = path.extname(originalName);
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    return {
      id: uniqueId,
      originalName,
      filename,
      path: filePath,
      size: buffer.length,
      mimeType,
      url: `${this.baseUrl}/${filename}`
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filename: string): Promise<FileUploadResult | null> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const stats = await fs.stat(filePath);
      
      return {
        id: filename.split('.')[0], // Extract ID from filename
        originalName: filename,
        filename,
        path: filePath,
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(filename)),
        url: `${this.baseUrl}/${filename}`
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: { size: number; mimetype: string; originalname: string },
    validation?: FileValidationOptions
  ): { valid: boolean; error?: string } {
    const options = { ...this.defaultValidation, ...validation };

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${Math.round(options.maxSize / 1024 / 1024)}MB`
      };
    }

    // Check MIME type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed`
      };
    }

    // Check file extension
    if (options.allowedExtensions) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `File extension ${ext} is not allowed`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }

  /**
   * Get upload directory statistics
   */
  async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;
      const fileTypes: Record<string, number> = {};

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        const ext = path.extname(file).toLowerCase();
        
        totalSize += stats.size;
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }

      return {
        totalFiles: files.length,
        totalSize,
        fileTypes
      };
    } catch (error) {
      console.error('Error getting upload stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {}
      };
    }
  }

  /**
   * Generate secure download URL with expiration
   */
  generateSecureUrl(filename: string, expiresIn: number = 3600): string {
    // In a production environment, you would implement signed URLs
    // For now, return the regular URL
    return `${this.baseUrl}/${filename}`;
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file content as buffer (for processing)
   */
  async getFileBuffer(filename: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  /**
   * Create thumbnail for images
   */
  async createThumbnail(filename: string, width: number = 150, height: number = 150): Promise<string | null> {
    // This would require image processing library like sharp
    // For now, return the original image URL
    // TODO: Implement actual thumbnail generation
    return `${this.baseUrl}/${filename}`;
  }

  /**
   * Scan file for viruses/malware (placeholder)
   */
  async scanFile(filename: string): Promise<{ safe: boolean; threats?: string[] }> {
    // In production, integrate with antivirus service
    // For now, assume all files are safe
    return { safe: true };
  }
}

export const fileService = new FileService();