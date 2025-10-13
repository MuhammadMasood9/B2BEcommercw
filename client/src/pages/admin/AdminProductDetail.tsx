import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Star,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ImageIcon,
  FileText,
  Truck,
  CreditCard,
} from "lucide-react";

export default function AdminProductDetail() {
  const [, params] = useRoute("/admin/products/:productId");
  const productId = params?.productId || "1";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Mock product data
  const mockProduct: Product & { categoryName?: string } = {
    id: productId,
    name: "Industrial LED Flood Lights 100W",
    slug: "industrial-led-flood-lights-100w",
    shortDescription: "High-efficiency LED flood lights for industrial use",
    description: "Premium quality LED flood lights with IP65 waterproof rating, suitable for outdoor and industrial applications. Features energy-saving technology and long lifespan of up to 50,000 hours. Perfect for warehouses, parking lots, sports fields, and construction sites.",
    categoryId: "1",
    specifications: {
      "Power": "100W",
      "Voltage": "AC 85-265V",
      "Color Temperature": "6000K",
      "Lumens": "10000lm",
      "IP Rating": "IP65",
      "Lifespan": "50,000 hours",
      "Beam Angle": "120°",
      "Material": "Aluminum Alloy",
      "Warranty": "3 Years"
    },
    images: [
      "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1545259742-24f9dbae58a7?w=800",
    ],
    videos: [],
    minOrderQuantity: 50,
    priceRanges: [
      { minQty: 50, maxQty: 99, pricePerUnit: 45.00 },
      { minQty: 100, maxQty: 499, pricePerUnit: 42.00 },
      { minQty: 500, maxQty: null, pricePerUnit: 38.00 }
    ],
    sampleAvailable: true,
    samplePrice: "55.00",
    customizationAvailable: true,
    leadTime: "15-20 days",
    port: "Shanghai/Ningbo",
    paymentTerms: ["T/T", "L/C", "Western Union"],
    inStock: true,
    stockQuantity: 5000,
    isPublished: true,
    isFeatured: true,
    views: 1250,
    inquiries: 45,
    tags: ["LED", "Lighting", "Industrial", "Waterproof"],
    sku: "LED-FL-100W-001",
    metaData: null,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    categoryName: "Electronics",
  };

  // Fetch real product data from API
  const { data: product, isLoading, error } = useQuery<Product & { categoryName?: string }>({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}`);
        const productData = await response.json();
        console.log("Fetched product from API:", productData);
        
        // Get category name if categoryId exists
        if (productData.categoryId) {
          try {
            const categoryResponse = await apiRequest("GET", `/api/categories/${productData.categoryId}`);
            const categoryData = await categoryResponse.json();
            productData.categoryName = categoryData.name;
          } catch (err) {
            console.error("Error fetching category:", err);
            productData.categoryName = "Unknown Category";
          }
        }
        
        return productData;
      } catch (error) {
        console.error("Error fetching product:", error);
        // Return mock data as fallback for demo purposes
        return mockProduct;
      }
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      setLocation("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => setLocation("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const priceRanges = (product.priceRanges as any[]) || [];
  const specifications = (product.specifications as Record<string, string>) || {};

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Products", href: "/admin/products" },
          { label: product.name }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">SKU: {product.sku || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/products/${product.slug}`, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            View Live
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/admin/products/${product.id}/manage`)}>
            <Edit className="w-4 h-4 mr-2" />
            Manage Product
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteProductMutation.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {product.isPublished ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Draft
                </Badge>
              )}
              {product.isFeatured && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              {product.views?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              {product.inquiries || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              {product.stockQuantity?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images ({product.images?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((img, idx) => (
                    <div key={idx} className="group aspect-square rounded-lg overflow-hidden border relative">
                      <img 
                        src={img} 
                        alt={`${product.name} - Image ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(img, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 mr-1" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No images available</p>
                    <p className="text-sm mt-1">Add images to make this product more appealing</p>
                  </div>
                )}
              </div>
              
              {/* Videos Section */}
              {product.videos && product.videos.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Product Videos ({product.videos.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.videos.map((video, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden border">
                        <video 
                          src={video}
                          controls
                          className="w-full h-full object-cover"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Product Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Short Description</h4>
                <p className="text-muted-foreground">{product.shortDescription || 'No description'}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Full Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description || 'No description'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(specifications).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No specifications available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & MOQ Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Minimum Order Quantity</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{product.minOrderQuantity?.toLocaleString() || 0} units</p>
              </div>
              
              {priceRanges.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Tiered Pricing</h4>
                  {priceRanges.map((tier, idx) => (
                    <div key={idx} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">
                            {tier.minQty?.toLocaleString()} - {tier.maxQty ? tier.maxQty.toLocaleString() : '∞'} units
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {tier.maxQty ? `${((tier.maxQty - tier.minQty) + 1).toLocaleString()} units range` : 'Unlimited quantity'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            ${tier.pricePerUnit?.toFixed(2)}
                          </span>
                          <p className="text-xs text-muted-foreground">per unit</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Best Price Highlight */}
                  {priceRanges.length > 1 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Best Price</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        ${Math.min(...priceRanges.map(tier => tier.pricePerUnit || 0)).toFixed(2)} per unit
                      </p>
                      <p className="text-xs text-green-600">
                        For orders of {Math.max(...priceRanges.map(tier => tier.minQty || 0)).toLocaleString()}+ units
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pricing tiers configured</p>
                  <p className="text-sm">Set up tiered pricing to encourage bulk orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample & Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Sample Available</p>
                  {product.sampleAvailable && (
                    <p className="text-sm text-muted-foreground">Price: ${product.samplePrice}</p>
                  )}
                </div>
                {product.sampleAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <p className="font-medium">Customization</p>
                {product.customizationAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping & Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Lead Time</p>
                <p className="text-muted-foreground">{product.leadTime || 'Not specified'}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Shipping Port</p>
                <p className="text-muted-foreground">{product.port || 'Not specified'}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Terms</p>
                <div className="flex flex-wrap gap-2">
                  {product.paymentTerms && product.paymentTerms.length > 0 ? (
                    product.paymentTerms.map((term, idx) => (
                      <Badge key={idx} variant="outline">{term}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Category & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Category</p>
                <Badge variant="default">{product.categoryName || 'Uncategorized'}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No tags</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Analytics & Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{product.views?.toLocaleString() || 0}</div>
                  <div className="text-xs text-blue-600">Total Views</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{product.inquiries || 0}</div>
                  <div className="text-xs text-green-600">Inquiries</div>
                </div>
              </div>
              
              {product.views && product.inquiries && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {((product.inquiries / product.views) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-600">Conversion Rate</div>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={product.isPublished ? "default" : "secondary"}>
                    {product.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Featured:</span>
                  <Badge variant={product.isFeatured ? "default" : "secondary"}>
                    {product.isFeatured ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Stock:</span>
                  <Badge variant={product.inStock ? "default" : "destructive"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(product.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(product.updatedAt || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product ID:</span>
                  <span className="font-mono text-xs">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-mono text-xs">{product.sku || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="font-mono text-xs truncate max-w-32">{product.slug}</span>
                </div>
              </div>
              
              {product.metaData ? (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Custom Metadata</h4>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                    {JSON.stringify(product.metaData as any, null, 2)}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

