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
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Star,
  Users,
  ShoppingCart,
  Settings
} from 'lucide-react';

export default function AdminInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [quotationForm, setQuotationForm] = useState({
    pricePerUnit: '',
    totalPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });
  const [selectedInquiryForNegotiation, setSelectedInquiryForNegotiation] = useState<any>(null);
  const [isNegotiationDialogOpen, setIsNegotiationDialogOpen] = useState(false);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [revisedQuotationForm, setRevisedQuotationForm] = useState({
    pricePerUnit: '',
    totalPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Dynamic data from API
  const { data: inquiriesData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/inquiries', statusFilter, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        const response = await fetch(`/api/admin/inquiries?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inquiries');
        }
        const data = await response.json();
        return data.inquiries || [];
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        return [];
      }
    }
  });

  const sendQuotationMutation = useMutation({
    mutationFn: async ({ inquiryId, quotation }: { inquiryId: string; quotation: any }) => {
      try {
        const response = await fetch('/api/admin/inquiries/quotation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inquiryId,
            quotation
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send quotation');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error sending quotation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      setSelectedInquiry(null);
      setQuotationForm({
        pricePerUnit: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        totalPrice: '',
        message: ''
      });
      toast.success('Quotation sent successfully!');
    },
    onError: (error: any) => {
      console.error('Error sending quotation:', error);
      toast.error(`Failed to send quotation: ${error.message}`);
    }
  });

  // Fetch negotiation history
  const fetchNegotiationHistory = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/revisions`);
      if (response.ok) {
        const data = await response.json();
        setNegotiationHistory(data.revisions || []);
      }
    } catch (error) {
      console.error('Error fetching negotiation history:', error);
    }
  };

  // Send revised quotation
  const sendRevisedQuotationMutation = useMutation({
    mutationFn: async ({ inquiryId, quotation }: { inquiryId: string; quotation: any }) => {
      console.log('Sending revised quotation:', { inquiryId, quotation });
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/revised-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Revised quotation error:', errorData);
        throw new Error(errorData.error || 'Failed to send revised quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      setRevisedQuotationForm({
        pricePerUnit: '',
        totalPrice: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: ''
      });
      setIsNegotiationDialogOpen(false);
      toast.success('Revised quotation sent successfully!');
    },
    onError: (error: any) => {
      console.error('Error sending revised quotation:', error);
      toast.error(`Failed to send revised quotation: ${error.message}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied': return CheckCircle;
      case 'pending': return Clock;
      case 'negotiating': return MessageSquare;
      case 'closed': return AlertCircle;
      default: return Clock;
    }
  };

  // Ensure inquiries is always an array
  const inquiries = Array.isArray(inquiriesData) ? inquiriesData : [];

  // Enhanced analytics
  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i: any) => i.status === 'pending').length,
    replied: inquiries.filter((i: any) => i.status === 'replied').length,
    negotiating: inquiries.filter((i: any) => i.status === 'negotiating').length,
    closed: inquiries.filter((i: any) => i.status === 'closed').length,
    // Calculate conversion rates
    conversionRate: inquiries.length > 0 ? 
      ((inquiries.filter((i: any) => i.status === 'replied').length / inquiries.length) * 100).toFixed(1) : 0,
    negotiationRate: inquiries.length > 0 ? 
      ((inquiries.filter((i: any) => i.status === 'negotiating').length / inquiries.length) * 100).toFixed(1) : 0,
    // Calculate average response time (mock data for now)
    avgResponseTime: '2.5 hours',
    // Calculate total inquiry value
    totalValue: inquiries.reduce((sum: number, inquiry: any) => 
      sum + ((inquiry.quantity || 0) * (inquiry.targetPrice || 0)), 0),
    // Recent activity (last 7 days)
    recentActivity: inquiries.filter((i: any) => {
      const createdAt = new Date(i.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length
  };

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch = inquiry.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.buyerCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
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

  const handleSendQuotation = (inquiryId: string) => {
    const pricePerUnit = parseFloat(quotationForm.pricePerUnit) || 0;
    const moq = parseInt(quotationForm.moq) || 1;
    const totalPrice = pricePerUnit * moq;

    sendQuotationMutation.mutate({
      inquiryId,
      quotation: {
        ...quotationForm,
        pricePerUnit: pricePerUnit,
        totalPrice: totalPrice,
        moq: moq
      }
    });
  };

  const calculateTotalPrice = () => {
    const pricePerUnit = parseFloat(quotationForm.pricePerUnit) || 0;
    const moq = parseInt(quotationForm.moq) || 1;
    return pricePerUnit * moq;
  };

  const calculateRevisedTotalPrice = () => {
    const pricePerUnit = parseFloat(revisedQuotationForm.pricePerUnit) || 0;
    const moq = parseInt(revisedQuotationForm.moq) || 1;
    return pricePerUnit * moq;
  };

  const handleViewNegotiation = async (inquiry: any) => {
    setSelectedInquiryForNegotiation(inquiry);
    await fetchNegotiationHistory(inquiry.id);
    setIsNegotiationDialogOpen(true);
  };

  const handleSendRevisedQuotation = (inquiryId: string) => {
    const pricePerUnit = parseFloat(revisedQuotationForm.pricePerUnit) || 0;
    const moq = parseInt(revisedQuotationForm.moq) || 1;
    const totalPrice = pricePerUnit * moq;

    sendRevisedQuotationMutation.mutate({
      inquiryId,
      quotation: {
        ...revisedQuotationForm,
        pricePerUnit: pricePerUnit,
        totalPrice: totalPrice,
        moq: moq
      }
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading inquiries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading inquiries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Inquiries" }]} />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                B2B Negotiation Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive inquiry management and negotiation tracking system
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Inquiries</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-blue-200 text-xs">+{stats.recentActivity} this week</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-green-200 text-xs">Inquiries to Quotations</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Negotiation Rate</p>
                  <p className="text-3xl font-bold">{stats.negotiationRate}%</p>
                  <p className="text-purple-200 text-xs">Active Negotiations</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Value</p>
                  <p className="text-3xl font-bold">${stats.totalValue.toLocaleString()}</p>
                  <p className="text-orange-200 text-xs">Inquiry Value</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-200" />
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
                    <span className="text-sm">Replied</span>
                  </div>
                  <span className="font-semibold">{stats.replied}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Negotiating</span>
                  </div>
                  <span className="font-semibold">{stats.negotiating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Closed</span>
                  </div>
                  <span className="font-semibold">{stats.closed}</span>
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
                  <span className="font-semibold">{stats.recentActivity} inquiries</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
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
                  View All Negotiations
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inquiries">All Inquiries</TabsTrigger>
            <TabsTrigger value="negotiations">Active Negotiations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiries.slice(0, 5).map((inquiry: any) => (
                    <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{inquiry.productName}</p>
                          <p className="text-sm text-gray-600">{inquiry.buyerCompany}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inquiries..."
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
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
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
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

            {/* Inquiries List */}
            <div className="space-y-4">
              {filteredInquiries.map((inquiry: any) => (
                <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {inquiry.productName}
                            </h3>
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Buyer:</span> {inquiry.buyerName}
                            </div>
                            <div>
                              <span className="font-medium">Company:</span> {inquiry.buyerCompany}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {inquiry.quantity} units
                            </div>
                            <div>
                              <span className="font-medium">Target Price:</span> ${inquiry.targetPrice}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {inquiry.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-gray-500">
                              Created: {formatDate(inquiry.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Country: {inquiry.buyerCountry}
                            </span>
                          </div>

                          {/* Display sent quotations */}
                          {inquiry.quotations && inquiry.quotations.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Quotations Sent ({inquiry.quotations.length})
                              </h4>
                              <div className="space-y-2">
                                {inquiry.quotations.map((quotation: any) => (
                                  <div key={quotation.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <span className="font-medium text-blue-600">${quotation.pricePerUnit}/unit</span>
                                        <span className="text-gray-600 ml-2 text-sm">(Total: ${quotation.totalPrice})</span>
                                        <Badge className="ml-2" variant={
                                          quotation.status === 'accepted' ? 'default' : 
                                          quotation.status === 'rejected' ? 'destructive' : 
                                          'secondary'
                                        }>
                                          {quotation.status || 'pending'}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(quotation.createdAt)}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                      <span>MOQ: {quotation.moq}</span>
                                      <span>Lead: {quotation.leadTime}</span>
                                      <span>Payment: {quotation.paymentTerms}</span>
                                    </div>
                                    {quotation.status === 'accepted' && (
                                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-400">
                                        ✓ Accepted - Order created
                                      </div>
                                    )}
                                    {quotation.status === 'rejected' && (
                                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                                        ✗ Rejected by buyer
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {inquiry.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedInquiry(inquiry)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Quotation
                              </Button>
                            </DialogTrigger>
                            {selectedInquiry && (
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Send Quotation</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price per Unit ($)
                                      </label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={quotationForm.pricePerUnit}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                        placeholder="Enter price per unit"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MOQ (Minimum Order Quantity)
                                      </label>
                                      <Input
                                        type="number"
                                        value={quotationForm.moq}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, moq: e.target.value }))}
                                        placeholder="Enter MOQ"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lead Time
                                      </label>
                                      <Input
                                        value={quotationForm.leadTime}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                                        placeholder="e.g., 2-3 weeks"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Terms
                                      </label>
                                      <Input
                                        value={quotationForm.paymentTerms}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                        placeholder="e.g., T/T 30% advance"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valid Until
                                      </label>
                                      <Input
                                        type="date"
                                        value={quotationForm.validUntil}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Price
                                      </label>
                                      <Input
                                        value={`$${calculateTotalPrice().toFixed(2)}`}
                                        disabled
                                        className="bg-gray-100"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message
                                      </label>
                                      <Textarea
                                        value={quotationForm.message}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Add a message to the customer..."
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setSelectedInquiry(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleSendQuotation(inquiry.id)}
                                      disabled={sendQuotationMutation.isPending || !quotationForm.pricePerUnit}
                                    >
                                      {sendQuotationMutation.isPending ? 'Sending...' : 'Send Quotation'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        )}

                        {inquiry.status === 'negotiating' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewNegotiation(inquiry)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Negotiation
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Buyer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="negotiations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Negotiations</CardTitle>
                <p className="text-sm text-gray-600">Inquiries currently in negotiation phase</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiries.filter((i: any) => i.status === 'negotiating').map((inquiry: any) => (
                    <div key={inquiry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{inquiry.productName}</h4>
                          <p className="text-sm text-gray-600">{inquiry.buyerCompany}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleViewNegotiation(inquiry)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {inquiries.filter((i: any) => i.status === 'negotiating').length === 0 && (
                    <p className="text-center text-gray-500 py-8">No active negotiations</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inquiry Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Week</span>
                      <span className="font-semibold">{stats.recentActivity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Negotiation Rate</span>
                      <span className="font-semibold text-blue-600">{stats.negotiationRate}%</span>
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
                      <span className="font-semibold text-green-600">{stats.conversionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiationDialogOpen} onOpenChange={setIsNegotiationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Negotiation History - {selectedInquiryForNegotiation?.productName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInquiryForNegotiation && (
            <div className="space-y-6">
              {/* Original Inquiry */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Original Inquiry</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span> {selectedInquiryForNegotiation.quantity} units
                  </div>
                  <div>
                    <span className="font-medium">Target Price:</span> ${selectedInquiryForNegotiation.targetPrice}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Message:</span> {selectedInquiryForNegotiation.message}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Requirements:</span> {selectedInquiryForNegotiation.requirements}
                  </div>
                </div>
              </div>

              {/* Negotiation History */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Negotiation History</h4>
                {negotiationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {negotiationHistory.map((revision: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Revision {revision.revisionNumber}</p>
                            <p className="text-sm text-gray-600">
                              Quantity: {revision.quantity} units | 
                              Target Price: ${revision.targetPrice} | 
                              Status: {revision.status}
                            </p>
                            {revision.message && (
                              <p className="text-sm mt-1">{revision.message}</p>
                            )}
                          </div>
                          <Badge variant="outline">{revision.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No negotiation history yet.</p>
                )}
              </div>

              {/* Send Revised Quotation */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Send Revised Quotation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Unit ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={revisedQuotationForm.pricePerUnit}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                      placeholder="Enter price per unit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MOQ (Minimum Order Quantity)
                    </label>
                    <Input
                      type="number"
                      value={revisedQuotationForm.moq}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, moq: e.target.value }))}
                      placeholder="Enter MOQ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time
                    </label>
                    <Input
                      value={revisedQuotationForm.leadTime}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <Input
                      value={revisedQuotationForm.paymentTerms}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder="e.g., T/T 30% advance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    <Input
                      type="date"
                      value={revisedQuotationForm.validUntil}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Price
                    </label>
                    <Input
                      value={`$${calculateRevisedTotalPrice().toFixed(2)}`}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <Textarea
                      value={revisedQuotationForm.message}
                      onChange={(e) => setRevisedQuotationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Add a message to the customer..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNegotiationDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSendRevisedQuotation(selectedInquiryForNegotiation.id)}
                    disabled={sendRevisedQuotationMutation.isPending || !revisedQuotationForm.pricePerUnit}
                  >
                    {sendRevisedQuotationMutation.isPending ? 'Sending...' : 'Send Revised Quotation'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}