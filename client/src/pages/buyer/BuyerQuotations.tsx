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
  Users
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
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterOffer, setCounterOffer] = useState({
    quantity: '',
    targetPrice: '',
    message: '',
    requirements: ''
  });

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
        // Return empty array if API fails
        return [];
      }
    }
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to accept quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
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
      const response = await fetch(`/api/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reject quotation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Quotation rejected');
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
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
          requirements: counterOfferData.requirements
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
      setCounterOffer({ quantity: '', targetPrice: '', message: '', requirements: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send counter-offer');
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
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      case "negotiating": return "bg-blue-100 text-blue-800";
      case "counter_offered": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
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

  const pendingQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "pending");
  const acceptedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "accepted");
  const rejectedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "rejected");
  const negotiatingQuotations = filteredQuotations.filter((quotation: any) => 
    quotation.status === "negotiating" || quotation.status === "counter_offered"
  );

  const handleAcceptQuotation = () => {
    if (selectedQuotation) {
      acceptQuotationMutation.mutate(selectedQuotation.id);
    }
  };

  const handleRejectQuotation = () => {
    if (selectedQuotation) {
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
          {/* Header with Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search quotations..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="counter_offered">Counter Offered</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingQuotations.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{negotiatingQuotations.length}</div>
                <div className="text-sm text-gray-600">Negotiating</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{acceptedQuotations.length}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{rejectedQuotations.length}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${quotations.reduce((sum: number, quotation: any) => sum + (quotation.totalPrice || quotation.totalAmount || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </CardContent>
            </Card>
          </div>

          {/* Quotations Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Quotations</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
                          {quotation.status === 'pending' && (
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
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
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
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setIsCounterOfferDialogOpen(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4" />
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

            <TabsContent value="negotiating" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {negotiatingQuotations.map((quotation: any) => (
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
                          {quotation.status === 'negotiating' ? 'Negotiating' : 'Counter Offered'}
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
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedQuotation(quotation);
                            setIsCounterOfferDialogOpen(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4" />
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

            <TabsContent value="accepted" className="space-y-6">
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

            <TabsContent value="rejected" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedQuotations.map((quotation: any) => (
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

      {/* Quotation Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              Review the complete quotation details before making a decision.
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <p className="text-lg font-semibold">{selectedQuotation.productName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Admin</label>
                  <p className="text-lg font-semibold">{selectedQuotation.supplierName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-lg font-semibold">{(selectedQuotation.inquiryQuantity ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit Price</label>
                  <p className="text-lg font-semibold">${selectedQuotation.pricePerUnit ?? 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Amount</label>
                  <p className="text-lg font-semibold text-green-600">${(selectedQuotation.totalPrice ?? 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Delivery Time</label>
                  <p className="text-lg font-semibold">{selectedQuotation.deliveryTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                  <p className="text-lg font-semibold">{selectedQuotation.paymentTerms}</p>
                </div>
              </div>
              
              {selectedQuotation.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-lg font-semibold">{selectedQuotation.notes}</p>
                </div>
              )}
              
              {selectedQuotation.attachments && selectedQuotation.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Attachments</label>
                  <div className="space-y-2">
                    {selectedQuotation.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{attachment}</span>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedQuotation?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedQuotation(selectedQuotation);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedQuotation(selectedQuotation);
                    setIsAcceptDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Quotation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Please provide your shipping address to proceed with this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Shipping Address</label>
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
              disabled={!shippingAddress || acceptQuotationMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {acceptQuotationMutation.isPending ? 'Accepting...' : 'Accept Quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Quotation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection</label>
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
              disabled={!rejectionReason || rejectQuotationMutation.isPending}
              variant="destructive"
            >
              {rejectQuotationMutation.isPending ? 'Rejecting...' : 'Reject Quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Dialog */}
      <Dialog open={isCounterOfferDialogOpen} onOpenChange={setIsCounterOfferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Counter Offer</DialogTitle>
            <DialogDescription>
              Send a counter-offer to negotiate the terms of this quotation.
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Current Quotation Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Current Quotation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-medium">{selectedQuotation.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Admin:</span>
                    <span className="ml-2 font-medium">{selectedQuotation.supplierName || selectedQuotation.adminName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{(selectedQuotation.inquiryQuantity || selectedQuotation.quantity || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="ml-2 font-medium">${selectedQuotation.pricePerUnit || selectedQuotation.unitPrice || 0}</span>
                  </div>
                </div>
              </div>

              {/* Counter Offer Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      placeholder="Enter desired quantity"
                      value={counterOffer.quantity}
                      onChange={(e) => setCounterOffer({...counterOffer, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Price per Unit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter your target price"
                      value={counterOffer.targetPrice}
                      onChange={(e) => setCounterOffer({...counterOffer, targetPrice: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message to Admin</label>
                  <Textarea
                    placeholder="Explain your counter-offer and any specific requirements..."
                    value={counterOffer.message}
                    onChange={(e) => setCounterOffer({...counterOffer, message: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Additional Requirements</label>
                  <Textarea
                    placeholder="Any specific requirements or modifications needed..."
                    value={counterOffer.requirements}
                    onChange={(e) => setCounterOffer({...counterOffer, requirements: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCounterOfferDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCounterOffer}
              disabled={!counterOffer.quantity || !counterOffer.targetPrice || counterOfferMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {counterOfferMutation.isPending ? 'Sending...' : 'Send Counter Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}