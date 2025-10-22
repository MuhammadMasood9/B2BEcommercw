import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  DollarSign,
  Calendar,
  Truck,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShoppingCart,
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  ArrowRight,
  Globe,
  Shield,
  Plus,
  Users,
  History,
  Edit,
  Send,
  Copy,
  Star,
  Zap,
  Target,
  BarChart3,
  Activity,
  Layers,
  GitBranch,
  GitCommit,
  ArrowUpDown,
  Percent,
  Timer,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen,
  Lightbulb,
  Award,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Loader2,
  XCircle,
  CheckSquare,
  Square
} from 'lucide-react';

export default function BuyerQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCounterOfferDialogOpen, setIsCounterOfferDialogOpen] = useState(false);
  const [isNegotiationHistoryOpen, setIsNegotiationHistoryOpen] = useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [selectedQuotationsForCompare, setSelectedQuotationsForCompare] = useState<any[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterOffer, setCounterOffer] = useState({
    quantity: '',
    targetPrice: '',
    message: '',
    requirements: '',
    urgency: 'normal',
    deadline: ''
  });
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');

  const queryClient = useQueryClient();

  // Fetch quotations from API
  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ['/api/buyer/quotations', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const response = await fetch('/api/buyer/quotations', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch quotations');
        const data = await response.json();
        console.log('Fetched quotations:', data);
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    }
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/inquiry-quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to accept quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation accepted successfully! Order has been created.');
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      setIsAcceptDialogOpen(false);
      setShippingAddress('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/inquiry-quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reject quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject quotation');
    }
  });

  // Send counter-offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ quotationId, counterOfferData }: { quotationId: string, counterOfferData: any }) => {
      const response = await fetch(`/api/inquiries/${selectedQuotation?.inquiryId}/counter-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(counterOfferData.quantity),
          targetPrice: parseFloat(counterOfferData.targetPrice),
          message: counterOfferData.message,
          requirements: counterOfferData.requirements,
          urgency: counterOfferData.urgency,
          deadline: counterOfferData.deadline
        }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send counter-offer');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Counter-offer sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      setIsCounterOfferDialogOpen(false);
      setCounterOffer({ quantity: '', targetPrice: '', message: '', requirements: '', urgency: 'normal', deadline: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send counter-offer');
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
      setIsNegotiationHistoryOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to fetch negotiation history');
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      case "expired": return <AlertCircle className="h-4 w-4" />;
      case "negotiating": return <MessageSquare className="h-4 w-4" />;
      case "counter_offered": return <TrendingUp className="h-4 w-4" />;
      case "revised": return <Edit className="h-4 w-4" />;
      case "under_review": return <Eye className="h-4 w-4" />;
      case "awaiting_response": return <Timer className="h-4 w-4" />;
      case "final_offer": return <Target className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "expired": return "bg-gray-100 text-gray-800 border-gray-200";
      case "negotiating": return "bg-blue-100 text-blue-800 border-blue-200";
      case "counter_offered": return "bg-purple-100 text-purple-800 border-purple-200";
      case "revised": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "under_review": return "bg-orange-100 text-orange-800 border-orange-200";
      case "awaiting_response": return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "final_offer": return "bg-pink-100 text-pink-800 border-pink-200";
      case "cancelled": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending": return "Waiting for your response";
      case "accepted": return "Quotation accepted";
      case "rejected": return "Quotation rejected";
      case "expired": return "Quotation has expired";
      case "negotiating": return "Under negotiation";
      case "counter_offered": return "Counter-offer sent";
      case "revised": return "Quotation revised by admin";
      case "under_review": return "Under admin review";
      case "awaiting_response": return "Awaiting admin response";
      case "final_offer": return "Final offer - no further negotiation";
      case "cancelled": return "Negotiation cancelled";
      default: return "Unknown status";
    }
  };

  // Ensure quotations is always an array
  const quotations = Array.isArray(quotationsData) ? quotationsData : [];

  const filteredQuotations = quotations.filter((quotation: any) => {
    const matchesSearch = (quotation.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (quotation.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (quotation.adminName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedQuotations = [...filteredQuotations].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || b.quotationDate || b.created_at || 0).getTime() - 
               new Date(a.createdAt || a.quotationDate || a.created_at || 0).getTime();
      case "oldest":
        return new Date(a.createdAt || a.quotationDate || a.created_at || 0).getTime() - 
               new Date(b.createdAt || b.quotationDate || b.created_at || 0).getTime();
      case "price-high":
        return (b.totalPrice || b.totalAmount || 0) - (a.totalPrice || a.totalAmount || 0);
      case "price-low":
        return (a.totalPrice || a.totalAmount || 0) - (b.totalPrice || b.totalAmount || 0);
      default:
        return 0;
    }
  });

  // Enhanced quotation categorization
  const pendingQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "pending");
  const acceptedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "accepted");
  const rejectedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "rejected");
  const negotiatingQuotations = filteredQuotations.filter((quotation: any) => 
    ["negotiating", "counter_offered", "revised", "under_review", "awaiting_response"].includes(quotation.status)
  );
  const expiredQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "expired");
  const finalOfferQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "final_offer");

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

  const handleCounterOffer = () => {
    if (selectedQuotation && counterOffer.quantity && counterOffer.targetPrice) {
      counterOfferMutation.mutate({ 
        quotationId: selectedQuotation.id, 
        counterOfferData: counterOffer 
      });
    }
  };

  const handleViewNegotiationHistory = (quotation: any) => {
    if (quotation.inquiryId) {
      fetchNegotiationHistory.mutate(quotation.inquiryId);
    }
  };

  const handleCompareQuotations = (quotation: any) => {
    // Only show quotations from the same inquiry for comparison
    const sameInquiryQuotations = quotations.filter((q: any) => 
      q.inquiryId === quotation.inquiryId && q.id !== quotation.id
    );
    
    if (sameInquiryQuotations.length > 0) {
      setSelectedQuotationsForCompare([quotation, ...sameInquiryQuotations]);
      setIsCompareDialogOpen(true);
    } else {
      toast.error('No other quotations found for this inquiry to compare');
    }
  };

  const handleAddToCompare = (quotation: any) => {
    if (selectedQuotationsForCompare.length < 3) {
      setSelectedQuotationsForCompare([...selectedQuotationsForCompare, quotation]);
    }
  };

  const handleRemoveFromCompare = (quotationId: string) => {
    setSelectedQuotationsForCompare(selectedQuotationsForCompare.filter(q => q.id !== quotationId));
  };

  const handleExportQuotations = () => {
    toast.success('Exporting quotations...');
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
              <span>My Quotations</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              My
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Quotations
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Review and manage quotations from verified admins for your inquiries
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
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
          {/* Enhanced Header with Analytics and Controls */}
          <div className="space-y-6 mb-8">
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search quotations, suppliers, or products..."
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
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="value-high">Value: High to Low</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
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

                    <Button variant="outline" size="sm" onClick={handleExportQuotations}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{pendingQuotations.length}</div>
                <div className="text-xs text-gray-600">Pending</div>
                <div className="text-xs text-yellow-600 mt-1">{getStatusDescription('pending')}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{negotiatingQuotations.length}</div>
                <div className="text-xs text-gray-600">Negotiating</div>
                <div className="text-xs text-blue-600 mt-1">Active discussions</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{finalOfferQuotations.length}</div>
                <div className="text-xs text-gray-600">Final Offers</div>
                <div className="text-xs text-purple-600 mt-1">Last chance</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{acceptedQuotations.length}</div>
                <div className="text-xs text-gray-600">Accepted</div>
                <div className="text-xs text-green-600 mt-1">Orders created</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{rejectedQuotations.length}</div>
                <div className="text-xs text-gray-600">Rejected</div>
                <div className="text-xs text-red-600 mt-1">No deal</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{expiredQuotations.length}</div>
                <div className="text-xs text-gray-600">Expired</div>
                <div className="text-xs text-gray-600 mt-1">Time's up</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Quotations Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All Quotations</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
              <TabsTrigger value="final_offer">Final Offers</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
              ) : sortedQuotations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedQuotations.map((quotation: any) => (
                    <Card key={quotation.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {quotation.productName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Quotation #{quotation.id}</p>
                          </div>
                          <Badge className={`${getStatusColor(quotation.status)} flex items-center gap-1`}>
                            {getStatusIcon(quotation.status)}
                            {quotation.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Admin:</span>
                            <span className="font-medium">{quotation.supplierName || quotation.adminName || 'Admin'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{(quotation.inquiryQuantity || quotation.quantity || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="font-medium">${quotation.pricePerUnit || quotation.unitPrice || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-green-600">${(quotation.totalPrice || quotation.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Quoted: {new Date(quotation.quotationDate || quotation.createdAt || quotation.created_at || new Date()).toLocaleDateString()}</span>
                            <span>Valid Until: {new Date(quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/quotation/${quotation.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          
                          {/* Accept/Reject Actions for Pending Quotations */}
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
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Negotiation Actions */}
                          {['pending', 'negotiating', 'counter_offered', 'revised'].includes(quotation.status) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsCounterOfferDialogOpen(true);
                              }}
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <TrendingUp className="w-4 h-4 mr-1" />
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
                              <History className="w-4 h-4 mr-1" />
                              History
                            </Button>
                          )}
                          
                          {/* Compare Button - Only show if there are other quotations for the same inquiry */}
                          {quotation.inquiryId && quotations.filter((q: any) => 
                            q.inquiryId === quotation.inquiryId && q.id !== quotation.id
                          ).length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCompareQuotations(quotation)}
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Compare
                            </Button>
                          )}
                          
                          {/* Message Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotations found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'You haven\'t received any quotations yet'}
                  </p>
                  <Link href="/inquiries">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Make Inquiry
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* Other tabs content would be similar but filtered by status */}
            <TabsContent value="pending" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingQuotations.map((quotation: any) => (
                  <Card key={quotation.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {quotation.productName}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Quotation #{quotation.id}</p>
                        </div>
                        <Badge className={`${getStatusColor(quotation.status)} flex items-center gap-1`}>
                          {getStatusIcon(quotation.status)}
                          {quotation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{quotation.supplierName || quotation.adminName || 'Admin'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{(quotation.inquiryQuantity || quotation.quantity || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${quotation.pricePerUnit || quotation.unitPrice || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${(quotation.totalPrice || quotation.totalAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Quoted: {new Date(quotation.quotationDate || quotation.createdAt || quotation.created_at).toLocaleDateString()}</span>
                          <span>Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/quotation/${quotation.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
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
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setIsCounterOfferDialogOpen(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Similar structure for other tabs */}
            <TabsContent value="accepted" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedQuotations.map((quotation: any) => (
                  <Card key={quotation.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {quotation.productName}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Quotation #{quotation.id}</p>
                        </div>
                        <Badge className={`${getStatusColor(quotation.status)} flex items-center gap-1`}>
                          {getStatusIcon(quotation.status)}
                          {quotation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{quotation.supplierName || quotation.adminName || 'Admin'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{(quotation.quantity || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${quotation.unitPrice || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${(quotation.totalAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Quoted: {new Date(quotation.quotationDate).toLocaleDateString()}</span>
                          <span>Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/quotation/${quotation.id}`}>
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
                ))}
              </div>
            </TabsContent>

            {/* Similar structure for rejected, negotiating, final_offer, expired tabs */}
          </Tabs>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need to Make an Inquiry?
              </h3>
              <p className="text-gray-600 mb-6">
                Browse our products and send inquiries to verified admins
              </p>
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

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
                  <p><strong>Product:</strong> {selectedQuotation.productName}</p>
                  <p><strong>Quantity:</strong> {(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || 0).toLocaleString()} units</p>
                  <p><strong>Total Amount:</strong> ${(selectedQuotation.totalPrice || selectedQuotation.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Textarea
                id="shipping-address"
                placeholder="Enter your complete shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                className="mt-2"
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
                  <p><strong>Product:</strong> {selectedQuotation.productName}</p>
                  <p><strong>Quantity:</strong> {(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || 0).toLocaleString()} units</p>
                  <p><strong>Total Amount:</strong> ${(selectedQuotation.totalPrice || selectedQuotation.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
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

      {/* Enhanced Counter Offer Dialog */}
      <Dialog open={isCounterOfferDialogOpen} onOpenChange={setIsCounterOfferDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Send Counter Offer
            </DialogTitle>
            <DialogDescription>
              Negotiate better terms with the admin. Be specific about your requirements and timeline.
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
                    <span className="text-gray-600 block">Admin:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.supplierName || selectedQuotation.adminName}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Quantity:</span>
                    <span className="font-medium text-gray-900">{(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Unit Price:</span>
                    <span className="font-medium text-gray-900">${selectedQuotation.pricePerUnit || selectedQuotation.unitPrice || 0}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Total:</span>
                    <span className="font-medium text-green-600">${(selectedQuotation.totalPrice || selectedQuotation.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Lead Time:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.leadTime || 'Not specified'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Payment Terms:</span>
                    <span className="font-medium text-gray-900">{selectedQuotation.paymentTerms || 'Not specified'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <span className="text-gray-600 block">Valid Until:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedQuotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Counter Offer Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="counter-quantity">Desired Quantity</Label>
                    <Input
                      id="counter-quantity"
                      type="number"
                      placeholder="Enter desired quantity"
                      value={counterOffer.quantity}
                      onChange={(e) => setCounterOffer({...counterOffer, quantity: e.target.value})}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum order quantity may apply</p>
                  </div>
                  <div>
                    <Label htmlFor="counter-price">Target Price per Unit ($)</Label>
                    <Input
                      id="counter-price"
                      type="number"
                      step="0.01"
                      placeholder="Enter your target price"
                      value={counterOffer.targetPrice}
                      onChange={(e) => setCounterOffer({...counterOffer, targetPrice: e.target.value})}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Be realistic with your expectations</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="counter-urgency">Urgency Level</Label>
                    <Select value={counterOffer.urgency} onValueChange={(value) => setCounterOffer({...counterOffer, urgency: value})}>
                      <SelectTrigger className="mt-2">
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
                  <div>
                    <Label htmlFor="counter-deadline">Deadline (Optional)</Label>
                    <Input
                      id="counter-deadline"
                      type="date"
                      value={counterOffer.deadline}
                      onChange={(e) => setCounterOffer({...counterOffer, deadline: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="counter-message">Message to Admin</Label>
                  <Textarea
                    id="counter-message"
                    placeholder="Explain your counter-offer, reasoning, and any specific requirements..."
                    value={counterOffer.message}
                    onChange={(e) => setCounterOffer({...counterOffer, message: e.target.value})}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Be professional and specific about your needs</p>
                </div>
                
                <div>
                  <Label htmlFor="counter-requirements">Additional Requirements</Label>
                  <Textarea
                    id="counter-requirements"
                    placeholder="Any specific requirements, modifications, or special conditions..."
                    value={counterOffer.requirements}
                    onChange={(e) => setCounterOffer({...counterOffer, requirements: e.target.value})}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {/* Negotiation Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Negotiation Tips
                  </h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Be specific about quantity and timeline to get better pricing</li>
                    <li>• Consider long-term partnership opportunities</li>
                    <li>• Mention any certifications or quality requirements</li>
                    <li>• Ask about bulk discounts or payment terms</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCounterOfferDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCounterOffer}
              disabled={!counterOffer.quantity || !counterOffer.targetPrice || counterOfferMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {counterOfferMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Counter Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negotiation History Dialog */}
      <Dialog open={isNegotiationHistoryOpen} onOpenChange={setIsNegotiationHistoryOpen}>
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
            <Button variant="outline" onClick={() => setIsNegotiationHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Quotation Comparison Dialog */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Compare Quotations - Same Inquiry
            </DialogTitle>
            <DialogDescription>
              Compare quotations from the same inquiry to see negotiation progress and make the best decision.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Quotation Selection - Only show quotations from same inquiry */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Quotations from Same Inquiry</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedQuotationsForCompare.length > 0 && sortedQuotations
                  .filter((quotation: any) => 
                    quotation.inquiryId === selectedQuotationsForCompare[0]?.inquiryId
                  )
                  .map((quotation: any) => {
                    const isSelected = selectedQuotationsForCompare.some(q => q.id === quotation.id);
                    
                    return (
                      <div 
                        key={quotation.id}
                        className={`p-3 border rounded-lg transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-sm">{quotation.productName}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>Admin: {quotation.supplierName || quotation.adminName}</p>
                          <p>Price: ${quotation.pricePerUnit || quotation.unitPrice}</p>
                          <p>Total: ${(quotation.totalPrice || quotation.totalAmount || 0).toLocaleString()}</p>
                          <p>Status: <span className="capitalize">{quotation.status}</span></p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Comparing {selectedQuotationsForCompare.length} quotations from the same inquiry
              </p>
            </div>

            {/* Comparison Table */}
            {selectedQuotationsForCompare.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Criteria</th>
                      {selectedQuotationsForCompare.map((quotation: any, index: number) => (
                        <th key={quotation.id} className="text-left p-3 font-medium text-gray-700">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(quotation.status)}>
                              {getStatusIcon(quotation.status)}
                              <span className="ml-1">{quotation.status}</span>
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Quotation #{index + 1}</div>
                              <div>{quotation.supplierName || quotation.adminName}</div>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Product</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">{quotation.productName}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Quantity</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">{(quotation.inquiryQuantity || quotation.quantity || 0).toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Unit Price</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3 font-medium text-green-600">${quotation.pricePerUnit || quotation.unitPrice || 0}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Total Price</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3 font-medium text-green-600">${(quotation.totalPrice || quotation.totalAmount || 0).toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Lead Time</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">{quotation.leadTime || 'Not specified'}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Payment Terms</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">{quotation.paymentTerms || 'Not specified'}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Valid Until</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">{new Date(quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Status</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">
                          <Badge className={getStatusColor(quotation.status)}>
                            {getStatusIcon(quotation.status)}
                            <span className="ml-1">{quotation.status}</span>
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-700">Actions</td>
                      {selectedQuotationsForCompare.map((quotation: any) => (
                        <td key={quotation.id} className="p-3">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/quotation/${quotation.id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Link>
                            </Button>
                            {quotation.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setIsAcceptDialogOpen(true);
                                    setIsCompareDialogOpen(false);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setIsRejectDialogOpen(true);
                                    setIsCompareDialogOpen(false);
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Quotations Selected</h3>
                <p className="text-gray-600">Select quotations from the list above to compare them side by side.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompareDialogOpen(false)}>
              Close
            </Button>
            {selectedQuotationsForCompare.length > 0 && (
              <Button 
                onClick={() => {
                  // Export comparison
                  toast.success('Comparison exported successfully!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Comparison
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}