import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Trash2,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  Loader2,
  Shield,
  Globe,
  MessageSquare,
  ShoppingCart,
  X,
  History,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BuyerRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [isQuotationsDialogOpen, setIsQuotationsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch RFQs from API
  const { data: rfqsData, isLoading } = useQuery({
    queryKey: ['/api/rfqs', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/rfqs?buyerId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    },
    enabled: !!user?.id
  });

  const rfqs = rfqsData || [];

  // Fetch categories for display
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Fetch all products to show product information for product-specific RFQs
  const { data: allProducts = [] } = useQuery({
    queryKey: ['/api/all-products'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products?limit=1000');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    }
  });

  // Helper function to get product details
  const getProductDetails = (productId: string) => {
    const product = allProducts.find((p: any) => p.id === productId);
    return product || null;
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

  // Delete RFQ mutation
  const deleteRFQMutation = useMutation({
    mutationFn: async (rfqId: string) => {
      const response = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete RFQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      toast.success('RFQ deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete RFQ');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return TrendingUp;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
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

  const formatPrice = (price: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Fetch quotations for a specific RFQ
  const { data: rfqQuotations = [] } = useQuery({
    queryKey: ['/api/rfqs/quotations', selectedRFQ?.id],
    queryFn: async () => {
      if (!selectedRFQ?.id) return [];
      try {
        const response = await fetch(`/api/rfqs/${selectedRFQ.id}/quotations`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch quotations');
        const data = await response.json();
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching RFQ quotations:', error);
        return [];
      }
    },
    enabled: !!selectedRFQ?.id && isQuotationsDialogOpen
  });

  // Accept RFQ quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to accept quotation' }));
        throw new Error(errorData.error || 'Failed to accept quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation accepted successfully! Order has been created.');
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      setIsAcceptDialogOpen(false);
      setShippingAddress('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject RFQ quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reject quotation' }));
        throw new Error(errorData.error || 'Failed to reject quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs/quotations'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject quotation');
    }
  });

  const handleViewQuotations = (rfq: any) => {
    setSelectedRFQ(rfq);
    setIsQuotationsDialogOpen(true);
  };

  const handleAcceptQuotation = () => {
    if (selectedQuotation && shippingAddress.trim()) {
      acceptQuotationMutation.mutate(selectedQuotation.id);
    }
  };

  const handleRejectQuotation = () => {
    if (selectedQuotation && rejectionReason.trim()) {
      rejectQuotationMutation.mutate(selectedQuotation.id);
    }
  };

  const getQuotationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r: any) => r.status === 'open').length,
    closed: rfqs.filter((r: any) => r.status === 'closed').length,
    totalValue: rfqs.reduce((sum: number, r: any) => sum + (parseFloat(r.targetPrice) || 0), 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <FileText className="w-4 h-4" />
              <span>My RFQs</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              My
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                RFQs
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Manage your Request for Quotations and compare supplier responses
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Suppliers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>Fast Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header with Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.open}</div>
                <div className="text-sm text-gray-600">Open</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.closed}</div>
                <div className="text-sm text-gray-600">Closed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Expired</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalValue)}</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </CardContent>
            </Card>
          </div>


          {/* RFQs Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All RFQs</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRFQs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRFQs.map((rfq: any) => {
                    const StatusIcon = getStatusIcon(rfq.status);
                    const quotationCount = rfq.quotationsCount || 0;
                    const productDetails = rfq.productId ? getProductDetails(rfq.productId) : null;
                    
                    return (
                      <Card key={rfq.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {rfq.title}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">RFQ #{rfq.id}</p>
                              {productDetails && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  📦 Product: {productDetails.name || 'Product RFQ'}
                                </Badge>
                              )}
                            </div>
                            <Badge className={`${getStatusColor(rfq.status)} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {rfq.status?.charAt(0).toUpperCase() + rfq.status?.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Product Image Section */}
                          {productDetails && productDetails.images && productDetails.images.length > 0 && (
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
                              <img 
                                src={productDetails.images[0]} 
                                alt={productDetails.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 line-clamp-2">{rfq.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{getCategoryName(rfq.categoryId)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Target Price:</span>
                              <span className="font-medium">{formatPrice(parseFloat(rfq.targetPrice))}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Quotations:</span>
                              <span className="font-medium text-green-600">{quotationCount}</span>
                            </div>
                            {quotationCount > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => handleViewQuotations(rfq)}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                View Quotations ({quotationCount})
                              </Button>
                            )}
                          </div>
                          
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Created: {formatDate(rfq.createdAt)}</span>
                              <span>Expected: {formatDate(rfq.expectedDate)}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              asChild
                            >
                              <Link href={`/rfq/${rfq.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No RFQs found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'You haven\'t created any RFQs yet'}
                  </p>
                  <Link href="/rfq/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New RFQ
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Other tabs content would be similar but filtered by status */}
            <TabsContent value="open" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRFQs.filter((rfq: any) => rfq.status === "open").map((rfq: any) => {
                  const StatusIcon = getStatusIcon(rfq.status);
                  const quotationCount = rfq.quotationsCount || 0;
                  return (
                    <Card key={rfq.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {rfq.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">RFQ #{rfq.id}</p>
                          </div>
                          <Badge className={`${getStatusColor(rfq.status)} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {rfq.status?.charAt(0).toUpperCase() + rfq.status?.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{rfq.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{getCategoryName(rfq.categoryId)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Target Price:</span>
                            <span className="font-medium">{formatPrice(parseFloat(rfq.targetPrice))}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quotations:</span>
                            <span className="font-medium text-green-600">{quotationCount}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {formatDate(rfq.createdAt)}</span>
                            <span>Expected: {formatDate(rfq.expectedDate)}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/rfq/${rfq.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="closed" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRFQs.filter((rfq: any) => rfq.status === "closed").map((rfq: any) => {
                  const StatusIcon = getStatusIcon(rfq.status);
                  const quotationCount = rfq.quotationsCount || 0;
                  return (
                    <Card key={rfq.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {rfq.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">RFQ #{rfq.id}</p>
                          </div>
                          <Badge className={`${getStatusColor(rfq.status)} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {rfq.status?.charAt(0).toUpperCase() + rfq.status?.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{rfq.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{getCategoryName(rfq.categoryId)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Target Price:</span>
                            <span className="font-medium">{formatPrice(parseFloat(rfq.targetPrice))}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quotations:</span>
                            <span className="font-medium text-green-600">{quotationCount}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {formatDate(rfq.createdAt)}</span>
                            <span>Expected: {formatDate(rfq.expectedDate)}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/rfq/${rfq.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="expired" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRFQs.filter((rfq: any) => rfq.status === "expired").map((rfq: any) => {
                  const StatusIcon = getStatusIcon(rfq.status);
                  const quotationCount = rfq.quotationsCount || 0;
                  return (
                    <Card key={rfq.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {rfq.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">RFQ #{rfq.id}</p>
                          </div>
                          <Badge className={`${getStatusColor(rfq.status)} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {rfq.status?.charAt(0).toUpperCase() + rfq.status?.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{rfq.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{getCategoryName(rfq.categoryId)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Target Price:</span>
                            <span className="font-medium">{formatPrice(parseFloat(rfq.targetPrice))}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quotations:</span>
                            <span className="font-medium text-green-600">{quotationCount}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {formatDate(rfq.createdAt)}</span>
                            <span>Expected: {formatDate(rfq.expectedDate)}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/rfq/${rfq.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </main>

      {/* RFQ Quotations Dialog */}
      <Dialog open={isQuotationsDialogOpen} onOpenChange={setIsQuotationsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Quotations for {selectedRFQ?.title || 'RFQ'}
            </DialogTitle>
            <DialogDescription>
              Review and manage quotations received for this RFQ. Accept, reject, or negotiate terms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {rfqQuotations.length > 0 ? (
              rfqQuotations.map((quotation: any) => (
                <Card key={quotation.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getQuotationStatusColor(quotation.status)}>
                            {quotation.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Quotation #{quotation.id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 block">Price per Unit:</span>
                            <span className="font-medium text-green-600">
                              ${quotation.pricePerUnit || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Total Price:</span>
                            <span className="font-medium">
                              ${quotation.totalPrice || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">MOQ:</span>
                            <span className="font-medium">{quotation.moq || 'N/A'} units</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Lead Time:</span>
                            <span className="font-medium">{quotation.leadTime || 'N/A'}</span>
                          </div>
                        </div>
                        {quotation.message && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                            {quotation.message}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {quotation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsAcceptDialogOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsRejectDialogOpen(true);
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {quotation.status === 'accepted' && (
                          <Badge className="bg-green-100 text-green-800">
                            Accepted ✓
                          </Badge>
                        )}
                        {quotation.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Quotations Yet</h3>
                <p className="text-gray-600">No quotations have been received for this RFQ yet.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotationsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Quotation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Accept Quotation
            </DialogTitle>
            <DialogDescription>
              Please provide your shipping address to proceed with this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuotation && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Quotation Summary</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>RFQ:</strong> {selectedRFQ?.title || 'N/A'}</p>
                  <p><strong>MOQ:</strong> {selectedQuotation.moq || 0} units</p>
                  <p><strong>Total Amount:</strong> ${selectedQuotation.totalPrice || 0}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-2">Shipping Address</label>
              <Textarea
                placeholder="Enter your complete shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptQuotation}
              disabled={!shippingAddress.trim() || acceptQuotationMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {acceptQuotationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Quotation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              Reject Quotation
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuotation && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Quotation Summary</h4>
                <div className="space-y-1 text-sm text-red-700">
                  <p><strong>RFQ:</strong> {selectedRFQ?.title || 'N/A'}</p>
                  <p><strong>MOQ:</strong> {selectedQuotation.moq || 0} units</p>
                  <p><strong>Total Amount:</strong> ${selectedQuotation.totalPrice || 0}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-2">Reason for Rejection</label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectQuotation}
              disabled={!rejectionReason.trim() || rejectQuotationMutation.isPending}
              variant="destructive"
            >
              {rejectQuotationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
