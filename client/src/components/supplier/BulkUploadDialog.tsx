import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  X,
  FileText,
  Image as ImageIcon
} from "lucide-react";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UploadResult {
  success: boolean;
  count?: number;
  errors?: Array<{ row: number; error: string }>;
  message?: string;
}

export default function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [activeTab, setActiveTab] = useState("template");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  // Download template
  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'name',
      'shortDescription',
      'description',
      'categoryId',
      'minOrderQuantity',
      'stockQuantity',
      'leadTime',
      'port',
      'paymentTerms',
      'colors',
      'sizes',
      'keyFeatures',
      'certifications',
      'tags',
      'sampleAvailable',
      'samplePrice',
      'customizationAvailable',
      'customizationDetails',
      'hasTradeAssurance',
      'sku'
    ];

    const sampleData = [
      'Wireless Bluetooth Headphones',
      'High-quality wireless headphones with noise cancellation',
      'Premium wireless Bluetooth headphones featuring advanced noise cancellation technology, 30-hour battery life, and superior sound quality. Perfect for music lovers and professionals.',
      'category-id-here',
      '100',
      '5000',
      '15-20 days',
      'Shanghai/Ningbo',
      'T/T, L/C, Western Union',
      'Black, White, Blue, Red',
      'One Size',
      'Noise Cancellation, 30h Battery, Wireless',
      'CE, FCC, RoHS',
      'headphones, wireless, bluetooth, audio',
      'true',
      '25.00',
      'true',
      'Custom logo printing and packaging available',
      'true',
      'WBH-001'
    ];

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      
      // Parse CSV/Excel file
      const fileContent = await selectedFile.text();
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length && values[0]) {
          const product: any = {};
          headers.forEach((header, index) => {
            product[header] = values[index];
          });
          products.push(product);
        }
      }

      formData.append('products', JSON.stringify(products));

      // Add images if selected
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/suppliers/products/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult({
          success: true,
          count: result.count,
          message: result.message
        });
        
        // Auto-close after success
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          resetForm();
        }, 2000);
      } else {
        setUploadResult({
          success: false,
          errors: result.errors,
          message: result.error
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setSelectedImages([]);
    setUploadResult(null);
    setUploadProgress(0);
    setActiveTab("template");
  };

  // Handle dialog close
  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Product Upload</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">1. Download Template</TabsTrigger>
            <TabsTrigger value="upload">2. Upload File</TabsTrigger>
            <TabsTrigger value="result">3. Review Results</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Download Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Download the CSV template to ensure your product data is formatted correctly.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Template Instructions:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Fill in all required fields (name, categoryId, minOrderQuantity)</li>
                    <li>• Use comma-separated values for arrays (colors, sizes, tags, etc.)</li>
                    <li>• Use 'true' or 'false' for boolean fields</li>
                    <li>• Get category IDs from the category management section</li>
                    <li>• Keep file size under 10MB for best performance</li>
                  </ul>
                </div>

                <Button onClick={downloadTemplate} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>

                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("upload")}
                    disabled={uploading}
                  >
                    Next: Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Product Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Product Data File (CSV/Excel) *
                  </label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      {selectedFile ? (
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium mb-1">Choose a file or drag it here</p>
                          <p className="text-sm text-muted-foreground">CSV or Excel files only</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploading}
                      >
                        {selectedFile ? 'Change File' : 'Select File'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Product Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      {selectedImages.length > 0 ? (
                        <div>
                          <p className="font-medium">{selectedImages.length} images selected</p>
                          <p className="text-sm text-muted-foreground">
                            Images will be distributed among products
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium mb-1">Upload product images</p>
                          <p className="text-sm text-muted-foreground">Images will be automatically distributed</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploading}
                      >
                        {selectedImages.length > 0 ? 'Change Images' : 'Select Images'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading products...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? 'Uploading...' : 'Upload Products'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("template")}
                    disabled={uploading}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {uploadResult?.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadResult ? (
                  <div className="space-y-4">
                    {uploadResult.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                          <CheckCircle className="w-4 h-4" />
                          Upload Successful!
                        </div>
                        <p className="text-green-700">
                          {uploadResult.message || `Successfully uploaded ${uploadResult.count} products.`}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          Products are now pending approval and will be visible once approved by administrators.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                            <AlertCircle className="w-4 h-4" />
                            Upload Failed
                          </div>
                          <p className="text-red-700">{uploadResult.message}</p>
                        </div>

                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Validation Errors:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {uploadResult.errors.map((error, index) => (
                                <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                                  <Badge variant="destructive" className="mb-1">
                                    Row {error.row}
                                  </Badge>
                                  <p className="text-sm text-red-700">{error.error}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {uploadResult.success ? (
                        <Button onClick={() => handleClose()} className="flex-1">
                          Close
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("upload")}
                            className="flex-1"
                          >
                            Try Again
                          </Button>
                          <Button onClick={() => handleClose()}>
                            Close
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upload results yet</p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("upload")}
                      className="mt-2"
                    >
                      Go to Upload
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}