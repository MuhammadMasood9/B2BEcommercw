import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle,
  Eye,
  Send,
  DollarSign,
  Calendar,
  Package,
  MapPin,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
  MessageSquare,
  BarChart3,
  Activity,
  Target,
  Settings
} from 'lucide-react';

export default function AdminRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    pricePerUnit: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Fetch all RFQs
  const { data: rfqsData, isLoading } = useQuery({
    queryKey: ['/api/rfqs', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      const response = await fetch(`/api/rfqs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    }
  });

  // Fetch categories for display
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const rfqs = rfqsData || [];

  // Collect unique product IDs from RFQs
  const productIds = useMemo(() => {
    const ids = new Set<string>();
    rfqs.forEach((rfq: any) => {
      if (rfq.productId && rfq.productId !== 'null' && rfq.productId !== 'undefined' && rfq.productId.trim() !== '') {
        ids.add(rfq.productId);
      }
    });
    return Array.from(ids);
  }, [rfqs]);

  // Fetch all products that are referenced in RFQs
  const { data: productsData = [] } = useQuery({
    queryKey: ['/api/products/batch', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      // Fetch each product individually (batch fetching would require API changes)
      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          return null;
        }
      });
      
      const products = await Promise.all(productPromises);
      return products.filter(p => p !== null);
    },
    enabled: productIds.length > 0
  });

  // Create a map of productId to product data for quick lookup
  const productsMap = useMemo(() => {
    const map = new Map();
    productsData.forEach((product: any) => {
      if (product && product.id) {
        map.set(product.id, product);
      }
    });
    return map;
  }, [productsData]);

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

  // Helper function to get product details
  const getProductDetails = (productId: string | null | undefined) => {
    if (!productId || productId === 'null' || productId === 'undefined' || productId.trim() === '') {
      return null;
    }
    return productsMap.get(productId) || null;
  };

  // Send quotation mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      setIsQuoteDialogOpen(false);
      setQuoteForm({
        pricePerUnit: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: ''
      });
      toast.success('Quotation sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send quotation');
    }
  });

  const handleSendQuotation = (rfq: any) => {
    setSelectedRFQ(rfq);
    setQuoteForm({
      pricePerUnit: rfq.targetPrice || '',
      moq: rfq.quantity?.toString() || '',
      leadTime: '',
      paymentTerms: 'T/T',
      validUntil: '',
      message: ''
    });
    setIsQuoteDialogOpen(true);
  };

  const submitQuotation = () => {
    if (!quoteForm.pricePerUnit || !quoteForm.moq) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalPrice = parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq);

    sendQuotationMutation.mutate({
      rfqId: selectedRFQ.id,
      pricePerUnit: quoteForm.pricePerUnit, // Send as string
      totalPrice: totalPrice.toString(), // Send as string
      moq: parseInt(quoteForm.moq),
      leadTime: quoteForm.leadTime,
      paymentTerms: quoteForm.paymentTerms,
      validUntil: quoteForm.validUntil ? new Date(quoteForm.validUntil) : null, // Convert to Date object
      message: quoteForm.message,
      status: 'pending'
    });
  };

  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (!numPrice) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
  };

  // Enhanced analytics
  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r: any) => r.status === 'open').length,
    closed: rfqs.filter((r: any) => r.status === 'closed').length,
    // Calculate conversion rates
    conversionRate: rfqs.length > 0 ? 
      ((rfqs.filter((r: any) => (r.quotationsCount || 0) > 0).length / rfqs.length) * 100).toFixed(1) : 0,
    responseRate: rfqs.length > 0 ? 
      ((rfqs.filter((r: any) => (r.quotationsCount || 0) > 0).length / rfqs.length) * 100).toFixed(1) : 0,
    // Calculate average response time (mock data for now)
    avgResponseTime: '2.5 hours',
    // Calculate total RFQ value
    totalValue: rfqs.reduce((sum: number, r: any) => 
      sum + ((r.quantity || 0) * (r.targetPrice || 0)), 0),
    // Recent activity (last 7 days)
    recentActivity: rfqs.filter((r: any) => {
      const createdAt = new Date(r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "RFQs" }]} />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                RFQ Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and respond to Request for Quotations from buyers
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">Total RFQs</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-primary-foreground/70 text-xs">+{stats.recentActivity} this week</p>
                </div>
                <FileText className="h-8 w-8 text-primary-foreground/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-foreground/80 text-sm font-medium">Response Rate</p>
                  <p className="text-3xl font-bold">{stats.responseRate}%</p>
                  <p className="text-secondary-foreground/70 text-xs">RFQs with Quotations</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary-foreground/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-accent to-accent/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent-foreground/80 text-sm font-medium">Open RFQs</p>
                  <p className="text-3xl font-bold">{stats.open}</p>
                  <p className="text-accent-foreground/70 text-xs">Active Opportunities</p>
                </div>
                <MessageSquare className="h-8 w-8 text-accent-foreground/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-brand-grey-800 to-brand-grey-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Value</p>
                  <p className="text-3xl font-bold">${stats.totalValue.toLocaleString()}</p>
                  <p className="text-white/70 text-xs">RFQ Value</p>
                </div>
                <DollarSign className="h-8 w-8 text-white/70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Open</span>
                  </div>
                  <span className="font-semibold">{stats.open}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Closed</span>
                  </div>
                  <span className="font-semibold">{stats.closed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm">With Quotations</span>
                  </div>
                  <span className="font-semibold">{rfqs.filter((r: any) => (r.quotationsCount || 0) > 0).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Pending Response</span>
                  </div>
                  <span className="font-semibold">{rfqs.filter((r: any) => r.status === 'open' && (r.quotationsCount || 0) === 0).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-semibold">{stats.avgResponseTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recent Activity</span>
                  <span className="font-semibold">{stats.recentActivity} RFQs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Rate</span>
                  <span className="font-semibold text-primary">{stats.responseRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All RFQs
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rfqs">All RFQs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rfqs.slice(0, 5).map((rfq: any) => {
                    const productDetails = getProductDetails(rfq.productId);
                    return (
                      <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{productDetails?.name || rfq.title}</p>
                            <p className="text-sm text-gray-600">Quantity: {rfq.quantity} units</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={rfq.status === 'open' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                            {rfq.status?.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(rfq.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfqs" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search RFQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High Value</SelectItem>
                      <SelectItem value="medium">Medium Value</SelectItem>
                      <SelectItem value="low">Low Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* RFQs List */}
            <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600">Loading RFQs...</span>
            </div>
          ) : filteredRFQs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No RFQs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No RFQs have been submitted yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRFQs.map((rfq: any) => {
              const quotationCount = rfq.quotationsCount || 0;
              const hasQuoted = quotationCount > 0;
              const productDetails = getProductDetails(rfq.productId);
              
              return (
                <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {productDetails?.images && productDetails.images.length > 0 ? (
                            <img 
                              src={Array.isArray(productDetails.images) ? productDetails.images[0] : productDetails.images} 
                              alt={productDetails.name || 'Product'} 
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop';
                              }}
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {productDetails?.name || rfq.title}
                            </h3>
                            <Badge className={rfq.status === 'open' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                              {rfq.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Quantity:</span> {rfq.quantity?.toLocaleString() || 'N/A'} units
                            </div>
                            <div>
                              <span className="font-medium">Target Price:</span> {formatPrice(rfq.targetPrice)}
                            </div>
                            <div>
                              <span className="font-medium">Expected:</span> {formatDate(rfq.expectedDate)}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {rfq.deliveryLocation || 'N/A'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {rfq.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-gray-500">
                              Created: {formatDate(rfq.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Quotations Sent: {quotationCount}
                            </span>
                          </div>

                          {/* Display sent quotations */}
                          {hasQuoted && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Quotations Sent ({quotationCount})
                              </h4>
                              <div className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm text-primary font-medium">
                                  ✓ You have sent {quotationCount} quotation{quotationCount > 1 ? 's' : ''} for this RFQ
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link href={`/admin/rfqs/${rfq.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => handleSendQuotation(rfq)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {hasQuoted ? 'Send Another Quote' : 'Send Quotation'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Week</span>
                      <span className="font-semibold">{stats.recentActivity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Rate</span>
                      <span className="font-semibold text-green-600">{stats.responseRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open RFQs</span>
                      <span className="font-semibold text-primary">{stats.open}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-semibold">{stats.avgResponseTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Value</span>
                      <span className="font-semibold">${stats.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-semibold text-green-600">{stats.responseRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Quotation Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Quotation for: {selectedRFQ?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerUnit">Price Per Unit (USD) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  value={quoteForm.pricePerUnit}
                  onChange={(e) => setQuoteForm({...quoteForm, pricePerUnit: e.target.value})}
                  placeholder="e.g., 18.50"
                  step="0.01"
                  min="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="moq">Minimum Order Quantity *</Label>
                <Input
                  id="moq"
                  type="number"
                  value={quoteForm.moq}
                  onChange={(e) => setQuoteForm({...quoteForm, moq: e.target.value})}
                  placeholder="e.g., 5000"
                  min="1"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={quoteForm.leadTime}
                  onChange={(e) => setQuoteForm({...quoteForm, leadTime: e.target.value})}
                  placeholder="e.g., 20-25 days"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={quoteForm.paymentTerms} onValueChange={(value) => setQuoteForm({...quoteForm, paymentTerms: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T/T">T/T (Telegraphic Transfer)</SelectItem>
                    <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                    <SelectItem value="D/P">D/P (Documents against Payment)</SelectItem>
                    <SelectItem value="D/A">D/A (Documents against Acceptance)</SelectItem>
                    <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({...quoteForm, validUntil: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message / Additional Details</Label>
              <Textarea
                id="message"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                placeholder="Provide detailed information about your quotation, customization options, certifications, etc."
                rows={4}
                className="mt-2"
              />
            </div>

            {quoteForm.pricePerUnit && quoteForm.moq && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Quotation Value:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitQuotation}
              disabled={sendQuotationMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {sendQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Quotation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

