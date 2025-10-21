import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertProductSchema, type Product, type Category } from "@shared/schema";
import type { z } from "zod";
import { ImageUpload } from "@/components/ImageUpload";
import TagInput from "@/components/TagInput";
import KeyValueInput from "@/components/KeyValueInput";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  FileImage,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Filter,
  Download,
  Upload,
  Star,
  CheckCircle,
  XCircle,
  Save,
  BarChart3,
  Package2,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  X,
  ImagePlus,
  Video,
  Tag,
  Truck,
  CreditCard,
  Box,
  Settings,
  Activity,
} from "lucide-react";


export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showInventoryManagement, setShowInventoryManagement] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "low-stock" | "out-of-stock" | "in-stock">("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch products from API - REAL DATA ONLY
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      console.log("Fetching REAL products from database...");
      
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          console.error(`Products API failed: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Products API returned non-JSON response');
          throw new Error('API returned non-JSON response');
        }
        
        const data = await response.json();
        console.log("✅ Successfully fetched REAL products from API:", data);
        
        // Enhance products with category names
        const enhancedProducts = await Promise.all(
          data.map(async (product: Product & { categoryName?: string }) => {
            if (product.categoryId) {
              try {
                const categoryResponse = await fetch(`/api/categories/${product.categoryId}`, {
                  credentials: "include",
                });
                if (categoryResponse.ok) {
                  const categoryData = await categoryResponse.json();
                  product.categoryName = categoryData.name;
                  console.log(`✅ Fetched category for product ${product.id}:`, categoryData.name);
                } else {
                  product.categoryName = "Uncategorized";
                }
              } catch (err) {
                console.error("Error fetching category for product:", product.id, err);
                product.categoryName = "Uncategorized";
              }
            } else {
              product.categoryName = "Uncategorized";
            }
            
            // Ensure priceRanges is properly formatted
            if (!product.priceRanges || !Array.isArray(product.priceRanges) || product.priceRanges.length === 0) {
              product.priceRanges = [{ minQty: 1, maxQty: 99, pricePerUnit: 0 }];
            }
            
            return product;
          })
        );
        
        console.log("✅ Enhanced products with category names:", enhancedProducts);
        return enhancedProducts;
      } catch (error) {
        console.error("❌ Error fetching products:", error);
        throw error; // Re-throw to trigger error state - NO FALLBACK
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch dashboard analytics
  const { data: dashboardAnalytics } = useQuery({
    queryKey: ["/api/admin/dashboard-analytics"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/dashboard-analytics", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
  });

  // Fetch top performing products
  const { data: topProducts = [] } = useQuery({
    queryKey: ["/api/admin/top-products"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/top-products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching top products:", error);
        return [];
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["/api/admin/recent-activities"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/recent-activities", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch categories for dropdown (real data)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched categories from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  // Create/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertProductSchema>) => {
      if (selectedProduct) {
        const response = await fetch(`/api/products/${selectedProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        return await response.json();
      } else {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: `Product ${selectedProduct ? 'updated' : 'created'} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Bulk stock update mutation
  const bulkStockUpdateMutation = useMutation({
    mutationFn: async ({ productIds, stockQuantity }: { productIds: string[], stockQuantity: number }) => {
      const response = await fetch("/api/products/bulk-stock-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productIds, stockQuantity }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setSelectedProducts([]);
      toast({
        title: "Success",
        description: "Stock quantities updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock quantities",
        variant: "destructive",
      });
    },
  });

  // Individual stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stockQuantity }: { productId: string, stockQuantity: number }) => {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stockQuantity }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Stock quantity updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock quantity",
        variant: "destructive",
      });
    },
  });

  // Toggle product status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product status updated.",
      });
    },
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "published" && p.isPublished) ||
      (filterStatus === "draft" && !p.isPublished) ||
      (filterStatus === "featured" && p.isFeatured) ||
      (filterStatus === "out-of-stock" && (!p.inStock || p.stockQuantity === 0));
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Inventory management helpers
  const getInventoryStats = () => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.inStock && (p.stockQuantity || 0) > 0).length;
    const lowStock = products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length;
    const outOfStock = products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => {
      const price = Array.isArray(p.priceRanges) && p.priceRanges.length > 0 
        ? p.priceRanges[0].pricePerUnit || 0 
        : 0;
      return sum + (price * (p.stockQuantity || 0));
    }, 0);

    return { totalProducts, inStock, lowStock, outOfStock, totalValue };
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10);
  };

  const getOutOfStockProducts = () => {
    return products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0);
  };

  const handleBulkStockUpdate = (stockQuantity: number) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select products to update stock quantities.",
        variant: "destructive",
      });
      return;
    }
    
    bulkStockUpdateMutation.mutate({ 
      productIds: selectedProducts, 
      stockQuantity 
    });
  };

  const handleStockUpdate = (productId: string, stockQuantity: number) => {
    updateStockMutation.mutate({ productId, stockQuantity });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const inventoryStats = getInventoryStats();

  // Calculate stats with enhanced metrics
  const stats = {
    total: products.length,
    published: products.filter(p => p.isPublished).length,
    draft: products.filter(p => !p.isPublished).length,
    featured: products.filter(p => p.isFeatured).length,
    outOfStock: products.filter(p => !p.inStock || p.stockQuantity === 0).length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
    totalInquiries: products.reduce((sum, p) => sum + (p.inquiries || 0), 0),
    avgViewsPerProduct: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.views || 0), 0) / products.length) : 0,
    avgInquiriesPerProduct: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + (p.inquiries || 0), 0) / products.length) : 0,
    conversionRate: products.reduce((sum, p) => sum + (p.views || 0), 0) > 0 
      ? ((products.reduce((sum, p) => sum + (p.inquiries || 0), 0) / products.reduce((sum, p) => sum + (p.views || 0), 0)) * 100).toFixed(1)
      : '0.0',
    lowStockProducts: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length,
    highPerformingProducts: products.filter(p => (p.views || 0) > 100 && (p.inquiries || 0) > 5).length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Products" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Product Management</h1>
           
          </div>
          <p className="text-muted-foreground mt-2">Manage your B2B product catalog with pricing tiers and specifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/bulk-upload'}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
              <Button onClick={() => setSelectedProduct(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
            </DialogHeader>
              <ProductForm
                product={selectedProduct}
                categories={categories}
                onSubmit={(data) => saveProductMutation.mutate(data)}
                isLoading={saveProductMutation.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Inventory Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Inventory Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor stock levels, manage inventory, and track product availability
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowInventoryManagement(!showInventoryManagement)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showInventoryManagement ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        
        {showInventoryManagement && (
          <CardContent className="space-y-6">
            {/* Inventory Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{inventoryStats.inStock}</div>
                <div className="text-sm text-blue-600">In Stock</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStock}</div>
                <div className="text-sm text-orange-600">Low Stock</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
                <div className="text-sm text-red-600">Out of Stock</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${inventoryStats.totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">Total Value</div>
              </div>
            </div>

            {/* Inventory Alerts */}
            {(inventoryStats.lowStock > 0 || inventoryStats.outOfStock > 0) && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Inventory Alerts
                </h4>
                <div className="space-y-2">
                  {inventoryStats.lowStock > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-700">
                        {inventoryStats.lowStock} products are running low on stock
                      </span>
                    </div>
                  )}
                  {inventoryStats.outOfStock > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        {inventoryStats.outOfStock} products are out of stock
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedProducts.length} products selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkStockUpdate(100)}
                    disabled={bulkStockUpdateMutation.isPending}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Set Stock to 100
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkStockUpdate(50)}
                    disabled={bulkStockUpdateMutation.isPending}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Set Stock to 50
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkStockUpdate(0)}
                    disabled={bulkStockUpdateMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark Out of Stock
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dashboard Insights */}
      {dashboardAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dashboardAnalytics.totalRevenue || '0'}</div>
                <div className="text-sm text-blue-600">Total Revenue (30d)</div>
                <div className="text-xs text-green-600 mt-1">
                  +{dashboardAnalytics.revenueGrowth || '0'}% vs last month
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dashboardAnalytics.totalOrders || '0'}</div>
                <div className="text-sm text-green-600">Total Orders (30d)</div>
                <div className="text-xs text-green-600 mt-1">
                  +{dashboardAnalytics.ordersGrowth || '0'}% vs last month
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dashboardAnalytics.avgOrderValue || '0'}</div>
                <div className="text-sm text-purple-600">Avg Order Value</div>
                <div className="text-xs text-green-600 mt-1">
                  +{dashboardAnalytics.aovGrowth || '0'}% vs last month
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dashboardAnalytics.conversionRate || '0'}%</div>
                <div className="text-sm text-orange-600">Conversion Rate</div>
                <div className="text-xs text-green-600 mt-1">
                  +{dashboardAnalytics.conversionGrowth || '0'}% vs last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.slice(0, 6).map((product: any, index: number) => (
                <div key={product.id || index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name || 'Unknown Product'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {product.views || 0} views • {product.inquiries || 0} inquiries
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={product.isPublished ? "default" : "secondary"} className="text-xs">
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      +{product.growth || '0'}%
                    </div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity: any, index: number) => (
                <div key={activity.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                    {activity.type?.[0] || 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description || 'Unknown activity'}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                  <Badge variant={activity.severity === 'high' ? 'destructive' : activity.severity === 'medium' ? 'default' : 'secondary'} className="text-xs">
                    {activity.severity || 'low'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 gap-4">
        {/* Total Products - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        
        {/* Published - Green */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.published}</div>
          </CardContent>
        </Card>
        
        {/* Draft - Yellow */}
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-100">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.draft}</div>
          </CardContent>
        </Card>
        
        {/* Featured - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-100">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.featured}</div>
          </CardContent>
        </Card>
        
        {/* Out of Stock - Red */}
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-100">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        
        {/* Total Views - Indigo */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-indigo-100">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        {/* Total Inquiries - Teal */}
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-teal-100">Total Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalInquiries}</div>
            <div className="text-xs text-teal-100 mt-1">Avg: {stats.avgInquiriesPerProduct}/product</div>
          </CardContent>
        </Card>

        {/* Conversion Rate - Indigo */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-indigo-100">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.conversionRate}%</div>
            <div className="text-xs text-indigo-100 mt-1">Views to Inquiries</div>
          </CardContent>
        </Card>

        {/* High Performing - Emerald */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-100">High Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.highPerformingProducts}</div>
            <div className="text-xs text-emerald-100 mt-1">100+ views, 5+ inquiries</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Top Categories by Performance</h4>
              <div className="space-y-2">
                {categories.slice(0, 3).map((category, index) => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id);
                  const categoryViews = categoryProducts.reduce((sum, p) => sum + (p.views || 0), 0);
                  const categoryInquiries = categoryProducts.reduce((sum, p) => sum + (p.inquiries || 0), 0);
                  return (
                    <div key={category.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{category.name}</span>
                      <div className="text-right">
                        <div className="text-xs font-medium">{categoryViews} views</div>
                        <div className="text-xs text-muted-foreground">{categoryInquiries} inquiries</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Performance Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-700">High Performers</span>
                  <Badge variant="default" className="bg-green-600">{stats.highPerformingProducts}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-yellow-700">Medium Performers</span>
                  <Badge variant="secondary">{products.filter(p => (p.views || 0) > 50 && (p.views || 0) <= 100).length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-700">Low Performers</span>
                  <Badge variant="destructive">{products.filter(p => (p.views || 0) <= 50).length}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Feature Top Products
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Optimize Low Performers
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Restock Low Inventory
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Get started by adding your first product"}
              </p>
              {!search && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllProducts();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>MOQ</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    selectedProducts={selectedProducts}
                    onEdit={(p) => {
                      setSelectedProduct(p);
                      setIsDialogOpen(true);
                    }}
                    onDelete={(id) => {
                      if (confirm("Are you sure you want to delete this product?")) {
                        deleteProductMutation.mutate(id);
                      }
                    }}
                    onToggleStatus={(id, isPublished) => toggleStatusMutation.mutate({ id, isPublished })}
                    onToggleSelection={toggleProductSelection}
                    onStockUpdate={handleStockUpdate}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Product Row Component
interface ProductRowProps {
  product: Product & { categoryName?: string };
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isPublished: boolean) => void;
  selectedProducts: string[];
  onToggleSelection: (id: string) => void;
  onStockUpdate: (id: string, quantity: number) => void;
}

function ProductRow({ product, onEdit, onDelete, onToggleStatus, selectedProducts, onToggleSelection, onStockUpdate }: ProductRowProps) {
  const priceRange = product.priceRanges as any[];
  const minPrice = priceRange?.[0]?.pricePerUnit || 0;
  const maxPrice = priceRange?.[priceRange.length - 1]?.pricePerUnit || minPrice;
  
  // Ensure both prices are valid numbers
  const safeMinPrice = typeof minPrice === 'number' ? minPrice : 0;
  const safeMaxPrice = typeof maxPrice === 'number' ? maxPrice : safeMinPrice;

  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          checked={selectedProducts.includes(product.id)}
          onChange={() => onToggleSelection(product.id)}
          className="rounded border-gray-300"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {product.shortDescription}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono">{product.sku || 'N/A'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{product.categoryName || 'Uncategorized'}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{product.minOrderQuantity} units</Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          ${safeMinPrice.toFixed(2)} - ${safeMaxPrice.toFixed(2)}
        </div>
      </TableCell>
      <TableCell>
        {product.inStock ? (
          <div className="flex items-center gap-2">
            <div className="text-sm">
              <span className={`font-medium ${
                (product.stockQuantity || 0) < 10 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {product.stockQuantity || 0}
              </span>
              <span className="text-muted-foreground"> units</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onStockUpdate(product.id, (product.stockQuantity || 0) + 10)}
              >
                +
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onStockUpdate(product.id, Math.max(0, (product.stockQuantity || 0) - 10))}
              >
                -
              </Button>
            </div>
          </div>
        ) : (
          <Badge variant="destructive">Out of Stock</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {product.views || 0} views
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Switch
            checked={product.isPublished || false}
            onCheckedChange={(checked) => onToggleStatus(product.id, checked)}
          />
          {product.isFeatured && (
            <Badge variant="default" className="w-fit">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/admin/products/${product.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/admin/products/${product.id}/manage`}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Product
            </DropdownMenuItem>
          
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Product Form Component
interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onSubmit: (data: z.infer<typeof insertProductSchema>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function ProductForm({ product, categories, onSubmit, isLoading, onCancel }: ProductFormProps) {
  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      shortDescription: product?.shortDescription || "",
      description: product?.description || "",
      categoryId: product?.categoryId || null,
      specifications: product?.specifications || {},
      images: product?.images || [],
      videos: product?.videos || [],
      minOrderQuantity: product?.minOrderQuantity || 1,
      priceRanges: product?.priceRanges || [{ minQty: 1, maxQty: 99, pricePerUnit: 0 }],
      sampleAvailable: product?.sampleAvailable ?? false,
      samplePrice: product?.samplePrice || "",
      customizationAvailable: product?.customizationAvailable ?? false,
      customizationDetails: product?.customizationDetails || "",
      leadTime: product?.leadTime || "",
      port: product?.port || "",
      paymentTerms: product?.paymentTerms || [],
      inStock: product?.inStock ?? true,
      stockQuantity: product?.stockQuantity || 0,
      isPublished: product?.isPublished ?? true,
      isFeatured: product?.isFeatured ?? false,
      colors: product?.colors || [],
      sizes: product?.sizes || [],
      keyFeatures: product?.keyFeatures || [],
      certifications: product?.certifications || [],
      hasTradeAssurance: product?.hasTradeAssurance ?? false,
      tags: product?.tags || [],
      sku: product?.sku || "",
      metaData: product?.metaData || null,
    },
  });

  // Price ranges field array
  const { fields: priceRangeFields, append: appendPriceRange, remove: removePriceRange } = useFieldArray({
    control: form.control,
    name: "priceRanges" as any,
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!product) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      form.setValue("slug", slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & MOQ</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Industrial LED Flood Lights 100W"
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="product-url-slug" />
                    </FormControl>
                    <FormDescription>Used in product URLs</FormDescription>
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
                      <Input {...field} value={field.value || ""} placeholder="PROD-001" />
                </FormControl>
                    <FormDescription>Stock Keeping Unit</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.filter(cat => cat.id && cat.name).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
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
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Brief product description..."
                      rows={2}
                    />
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
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Detailed product description..."
                      rows={6}
                    />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          </TabsContent>

          {/* Pricing & MOQ Tab */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
        <FormField
          control={form.control}
              name="minOrderQuantity"
          render={({ field }) => (
            <FormItem>
                  <FormLabel>Minimum Order Quantity (MOQ) *</FormLabel>
              <FormControl>
                    <Input
                  {...field} 
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
                  <FormDescription>Minimum units per order</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Price Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPriceRange({ minQty: 0, maxQty: 0, pricePerUnit: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>
              {priceRangeFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 border rounded">
                  <div>
                    <Label className="text-xs">Min Qty</Label>
                    <Input
                      type="number"
                      {...form.register(`priceRanges.${index}.minQty` as any)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Qty</Label>
                    <Input
                      type="number"
                      {...form.register(`priceRanges.${index}.maxQty` as any)}
                      placeholder="99"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price/Unit ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`priceRanges.${index}.pricePerUnit` as any)}
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePriceRange(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
                name="sampleAvailable"
            render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sample Available</FormLabel>
                      <FormDescription>Allow customers to order samples</FormDescription>
                    </div>
                <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
                name="samplePrice"
            render={({ field }) => (
              <FormItem>
                    <FormLabel>Sample Price ($)</FormLabel>
                <FormControl>
                      <Input {...field} value={field.value || ""} type="text" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            </div>

            <FormField
              control={form.control}
              name="customizationAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Customization Available</FormLabel>
                    <FormDescription>Product can be customized</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g., 15-20 days" />
                    </FormControl>
                    <FormDescription>Production & delivery time</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Port</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g., Shanghai/Ningbo" />
                    </FormControl>
                    <FormDescription>Departure port</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">In Stock</FormLabel>
                      <FormDescription>Product availability</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                </FormControl>
                    <FormDescription>Available units</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

            {/* Colors */}
            <TagInput
              label="Available Colors"
              description="Enter colors for this product"
              placeholder="Type color name and press Enter"
              value={form.watch("colors") || []}
              onChange={(colors) => form.setValue("colors", colors as any)}
              maxTags={10}
            />

            {/* Sizes */}
            <TagInput
              label="Available Sizes"
              description="Enter sizes for this product (e.g., S, M, L, XL or 250g, 500g, 1kg)"
              placeholder="Type size and press Enter"
              value={form.watch("sizes") || []}
              onChange={(sizes) => form.setValue("sizes", sizes as any)}
              maxTags={15}
            />

            {/* Key Features */}
            <TagInput
              label="Key Features"
              description="Enter key features that highlight this product's benefits"
              placeholder="Type feature and press Enter"
              value={form.watch("keyFeatures") || []}
              onChange={(features) => form.setValue("keyFeatures", features as any)}
              maxTags={20}
            />

            {/* Certifications */}
            <TagInput
              label="Certifications"
              description="Enter product certifications and standards (e.g., ISO9001, CE, RoHS, FDA)"
              placeholder="Type certification and press Enter"
              value={form.watch("certifications") || []}
              onChange={(certifications) => form.setValue("certifications", certifications as any)}
              maxTags={10}
            />

            {/* Customization Details */}
            <FormField
              control={form.control}
              name="customizationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customization Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe available customization options..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Details about how this product can be customized</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trade Assurance */}
            <FormField
              control={form.control}
              name="hasTradeAssurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Trade Assurance</FormLabel>
                    <FormDescription>This product is covered by trade assurance</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <TagInput
              label="Payment Terms"
              description="Enter payment terms accepted for this product"
              placeholder="Type payment term and press Enter"
              value={form.watch("paymentTerms") || []}
              onChange={(paymentTerms) => form.setValue("paymentTerms", paymentTerms as any)}
              maxTags={10}
            />

            <TagInput
              label="Tags"
              description="Enter tags to categorize and search for this product"
              placeholder="Type tag and press Enter"
              value={form.watch("tags") || []}
              onChange={(tags) => form.setValue("tags", tags as any)}
              maxTags={15}
            />
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <ImageUpload
                    value={(field.value as string[]) || []}
                    onChange={field.onChange}
                    maxImages={10}
                    label="Product Images"
                    description="Upload product images (max 5MB each, JPEG/PNG/GIF/WebP, recommended: 800x800px)"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Product Videos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentVideos = form.getValues("videos") || [];
                    form.setValue("videos", [...currentVideos, ""]);
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Video URL
                </Button>
              </div>
              <FormDescription>Add YouTube or Vimeo video URLs</FormDescription>
              
              {(form.watch("videos") || []).map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.watch(`videos.${index}` as any) || ""}
                    onChange={(e) => {
                      const videos = form.getValues("videos") || [];
                      videos[index] = e.target.value;
                      form.setValue("videos", videos);
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const videos = (form.getValues("videos") || []).filter((_, i) => i !== index);
                      form.setValue("videos", videos);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Published</FormLabel>
                      <FormDescription>Make product visible on website</FormDescription>
                    </div>
                <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Featured</FormLabel>
                      <FormDescription>Show in featured products</FormDescription>
                    </div>
                <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

            <KeyValueInput
              label="Specifications"
              description="Enter product technical specifications as key-value pairs"
              value={(() => {
                const specs = form.watch("specifications");
                if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
                  return specs as Record<string, string>;
                }
                return {};
              })()}
              onChange={(specifications) => form.setValue("specifications", specifications as any)}
              maxPairs={20}
            />
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
