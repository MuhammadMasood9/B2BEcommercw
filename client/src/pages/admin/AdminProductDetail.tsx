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
  Heart,
  Download,
  Mail,
  Filter,
  Search,
  MoreHorizontal,
  UserCheck,
  Clock,
  BarChart3,
  Award,
} from "lucide-react";

export default function AdminProductDetail() {
  const [, params] = useRoute("/admin/products/:productId");
  const productId = params?.productId || "1";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Favorite management state - must be at the top before any early returns
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState("all"); // all, recent, verified, unverified


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

  // Fetch favorites data from API - REAL DATA ONLY
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: [`/api/products/${productId}/favorites`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/favorites`);
        if (!response.ok) {
          console.warn('Favorites API not available');
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Favorites API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL favorites from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch related products from API - REAL DATA ONLY
  const { data: relatedProducts = [] } = useQuery({
    queryKey: [`/api/products/${productId}/related`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/related`);
        if (!response.ok) {
          console.warn('Related products API not available');
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Related products API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL related products from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching related products:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product analytics from API - REAL DATA ONLY
  const { data: analytics } = useQuery({
    queryKey: [`/api/products/${productId}/analytics`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/products/${productId}/analytics`);
        if (!response.ok) {
          console.warn('Analytics API not available');
          return null;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Analytics API returned non-JSON');
          return null;
        }
        const data = await response.json();
        console.log("✅ Fetched REAL analytics from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching analytics:", error);
        return null;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product inquiries from API - REAL DATA ONLY
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: [`/api/products/${productId}/inquiries`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/inquiries`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('Inquiries API not available:', response.status, response.statusText);
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Inquiries API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL inquiries from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product quotations from API - REAL DATA ONLY
  const { data: quotations = [], isLoading: quotationsLoading } = useQuery({
    queryKey: [`/api/products/${productId}/quotations`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/quotations`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('Quotations API not available:', response.status, response.statusText);
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Quotations API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL quotations from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching quotations:", error);
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

  // Fetch product reviews from API - REAL DATA ONLY
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: [`/api/products/${productId}/reviews`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('Reviews API not available:', response.status, response.statusText);
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Reviews API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL reviews from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product RFQs from API - REAL DATA ONLY
  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery({
    queryKey: [`/api/products/${productId}/rfqs`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/rfqs`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('RFQs API not available:', response.status, response.statusText);
          return [];
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('RFQs API returned non-JSON');
          return [];
        }
        const data = await response.json();
        console.log("✅ Fetched REAL RFQs from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching RFQs:", error);
        return [];
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch product performance metrics from API - REAL DATA ONLY
  const { data: performanceMetrics } = useQuery({
    queryKey: [`/api/products/${productId}/performance`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}/performance`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.warn('Performance API not available:', response.status, response.statusText);
          return null;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Performance API returned non-JSON');
          return null;
        }
        const data = await response.json();
        console.log("✅ Fetched REAL performance metrics from API:", data);
        return data;
      } catch (error) {
        console.error("Error fetching performance metrics:", error);
        return null;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
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

  // Filter favorites based on search and filter criteria
  const filteredFavorites = favorites.filter((favorite: any) => {
    const matchesSearch = favoriteSearchQuery === "" || 
      favorite.user?.firstName?.toLowerCase().includes(favoriteSearchQuery.toLowerCase()) ||
      favorite.user?.lastName?.toLowerCase().includes(favoriteSearchQuery.toLowerCase()) ||
      favorite.user?.companyName?.toLowerCase().includes(favoriteSearchQuery.toLowerCase()) ||
      favorite.user?.email?.toLowerCase().includes(favoriteSearchQuery.toLowerCase());
    
    const matchesFilter = favoriteFilter === "all" ||
      (favoriteFilter === "verified" && favorite.user?.isVerified) ||
      (favoriteFilter === "unverified" && !favorite.user?.isVerified) ||
      (favoriteFilter === "recent" && new Date(favorite.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  // Favorite statistics
  const favoriteStats = {
    total: favorites.length,
    verified: favorites.filter((f: any) => f.user?.isVerified).length,
    unverified: favorites.filter((f: any) => !f.user?.isVerified).length,
    recent: favorites.filter((f: any) => new Date(f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    countries: Array.from(new Set(favorites.map((f: any) => f.user?.country).filter(Boolean))).length
  };

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
              <Eye className="h-5 w-5 text-primary" />
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

      {/* Enhanced Status Cards with Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <Eye className="h-5 w-5 text-primary" />
              {product.views?.toLocaleString() || 0}
            </div>
            {performanceMetrics?.viewsTrend && (
              <div className="text-xs text-green-600 mt-1">
                +{performanceMetrics.viewsTrend}% vs last month
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
            {performanceMetrics?.inquiriesTrend && (
              <div className="text-xs text-green-600 mt-1">
                +{performanceMetrics.inquiriesTrend}% vs last month
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
              <Package className="h-5 w-5 text-purple-500" />
              {orders.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              {quotations.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Active quotes
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {reviews.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Customer reviews
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="quotations">Quotations ({quotations.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {product.shortDescription?.replace(/\\n/g, '\n').replace(/@/g, '') || 'No description'}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Full Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {product.description?.replace(/\\n/g, '\n').replace(/@/g, '') || 'No description'}
                        </p>
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
              <div className="p-4 bg-primary border border-primary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-primary">Minimum Order Quantity</p>
                </div>
                <p className="text-2xl font-bold text-primary">{product.minOrderQuantity?.toLocaleString() || 0} units</p>
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
                            ${Number(tier.pricePerUnit || 0).toFixed(2)}
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
                        ${Math.min(...priceRanges.map(tier => Number(tier.pricePerUnit || 0))).toFixed(2)} per unit
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
                  {product.sampleAvailable && product.samplePrice && (
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
                <div>
                  <p className="font-medium">Customization</p>
                  {product.customizationAvailable && product.customizationDetails && (
                    <p className="text-xs text-muted-foreground mt-1">{product.customizationDetails}</p>
                  )}
                </div>
                {product.customizationAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <p className="font-medium">Trade Assurance</p>
                {product.hasTradeAssurance ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Variants */}
          {((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Available Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color, idx) => (
                        <Badge key={idx} variant="secondary">{color}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size, idx) => (
                        <Badge key={idx} variant="outline">{size}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {product.certifications && product.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Features */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.keyFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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
                <div className="text-center p-3 bg-primary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{product.views?.toLocaleString() || 0}</div>
                  <div className="text-xs text-primary">Total Views</div>
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

              {/* Dynamic Analytics Data */}
              {analytics && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-lg font-bold text-orange-600">{analytics.avgViewTime || '0'}</div>
                      <div className="text-xs text-muted-foreground">Avg. View Time (min)</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-lg font-bold text-orange-600">{analytics.bounceRate || '0'}%</div>
                      <div className="text-xs text-muted-foreground">Bounce Rate</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-lg font-bold text-pink-600">{analytics.favorites || '0'}</div>
                      <div className="text-xs text-muted-foreground">Favorites</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-lg font-bold text-teal-600">{analytics.shares || '0'}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                  </div>
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

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Related Products ({relatedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedProducts.slice(0, 4).map((relatedProduct: any) => (
                    <div key={relatedProduct.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      {relatedProduct.images?.[0] ? (
                        <img
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{relatedProduct.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {relatedProduct.views || 0} views • {relatedProduct.inquiries || 0} inquiries
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={relatedProduct.isPublished ? "default" : "secondary"} className="text-xs">
                            {relatedProduct.isPublished ? "Published" : "Draft"}
                          </Badge>
                          {relatedProduct.isFeatured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/admin/products/${relatedProduct.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {relatedProducts.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      View All Related Products ({relatedProducts.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
        </TabsContent>

        {/* Inquiries Tab */}
      <TabsContent value="inquiries" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Product Inquiries ({inquiries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inquiriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading inquiries...</p>
              </div>
            ) : inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry: any, index: number) => (
                  <div key={inquiry.id || index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{inquiry.buyerName || 'Unknown Buyer'}</h4>
                          <Badge variant={inquiry.status === 'responded' ? 'default' : 'secondary'}>
                            {inquiry.status || 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{inquiry.message || 'No message'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Company: {inquiry.companyName || 'N/A'}</span>
                          <span>Email: {inquiry.email || 'N/A'}</span>
                          <span>Date: {new Date(inquiry.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No inquiries yet</p>
                <p className="text-sm">Customer inquiries will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Quotations Tab */}
      <TabsContent value="quotations" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Product Quotations ({quotations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading quotations...</p>
              </div>
            ) : quotations.length > 0 ? (
              <div className="space-y-4">
                {quotations.map((quotation: any, index: number) => (
                  <div key={quotation.id || index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Quote #{quotation.quoteNumber || quotation.id}</h4>
                          <Badge variant={
                            quotation.status === 'accepted' ? 'default' : 
                            quotation.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }>
                            {quotation.status || 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Buyer: {quotation.buyerName || 'Unknown'} • 
                          Quantity: {quotation.quantity || 'N/A'} • 
                          Price: ${quotation.totalPrice || '0'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Valid Until: {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}</span>
                          <span>Created: {new Date(quotation.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No quotations yet</p>
                <p className="text-sm">Product quotations will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Orders Tab */}
      <TabsContent value="orders" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">Product orders will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Product Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any, index: number) => (
                  <div key={review.id || index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {review.userName?.[0] || 'U'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{review.userName || 'Anonymous'}</h4>
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
                            <span className="text-xs text-muted-foreground ml-1">
                              ({review.rating || 0}/5)
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment || 'No comment'}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.slice(0, 3).map((img: string, idx: number) => (
                          <img key={idx} src={img} alt={`Review image ${idx + 1}`} className="h-16 w-16 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No reviews yet</p>
                <p className="text-sm">Customer reviews will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                <span className="text-sm font-medium">
                  {product.views && product.inquiries ? 
                    ((product.inquiries / product.views) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Rating:</span>
                <span className="text-sm font-medium">
                  {reviews.length > 0 ? 
                    (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue:</span>
                <span className="text-sm font-medium">
                  ${orders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: 'inquiry', count: inquiries.length, label: 'New Inquiries' },
                { type: 'order', count: orders.length, label: 'Orders' },
                { type: 'review', count: reviews.length, label: 'Reviews' },
                { type: 'quotation', count: quotations.length, label: 'Quotations' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {performanceMetrics ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Views Trend:</span>
                    <span className={`text-sm font-medium ${performanceMetrics.viewsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performanceMetrics.viewsTrend > 0 ? '+' : ''}{performanceMetrics.viewsTrend || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Inquiries Trend:</span>
                    <span className={`text-sm font-medium ${performanceMetrics.inquiriesTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performanceMetrics.inquiriesTrend > 0 ? '+' : ''}{performanceMetrics.inquiriesTrend || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Trend:</span>
                    <span className={`text-sm font-medium ${performanceMetrics.conversionTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performanceMetrics.conversionTrend > 0 ? '+' : ''}{performanceMetrics.conversionTrend || 0}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Performance data not available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>

      {/* Favorite Management Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Favorite Management
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Notify All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users ({favoriteStats.total})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Favorite Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{favoriteStats.total}</div>
                    <div className="text-xs text-red-600">Total Favorites</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{favoriteStats.verified}</div>
                    <div className="text-xs text-green-600">Verified Users</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{favoriteStats.unverified}</div>
                    <div className="text-xs text-yellow-600">Unverified</div>
                  </div>
                  <div className="text-center p-3 bg-primary rounded-lg">
                    <div className="text-2xl font-bold text-primary">{favoriteStats.recent}</div>
                    <div className="text-xs text-primary">This Week</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{favoriteStats.countries}</div>
                    <div className="text-xs text-purple-600">Countries</div>
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Array.from(new Set(favorites.map((f: any) => f.user?.country).filter(Boolean))).slice(0, 3).map((country: any, idx: number) => {
                          const count = favorites.filter((f: any) => f.user?.country === country).length;
                          return (
                            <div key={country || idx} className="flex justify-between items-center">
                              <span className="text-sm">{country}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {favorites
                          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 3)
                          .map((favorite: any) => (
                            <div key={favorite.id} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {favorite.user?.firstName?.[0] || 'U'}
                              </div>
                              <span className="text-muted-foreground">
                                {favorite.user?.firstName || 'Unknown'} favorited this product
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(favorite.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users by name, company, or email..."
                      value={favoriteSearchQuery}
                      onChange={(e) => setFavoriteSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={favoriteFilter}
                      onChange={(e) => setFavoriteFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                    >
                      <option value="all">All Users</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                      <option value="recent">Recent (7 days)</option>
                    </select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>

                {/* Favorites List */}
                <div className="space-y-3">
                  {favoritesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading favorites...</p>
                    </div>
                  ) : filteredFavorites.length > 0 ? (
                    filteredFavorites.map((favorite: any) => (
                      <div key={favorite.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {favorite.user?.firstName?.[0] || 'U'}{favorite.user?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {favorite.user?.firstName || 'Unknown'} {favorite.user?.lastName || 'User'}
                              </h4>
                              {favorite.user?.isVerified && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{favorite.user?.companyName || 'No company'}</p>
                            <p className="text-xs text-muted-foreground">{favorite.user?.email || 'No email'}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {favorite.user?.country || 'Unknown'}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Favorited {new Date(favorite.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                Last active {favorite.user?.lastActive ? new Date(favorite.user.lastActive).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No favorites found</h3>
                      <p className="text-muted-foreground">
                        {favoriteSearchQuery || favoriteFilter !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "This product hasn't been favorited by any users yet"
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredFavorites.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredFavorites.length} of {favorites.length} favorites
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Favorites Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">
                            {analytics?.favoritesOverTime ? 'Chart data available' : 'Chart visualization would go here'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Geographic Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {favorites.length > 0 ? (
                          Array.from(new Set(favorites.map((f: any) => f.user?.country).filter(Boolean))).map((country: any) => {
                            const count = favorites.filter((f: any) => f.user?.country === country).length;
                            const percentage = (count / favorites.length) * 100;
                            return (
                              <div key={country || 'unknown'} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{country}</span>
                                  <span>{count} ({percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">No geographic data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Analytics */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Engagement Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg. Session Duration:</span>
                          <span className="text-sm font-medium">{analytics.avgSessionDuration || '0'} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Page Views per Session:</span>
                          <span className="text-sm font-medium">{analytics.pageViewsPerSession || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Return Visitor Rate:</span>
                          <span className="text-sm font-medium">{analytics.returnVisitorRate || '0'}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Conversion Funnel</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Views to Inquiries:</span>
                          <span className="text-sm font-medium">{analytics.viewsToInquiries || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Inquiries to Orders:</span>
                          <span className="text-sm font-medium">{analytics.inquiriesToOrders || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Overall Conversion:</span>
                          <span className="text-sm font-medium">{analytics.overallConversion || '0'}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Views (7d):</span>
                          <span className="text-sm font-medium text-green-600">+{analytics.viewsChange7d || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Inquiries (7d):</span>
                          <span className="text-sm font-medium text-green-600">+{analytics.inquiriesChange7d || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Favorites (7d):</span>
                          <span className="text-sm font-medium text-green-600">+{analytics.favoritesChange7d || '0'}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bulk Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Favorites List
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Product Update
                      </Button>
                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Notify Price Changes
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Package className="h-4 w-4 mr-2" />
                        Notify Stock Updates
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Notify New Features
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

