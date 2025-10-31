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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';

interface VerificationLevel {
  name: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

interface VerificationApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: string;
  levelConfig: VerificationLevel | null;
  onSuccess: () => void;
}

interface DocumentUpload {
  file: File;
  fieldName: string;
  displayName: string;
  required: boolean;
}

export function VerificationApplicationDialog({
  open,
  onOpenChange,
  level,
  levelConfig,
  onSuccess
}: VerificationApplicationDialogProps) {
  const [step, setStep] = useState(1);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const documentFields = {
    basic: [
      { fieldName: 'businessLicense', displayName: 'Business License', required: true },
      { fieldName: 'identityDocument', displayName: 'Identity Document', required: true }
    ],
    business: [
      { fieldName: 'businessLicense', displayName: 'Business License', required: true },
      { fieldName: 'taxRegistration', displayName: 'Tax Registration Certificate', required: true },
      { fieldName: 'identityDocument', displayName: 'Identity Document', required: true },
      { fieldName: 'bankStatement', displayName: 'Bank Statement', required: true }
    ],
    premium: [
      { fieldName: 'businessLicense', displayName: 'Business License', required: true },
      { fieldName: 'taxRegistration', displayName: 'Tax Registration Certificate', required: true },
      { fieldName: 'identityDocument', displayName: 'Identity Document', required: true },
      { fieldName: 'bankStatement', displayName: 'Bank Statement', required: true },
      { fieldName: 'financialStatements', displayName: 'Financial Statements', required: true },
      { fieldName: 'qualityCertifications', displayName: 'Quality Certifications', required: false },
      { fieldName: 'exportLicense', displayName: 'Export/Import License', required: false }
    ],
    trade_assurance: [
      { fieldName: 'businessLicense', displayName: 'Business License', required: true },
      { fieldName: 'taxRegistration', displayName: 'Tax Registration Certificate', required: true },
      { fieldName: 'identityDocument', displayName: 'Identity Document', required: true },
      { fieldName: 'bankStatement', displayName: 'Bank Statement', required: true },
      { fieldName: 'financialStatements', displayName: 'Financial Statements', required: true },
      { fieldName: 'qualityCertifications', displayName: 'Quality Certifications', required: true },
      { fieldName: 'exportLicense', displayName: 'Export/Import License', required: true },
      { fieldName: 'auditReport', displayName: 'Third-party Audit Report', required: true },
      { fieldName: 'insuranceCertificate', displayName: 'Insurance Certificate', required: true }
    ]
  };

  const currentDocumentFields = documentFields[level as keyof typeof documentFields] || [];

  const handleFileUpload = (fieldName: string, displayName: string, required: boolean) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, or image files only.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');

    // Remove existing file for this field
    setDocuments(prev => prev.filter(doc => doc.fieldName !== fieldName));

    // Add new file
    setDocuments(prev => [...prev, { file, fieldName, displayName, required }]);
  };

  const removeDocument = (fieldName: string) => {
    setDocuments(prev => prev.filter(doc => doc.fieldName !== fieldName));
  };

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 2) {
      const requiredFields = currentDocumentFields.filter(field => field.required);
      const uploadedRequiredFields = documents.filter(doc => 
        requiredFields.some(field => field.fieldName === doc.fieldName)
      );
      
      if (uploadedRequiredFields.length < requiredFields.length) {
        setError('Please upload all required documents.');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('level', level);
      formData.append('additionalInfo', additionalInfo);

      // Add documents to form data
      documents.forEach(doc => {
        formData.append(doc.fieldName, doc.file);
      });

      const response = await fetch('/api/verification/apply', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        resetForm();
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting verification application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAdditionalInfo('');
    setDocuments([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!levelConfig) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {levelConfig.name}</DialogTitle>
          <DialogDescription>
            Complete the application process to get verified at the {levelConfig.name} level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Requirements Review */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please ensure you have the following documents ready before proceeding:
                </p>
                <ul className="space-y-2">
                  {levelConfig.requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                <ul className="space-y-2">
                  {levelConfig.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload the required documents for verification. Files must be in PDF, DOC, DOCX, or image format (max 10MB each).
                </p>
              </div>

              <div className="space-y-4">
                {currentDocumentFields.map((field) => {
                  const uploadedDoc = documents.find(doc => doc.fieldName === field.fieldName);
                  
                  return (
                    <div key={field.fieldName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          {field.displayName}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {uploadedDoc && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(field.fieldName)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {uploadedDoc ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">{uploadedDoc.file.name}</span>
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <Label
                            htmlFor={field.fieldName}
                            className="text-sm text-gray-600 cursor-pointer hover:text-gray-800"
                          >
                            Click to upload {field.displayName}
                          </Label>
                          <input
                            id={field.fieldName}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileUpload(field.fieldName, field.displayName, field.required)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide any additional information that might help with your verification process.
                </p>
              </div>

              <div>
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Enter any additional information about your business, certifications, or special circumstances..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Review Summary</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Verification Level:</strong> {levelConfig.name}</p>
                  <p><strong>Documents Uploaded:</strong> {documents.length}</p>
                  <div>
                    <strong>Required Documents:</strong>
                    <ul className="mt-1 ml-4">
                      {currentDocumentFields.filter(f => f.required).map(field => {
                        const uploaded = documents.some(doc => doc.fieldName === field.fieldName);
                        return (
                          <li key={field.fieldName} className="flex items-center gap-2">
                            {uploaded ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <X className="h-3 w-3 text-red-600" />
                            )}
                            {field.displayName}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}