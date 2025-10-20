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
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch quotations from API
  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ['/api/buyer/quotations', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const response = await fetch('/api/buyer/quotations', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch quotations');
        const data = await response.json();
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        // Return mock data if API fails
        return [
          {
            id: "QUO-2024-001",
            productName: "Wireless Earbuds",
            supplierName: "Tech Solutions Ltd",
            supplierEmail: "contact@techsolutions.com",
            supplierPhone: "+1-555-0123",
            quantity: 1000,
            unitPrice: 15.50,
            totalAmount: 15500,
            status: "pending",
            quotationDate: "2024-01-20",
            validUntil: "2024-02-20",
            notes: "Bulk discount applied for orders over 500 units",
            attachments: ["quotation.pdf", "specifications.docx"],
            shippingAddress: "123 Business St, New York, NY 10001",
            deliveryTime: "15-20 business days",
            paymentTerms: "30% advance, 70% on delivery"
          },
          {
            id: "QUO-2024-002",
            productName: "LED Display Panels",
            supplierName: "Display Tech Inc",
            supplierEmail: "sales@displaytech.com",
            supplierPhone: "+1-555-0456",
            quantity: 500,
            unitPrice: 45.00,
            totalAmount: 22500,
            status: "accepted",
            quotationDate: "2024-01-18",
            validUntil: "2024-02-18",
            notes: "Includes installation and warranty",
            attachments: ["quotation.pdf"],
            shippingAddress: "456 Commerce Ave, Los Angeles, CA 90210",
            deliveryTime: "10-15 business days",
            paymentTerms: "50% advance, 50% on delivery"
          }
        ];
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      case "expired": return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Ensure quotations is always an array
  const quotations = Array.isArray(quotationsData) ? quotationsData : [];

  const filteredQuotations = quotations.filter((quotation: any) => {
    const matchesSearch = quotation.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quotation.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedQuotations = [...filteredQuotations].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "price-high":
        return (b.totalPrice ?? 0) - (a.totalPrice ?? 0);
      case "price-low":
        return (a.totalPrice ?? 0) - (b.totalPrice ?? 0);
      default:
        return 0;
    }
  });

  const pendingQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "pending");
  const acceptedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "accepted");
  const rejectedQuotations = filteredQuotations.filter((quotation: any) => quotation.status === "rejected");

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${quotations.reduce((sum: number, quotation: any) => sum + (quotation.totalPrice ?? 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </CardContent>
            </Card>
          </div>

          {/* Quotations Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Quotations</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
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
                            <span className="font-medium">{quotation.supplierName}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{(quotation.inquiryQuantity ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="font-medium">${quotation.pricePerUnit ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-green-600">${(quotation.totalPrice ?? 0).toLocaleString()}</span>
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
                          <span className="font-medium">{quotation.supplierName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{quotation.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${quotation.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${quotation.totalAmount.toLocaleString()}</span>
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
                          <span className="font-medium">{quotation.supplierName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{quotation.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${quotation.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${quotation.totalAmount.toLocaleString()}</span>
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
                          <span className="font-medium">{quotation.supplierName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{quotation.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${quotation.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${quotation.totalAmount.toLocaleString()}</span>
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

      <Footer />
    </div>
  );
}