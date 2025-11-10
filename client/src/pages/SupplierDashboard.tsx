import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import SupplierProductForm from "@/components/supplier/SupplierProductForm";
import SupplierStoreManagement from "@/components/supplier/SupplierStoreManagement";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Package,
  Plus,
  FileText,
  DollarSign,
  ShoppingCart,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  Send,
  Reply,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Store,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  MapPin,
  Phone,
  Mail,
  Building
} from "lucide-react";

interface SupplierStats {
  totalProducts: number;
  productViews: number;
  inquiriesReceived: number;
  quotationsSent: number;
  ordersReceived: number;
  responseRate: number;
  averageRating: number;
  totalRevenue: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  images: string[];
  priceRanges: Array<{
    minQty: number;
    maxQty: number;
    pricePerUnit: number;
  }>;
  specifications: Record<string, any>;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  inStock: boolean;
  stockQuantity: number;
  views: number;
  inquiries: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  moq?: number;
  leadTime?: string;
  shippingInfo?: string;
}

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  quantity: number;
  targetPrice: number;
  urgency: string;
  status: 'pending' | 'replied' | 'quoted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  targetPrice: number;
  deadline: string;
  location: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  status: 'open' | 'closed';
  createdAt: string;
}

interface Quotation {
  id: string;
  inquiryId?: string;
  rfqId?: string;
  buyerId: string;
  buyerName: string;
  productId?: string;
  productName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  validUntil: string;
  terms: string;
  notes?: string;
  status: 'sent' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: any;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [quotationForm, setQuotationForm] = useState({
    items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    totalAmount: 0,
    validUntil: '',
    terms: '',
    notes: ''
  });

