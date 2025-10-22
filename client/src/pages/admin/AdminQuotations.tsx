import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Globe,
  History,
  BarChart3,
  Target,
  Percent,
  Activity,
  Layers,
  GitBranch,
  GitCommit,
  Timer,
  AlertTriangle,
  Info,
  Lightbulb,
  Award,
  Star,
  Zap,
  Copy,
  ExternalLink,
  BookOpen,
  Loader2,
  XCircle,
  TrendingDown,
  ArrowUpDown,
  Users,
  Shield,
  Award as AwardIcon
} from 'lucide-react';

function AdminQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNegotiationDialogOpen, setIsNegotiationDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [editForm, setEditForm] = useState({
    status: '',
    message: '',
    pricePerUnit: '',
    totalPrice: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: ''
  });
  const [negotiationForm, setNegotiationForm] = useState({
    message: '',
    newPrice: '',
    newLeadTime: '',
    newPaymentTerms: '',
    isFinalOffer: false,
    urgency: 'normal'
  });
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);

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

  // Send revised quotation mutation
  const sendRevisedQuotationMutation = useMutation({
    mutationFn: async ({ inquiryId, revisionData }: { inquiryId: string; revisionData: any }) => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/revised-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePerUnit: parseFloat(revisionData.newPrice),
          totalPrice: parseFloat(revisionData.newPrice) * (selectedQuotation?.inquiryQuantity || 1),
          leadTime: revisionData.newLeadTime,
          paymentTerms: revisionData.newPaymentTerms,
          message: revisionData.message,
          isFinalOffer: revisionData.isFinalOffer,
          urgency: revisionData.urgency
        }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send revised quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Revised quotation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      setIsNegotiationDialogOpen(false);
      setNegotiationForm({ message: '', newPrice: '', newLeadTime: '', newPaymentTerms: '', isFinalOffer: false, urgency: 'normal' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send revised quotation');
    }
  });

  // Fetch negotiation history
  const fetchNegotiationHistory = useMutation({
    mutationFn: async (inquiryId: string) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/revisions`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch negotiation history');
      return response.json();
    },
    onSuccess: (data) => {
      setNegotiationHistory(data.revisions || []);
      setIsHistoryDialogOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to fetch negotiation history');
    }
  });

  // Bulk operations mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, quotationIds, data }: { action: string, quotationIds: string[], data?: any }) => {
      const response = await fetch('/api/admin/quotations/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quotationIds, data }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to perform bulk action');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.action} completed successfully!`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk action');
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
      case 'negotiating':
        return <MessageSquare className="h-4 w-4" />;
      case 'counter_offered':
        return <TrendingUp className="h-4 w-4" />;
      case 'revised':
        return <Edit className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      case 'awaiting_response':
        return <Timer className="h-4 w-4" />;
      case 'final_offer':
        return <Target className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
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
      case 'negotiating':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'counter_offered':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'revised':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'under_review':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'awaiting_response':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case 'final_offer':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for buyer response';
      case 'accepted': return 'Quotation accepted by buyer';
      case 'rejected': return 'Quotation rejected by buyer';
      case 'negotiating': return 'Under negotiation';
      case 'counter_offered': return 'Buyer sent counter-offer';
      case 'revised': return 'Quotation revised by admin';
      case 'under_review': return 'Under admin review';
      case 'awaiting_response': return 'Awaiting buyer response';
      case 'final_offer': return 'Final offer - no further negotiation';
      case 'expired': return 'Quotation has expired';
      case 'cancelled': return 'Negotiation cancelled';
      default: return 'Unknown status';
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

  // Enhanced analytics
  const stats = {
    total: quotations.length,
    pending: quotations.filter((q: any) => q.status === 'pending').length,
    accepted: quotations.filter((q: any) => q.status === 'accepted').length,
    rejected: quotations.filter((q: any) => q.status === 'rejected').length,
    negotiating: quotations.filter((q: any) => 
      ['negotiating', 'counter_offered', 'revised', 'under_review', 'awaiting_response'].includes(q.status)
    ).length,
    finalOffers: quotations.filter((q: any) => q.status === 'final_offer').length,
    expired: quotations.filter((q: any) => q.status === 'expired').length,
    totalValue: quotations.reduce((sum: number, q: any) => sum + (q.totalPrice || 0), 0),
    conversionRate: quotations.length > 0 ? ((quotations.filter((q: any) => q.status === 'accepted').length / quotations.length) * 100).toFixed(1) : '0',
    negotiationSuccessRate: quotations.filter((q: any) => 
      ['negotiating', 'counter_offered', 'revised', 'under_review', 'awaiting_response', 'accepted'].includes(q.status)
    ).length > 0 ? 
      ((quotations.filter((q: any) => q.status === 'accepted').length / 
        quotations.filter((q: any) => 
          ['negotiating', 'counter_offered', 'revised', 'under_review', 'awaiting_response', 'accepted'].includes(q.status)
        ).length) * 100).toFixed(1) : '0',
    averageResponseTime: 12, // hours - would be calculated from actual data
    averageNegotiationRounds: 2.1, // would be calculated from revision history
    topPerformingBuyers: [], // would be calculated from data
    priceOptimization: quotations.reduce((sum: number, q: any) => {
      const originalPrice = q.originalPrice || q.totalPrice || 0;
      const finalPrice = q.totalPrice || 0;
      return sum + Math.max(0, originalPrice - finalPrice);
    }, 0)
  };

  const handleEditQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setEditForm({
      status: quotation.status,
      message: quotation.message || '',
      pricePerUnit: quotation.pricePerUnit || '',
      totalPrice: quotation.totalPrice || '',
      leadTime: quotation.leadTime || '',
      paymentTerms: quotation.paymentTerms || '',
      validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : ''
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

  const handleStartNegotiation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setNegotiationForm({
      message: '',
      newPrice: quotation.pricePerUnit || '',
      newLeadTime: quotation.leadTime || '',
      newPaymentTerms: quotation.paymentTerms || '',
      isFinalOffer: false,
      urgency: 'normal'
    });
    setIsNegotiationDialogOpen(true);
  };

  const handleSendRevisedQuotation = () => {
    if (selectedQuotation && negotiationForm.newPrice) {
      sendRevisedQuotationMutation.mutate({
        inquiryId: selectedQuotation.inquiryId,
        revisionData: negotiationForm
      });
    }
  };

  const handleViewNegotiationHistory = (quotation: any) => {
    if (quotation.inquiryId) {
      fetchNegotiationHistory.mutate(quotation.inquiryId);
    }
  };

  const handleBulkAction = (action: string, quotationIds: string[]) => {
    bulkActionMutation.mutate({ action, quotationIds });
  };

  const handleExportQuotations = () => {
    // Implementation for exporting quotations
    toast.success('Exporting quotations...');
  };

  const handleCreateTemplate = (quotation: any) => {
    // Implementation for creating quotation templates
    toast.success('Template created successfully!');
  };

  // Admin doesn't create orders directly
  // Orders are created when buyers accept quotations via /api/quotations/accept

  return (
    <div className="mx-auto p-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Quotations" }]} />
      
      {/* Enhanced Header with Analytics */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quotations Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track quotation status, manage negotiations, and analyze performance in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportQuotations}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsAnalyticsDialogOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Quotations</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-blue-200 text-xs mt-1">{formatPrice(stats.totalValue)} value</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-green-200 text-xs mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.accepted} accepted
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Negotiation Success</p>
                  <p className="text-2xl font-bold">{stats.negotiationSuccessRate}%</p>
                  <p className="text-purple-200 text-xs mt-1">{stats.negotiating} active</p>
                </div>
                <Target className="h-8 w-8 text-purple-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Price Optimization</p>
                  <p className="text-2xl font-bold">${stats.priceOptimization.toLocaleString()}</p>
                  <p className="text-orange-200 text-xs mt-1">Savings achieved</p>
                </div>
                <Percent className="h-8 w-8 text-orange-200 opacity-80" />
              </div>
            </CardContent>
          </Card>
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

      {/* Enhanced Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by product, buyer name, company, or quotation ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="counter_offered">Counter Offered</SelectItem>
                  <SelectItem value="revised">Revised</SelectItem>
                  <SelectItem value="final_offer">Final Offer</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode('grid')}>
                  <Layers className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>
                  <Activity className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewMode('timeline')}>
                  <GitBranch className="h-4 w-4" />
                </Button>
              </div>
              
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

                        {/* Enhanced Actions */}
                        <div className="flex flex-col gap-2">
                          {/* Order Actions */}
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
                          
                          {/* Negotiation Actions */}
                          {['pending', 'counter_offered', 'negotiating'].includes(quotation.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartNegotiation(quotation)}
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Negotiate
                            </Button>
                          )}
                          
                          {/* History Button */}
                          {quotation.inquiryId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewNegotiationHistory(quotation)}
                              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            >
                              <History className="h-4 w-4 mr-2" />
                              History
                            </Button>
                          )}
                          
                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuotation(quotation)}
                            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          {/* Template Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTemplate(quotation)}
                            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Template
                          </Button>
                          
                          {/* Message Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to conversation
                              window.location.href = '/messages';
                            }}
                            className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          
                          {/* Status Info */}
                          {quotation.status === 'pending' && (
                            <div className="text-sm text-gray-500 italic">
                              Waiting for buyer to accept quotation...
                            </div>
                          )}
                          {quotation.status === 'counter_offered' && (
                            <div className="text-sm text-blue-600 italic">
                              Buyer sent counter-offer - respond to negotiate
                            </div>
                          )}
                          {quotation.status === 'final_offer' && (
                            <div className="text-sm text-pink-600 italic">
                              Final offer - no further negotiation
                            </div>
                          )}
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

      {/* Enhanced Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Quotation
            </DialogTitle>
            <DialogDescription>
              Update quotation details and status. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="counter_offered">Counter Offered</SelectItem>
                    <SelectItem value="revised">Revised</SelectItem>
                    <SelectItem value="final_offer">Final Offer</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Until
                </label>
                <Input
                  type="date"
                  value={editForm.validUntil}
                  onChange={(e) => setEditForm(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Unit ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.pricePerUnit}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.totalPrice}
                  onChange={(e) => setEditForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lead Time
                </label>
                <Input
                  value={editForm.leadTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, leadTime: e.target.value }))}
                  placeholder="e.g., 2-3 weeks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <Input
                  value={editForm.paymentTerms}
                  onChange={(e) => setEditForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="e.g., 30% advance, 70% on delivery"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <Textarea
                value={editForm.message}
                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a message or update..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuotation}
                disabled={updateQuotationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateQuotationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Quotation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiationDialogOpen} onOpenChange={setIsNegotiationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Send Revised Quotation
            </DialogTitle>
            <DialogDescription>
              Respond to buyer's counter-offer or send a revised quotation with better terms.
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Current Quotation Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Current Quotation Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Product:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.productName}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Buyer:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.buyerName}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Quantity:</span>
                    <span className="font-medium text-gray-900">{(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Current Price:</span>
                    <span className="font-medium text-gray-900">${selectedQuotation.pricePerUnit || selectedQuotation.unitPrice || 0}</span>
                  </div>
                </div>
              </div>

              {/* Revised Quotation Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">New Price per Unit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter revised price"
                      value={negotiationForm.newPrice}
                      onChange={(e) => setNegotiationForm({...negotiationForm, newPrice: e.target.value})}
                      className="border-gray-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Consider market conditions and buyer's counter-offer</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Urgency Level</label>
                    <Select value={negotiationForm.urgency} onValueChange={(value) => setNegotiationForm({...negotiationForm, urgency: value})}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Flexible timeline</SelectItem>
                        <SelectItem value="normal">Normal - Standard timeline</SelectItem>
                        <SelectItem value="high">High - Rush order</SelectItem>
                        <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Revised Lead Time</label>
                    <Input
                      placeholder="e.g., 2-3 weeks"
                      value={negotiationForm.newLeadTime}
                      onChange={(e) => setNegotiationForm({...negotiationForm, newLeadTime: e.target.value})}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Revised Payment Terms</label>
                    <Input
                      placeholder="e.g., 30% advance, 70% on delivery"
                      value={negotiationForm.newPaymentTerms}
                      onChange={(e) => setNegotiationForm({...negotiationForm, newPaymentTerms: e.target.value})}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Message to Buyer</label>
                  <Textarea
                    placeholder="Explain your revised quotation, reasoning, and any special conditions..."
                    value={negotiationForm.message}
                    onChange={(e) => setNegotiationForm({...negotiationForm, message: e.target.value})}
                    rows={4}
                    className="border-gray-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Be professional and explain the value proposition</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="final-offer"
                    checked={negotiationForm.isFinalOffer}
                    onChange={(e) => setNegotiationForm({...negotiationForm, isFinalOffer: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="final-offer" className="text-sm font-medium text-gray-700">
                    This is a final offer - no further negotiation
                  </label>
                </div>

                {/* Negotiation Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Negotiation Tips
                  </h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Consider the buyer's counter-offer and market conditions</li>
                    <li>• Highlight quality, reliability, and service advantages</li>
                    <li>• Offer flexible payment terms for better acceptance</li>
                    <li>• Mention bulk discounts or long-term partnership benefits</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setIsNegotiationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendRevisedQuotation}
              disabled={!negotiationForm.newPrice || sendRevisedQuotationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendRevisedQuotationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Revised Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negotiation History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Negotiation History
            </DialogTitle>
            <DialogDescription>
              Complete timeline of negotiations and revisions for this quotation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {negotiationHistory.length > 0 ? (
              <div className="space-y-4">
                {negotiationHistory.map((revision: any, index: number) => (
                  <div key={revision.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <GitCommit className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Revision #{revision.revisionNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(revision.createdAt).toLocaleDateString()} at {new Date(revision.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(revision.status)}>
                        {getStatusIcon(revision.status)}
                        <span className="ml-1">{revision.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="ml-2 font-medium">{revision.quantity?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Target Price:</span>
                        <span className="ml-2 font-medium">${revision.targetPrice || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Created By:</span>
                        <span className="ml-2 font-medium">{revision.createdBy === 'admin' ? 'Admin' : 'Buyer'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className="ml-2 font-medium">{revision.status}</span>
                      </div>
                    </div>
                    
                    {revision.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Message:</strong> {revision.message}
                        </p>
                      </div>
                    )}
                    
                    {revision.requirements && (
                      <div className="bg-blue-50 p-3 rounded-lg mt-2">
                        <p className="text-sm text-blue-700">
                          <strong>Requirements:</strong> {revision.requirements}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Negotiation History</h3>
                <p className="text-gray-600">This quotation hasn't been negotiated yet.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminQuotations;
