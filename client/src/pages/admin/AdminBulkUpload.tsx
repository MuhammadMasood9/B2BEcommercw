import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, ImageIcon, Package, DollarSign, Truck, Settings, Tag, Star, AlertTriangle, Info, FileText, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AdminBulkUpload() {
  const [activeTab, setActiveTab] = useState('excel');
  const [products, setProducts] = useState<any[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [separateImageFiles, setSeparateImageFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ count: number; errors?: string[] } | null>(null);
  const { toast } = useToast();

  // Fetch categories for manual form
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/products/bulk-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to upload products');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setUploadStatus('success');
      setUploadResult({ count: data.count });
      toast({
        title: "Success",
        description: `Successfully uploaded ${data.count} products`,
      });
    },
    onError: (error: any) => {
      setUploadStatus('error');
      setUploadResult({ count: 0, errors: [error.message] });
      toast({
        title: "Error",
        description: error.message || "Failed to upload products",
        variant: "destructive",
      });
    },
  });

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setExcelFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      // Import ExcelJS library dynamically
      const ExcelJS = await import('exceljs');
      
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      
      // Get the first worksheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      // Extract images from the workbook
      const extractedImages: { [key: string]: string } = {};
      
      // Get all images from the workbook
      const images = workbook.model.media || [];
      console.log(`Found ${images.length} images in workbook`);
      
      // Process each image
      images.forEach((image: any, imageIndex: number) => {
        try {
          // Convert image buffer to base64 using browser-compatible method
          const uint8Array = new Uint8Array(image.buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          const mimeType = image.type || 'image/jpeg';
          const imageData = `data:${mimeType};base64,${base64}`;
          
          // Store image with a unique key
          const imageKey = `image_${imageIndex}`;
          extractedImages[imageKey] = imageData;
          console.log(`Extracted image ${imageIndex + 1}: ${imageKey}`);
        } catch (error) {
          console.warn(`Failed to extract image ${imageIndex + 1}:`, error);
        }
      });
      
      // Convert worksheet to JSON
      const jsonData: any[] = [];
      const headers: string[] = [];
      
      // Get headers from first row
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });
      
      // Process each row
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        // Add row number for reference
        rowData.__rowNum__ = rowNumber;
        jsonData.push(rowData);
      });
      
      console.log(`Processed ${jsonData.length} rows from Excel`);
      
      // Process the data
      const processedProducts = jsonData.map((row: any, index: number) => {
        // Debug: Log the raw row data for troubleshooting
        console.log(`Processing product ${index + 1}:`, row);
        
        // Process arrays from Excel
        const processArray = (value: any) => {
          if (typeof value === 'string') {
            return value.split(',').map((item: string) => item.trim()).filter(Boolean);
          }
          return Array.isArray(value) ? value : [];
        };
        
        // Process specifications JSON
        let specifications = null;
        if (row.specifications) {
          try {
            specifications = typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications;
          } catch (e) {
            console.warn(`Invalid specifications JSON for product ${index + 1}:`, row.specifications);
          }
        }
        
        // Process price tiers
        const priceTiers = [];
        for (let tier = 1; tier <= 3; tier++) {
          const minQty = row[`priceTier${tier}MinQty`];
          const maxQty = row[`priceTier${tier}MaxQty`];
          const price = row[`priceTier${tier}Price`];
          
          if (minQty && price) {
            priceTiers.push({
              minQty: parseInt(minQty),
              maxQty: maxQty ? parseInt(maxQty) : null,
              pricePerUnit: parseFloat(price)
            });
          }
        }
        
        // Process images - try to match with extracted images
        const imageData: string[] = [];
        const imageFields = ['mainImage', 'image1', 'image2', 'image3', 'image4', 'image5'];
        
        console.log(`Image fields for product ${index + 1}:`, imageFields.map(field => ({ field, value: row[field], type: typeof row[field] })));
        
        // For now, distribute extracted images evenly among products
        const imagesPerProduct = Math.ceil(Object.keys(extractedImages).length / jsonData.length);
        const startImageIndex = index * imagesPerProduct;
        const endImageIndex = Math.min(startImageIndex + imagesPerProduct, Object.keys(extractedImages).length);
        
        for (let i = startImageIndex; i < endImageIndex; i++) {
          const imageKey = `image_${i}`;
          if (extractedImages[imageKey]) {
            imageData.push(extractedImages[imageKey]);
            console.log(`Assigned image ${imageKey} to product ${index + 1}`);
          }
        }
        
        return {
          id: index + 1,
          name: row.name || '',
          sku: row.sku || '',
          shortDescription: row.shortDescription || '',
          description: row.description || '',
          categoryId: row.categoryId || '',
          minOrderQuantity: parseInt(row.minOrderQuantity || '1'),
          sampleAvailable: row.sampleAvailable === 'TRUE' || row.sampleAvailable === true,
          samplePrice: row.samplePrice ? parseFloat(row.samplePrice) : 0,
          customizationAvailable: row.customizationAvailable === 'TRUE' || row.customizationAvailable === true,
          customizationDetails: row.customizationDetails || '',
          leadTime: row.leadTime || '',
          port: row.port || '',
          paymentTerms: processArray(row.paymentTerms),
          inStock: row.inStock === 'TRUE' || row.inStock === true,
          stockQuantity: parseInt(row.stockQuantity || '0'),
          isPublished: row.isPublished === 'TRUE' || row.isPublished === true,
          isFeatured: row.isFeatured === 'TRUE' || row.isFeatured === true,
          colors: processArray(row.colors),
          sizes: processArray(row.sizes),
          keyFeatures: processArray(row.keyFeatures),
          certifications: processArray(row.certifications),
          tags: processArray(row.tags),
          hasTradeAssurance: row.hasTradeAssurance === 'TRUE' || row.hasTradeAssurance === true,
          specifications,
          priceTiers,
          images: imageData, // Store actual image data
          imageData // Keep track of extracted image data
        };
      });
      
      setProducts(processedProducts);
      
      toast({
        title: "Success",
        description: `Processed ${processedProducts.length} products from Excel file with ${Object.keys(extractedImages).length} extracted images`,
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to process Excel file",
        variant: "destructive",
      });
    }
  };

  const handleSeparateImageFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSeparateImageFiles(files);
    console.log('Separate image files selected:', files.map(f => f.name));
  };

  const addProduct = () => {
    const newProduct = {
      id: Date.now(),
      name: "",
      sku: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      minOrderQuantity: 1,
      sampleAvailable: false,
      samplePrice: 0,
      customizationAvailable: false,
      customizationDetails: "",
      leadTime: "",
      port: "",
      paymentTerms: [],
      inStock: true,
      stockQuantity: 0,
      isPublished: true,
      isFeatured: false,
      colors: [],
      sizes: [],
      keyFeatures: [],
      certifications: [],
      tags: [],
      hasTradeAssurance: false,
      specifications: {},
      priceTiers: [],
      images: []
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: number, field: string, value: any) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addImageToProduct = (productId: number, imageFile: File) => {
    const imageUrl = URL.createObjectURL(imageFile);
    setProducts(products.map(p => 
      p.id === productId ? { ...p, images: [...p.images, imageUrl] } : p
    ));
  };

  const removeImageFromProduct = (productId: number, imageIndex: number) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, images: p.images.filter((_: any, i: number) => i !== imageIndex) } : p
    ));
  };

  const handleExcelUpload = async () => {
    if (products.length === 0) {
      toast({
        title: "Error",
        description: "No products to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploadStatus('uploading');
    
    try {
      const formData = new FormData();
      
      // Prepare products data with extracted image data
      const productsWithImages = products.map(product => ({
        ...product,
        images: product.imageData || [], // Use extracted image data
        imageData: undefined // Remove this field from the payload
      }));
      
      formData.append('products', JSON.stringify(productsWithImages));
      
      // Log what we're sending
      console.log('Products with images:', productsWithImages.map(p => ({ 
        name: p.name, 
        images: p.images,
        imageCount: p.images.length 
      })));
      
      uploadMutation.mutate(formData);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadResult({ count: 0, errors: [error.message] });
      toast({
        title: "Error",
        description: error.message || "Failed to upload products",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Product Upload</h1>
        <p className="text-muted-foreground">
          Upload multiple products with actual image files using Excel/JSON format
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel/JSON Upload
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        {/* Excel/JSON Upload Tab */}
        <TabsContent value="excel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
        <Card>
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Excel/JSON Upload
                </CardTitle>
            <CardDescription>
                  Upload Excel file or create products manually with actual image files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Excel File (Optional)</Label>
                  <Input
                    id="excel-file"
                type="file"
                    accept=".xlsx,.xls,.json"
                    onChange={handleExcelFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload Excel file to pre-populate products
                  </p>
            </div>


                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Products ({products.length})</h4>
                    <p className="text-sm text-muted-foreground">
                      Add products manually or import from Excel
                    </p>
                  </div>
                  <Button onClick={addProduct} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
            </Button>
                </div>

                {/* Show expected image filenames */}
                {products.length > 0 && products.some(p => p.imageFilenames && p.imageFilenames.length > 0) && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📁 Expected Image Files</h4>
                    <div className="text-sm text-blue-800">
                      <p className="mb-2">The following image files are expected based on your Excel:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(products.flatMap(p => p.imageFilenames || []))).map((filename, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {filename}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-xs">
                        💡 Upload these image files using the "Image Files" field above. The system will automatically match them by filename.
                      </p>
                    </div>
                  </div>
                )}

            {uploadStatus === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading products...</span>
                      <span>Processing</span>
                    </div>
                    <Progress value={66} className="w-full" />
                  </div>
            )}

            {uploadStatus === 'success' && uploadResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Upload Successful</AlertTitle>
                <AlertDescription>
                  Successfully uploaded {uploadResult.count} products
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && uploadResult && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                    <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>
                      {uploadResult.errors?.join(', ') || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}

                <Button 
                  onClick={handleExcelUpload}
                  disabled={products.length === 0 || uploadStatus === 'uploading'}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {products.length} Products
                </Button>
          </CardContent>
        </Card>

            {/* Format Guide */}
        <Card>
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Excel Format Guide
                </CardTitle>
            <CardDescription>
                  Required fields and format for Excel upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Required Fields</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• name</li>
                      <li>• sku</li>
                      <li>• categoryId</li>
                      <li>• minOrderQuantity</li>
                      <li>• priceTiers</li>
              </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Image Fields</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• mainImage (filename)</li>
                      <li>• image1 (filename)</li>
                      <li>• image2 (filename)</li>
                      <li>• image3 (filename)</li>
                      <li>• image4 (filename)</li>
                      <li>• image5 (filename)</li>
              </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-2">Price Tiers Format</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>priceTier1MinQty: 100</div>
                    <div>priceTier1MaxQty: 499</div>
                    <div>priceTier1Price: 25.00</div>
                    <div>priceTier2MinQty: 500</div>
                    <div>priceTier2MaxQty: 999</div>
                    <div>priceTier2Price: 22.00</div>
                  </div>
            </div>

            <Button 
              variant="outline" 
                  onClick={() => {
                    const template = {
                      name: "Product Name",
                      sku: "SKU-001",
                      shortDescription: "Short description",
                      description: "Full description",
                      categoryId: "cat-electronics",
                      minOrderQuantity: 100,
                      sampleAvailable: true,
                      samplePrice: 5.00,
                      customizationAvailable: true,
                      customizationDetails: "Custom options",
                      leadTime: "15-20 days",
                      port: "Shanghai Port",
                      paymentTerms: ["T/T", "L/C"],
                      inStock: true,
                      stockQuantity: 500,
                      isPublished: true,
                      isFeatured: false,
                      colors: ["Black", "White"],
                      sizes: ["S", "M", "L"],
                      keyFeatures: ["Feature 1", "Feature 2"],
                      certifications: ["CE", "FCC"],
                      tags: ["electronics", "audio"],
                      hasTradeAssurance: true,
                      specifications: { "Battery": "30 hours" },
                      priceTiers: [
                        { minQty: 100, maxQty: 499, pricePerUnit: 25.00 },
                        { minQty: 500, maxQty: 999, pricePerUnit: 22.00 },
                        { minQty: 1000, maxQty: null, pricePerUnit: 20.00 }
                      ],
                      mainImage: "product-main.jpg",
                      image1: "product-detail1.jpg",
                      image2: "product-detail2.jpg"
                    };
                    
                    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'product-template.json';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
              className="w-full"
            >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON Template
            </Button>
          </CardContent>
        </Card>
      </div>

          {/* Products List */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({products.length})
                </CardTitle>
                <CardDescription>
                  Review and edit products before uploading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product, index) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Product Name</Label>
                              <Input
                                value={product.name}
                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                placeholder="Enter product name"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">SKU</Label>
                              <Input
                                value={product.sku}
                                onChange={(e) => updateProduct(product.id, 'sku', e.target.value)}
                                placeholder="Enter SKU"
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs">Category ID</Label>
                              <Input
                                value={product.categoryId}
                                onChange={(e) => updateProduct(product.id, 'categoryId', e.target.value)}
                                placeholder="cat-electronics"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">MOQ</Label>
                              <Input
                                type="number"
                                value={product.minOrderQuantity}
                                onChange={(e) => updateProduct(product.id, 'minOrderQuantity', parseInt(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Stock Quantity</Label>
                              <Input
                                type="number"
                                value={product.stockQuantity}
                                onChange={(e) => updateProduct(product.id, 'stockQuantity', parseInt(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Short Description</Label>
                            <Textarea
                              value={product.shortDescription}
                              onChange={(e) => updateProduct(product.id, 'shortDescription', e.target.value)}
                              placeholder="Brief product description"
                              className="h-16"
                            />
                          </div>

                          {/* Price Tiers */}
                          <div>
                            <Label className="text-xs">Price Tiers</Label>
                            <div className="space-y-2">
                              {product.priceTiers.map((tier: any, tierIndex: number) => (
                                <div key={tierIndex} className="flex gap-2">
                                  <Input
                                    placeholder="Min Qty"
                                    value={tier.minQty}
                                    onChange={(e) => {
                                      const newTiers = [...product.priceTiers];
                                      newTiers[tierIndex].minQty = parseInt(e.target.value);
                                      updateProduct(product.id, 'priceTiers', newTiers);
                                    }}
                                    className="h-8 w-20"
                                  />
                                  <Input
                                    placeholder="Max Qty"
                                    value={tier.maxQty || ''}
                                    onChange={(e) => {
                                      const newTiers = [...product.priceTiers];
                                      newTiers[tierIndex].maxQty = e.target.value ? parseInt(e.target.value) : null;
                                      updateProduct(product.id, 'priceTiers', newTiers);
                                    }}
                                    className="h-8 w-20"
                                  />
                                  <Input
                                    placeholder="Price"
                                    value={tier.pricePerUnit}
                                    onChange={(e) => {
                                      const newTiers = [...product.priceTiers];
                                      newTiers[tierIndex].pricePerUnit = parseFloat(e.target.value);
                                      updateProduct(product.id, 'priceTiers', newTiers);
                                    }}
                                    className="h-8 w-24"
                                  />
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newTiers = [...product.priceTiers, { minQty: 0, maxQty: null, pricePerUnit: 0 }];
                                  updateProduct(product.id, 'priceTiers', newTiers);
                                }}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Tier
                              </Button>
                            </div>
                          </div>

                          {/* Images */}
                          <div>
                            <Label className="text-xs">Product Images</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => addImageToProduct(product.id, file));
                                }}
                                className="h-8"
                              />
                            </div>
                            {product.images.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {product.images.map((image: string, imageIndex: number) => (
                                  <div key={imageIndex} className="relative">
                                    <img
                                      src={image}
                                      alt={`Product ${imageIndex + 1}`}
                                      className="w-16 h-16 object-cover rounded border"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      onClick={() => removeImageFromProduct(product.id, imageIndex)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Product Entry</CardTitle>
              <CardDescription>
                Add products one by one with full control over all fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Manual Entry Coming Soon</h3>
                <p className="text-muted-foreground">
                  Use the Excel/JSON upload method for now, or add products individually in the product management section.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Upload Tab */}
        <TabsContent value="csv" className="space-y-6">
          <Card>
        <CardHeader>
              <CardTitle>CSV Upload (Legacy)</CardTitle>
              <CardDescription>
                CSV upload with Base64 images - use Excel/JSON method for better experience
              </CardDescription>
        </CardHeader>
        <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">CSV Upload Available</h3>
                <p className="text-muted-foreground">
                  CSV upload with Base64 images is still available, but we recommend using the Excel/JSON method for better image handling.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('excel')}>
                  Switch to Excel/JSON Upload
                </Button>
              </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}