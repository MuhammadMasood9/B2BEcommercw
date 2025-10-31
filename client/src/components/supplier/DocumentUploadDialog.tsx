import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'businessLicense', label: 'Business License' },
  { value: 'taxRegistration', label: 'Tax Registration Certificate' },
  { value: 'identityDocument', label: 'Identity Document' },
  { value: 'bankStatement', label: 'Bank Statement' },
  { value: 'financialStatements', label: 'Financial Statements' },
  { value: 'qualityCertifications', label: 'Quality Certifications' },
  { value: 'exportLicense', label: 'Export/Import License' },
  { value: 'auditReport', label: 'Third-party Audit Report' },
  { value: 'insuranceCertificate', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other Document' }
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess
}: DocumentUploadDialogProps) {
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, or image files only.');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!documentType) {
      setError('Please select a document type.');
      return;
    }

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('description', description);

      const response = await fetch('/api/verification/upload-document', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        resetForm();
      } else {
        setError(data.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDocumentType('');
    setDescription('');
    setFile(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Verification Document</DialogTitle>
          <DialogDescription>
            Upload additional documents to support your verification application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="file">Document File *</Label>
            {file ? (
              <div className="mt-2 p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">{file.name}</span>
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Label
                  htmlFor="file"
                  className="text-sm text-gray-600 cursor-pointer hover:text-gray-800"
                >
                  Click to upload document
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, or image files (max 10MB)
                </p>
              </div>
            )}
            <Input
              id="file"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFile(null)}
              className="w-full"
            >
              Remove File
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !file || !documentType}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}