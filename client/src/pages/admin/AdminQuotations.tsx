import { useState } from 'react';
import { Link } from 'wouter';
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'rfq' | 'inquiry'>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNegotiationDialogOpen, setIsNegotiationDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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

  // Fetch quotations with enhanced product data (both RFQ and Inquiry)
  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/quotations', statusFilter, searchQuery, typeFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
        const response = await fetch(`/api/admin/quotations?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quotations');
        }
        const data = await response.json();
        const quotations = data.quotations || [];
        
        // Enhance quotations with additional data (product details for inquiry quotations that may not have been enhanced)
        const enhancedQuotations = await Promise.all(
          quotations.map(async (quotation: any) => {
            try {
              // For inquiry quotations, fetch product details if not already present
              if (quotation.type === 'inquiry' && quotation.productId && !quotation.productName) {
                try {
                  const productResponse = await fetch(`/api/products/${quotation.productId}`);
                  if (productResponse.ok) {
                    const productData = await productResponse.json();
                    quotation.product = productData;
                    quotation.productName = productData.name;
                    quotation.productImages = productData.images;
                    quotation.productCategory = productData.categoryName;
                  }
                } catch (err) {
                  console.error('Error fetching product:', err);
                }
              }
              
              // For RFQ quotations, ensure buyer details are fetched if not present
              if (quotation.type === 'rfq' && quotation.buyerId && !quotation.buyerName) {
                try {
                  const buyerResponse = await fetch(`/api/users/${quotation.buyerId}`);
                  if (buyerResponse.ok) {
                    const buyerData = await buyerResponse.json();
                    quotation.buyer = buyerData;
                    quotation.buyerName = `${buyerData.firstName || ''} ${buyerData.lastName || ''}`.trim() || buyerData.email;
                    quotation.buyerCompany = buyerData.companyName;
                    quotation.buyerEmail = buyerData.email;
                    quotation.buyerPhone = buyerData.phone;
                  }
                } catch (err) {
                  console.error('Error fetching buyer:', err);
                }
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

  // Send revised quotation mutation (handles both RFQ and Inquiry quotations)
  const sendRevisedQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, revisionData }: { quotationId?: string; revisionData: any }) => {
      const quotation = selectedQuotation;
      if (!quotation) throw new Error('No quotation selected');
      
      const quantity = quotation.quantity || quotation.inquiryQuantity || 1;
      const pricePerUnit = parseFloat(revisionData.newPrice);
      const totalPrice = pricePerUnit * quantity;
      
      let response;
      
      if (quotation.type === 'rfq') {
        // Send revised RFQ quotation
        response = await fetch(`/api/admin/rfqs/${quotation.rfqId}/revised-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pricePerUnit,
            totalPrice,
            moq: quotation.moq || quantity,
            leadTime: revisionData.newLeadTime,
            paymentTerms: revisionData.newPaymentTerms,
            message: revisionData.message
          }),
          credentials: 'include'
        });
      } else {
        // Send revised inquiry quotation
        response = await fetch(`/api/admin/inquiries/${quotation.inquiryId}/revised-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quotation: {
              pricePerUnit,
              totalPrice,
              moq: quotation.moq || quantity,
              leadTime: revisionData.newLeadTime,
              paymentTerms: revisionData.newPaymentTerms,
              message: revisionData.message
            }
          }),
          credentials: 'include'
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send revised quotation' }));
        throw new Error(errorData.error || 'Failed to send revised quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Revised quotation sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      setIsNegotiationDialogOpen(false);
      setNegotiationForm({ message: '', newPrice: '', newLeadTime: '', newPaymentTerms: '', isFinalOffer: false, urgency: 'normal' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send revised quotation');
    }
  });

  // Fetch negotiation history (handles both RFQ and Inquiry quotations)
  const fetchNegotiationHistory = useMutation({
    mutationFn: async (quotation: any) => {
      if (quotation.type === 'rfq') {
        // For RFQ quotations, get all quotations for the same RFQ
        const response = await fetch(`/api/rfqs/${quotation.rfqId}/quotations`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch RFQ quotation history');
        const data = await response.json();
        // Transform quotations to revision-like format for display
        return {
          revisions: (data.quotations || []).map((q: any, index: number) => ({
            id: q.id,
            revisionNumber: (data.quotations || []).length - index,
            quantity: q.moq,
            targetPrice: q.pricePerUnit,
            message: q.message,
            requirements: q.leadTime ? `Lead Time: ${q.leadTime}` : '',
            status: q.status,
            createdBy: q.supplierId ? 'admin' : 'buyer',
            createdAt: q.createdAt,
            pricePerUnit: q.pricePerUnit,
            totalPrice: q.totalPrice,
            leadTime: q.leadTime,
            paymentTerms: q.paymentTerms
          }))
        };
      } else {
        // For inquiry quotations, get revisions
        const response = await fetch(`/api/inquiries/${quotation.inquiryId}/revisions`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch negotiation history');
        return response.json();
      }
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
        return 'bg-primary/10 text-primary';
      case 'counter_offered':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'revised':
        return 'bg-orange-600 text-orange-600 dark:bg-orange-600 dark:text-orange-600';
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
      quotation.rfqTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.buyerCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesType = typeFilter === 'all' || quotation.type === typeFilter;
    
    // Apply tab filter
    let matchesTab = true;
    if (activeTab === 'rfq') {
      matchesTab = quotation.type === 'rfq';
    } else if (activeTab === 'inquiry') {
      matchesTab = quotation.type === 'inquiry';
    } else if (activeTab === 'quotations') {
      matchesTab = true; // Show all
    } else if (activeTab === 'overview') {
      matchesTab = false; // Overview tab shows different content
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesTab;
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
      newPrice: quotation.pricePerUnit?.toString() || '',
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
        quotationId: selectedQuotation.id,
        revisionData: negotiationForm
      });
    }
  };

  const handleViewNegotiationHistory = (quotation: any) => {
    fetchNegotiationHistory.mutate(quotation);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Quotations" }]} />
        
        {/* Header Section */}
        <div className="mb-8">
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
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">Total Quotations</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-primary-foreground/70 text-xs">{formatPrice(stats.totalValue)} value</p>
                </div>
                <FileText className="h-8 w-8 text-primary-foreground/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-foreground/80 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-secondary-foreground/70 text-xs">Quotations to Orders</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary-foreground/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-accent to-accent/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-accent-foreground/80 text-sm font-medium">Negotiation Rate</p>
                  <p className="text-3xl font-bold">{stats.negotiationSuccessRate}%</p>
                  <p className="text-accent-foreground/70 text-xs">Active Negotiations</p>
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
                  <p className="text-white/70 text-xs">Quotation Value</p>
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
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-semibold">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Accepted</span>
                  </div>
                  <span className="font-semibold">{stats.accepted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm">Negotiating</span>
                  </div>
                  <span className="font-semibold">{stats.negotiating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-semibold">{stats.rejected}</span>
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
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="font-semibold">${stats.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Negotiation Success</span>
                  <span className="font-semibold text-purple-600">{stats.negotiationSuccessRate}%</span>
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
                  <FileText className="h-4 w-4 mr-2" />
                  View All Negotiations
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleExportQuotations}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setIsAnalyticsDialogOpen(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotations">All Quotations</TabsTrigger>
            <TabsTrigger value="rfq">RFQ Quotations</TabsTrigger>
            <TabsTrigger value="inquiry">Inquiry Quotations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quotations.slice(0, 5).map((quotation: any) => (
                    <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{quotation.type === 'rfq' ? quotation.rfqTitle : quotation.productName}</p>
                          <p className="text-sm text-gray-600">{quotation.buyerCompany}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(quotation.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotations" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search quotations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | 'rfq' | 'inquiry')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="rfq">RFQ Quotations</SelectItem>
                      <SelectItem value="inquiry">Inquiry Quotations</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
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
                </div>
              </CardContent>
            </Card>

            {/* Quotations List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                filteredQuotations.map((quotation: any) => (
                  <Card key={quotation.id} className={`hover:shadow-xl transition-all duration-300 ${
                    quotation.type === 'rfq' 
                      ? 'border-l-4 border-l-purple-500' 
                      : 'border-l-4 border-l-primary'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex gap-4 flex-1">
                          {/* Product/RFQ Image */}
                          {quotation.type === 'inquiry' && quotation.productImages && quotation.productImages.length > 0 ? (
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                                <img 
                                  src={quotation.productImages[0]} 
                                  alt={quotation.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ) : quotation.type === 'inquiry' ? (
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center shadow-md">
                                <Package className="h-10 w-10 text-primary" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl flex items-center justify-center shadow-md">
                                <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {quotation.type === 'rfq' ? (quotation.rfqTitle || 'RFQ Quotation') : (quotation.productName || 'Inquiry Quotation')}
                              </h3>
                              <Badge 
                                className={quotation.type === 'rfq' 
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' 
                                  : 'bg-primary/10 text-primary border-primary/30 font-semibold'}
                              >
                                {quotation.type === 'rfq' ? 'RFQ Quotation' : 'Inquiry Quotation'}
                              </Badge>
                              <Badge className={getStatusColor(quotation.status)}>
                                {getStatusIcon(quotation.status)}
                                <span className="ml-1">{quotation.status}</span>
                              </Badge>
                              {quotation.status === 'accepted' && quotation.orderId && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Order Created
                                </Badge>
                              )}
                            </div>
                            
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className={`p-3 rounded-lg ${
                                quotation.type === 'rfq' 
                                  ? 'bg-purple-50 dark:bg-purple-900/20' 
                                  : 'bg-primary/5'
                              }`}>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price/Unit</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.pricePerUnit) || 0)}</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.totalPrice) || 0)}</p>
                              </div>
                              <div className={`p-3 rounded-lg ${
                                quotation.type === 'rfq' 
                                  ? 'bg-purple-50 dark:bg-purple-900/20' 
                                  : 'bg-primary/5'
                              }`}>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">MOQ</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{quotation.moq || quotation.inquiryQuantity || quotation.quantity || 'N/A'} units</p>
                              </div>
                            </div>

                            {/* Buyer & Metadata */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{quotation.buyerName || 'Unknown Buyer'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{quotation.buyerCompany || 'Unknown Company'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(quotation.createdAt)}</span>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              {quotation.leadTime && (
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  <span>Lead Time: {quotation.leadTime}</span>
                                </div>
                              )}
                              {quotation.paymentTerms && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{quotation.paymentTerms}</span>
                                </div>
                              )}
                              {quotation.buyerVerified && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified Buyer
                                </Badge>
                              )}
                            </div>

                            {/* Status Messages */}
                            {quotation.status === 'accepted' && (
                              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Quotation Accepted - Order Created
                                </p>
                              </div>
                            )}
                            {quotation.status === 'rejected' && (
                              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Quotation Rejected by Buyer
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Link href={`/admin/quotations/${quotation.id}`}>
                            <Button variant="default" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          {['pending', 'counter_offered', 'negotiating'].includes(quotation.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartNegotiation(quotation)}
                              className="w-full"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Negotiate
                            </Button>
                          )}
                          {(quotation.inquiryId || quotation.rfqId) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewNegotiationHistory(quotation)}
                              className="w-full"
                            >
                              <History className="h-4 w-4 mr-2" />
                              History
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuotation(quotation)}
                            className="w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rfq" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search RFQ quotations..."
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
              </CardContent>
            </Card>

            {/* RFQ Quotations List */}
            <div className="space-y-4">
              {quotations.filter((q: any) => q.type === 'rfq' && 
                (statusFilter === 'all' || q.status === statusFilter) &&
                (!searchQuery || q.rfqTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No RFQ quotations found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No RFQ quotations have been sent yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                quotations.filter((q: any) => q.type === 'rfq' && 
                  (statusFilter === 'all' || q.status === statusFilter) &&
                  (!searchQuery || q.rfqTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((quotation: any) => (
                  <Card key={quotation.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {quotation.rfqTitle || 'RFQ Quotation'}
                            </h3>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                              RFQ Quotation
                            </Badge>
                            <Badge className={getStatusColor(quotation.status)}>
                              {getStatusIcon(quotation.status)}
                              <span className="ml-1">{quotation.status}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-primary/5 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price/Unit</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.pricePerUnit) || 0)}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.totalPrice) || 0)}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">MOQ</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{quotation.moq || quotation.quantity || 'N/A'} units</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{quotation.buyerName || 'Unknown Buyer'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{quotation.buyerCompany || 'Unknown Company'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(quotation.createdAt)}</span>
                            </div>
                          </div>
                          {quotation.leadTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Truck className="h-4 w-4" />
                              <span>Lead Time: {quotation.leadTime}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/admin/quotations/${quotation.id}`}>
                            <Button variant="default" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          {['pending', 'counter_offered', 'negotiating'].includes(quotation.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartNegotiation(quotation)}
                              className="w-full"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Negotiate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="inquiry" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inquiry quotations..."
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
              </CardContent>
            </Card>

            {/* Inquiry Quotations List */}
            <div className="space-y-4">
              {quotations.filter((q: any) => q.type === 'inquiry' && 
                (statusFilter === 'all' || q.status === statusFilter) &&
                (!searchQuery || q.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No inquiry quotations found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No inquiry quotations have been sent yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                quotations.filter((q: any) => q.type === 'inquiry' && 
                  (statusFilter === 'all' || q.status === statusFilter) &&
                  (!searchQuery || q.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || q.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((quotation: any) => (
                  <Card key={quotation.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex gap-4 flex-1">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {quotation.productImages && quotation.productImages.length > 0 ? (
                              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                                <img 
                                  src={quotation.productImages[0]} 
                                  alt={quotation.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center shadow-md">
                                <Package className="h-10 w-10 text-primary" />
                              </div>
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {quotation.productName || 'Inquiry Quotation'}
                              </h3>
                              <Badge className="bg-primary/10 text-primary border-primary/30 font-semibold">
                                Inquiry Quotation
                              </Badge>
                              <Badge className={getStatusColor(quotation.status)}>
                                {getStatusIcon(quotation.status)}
                                <span className="ml-1">{quotation.status}</span>
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-primary/5 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price/Unit</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.pricePerUnit) || 0)}</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(parseFloat(quotation.totalPrice) || 0)}</p>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">MOQ</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{quotation.moq || quotation.inquiryQuantity || quotation.quantity || 'N/A'} units</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{quotation.buyerName || 'Unknown Buyer'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{quotation.buyerCompany || 'Unknown Company'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(quotation.createdAt)}</span>
                              </div>
                            </div>
                            {quotation.leadTime && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Truck className="h-4 w-4" />
                                <span>Lead Time: {quotation.leadTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/admin/quotations/${quotation.id}`}>
                            <Button variant="default" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          {['pending', 'counter_offered', 'negotiating'].includes(quotation.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartNegotiation(quotation)}
                              className="w-full"
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Negotiate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Quotations</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Negotiation Success</span>
                      <span className="font-semibold text-purple-600">{stats.negotiationSuccessRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Value</span>
                      <span className="font-semibold">${stats.totalValue.toLocaleString()}</span>
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
                      <span className="text-sm text-gray-600">Accepted</span>
                      <span className="font-semibold text-green-600">{stats.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rejected</span>
                      <span className="font-semibold text-red-600">{stats.rejected}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Negotiating</span>
                      <span className="font-semibold text-primary">{stats.negotiating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">{stats.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      {/* Enhanced Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
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
                className="bg-primary hover:bg-primary/90"
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
              <TrendingUp className="w-5 h-5 text-primary" />
              Send Revised Quotation
            </DialogTitle>
            <DialogDescription>
              Respond to buyer's counter-offer or send a revised quotation with better terms.
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Current Quotation Details */}
              <div className="bg-gradient-to-r from-primary/5 to-purple-50 p-6 rounded-xl border border-primary/20">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Current Quotation Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">
                      {selectedQuotation.type === 'rfq' ? 'RFQ Title:' : 'Product:'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {selectedQuotation.type === 'rfq' 
                        ? (selectedQuotation.rfqTitle || 'RFQ') 
                        : (selectedQuotation.productName || 'Unknown')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Buyer:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.buyerName || 'Unknown'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Quantity:</span>
                    <span className="font-medium text-gray-900">
                      {(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || selectedQuotation.moq || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Current Price:</span>
                    <span className="font-medium text-gray-900">
                      ${selectedQuotation.pricePerUnit || selectedQuotation.unitPrice || 0}
                    </span>
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
                      className="border-gray-300 focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">Consider market conditions and buyer's counter-offer</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Urgency Level</label>
                    <Select value={negotiationForm.urgency} onValueChange={(value) => setNegotiationForm({...negotiationForm, urgency: value})}>
                      <SelectTrigger className="border-gray-300 focus:border-primary">
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
                      className="border-gray-300 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Revised Payment Terms</label>
                    <Input
                      placeholder="e.g., 30% advance, 70% on delivery"
                      value={negotiationForm.newPaymentTerms}
                      onChange={(e) => setNegotiationForm({...negotiationForm, newPaymentTerms: e.target.value})}
                      className="border-gray-300 focus:border-primary"
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
                    className="border-gray-300 focus:border-primary"
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
              className="bg-primary hover:bg-primary/90 text-white"
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
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <GitCommit className="w-4 h-4 text-primary" />
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
                        <span className="ml-2 font-medium">{revision.quantity?.toLocaleString() || revision.moq?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Price per Unit:</span>
                        <span className="ml-2 font-medium">${revision.pricePerUnit || revision.targetPrice || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Price:</span>
                        <span className="ml-2 font-medium">${revision.totalPrice || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Created By:</span>
                        <span className="ml-2 font-medium">{revision.createdBy === 'admin' || revision.createdBy === 'supplierId' ? 'Admin' : 'Buyer'}</span>
                      </div>
                    </div>
                    
                    {(revision.leadTime || revision.paymentTerms) && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {revision.leadTime && (
                          <div>
                            <span className="text-sm text-gray-600">Lead Time:</span>
                            <span className="ml-2 font-medium">{revision.leadTime}</span>
                          </div>
                        )}
                        {revision.paymentTerms && (
                          <div>
                            <span className="text-sm text-gray-600">Payment Terms:</span>
                            <span className="ml-2 font-medium">{revision.paymentTerms}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {revision.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Message:</strong> {revision.message}
                        </p>
                      </div>
                    )}
                    
                    {revision.requirements && (
                      <div className="bg-primary/5 p-3 rounded-lg mt-2">
                        <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
export default AdminQuotations;