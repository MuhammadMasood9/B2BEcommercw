import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RFQCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    quantity: '',
    targetPrice: '',
    deliveryLocation: '',
    expectedDate: ''
  });


  // Create RFQ mutation
  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add RFQ data to FormData
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('quantity', data.quantity.toString());
      formData.append('deliveryLocation', data.deliveryLocation);
      formData.append('status', data.status);
      formData.append('buyerId', data.buyerId);
      
      if (data.categoryId) formData.append('categoryId', data.categoryId);
      if (data.targetPrice) formData.append('targetPrice', data.targetPrice);
      if (data.expectedDate) formData.append('expectedDate', data.expectedDate.toISOString());

      // Add files
      files.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await fetch('/api/rfqs', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to create RFQ');
      return response.json();
    },
    onSuccess: () => {
      toast.success('RFQ created successfully!');
      setLocation('/buyer/rfqs');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create RFQ');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.quantity || !formData.deliveryLocation) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRFQMutation.mutate({
      ...formData,
      buyerId: user?.id,
      quantity: parseInt(formData.quantity),
      targetPrice: formData.targetPrice ? formData.targetPrice.toString() : null,
      expectedDate: formData.expectedDate ? new Date(formData.expectedDate) : null,
      status: 'open'
    });
  };

  // Fetch categories for the dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Post a Request for Quotation</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Get quotes from verified suppliers for your bulk order requirements</p>
          </div>

          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">RFQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <form onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base">RFQ Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Looking for High-Quality Wireless Earbuds"
                  className="mt-2 text-sm sm:text-base"
                  data-testid="input-rfq-title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">Product Category</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger className="mt-2 text-sm sm:text-base" data-testid="select-category">
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && !categoriesLoading && (
                      <SelectItem value="" disabled>
                        No categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm sm:text-base">Detailed Requirements *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product requirements in detail: specifications, quality standards, packaging needs, etc."
                  rows={5}
                  className="mt-2 text-sm sm:text-base"
                  data-testid="textarea-requirements"
                  required
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Be as specific as possible to get accurate quotations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity Needed *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="e.g., 5000"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-quantity"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="target-price" className="text-sm sm:text-base">Target Price (Optional)</Label>
                  <Input
                    id="target-price"
                    type="number"
                    value={formData.targetPrice}
                    onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                    placeholder="e.g., 15.50"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-target-price"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Upload Images/Documents (Optional)</Label>
                <div 
                  className="mt-2 border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Supports: JPG, PNG, PDF, DOC, DOCX (Max 10MB each)
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files);
                        const validFiles = selectedFiles.filter(file => {
                          const maxSize = 10 * 1024 * 1024; // 10MB
                          if (file.size > maxSize) {
                            toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
                            return false;
                          }
                          return true;
                        });
                        setFiles(validFiles);
                      }
                    }}
                    data-testid="input-file-upload"
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Uploaded files:</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFiles(files.filter((_, i) => i !== index));
                          }}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="delivery-location" className="text-sm sm:text-base">Delivery Location *</Label>
                  <Input
                    id="delivery-location"
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                    placeholder="City, Country"
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-location"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-date" className="text-sm sm:text-base">Expected Delivery Date</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => handleInputChange('expectedDate', e.target.value)}
                    className="mt-2 text-sm sm:text-base"
                    data-testid="input-delivery-date"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1 text-sm sm:text-base" 
                  data-testid="button-post-rfq"
                  disabled={createRFQMutation.isPending}
                >
                  {createRFQMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating RFQ...
                    </>
                  ) : (
                    'Post RFQ'
                  )}
                </Button>
                <Button 
                  type="button"
                  size="lg" 
                  variant="outline" 
                  className="flex-1 text-sm sm:text-base" 
                  data-testid="button-cancel"
                  onClick={() => setLocation('/buyer/rfqs')}
                >
                  Cancel
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
