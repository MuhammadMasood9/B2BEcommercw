import { Router, Request, Response } from 'express';
import { uploadSingle, uploadMultiple } from './upload';
import path from 'path';
import fs from 'fs';

const uploadRoutes = Router();

// Upload single image
uploadRoutes.post('/upload/single', (req: Request, res: Response) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

// Upload multiple images
uploadRoutes.post('/upload/multiple', (req: Request, res: Response) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename
    }));
    
    res.json({
      success: true,
      files: fileUrls
    });
  });
});

// Delete uploaded image
uploadRoutes.delete('/upload/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default uploadRoutes;