  // Redirect if not supplier
  useEffect(() => {
    if (user && user.role !== 'supplier') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch supplier dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<SupplierStats>({
    queryKey: ['/api/suppliers/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/dashboard/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch supplier products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/suppliers/products'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/products', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch supplier inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/suppliers/inquiries'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/inquiries', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch supplier RFQs
  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery<RFQ[]>({
    queryKey: ['/api/suppliers/rfqs'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/rfqs', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch supplier quotations
  const { data: quotations = [], isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ['/api/suppliers/quotations'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotations', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Fetch supplier orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/suppliers/orders'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/orders', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user && user.role === 'supplier',
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await fetch('/api/suppliers/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/dashboard/stats'] });
      toast({ title: "Success", description: "Product created successfully" });
      setIsProductDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: any }) => {
      const response = await fetch(`/api/suppliers/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/products'] });
      toast({ title: "Success", description: "Product updated successfully" });
      setIsProductDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/suppliers/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/dashboard/stats'] });
      toast({ title: "Success", description: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: string; status: string; trackingNumber?: string }) => {
      const response = await fetch(`/api/suppliers/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, trackingNumber }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/orders'] });
      toast({ title: "Success", description: "Order status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Send quotation mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      const response = await fetch('/api/suppliers/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quotationData),
      });
      if (!response.ok) throw new Error('Failed to send quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/inquiries'] });
      toast({ title: "Success", description: "Quotation sent successfully" });
      setIsQuotationDialogOpen(false);
      setSelectedInquiry(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reply to inquiry mutation
  const replyToInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, message }: { inquiryId: string; message: string }) => {
      const response = await fetch(`/api/suppliers/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to reply to inquiry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/inquiries'] });
      toast({ title: "Success", description: "Reply sent successfully" });
      setIsInquiryDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Calculate dashboard metrics
  const dashboardStats = {
    totalProducts: products.length,
    publishedProducts: products.filter(p => p.isPublished).length,
    pendingApproval: products.filter(p => p.approvalStatus === 'pending').length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
    totalInquiries: inquiries.length,
    pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
    quotationsSent: quotations.length,
    acceptedQuotations: quotations.filter(q => q.status === 'accepted').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': case 'accepted': case 'confirmed': case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': case 'cancelled': case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': case 'shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'approved': case 'accepted': case 'confirmed': case 'delivered': return CheckCircle;
      case 'rejected': case 'cancelled': case 'failed': return XCircle;
      case 'processing': case 'shipped': return Clock;
      default: return AlertCircle;
    }
  };

  const handleProductSubmit = (productData: any) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleQuotationSubmit = () => {
    if (!selectedInquiry) return;
    
    const quotationData = {
      inquiryId: selectedInquiry.id,
      buyerId: selectedInquiry.buyerId,
      items: quotationForm.items,
      totalAmount: quotationForm.totalAmount,
      validUntil: quotationForm.validUntil,
      terms: quotationForm.terms,
      notes: quotationForm.notes,
    };
    
    sendQuotationMutation.mutate(quotationData);
  };

  if (!user || user.role !== 'supplier') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Supplier Dashboard</h1>
              <p className="text-muted-foreground">Manage your products, orders, and customer relationships</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab("products")}>
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedProduct(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>
                  <SupplierProductForm
                    product={selectedProduct}
                    categories={categories}
                    onSubmit={handleProductSubmit}
                    onCancel={() => {
                      setIsProductDialogOpen(false);
                      setSelectedProduct(null);
                    }}
                    isLoading={createProductMutation.isPending || updateProductMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboardStats.publishedProducts}/{dashboardStats.totalProducts}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-2xl font-bold">{dashboardStats.totalProducts}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    +{Math.round(dashboardStats.totalViews * 0.15)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Product Views</p>
                <p className="text-2xl font-bold">{dashboardStats.totalViews.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboardStats.pendingInquiries} pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Inquiries</p>
                <p className="text-2xl font-bold">{dashboardStats.totalInquiries}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboardStats.completedOrders} orders
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">${dashboardStats.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="store">Store</TabsTrigger>
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Inquiries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recent Inquiries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inquiriesLoading ? (
                        <div className="text-center py-4 text-gray-500">Loading inquiries...</div>
                      ) : inquiries.slice(0, 5).map((inquiry) => {
                        const StatusIcon = getStatusIcon(inquiry.status);
                        return (
                          <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{inquiry.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {inquiry.buyerName} • {inquiry.buyerCompany}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {inquiry.quantity} • {new Date(inquiry.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(inquiry.status)}>
                                {inquiry.status}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedInquiry(inquiry);
                                setIsInquiryDialogOpen(true);
                              }}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {inquiries.length === 0 && (
                        <div className="text-center py-4 text-gray-500">No inquiries yet</div>
                      )}
                    </div>
                    {inquiries.length > 5 && (
                      <Button 
                        className="w-full mt-4" 
                        variant="outline" 
                        onClick={() => setActiveTab("inquiries")}
                      >
                        View All Inquiries
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {ordersLoading ? (
                        <div className="text-center py-4 text-gray-500">Loading orders...</div>
                      ) : orders.slice(0, 5).map((order) => {
                        const StatusIcon = getStatusIcon(order.status);
                        return (
                          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">#{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.buyerName} • {order.buyerCompany}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${order.totalAmount.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedOrder(order);
                                setIsOrderDialogOpen(true);
                              }}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && (
                        <div className="text-center py-4 text-gray-500">No orders yet</div>
                      )}
                    </div>
                    {orders.length > 5 && (
                      <Button 
                        className="w-full mt-4" 
                        variant="outline" 
                        onClick={() => setActiveTab("orders")}
                      >
                        View All Orders
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dashboardStats.quotationsSent}</div>
                      <div className="text-sm text-blue-600">Quotations Sent</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dashboardStats.acceptedQuotations}</div>
                      <div className="text-sm text-green-600">Accepted</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{dashboardStats.pendingApproval}</div>
                      <div className="text-sm text-orange-600">Pending Approval</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {dashboardStats.totalInquiries > 0 ? 
                          Math.round((dashboardStats.quotationsSent / dashboardStats.totalInquiries) * 100) : 0}%
                      </div>
                      <div className="text-sm text-purple-600">Response Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Product Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your product catalog</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedProduct(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedProduct ? 'Edit Product' : 'Add New Product'}
                        </DialogTitle>
                      </DialogHeader>
                      <SupplierProductForm
                        product={selectedProduct}
                        categories={categories}
                        onSubmit={handleProductSubmit}
                        onCancel={() => {
                          setIsProductDialogOpen(false);
                          setSelectedProduct(null);
                        }}
                        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input placeholder="Search products..." className="pl-10" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="pending">Pending Approval</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Inquiries</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading products...
                          </TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="w-8 h-8 text-gray-400" />
                              <p className="text-gray-500">No products yet</p>
                              <Button onClick={() => setIsProductDialogOpen(true)}>
                                Add Your First Product
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => {
                          const StatusIcon = getStatusIcon(product.approvalStatus);
                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {product.images?.[0] ? (
                                      <img 
                                        src={product.images[0]} 
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      MOQ: {product.moq || 1}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.categoryName || 'Uncategorized'}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <Badge className={getStatusColor(product.approvalStatus)}>
                                    {product.approvalStatus}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{product.views || 0}</TableCell>
                              <TableCell>{product.inquiries || 0}</TableCell>
                              <TableCell>
                                <Badge variant={product.inStock ? "default" : "secondary"}>
                                  {product.inStock ? `${product.stockQuantity} in stock` : 'Out of stock'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedProduct(product);
                                      setIsProductDialogOpen(true);
                                    }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => deleteProductMutation.mutate(product.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Store Tab */}
            <TabsContent value="store" className="space-y-6">
              <SupplierStoreManagement />
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Inquiry Management</h3>
                  <p className="text-sm text-muted-foreground">Manage buyer inquiries and send quotations</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inquiries</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Target Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiriesLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading inquiries...
                          </TableCell>
                        </TableRow>
                      ) : inquiries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <MessageSquare className="w-8 h-8 text-gray-400" />
                              <p className="text-gray-500">No inquiries yet</p>
                              <p className="text-sm text-gray-400">Inquiries will appear here when buyers contact you</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        inquiries.map((inquiry) => {
                          const StatusIcon = getStatusIcon(inquiry.status);
                          return (
                            <TableRow key={inquiry.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{inquiry.productName}</p>
                                  <p className="text-sm text-muted-foreground">{inquiry.urgency}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{inquiry.buyerName}</p>
                                  <p className="text-sm text-muted-foreground">{inquiry.buyerCompany}</p>
                                </div>
                              </TableCell>
                              <TableCell>{inquiry.quantity.toLocaleString()}</TableCell>
                              <TableCell>${inquiry.targetPrice.toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <Badge className={getStatusColor(inquiry.status)}>
                                    {inquiry.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedInquiry(inquiry);
                                      setIsInquiryDialogOpen(true);
                                    }}
                                  >
                                    <Reply className="w-4 h-4 mr-1" />
                                    Reply
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedInquiry(inquiry);
                                      setIsQuotationDialogOpen(true);
                                    }}
                                  >
                                    <Send className="w-4 h-4 mr-1" />
                                    Quote
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quotations Tab */}
            <TabsContent value="quotations" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Quotation Management</h3>
                  <p className="text-sm text-muted-foreground">Track your sent quotations and their status</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quotations</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation ID</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotationsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading quotations...
                          </TableCell>
                        </TableRow>
                      ) : quotations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="w-8 h-8 text-gray-400" />
                              <p className="text-gray-500">No quotations yet</p>
                              <p className="text-sm text-gray-400">Send quotations to buyers from the inquiries tab</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        quotations.map((quotation) => {
                          const StatusIcon = getStatusIcon(quotation.status);
                          const isExpired = new Date(quotation.validUntil) < new Date();
                          return (
                            <TableRow key={quotation.id}>
                              <TableCell>
                                <p className="font-mono text-sm">#{quotation.id.slice(-8)}</p>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{quotation.buyerName}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{quotation.items.length} item(s)</p>
                                  <p className="text-xs text-muted-foreground">
                                    {quotation.items[0]?.productName}
                                    {quotation.items.length > 1 && ` +${quotation.items.length - 1} more`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">${quotation.totalAmount.toLocaleString()}</p>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{new Date(quotation.validUntil).toLocaleDateString()}</p>
                                  {isExpired && (
                                    <Badge variant="destructive" className="text-xs">Expired</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <Badge className={getStatusColor(quotation.status)}>
                                    {quotation.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setIsQuotationDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Order Management</h3>
                  <p className="text-sm text-muted-foreground">Manage and track your orders</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading orders...
                          </TableCell>
                        </TableRow>
                      ) : orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <ShoppingCart className="w-8 h-8 text-gray-400" />
                              <p className="text-gray-500">No orders yet</p>
                              <p className="text-sm text-gray-400">Orders will appear here when buyers accept your quotations</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => {
                          const StatusIcon = getStatusIcon(order.status);
                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <p className="font-mono text-sm">#{order.orderNumber}</p>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{order.buyerName}</p>
                                  <p className="text-sm text-muted-foreground">{order.buyerCompany}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{order.items.length} item(s)</p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.items[0]?.productName}
                                    {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">${order.totalAmount.toLocaleString()}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setIsOrderDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  {order.status === 'pending' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: 'confirmed'
                                      })}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Confirm
                                    </Button>
                                  )}
                                  {order.status === 'confirmed' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: 'processing'
                                      })}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-1" />
                                      Process
                                    </Button>
                                  )}
                                  {order.status === 'processing' && (
                                    <Button 
                                      size="sm"
                                      onClick={() => updateOrderStatusMutation.mutate({
                                        orderId: order.id,
                                        status: 'shipped'
                                      })}
                                    >
                                      <Truck className="w-4 h-4 mr-1" />
                                      Ship
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Inquiry Detail Dialog */}
          <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inquiry Details</DialogTitle>
              </DialogHeader>
              {selectedInquiry && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Product</Label>
                      <p className="font-medium">{selectedInquiry.productName}</p>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <p>{selectedInquiry.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Target Price</Label>
                      <p>${selectedInquiry.targetPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Urgency</Label>
                      <Badge>{selectedInquiry.urgency}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Buyer Information</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedInquiry.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{selectedInquiry.buyerCompany}</p>
                      <p className="text-sm">{selectedInquiry.buyerEmail}</p>
                      {selectedInquiry.buyerPhone && (
                        <p className="text-sm">{selectedInquiry.buyerPhone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Message</Label>
                    <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedInquiry.message}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setIsInquiryDialogOpen(false);
                        setIsQuotationDialogOpen(true);
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Quotation
                    </Button>
                    <Button variant="outline">
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Quotation Dialog */}
          <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Quotation</DialogTitle>
              </DialogHeader>
              {selectedInquiry && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Buyer</Label>
                      <p className="font-medium">{selectedInquiry.buyerName}</p>
                      <p className="text-sm text-muted-foreground">{selectedInquiry.buyerCompany}</p>
                    </div>
                    <div>
                      <Label>Product</Label>
                      <p className="font-medium">{selectedInquiry.productName}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Quotation Items</Label>
                    <div className="space-y-4 mt-2">
                      {quotationForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                          <div>
                            <Label>Product Name</Label>
                            <Input 
                              value={item.productName}
                              onChange={(e) => {
                                const newItems = [...quotationForm.items];
                                newItems[index].productName = e.target.value;
                                setQuotationForm(prev => ({ ...prev, items: newItems }));
                              }}
                              placeholder="Product name"
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...quotationForm.items];
                                newItems[index].quantity = parseInt(e.target.value) || 0;
                                newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                                setQuotationForm(prev => ({ 
                                  ...prev, 
                                  items: newItems,
                                  totalAmount: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Unit Price ($)</Label>
                            <Input 
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...quotationForm.items];
                                newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                                setQuotationForm(prev => ({ 
                                  ...prev, 
                                  items: newItems,
                                  totalAmount: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <p className="mt-2 font-medium">${item.totalPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valid Until</Label>
                      <Input 
                        type="date"
                        value={quotationForm.validUntil}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <p className="mt-2 text-2xl font-bold">${quotationForm.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Terms & Conditions</Label>
                    <Textarea 
                      value={quotationForm.terms}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, terms: e.target.value }))}
                      placeholder="Enter terms and conditions..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      value={quotationForm.notes}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleQuotationSubmit} disabled={sendQuotationMutation.isPending}>
                      {sendQuotationMutation.isPending ? "Sending..." : "Send Quotation"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsQuotationDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Order Detail Dialog */}
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Order Number</Label>
                      <p className="font-mono font-medium">#{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <p className="text-xl font-bold">${selectedOrder.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Buyer Information</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">{selectedOrder.buyerName}</p>
                          <p className="text-sm text-muted-foreground">{selectedOrder.buyerCompany}</p>
                          <p className="text-sm">{selectedOrder.buyerEmail}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Shipping Address</Label>
                          {selectedOrder.shippingAddress && (
                            <div className="text-sm">
                              <p>{selectedOrder.shippingAddress.street}</p>
                              <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                              <p>{selectedOrder.shippingAddress.country} {selectedOrder.shippingAddress.zipCode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Order Items</Label>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">${item.unitPrice}/unit</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedOrder.trackingNumber && (
                    <div>
                      <Label>Tracking Number</Label>
                      <p className="font-mono">{selectedOrder.trackingNumber}</p>
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div>
                      <Label>Notes</Label>
                      <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedOrder.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button 
                        onClick={() => updateOrderStatusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'confirmed'
                        })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Order
                      </Button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button 
                        onClick={() => updateOrderStatusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'processing'
                        })}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start Processing
                      </Button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <Button 
                        onClick={() => {
                          const trackingNumber = prompt("Enter tracking number:");
                          if (trackingNumber) {
                            updateOrderStatusMutation.mutate({
                              orderId: selectedOrder.id,
                              status: 'shipped',
                              trackingNumber
                            });
                          }
                        }}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Mark as Shipped
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}