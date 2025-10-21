import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  Eye,
  Send,
  DollarSign,
  Calendar,
  Truck,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  ShoppingBag,
  Globe
} from 'lucide-react';

function AdminQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Create order from quotation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch('/api/admin/orders/create-from-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast.success('Order created successfully! Waiting for buyer approval.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create order');
    }
  });

  // Fetch quotations with enhanced product data
  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/quotations', statusFilter, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        const response = await fetch(`/api/admin/quotations?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quotations');
        }
        const data = await response.json();
        const quotations = data.quotations || [];
        
        // Enhance quotations with product data
        const enhancedQuotations = await Promise.all(
          quotations.map(async (quotation: any) => {
            try {
              // Fetch product details
              const productResponse = await fetch(`/api/products/${quotation.productId}`);
              if (productResponse.ok) {
                const productData = await productResponse.json();
                quotation.product = productData;
                quotation.productName = productData.name;
                quotation.productImages = productData.images;
                quotation.productCategory = productData.categoryName;
                quotation.productViews = productData.views || 0;
                quotation.productInquiries = productData.inquiries || 0;
                quotation.productStock = productData.stockQuantity || 0;
                quotation.productPrice = productData.priceRanges?.[0]?.pricePerUnit || 0;
                quotation.productMOQ = productData.minOrderQuantity || 1;
                quotation.productLeadTime = productData.leadTime;
                quotation.productPaymentTerms = productData.paymentTerms;
                quotation.productSpecifications = productData.specifications;
              }
              
              // Fetch buyer details
              const buyerResponse = await fetch(`/api/users/${quotation.buyerId}`);
              if (buyerResponse.ok) {
                const buyerData = await buyerResponse.json();
                quotation.buyer = buyerData;
                quotation.buyerName = buyerData.firstName + ' ' + buyerData.lastName;
                quotation.buyerCompany = buyerData.companyName;
                quotation.buyerEmail = buyerData.email;
                quotation.buyerPhone = buyerData.phone;
                quotation.buyerCountry = buyerData.country;
                quotation.buyerVerified = buyerData.isVerified;
              }
              
              return quotation;
            } catch (err) {
              console.error('Error enhancing quotation:', err);
              return quotation;
            }
          })
        );
        
        return enhancedQuotations;
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Update quotation mutation
  const updateQuotationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/quotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update quotation');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
      setIsEditDialogOpen(false);
      setSelectedQuotation(null);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredQuotations = quotations.filter((quotation: any) => {
    const matchesSearch = !searchQuery || 
      quotation.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.buyerCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Calculate statistics
  const stats = {
    total: quotations.length,
    pending: quotations.filter((q: any) => q.status === 'pending').length,
    accepted: quotations.filter((q: any) => q.status === 'accepted').length,
    rejected: quotations.filter((q: any) => q.status === 'rejected').length,
    totalValue: quotations.reduce((sum: number, q: any) => sum + (q.totalPrice || 0), 0),
    conversionRate: quotations.length > 0 ? ((quotations.filter((q: any) => q.status === 'accepted').length / quotations.length) * 100).toFixed(1) : '0'
  };

  const handleEditQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setEditForm({
      status: quotation.status,
      message: quotation.message || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuotation = () => {
    if (selectedQuotation) {
      updateQuotationMutation.mutate({
        id: selectedQuotation.id,
        data: editForm
      });
    }
  };

  // Admin doesn't create orders directly
  // Orders are created when buyers accept quotations via /api/quotations/accept

  return (
    <div className="mx-auto p-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Quotations" }]} />
      
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quotations Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track quotation status and manage buyer responses in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] })}>
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

      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Quotations</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-blue-200 text-xs mt-1">{formatPrice(stats.totalValue)} value</p>
              </div>
              <FileText className="h-10 w-10 text-blue-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
                <p className="text-yellow-200 text-xs mt-1">Awaiting response</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Accepted</p>
                <p className="text-3xl font-bold">{stats.accepted}</p>
                <p className="text-green-200 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats.conversionRate}% conversion
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Rejected</p>
                <p className="text-3xl font-bold">{stats.rejected}</p>
                <p className="text-red-200 text-xs mt-1">Need follow-up</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-200 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by product, buyer name, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading quotations...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error loading quotations
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There was an error loading the quotations. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : filteredQuotations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No quotations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No quotations have been sent yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuotations.map((quotation: any) => {
            return (
              <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Product Info */}
                    <div className="flex-shrink-0">
                      {quotation.productImages && quotation.productImages.length > 0 ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border">
                          <img 
                            src={quotation.productImages[0]} 
                            alt={quotation.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {quotation.productName || 'Unknown Product'}
                            </h3>
                            <Badge className={getStatusColor(quotation.status)}>
                              {getStatusIcon(quotation.status)}
                              {quotation.status}
                            </Badge>
                            {quotation.status === 'accepted' && quotation.orderId && (
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Order Created
                              </Badge>
                            )}
                            {quotation.productCategory && (
                              <Badge variant="secondary" className="ml-2">
                                {quotation.productCategory}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Product Performance Indicators */}
                          <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{quotation.productViews || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              <span>{quotation.productInquiries || 0} inquiries</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>{quotation.productStock || 0} in stock</span>
                            </div>
                            {quotation.buyerVerified && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span>Verified Buyer</span>
                              </div>
                            )}
                          </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Buyer Information</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <User className="h-4 w-4" />
                                        <span>{quotation.buyerName || 'Unknown Buyer'}</span>
                                        {quotation.buyerVerified && (
                                          <Badge variant="default" className="text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Building className="h-4 w-4" />
                                        <span>{quotation.buyerCompany || 'Unknown Company'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Mail className="h-4 w-4" />
                                        <span>{quotation.buyerEmail || 'No email'}</span>
                                      </div>
                                      {quotation.buyerPhone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                          <Phone className="h-4 w-4" />
                                          <span>{quotation.buyerPhone}</span>
                                        </div>
                                      )}
                                      {quotation.buyerCountry && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                          <Globe className="h-4 w-4" />
                                          <span>{quotation.buyerCountry}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Quotation Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <DollarSign className="h-4 w-4" />
                                        <span>Price: {formatPrice(quotation.pricePerUnit || quotation.productPrice)}/unit</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Package className="h-4 w-4" />
                                        <span>MOQ: {quotation.moq || quotation.productMOQ} units</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created: {formatDate(quotation.createdAt)}</span>
                                      </div>
                                      {quotation.productLeadTime && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                          <Truck className="h-4 w-4" />
                                          <span>Lead Time: {quotation.productLeadTime}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Show acceptance/rejection status */}
                                {quotation.status === 'accepted' && (
                                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4" />
                                          Quotation Accepted
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                          Order has been created and is being processed
                                        </p>
                                      </div>
                                      {quotation.orderId && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.location.href = '/admin/orders'}
                                        >
                                          View Order
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {quotation.status === 'rejected' && (
                                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4" />
                                      Quotation Rejected by Buyer
                                    </p>
                                    {quotation.rejectionReason && (
                                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                        Reason: {quotation.rejectionReason}
                                      </p>
                                    )}
                                  </div>
                                )}

                          {quotation.message && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <strong>Message:</strong> {quotation.message}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 text-sm">
                            {quotation.leadTime && (
                              <Badge variant="outline">
                                <Truck className="h-3 w-3 mr-1" />
                                Lead Time: {quotation.leadTime}
                              </Badge>
                            )}
                            {quotation.paymentTerms && (
                              <Badge variant="outline">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {quotation.paymentTerms}
                              </Badge>
                            )}
                            {quotation.validUntil && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Valid until: {formatDate(quotation.validUntil)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {quotation.status === 'accepted' && !quotation.orderId && (
                            <Button
                              size="sm"
                              onClick={() => createOrderMutation.mutate(quotation.id)}
                              disabled={createOrderMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Create Order
                            </Button>
                          )}
                          {quotation.status === 'accepted' && quotation.orderId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-300"
                              disabled
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Order Created
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuotation(quotation)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {quotation.status === 'pending' && (
                            <div className="text-sm text-gray-500 italic">
                              Waiting for buyer to accept quotation...
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to conversation
                              window.location.href = '/messages';
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <Textarea
                value={editForm.message}
                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a message..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuotation}
                disabled={updateQuotationMutation.isPending}
              >
                {updateQuotationMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminQuotations;
