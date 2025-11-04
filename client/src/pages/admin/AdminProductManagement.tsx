import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertProductSchema, type Product, type Category } from "@shared/schema";
import type { z } from "zod";
import { ImageUpload } from "@/components/ImageUpload";
import {
  ArrowLeft,
  Edit,
  Save,
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
  BarChart3,
  Settings,
  Plus,
  Minus,
  AlertTriangle,
  Package2,
  Tag,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Target,
  Clock,
  Globe,
  Shield,
  Zap,
  User,
  Mail,
} from "lucide-react";

export default function AdminProductManagement() {
  const [, params] = useRoute("/admin/products/:productId/manage");
  const productId = params?.productId || "1";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function for safe number formatting
  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(decimals);
    }
    return '0.00';
  };

  // Fetch real product data from API - FIXED TO USE CORRECT API APPROACH
  const { data: product, isLoading, error } = useQuery<Product & { categoryName?: string }>({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      console.log(`Fetching real product data for ID: ${productId}`);
      
      try {
        // Use direct fetch instead of apiRequest to get proper Response object
        const response = await fetch(`/api/products/${productId}`, {
          credentials: "include",
        });
        
        // Check if response is ok
        if (!response.ok) {
          const errorMessage = `Failed to fetch product: ${response.status} ${response.statusText}`;
          console.error(`Product API failed: ${response.status} ${response.statusText}`);
          throw new Error(errorMessage);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorMessage = 'API returned non-JSON response';
          console.error('Product API returned non-JSON response');
          throw new Error(errorMessage);
        }
        
        const productData = await response.json();
        console.log("✅ Successfully fetched REAL product from API:", productData);
        
        // Get category name if categoryId exists - WITH PROPER ERROR HANDLING
        if (productData.categoryId) {
          try {
            const categoryResponse = await fetch(`/api/categories/${productData.categoryId}`, {
              credentials: "include",
            });
            if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            productData.categoryName = categoryData.name;
              console.log("✅ Fetched category name:", categoryData.name);
            } else {
              console.warn(`Category API failed: ${categoryResponse.status} ${categoryResponse.statusText}`);
              productData.categoryName = "Uncategorized";
            }
          } catch (err) {
            console.warn("Error fetching category (non-critical):", err);
            productData.categoryName = "Uncategorized";
          }
        } else {
          productData.categoryName = "Uncategorized";
        }
        
        return productData;
      } catch (error) {
        console.error("❌ Error fetching product:", error);
        // Re-throw with proper error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to fetch product: ${errorMessage}`);
      }
    },
    retry: 3, // Retry failed requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // No fallback data - we only want REAL data from the database

  // Fetch product performance data from API
  const { data: performanceData } = useQuery({
    queryKey: [`/api/products/${productId}/performance`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/performance`);
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return null;
        return await response.json();
      } catch (error) {
        console.error("Error fetching performance data:", error);
        return null;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product competitors from API
  const { data: competitors = [] } = useQuery({
    queryKey: [`/api/products/${productId}/competitors`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/competitors`);
        if (!response.ok) return [];
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching competitors:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product trends from API
  const { data: trends } = useQuery({
    queryKey: [`/api/products/${productId}/trends`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/trends`);
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return null;
        return await response.json();
      } catch (error) {
        console.error("Error fetching trends:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Fetch product reviews from API
  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/products/${productId}/reviews`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/reviews`);
        if (!response.ok) return [];
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product orders from API - REAL DATA ONLY
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/products/${productId}/orders`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/orders`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('Orders API not available:', response.status, response.statusText);
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Orders API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL orders from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product favorites from API
  const { data: favorites = [] } = useQuery({
    queryKey: [`/api/products/${productId}/favorites`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/favorites`);
        if (!response.ok) return [];
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Removed admin RFQ/inquiry/quotation management functionality
  // These are now handled by suppliers directly as per requirements 1.1, 1.2, 1.3

  // Fetch categories for editing from API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/api/categories");
        return data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  // Form setup
  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      categoryId: null,
      specifications: {},
      images: [],
      videos: [],
      minOrderQuantity: 1,
      priceRanges: [],
      sampleAvailable: false,
      samplePrice: null,
      customizationAvailable: false,
      leadTime: "",
      port: "",
      paymentTerms: [],
      inStock: true,
      stockQuantity: 0,
      isPublished: true,
      isFeatured: false,
      tags: [],
      sku: "",
      metaData: null,
    },
  });

  // Update form when product data loads
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        slug: product.slug || "",
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        categoryId: product.categoryId || null,
        specifications: product.specifications || {},
        images: product.images || [],
        videos: product.videos || [],
        minOrderQuantity: product.minOrderQuantity || 1,
        priceRanges: product.priceRanges || [],
        sampleAvailable: product.sampleAvailable || false,
        samplePrice: product.samplePrice || null,
        customizationAvailable: product.customizationAvailable || false,
        leadTime: product.leadTime || "",
        port: product.port || "",
        paymentTerms: product.paymentTerms || [],
        inStock: product.inStock || true,
        stockQuantity: product.stockQuantity || 0,
        isPublished: product.isPublished || true,
        isFeatured: product.isFeatured || false,
        tags: product.tags || [],
        sku: product.sku || "",
        metaData: product.metaData || null,
      });
    }
  }, [product, form]);

  // Price ranges field array
  const { fields: priceRangeFields, append: appendPriceRange, remove: removePriceRange } = useFieldArray({
    control: form.control,
    name: "priceRanges",
  });

  // Note: paymentTerms and tags are handled as arrays in the form, not as field arrays

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertProductSchema>) => {
      const response = await apiRequest("PATCH", `/api/products/${productId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ stockQuantity }: { stockQuantity: number }) => {
      const response = await apiRequest("PATCH", `/api/products/${productId}/stock`, { stockQuantity });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      toast({
        title: "Success",
        description: "Stock updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
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

  const onSubmit = (data: z.infer<typeof insertProductSchema>) => {
    updateProductMutation.mutate(data);
  };

  const handleStockUpdate = (newQuantity: number) => {
    updateStockMutation.mutate({ stockQuantity: newQuantity });
  };

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
          { label: product.name, href: `/admin/products/${product.id}` },
          { label: "Management" }
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
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateProductMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Are you sure you want to delete this product? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteProductMutation.mutate()}
                    disabled={deleteProductMutation.isPending}
                  >
                    Delete Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Out of Stock
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                ({product.stockQuantity || 0} units)
              </span>
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
            {trends?.viewsTrend && (
              <div className="text-xs text-green-600 mt-1">
                +{trends.viewsTrend}% vs last month
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              {inquiries.length || product.inquiries || 0}
            </div>
            {trends?.inquiriesTrend && (
              <div className="text-xs text-green-600 mt-1">
                +{trends.inquiriesTrend}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Package2 className="h-5 w-5 text-purple-500" />
              {orders.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {favorites.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              User favorites
            </div>
          </CardContent>
        </Card>
        
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
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter product name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="product-slug" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shortDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} placeholder="Brief description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} placeholder="Detailed description" rows={6} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="Product SKU" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Product Name</h4>
                        <p className="text-muted-foreground">{product.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Slug</h4>
                        <p className="text-muted-foreground font-mono">{product.slug}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Short Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {product.shortDescription?.replace(/\\n/g, '\n').replace(/@/g, '') || 'No description'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Full Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {product.description?.replace(/\\n/g, '\n').replace(/@/g, '') || 'No description'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Category</h4>
                        <Badge variant="default">{product.categoryName || 'Uncategorized'}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">SKU</h4>
                        <p className="text-muted-foreground font-mono">{product.sku || 'Not set'}</p>
                      </div>
                    </div>
                  )}
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

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Quick Stock Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package2 className="h-5 w-5" />
                    Quick Stock Update
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{product.stockQuantity || 0}</div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStockUpdate((product.stockQuantity || 0) + 10)}
                      disabled={updateStockMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      +10
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStockUpdate(Math.max(0, (product.stockQuantity || 0) - 10))}
                      disabled={updateStockMutation.isPending}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      -10
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStockUpdate((product.stockQuantity || 0) + 50)}
                      disabled={updateStockMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      +50
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStockUpdate(0)}
                      disabled={updateStockMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Status Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">Published</Label>
                    <Switch 
                      id="published"
                      checked={product.isPublished || false}
                      onCheckedChange={(checked) => {
                        if (isEditing) {
                          form.setValue("isPublished", checked);
                        } else {
                          // Quick toggle without editing mode
                          updateProductMutation.mutate({ 
                            ...product, 
                            isPublished: checked 
                          } as any);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured</Label>
                    <Switch 
                      id="featured"
                      checked={product.isFeatured || false}
                      onCheckedChange={(checked) => {
                        if (isEditing) {
                          form.setValue("isFeatured", checked);
                        } else {
                          updateProductMutation.mutate({ 
                            ...product, 
                            isFeatured: checked 
                          } as any);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inStock">In Stock</Label>
                    <Switch 
                      id="inStock"
                      checked={product.inStock || false}
                      onCheckedChange={(checked) => {
                        if (isEditing) {
                          form.setValue("inStock", checked);
                        } else {
                          updateProductMutation.mutate({ 
                            ...product, 
                            inStock: checked 
                          } as any);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">{product.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inquiries:</span>
                    <span className="font-medium">{product.inquiries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(product.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="font-medium">
                      {new Date(product.updatedAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Inventory Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{product.stockQuantity || 0}</div>
                  <div className="text-sm text-blue-600">Current Stock</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{product.minOrderQuantity || 0}</div>
                  <div className="text-sm text-green-600">Minimum Order</div>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                  <div className="text-sm text-orange-600">Status</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Stock Adjustment</h4>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="stockQuantity">Stock Quantity</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={product.stockQuantity || 0}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (!isEditing) {
                          handleStockUpdate(newQuantity);
                        }
                      }}
                      placeholder="Enter stock quantity"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      const currentStock = product.stockQuantity || 0;
                      const input = document.getElementById('stockQuantity') as HTMLInputElement;
                      const newQuantity = parseInt(input.value) || 0;
                      handleStockUpdate(newQuantity);
                    }}
                    disabled={updateStockMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Stock
                  </Button>
                </div>
              </div>

              {(product.stockQuantity || 0) < 10 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700 font-medium">
                      Low Stock Alert: This product is running low on inventory
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Minimum Order Quantity</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{product.minOrderQuantity || 0} units</div>
                    <div className="text-sm text-blue-600">Required minimum order</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Sample Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Sample Available:</span>
                      {product.sampleAvailable ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </div>
                    {product.sampleAvailable && product.samplePrice && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Sample Price: </span>
                        <span className="font-medium">${safeToFixed(product.samplePrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Tiered Pricing</h4>
                {priceRanges.length > 0 ? (
                  <div className="space-y-3">
                    {priceRanges.map((tier, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {tier.minQty?.toLocaleString()} - {tier.maxQty ? tier.maxQty.toLocaleString() : '∞'} units
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {tier.maxQty ? `${((tier.maxQty - tier.minQty) + 1).toLocaleString()} units range` : 'Unlimited quantity'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-green-600">
                              ${safeToFixed(tier.pricePerUnit)}
                            </span>
                            <p className="text-sm text-muted-foreground">per unit</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pricing tiers configured</p>
                    <p className="text-sm">Set up tiered pricing to encourage bulk orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images */}
              <div className="space-y-4">
                <h4 className="font-semibold">Product Images ({product.images?.length || 0})</h4>
                {product.images && product.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((img, idx) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No images available</p>
                    <p className="text-sm mt-1">Add images to make this product more appealing</p>
                  </div>
                )}
              </div>

              {/* Videos */}
              {product.videos && product.videos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Product Videos ({product.videos.length})</h4>
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{product.views || 0}</div>
                    <div className="text-xs text-blue-600">Total Views</div>
                    {performanceData?.viewsChange && (
                      <div className="text-xs text-green-600 mt-1">
                        +{performanceData.viewsChange}% vs last month
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{product.inquiries || 0}</div>
                    <div className="text-xs text-green-600">Inquiries</div>
                    {performanceData?.inquiriesChange && (
                      <div className="text-xs text-green-600 mt-1">
                        +{performanceData.inquiriesChange}% vs last month
                      </div>
                    )}
                  </div>
                </div>
                
                {product.views && product.inquiries && (
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {((product.inquiries / product.views) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-600">Conversion Rate</div>
                    {performanceData?.conversionChange && (
                      <div className="text-xs text-green-600 mt-1">
                        +{performanceData.conversionChange}% vs last month
                  </div>
                )}
                  </div>
                )}

                {/* Additional Performance Metrics */}
                {performanceData && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{performanceData.avgViewTime || '0'}</div>
                      <div className="text-xs text-orange-600">Avg. View Time (min)</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-lg font-bold text-indigo-600">{performanceData.bounceRate || '0'}%</div>
                      <div className="text-xs text-indigo-600">Bounce Rate</div>
                    </div>
                  </div>
                )}

                {/* Real-time Data from API */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{orders.length}</div>
                    <div className="text-xs text-blue-600">Total Orders</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{favorites.length}</div>
                    <div className="text-xs text-green-600">User Favorites</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Featured Status</span>
                    </div>
                    <Badge variant={product.isFeatured ? "default" : "secondary"}>
                      {product.isFeatured ? "Featured" : "Not Featured"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Published Status</span>
                    </div>
                    <Badge variant={product.isPublished ? "default" : "secondary"}>
                      {product.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Stock Status</span>
                    </div>
                    <Badge variant={product.inStock ? "default" : "destructive"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-sm">Engagement Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Favorites:</span>
                      <span className="font-medium">{favorites.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inquiries:</span>
                      <span className="font-medium">{inquiries.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Orders:</span>
                      <span className="font-medium">{orders.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reviews:</span>
                      <span className="font-medium">{reviews.length}</span>
                    </div>
                    {performanceData && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shares:</span>
                          <span className="font-medium">{performanceData.shares || '0'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Return Visitors:</span>
                          <span className="font-medium">{performanceData.returnVisitors || '0'}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Section */}
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{trends.viewsTrend || '0'}%</div>
                    <div className="text-xs text-blue-600">Views Growth (30d)</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{trends.inquiriesTrend || '0'}%</div>
                    <div className="text-xs text-green-600">Inquiries Growth (30d)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{trends.conversionTrend || '0'}%</div>
                    <div className="text-xs text-purple-600">Conversion Growth (30d)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Created</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(product.createdAt || '').toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Last Updated</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(product.updatedAt || '').toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Market Share</span>
                    <span className="text-lg font-bold text-blue-600">
                      {performanceData?.marketShare || '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Price Competitiveness</span>
                    <Badge variant={performanceData?.priceCompetitive ? "default" : "secondary"}>
                      {performanceData?.priceCompetitive ? "Competitive" : "Not Competitive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Quality Rating</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < (performanceData?.qualityRating || 0) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({performanceData?.qualityRating || 0}/5)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trends ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Demand Trend</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          +{trends.demandTrend || '0'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Price Trend</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          +{trends.priceTrend || '0'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Competition Level</span>
                      <Badge variant={trends.competitionLevel === 'high' ? 'destructive' : trends.competitionLevel === 'medium' ? 'default' : 'secondary'}>
                        {trends.competitionLevel || 'Low'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Market trend data not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Competitors Analysis */}
          {competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Competitor Analysis ({competitors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.slice(0, 5).map((competitor: any, index: number) => (
                    <div key={competitor.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {competitor.name?.[0] || 'C'}
                        </div>
                        <div>
                          <h4 className="font-medium">{competitor.name || 'Unknown Competitor'}</h4>
                          <p className="text-sm text-muted-foreground">
                            Price: ${competitor.price || '0'} • Views: {competitor.views || '0'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={competitor.isActive ? "default" : "secondary"} className="text-xs">
                              {competitor.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {competitor.isVerified && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {competitor.marketShare || '0'}% market share
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {competitor.rating || '0'}/5 rating
                        </div>
                      </div>
                    </div>
                  ))}
                  {competitors.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" size="sm">
                        View All Competitors ({competitors.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Market Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>• High conversion rate compared to competitors</li>
                      <li>• Strong customer engagement metrics</li>
                      <li>• Competitive pricing structure</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Opportunities</h4>
                    <ul className="space-y-1 text-sm text-orange-700">
                      <li>• Expand to new geographic markets</li>
                      <li>• Optimize pricing for better margins</li>
                      <li>• Enhance product features based on feedback</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• Consider adjusting pricing strategy based on market trends</p>
                    <p>• Focus on improving product visibility in search results</p>
                    <p>• Monitor competitor activities and adjust strategy accordingly</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Removed Inquiries and Quotations tabs - now handled by suppliers directly */}

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Product Orders ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order: any, index: number) => (
                    <div key={order.id || index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Order #{order.orderNumber || order.id}</h4>
                            <Badge variant={
                              order.status === 'completed' ? 'default' : 
                              order.status === 'processing' ? 'secondary' : 
                              order.status === 'shipped' ? 'default' : 
                              'destructive'
                            }>
                              {order.status || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Buyer: {order.buyerName || 'Unknown'} • 
                            Quantity: {order.quantity || 'N/A'} • 
                            Total: ${order.totalAmount || '0'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Order Date: {new Date(order.createdAt || '').toLocaleDateString()}</span>
                            <span>Expected Delivery: {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Truck className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No orders yet</p>
                  <p className="text-sm">Product orders will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Recent Orders ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order: any, index: number) => (
                      <div key={order.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Order #{order.orderNumber || order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.buyerName || 'Unknown Buyer'} • ${order.totalAmount || 0}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                            {order.status || 'Unknown'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {orders.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm">
                          View All Orders ({orders.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                    <p className="text-sm">Orders will appear here when customers purchase this product</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Product Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Product Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Total Views</p>
                        <p className="text-xs text-muted-foreground">
                          Product visibility metrics
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.views?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Inquiries and quotations are now managed by suppliers directly</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recent Favorites ({favorites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.slice(0, 6).map((favorite: any, index: number) => (
                    <div key={favorite.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{favorite.user?.firstName || 'Unknown'} {favorite.user?.lastName || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {favorite.user?.companyName || 'No company'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(favorite.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {favorites.length > 6 && (
                    <div className="col-span-full text-center pt-2">
                      <Button variant="outline" size="sm">
                        View All Favorites ({favorites.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No favorites yet</p>
                  <p className="text-sm">User favorites will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review: any, index: number) => (
                    <div key={review.id || index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="font-medium text-sm">{review.userName || 'Anonymous'}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < (review.rating || 0) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment || 'No comment'}</p>
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm">
                        View All Reviews ({reviews.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Product Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Shipping & Delivery</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Lead Time</Label>
                      <p className="text-sm text-muted-foreground">{product.leadTime || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label>Shipping Port</Label>
                      <p className="text-sm text-muted-foreground">{product.port || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Payment Terms</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.paymentTerms && product.paymentTerms.length > 0 ? (
                      product.paymentTerms.map((term, idx) => (
                        <Badge key={idx} variant="outline">{term}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No payment terms specified</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Product Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No tags added</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Customization Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sample Available</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sampleAvailable ? `$${safeToFixed(product.samplePrice)}` : 'Not available'}
                      </p>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
