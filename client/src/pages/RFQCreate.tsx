import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  FileText, 
  Loader2, 
  ArrowRight,
  Globe,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Package,
  Calendar,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  CheckCircle,
  Search
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function RFQCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Get productId and productName from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const productIdFromUrl = urlParams.get('productId');
  const productNameFromUrl = urlParams.get('productName');
  
  // Fetch product details if productId exists
  const { data: productData } = useQuery({
    queryKey: ['/api/products', productIdFromUrl],
    queryFn: async () => {
      if (!productIdFromUrl) return null;
      const response = await fetch(`/api/products/${productIdFromUrl}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: !!productIdFromUrl
  });

  // Fetch products for search
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/products/search', productSearchQuery],
    queryFn: async () => {
      if (!productSearchQuery || productSearchQuery.length < 2) return [];
      const response = await fetch(`/api/products?search=${encodeURIComponent(productSearchQuery)}&limit=10`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: productSearchQuery.length >= 2
  });
  
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

  // Auto-fill form when product data is loaded from URL
  useEffect(() => {
    if (productData && productIdFromUrl) {
      setFormData(prev => ({
        ...prev,
        title: productNameFromUrl || productData.name || prev.title,
        categoryId: productData.categoryId || prev.categoryId,
        description: productData.description || prev.description,
      }));
      setSelectedProduct(productData);
    }
  }, [productData, productIdFromUrl, productNameFromUrl]);

  // Set selected product from URL on mount
  useEffect(() => {
    if (productIdFromUrl && productData && !selectedProduct) {
      setSelectedProduct(productData);
    }
  }, [productIdFromUrl, productData]);

  // Handle clicks outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as HTMLElement;
      if (!target.closest('.product-search-container')) {
        setShowProductSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  });

  // Create RFQ mutation
  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      console.log('=== Creating RFQ with data ===');
      console.log('Full data object:', data);
      console.log('productId from URL:', productIdFromUrl);
      console.log('selectedProduct:', selectedProduct);
      
      // Add RFQ data to FormData
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('quantity', data.quantity.toString());
      formData.append('deliveryLocation', data.deliveryLocation);
      formData.append('status', data.status);
      formData.append('buyerId', data.buyerId);
      formData.append('categoryId', data.categoryId);
      formData.append('targetPrice', data.targetPrice);
      formData.append('expectedDate', data.expectedDate);
      
      // CRITICAL: Add productId if it exists (from selected product or URL)
      const finalProductId = data.productId || (selectedProduct?.id);
      if (finalProductId && finalProductId !== 'null' && finalProductId !== 'undefined' && finalProductId.trim() !== '') {
        console.log('Adding productId to FormData:', finalProductId);
        formData.append('productId', finalProductId);
      } else {
        console.log('No productId to add (productId is:', finalProductId, ')');
      }
      
      // Add files to FormData
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch('/api/rfqs', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('RFQ creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create RFQ');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('RFQ created successfully!');
      setLocation('/buyer/rfqs');
    },
    onError: (error: any) => {
      console.error('RFQ creation error:', error);
      toast.error(error.message || 'Failed to create RFQ');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create an RFQ');
      return;
    }

    const finalProductId = selectedProduct?.id || productIdFromUrl;

    createRFQMutation.mutate({
      ...formData,
      buyerId: user.id,
      status: 'open', // Use 'open' instead of 'active'
      productId: finalProductId && finalProductId !== 'null' ? finalProductId : undefined
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      title: product.name || prev.title,
      categoryId: product.categoryId || prev.categoryId,
      description: product.description || prev.description,
    }));
    setShowProductSearch(false);
    setProductSearchQuery('');
  };

  const handleRemoveProduct = () => {
    setSelectedProduct(null);
    setFormData(prev => ({
      title: '',
      categoryId: prev.categoryId,
      description: '',
      quantity: prev.quantity,
      targetPrice: prev.targetPrice,
      deliveryLocation: prev.deliveryLocation,
      expectedDate: prev.expectedDate
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <FileText className="w-4 h-4" />
              <span>Request for Quotation</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Create
              <span className="bg-gradient-to-r from-primary/80 via-white to-primary/80 bg-clip-text text-transparent block">
                RFQ
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Get competitive quotes from verified admins worldwide for your business needs
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24h Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Product Selection */}
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Select Product (Optional)
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Search and select a product to auto-fill the RFQ details
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedProduct ? (
                  <>
                    <div className="relative product-search-container">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Search for products..."
                          value={productSearchQuery}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value);
                            setShowProductSearch(true);
                          }}
                          onFocus={() => setShowProductSearch(true)}
                          className="h-12 pl-10"
                        />
                      </div>
                      {showProductSearch && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((product: any) => (
                            <div
                              key={product.id}
                              onClick={() => handleProductSelect(product)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate">{product.shortDescription || 'No description'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {productSearchQuery.length >= 2 && searchResults.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                    )}
                  </>
                ) : (
                  <div className="border border-primary/20 bg-primary/5 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        <img 
                          src={selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'} 
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{selectedProduct.shortDescription}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveProduct}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                        <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Product Selected
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">RFQ Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Wireless Earbuds Bulk Order"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your requirements in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice" className="text-sm font-medium">Target Price (USD)</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.targetPrice}
                      onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryLocation" className="text-sm font-medium">Delivery Location *</Label>
                    <Input
                      id="deliveryLocation"
                      placeholder="e.g., New York, USA"
                      value={formData.deliveryLocation}
                      onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expectedDate" className="text-sm font-medium">Expected Delivery Date</Label>
                    <Input
                      id="expectedDate"
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  Attachments (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Upload files</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-4"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-900">Selected files:</p>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                disabled={createRFQMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-lg font-semibold"
              >
                {createRFQMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating RFQ...
                  </>
                ) : (
                  <>
                    Create RFQ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}