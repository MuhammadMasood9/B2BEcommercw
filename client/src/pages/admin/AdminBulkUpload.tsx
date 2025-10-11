import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ count: number; errors?: string[] } | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (products: any[]) => {
      return await apiRequest("POST", "/api/products/bulk", { products });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setUploadResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line handling quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const product: any = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        value = value.replace(/^"|"$/g, ''); // Remove surrounding quotes
        product[header] = value;
      });
      
      products.push(product);
    }
    
    return products;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadStatus('uploading');
    
    try {
      const text = await file.text();
      const products = parseCSV(text);
      
      if (products.length === 0) {
        throw new Error("No products found in file");
      }
      
      uploadMutation.mutate(products);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadResult({ count: 0, errors: [error.message] });
      toast({
        title: "Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = `ID,Type,SKU,Name,Short description,Description,Regular price,Sale price,In stock?,Stock,Images,Tags,Categories
1,simple,SAMPLE-SKU,Sample Product,Short description here,Full product description here,99.99,79.99,1,100,"https://example.com/image1.jpg, https://example.com/image2.jpg","tag1, tag2",Electronics`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-bulk-upload-title">Bulk Product Upload</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with your products. Each product can have multiple images separated by commas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild data-testid="button-select-file">
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Select CSV File
                  </span>
                </Button>
              </label>
              {file && (
                <p className="mt-4 text-sm text-muted-foreground" data-testid="text-selected-file">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploadStatus === 'uploading'}
              className="w-full"
              data-testid="button-upload-products"
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Products'}
            </Button>

            {uploadStatus === 'uploading' && (
              <Progress value={50} className="w-full" />
            )}

            {uploadStatus === 'success' && uploadResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Successfully uploaded {uploadResult.count} products
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && uploadResult && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {uploadResult.errors?.[0] || 'Failed to upload products'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Format Guide</CardTitle>
            <CardDescription>
              Follow this format for your CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Name - Product name</li>
                <li>SKU - Stock keeping unit (unique)</li>
              </ul>

              <h3 className="font-semibold mt-4">Optional Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Description - Full product description</li>
                <li>Short description - Brief description</li>
                <li>Regular price - Regular price in dollars</li>
                <li>Sale price - Sale price in dollars</li>
                <li>Stock - Quantity in stock</li>
                <li>In stock? - 1 for in stock, 0 for out of stock</li>
                <li>Images - Comma-separated image URLs</li>
                <li>Tags - Comma-separated tags</li>
                <li>Categories - Comma-separated categories</li>
                <li>Published - 1 for published, 0 for draft</li>
              </ul>

              <h3 className="font-semibold mt-4">Image URLs:</h3>
              <p className="text-muted-foreground">
                You can add multiple images per product by separating URLs with commas:
              </p>
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                "https://example.com/img1.jpg, https://example.com/img2.jpg, https://example.com/img3.jpg"
              </code>
            </div>

            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="w-full"
              data-testid="button-download-template"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Ensure your CSV file is properly formatted with headers in the first row</li>
            <li>Image URLs should be publicly accessible and direct links to images</li>
            <li>Multiple images for a single product should be separated by commas within the Images column</li>
            <li>SKU should be unique for each product to avoid conflicts</li>
            <li>The system will automatically generate a URL-friendly slug from the product name</li>
            <li>All numeric fields (prices, stock) will be automatically validated</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
