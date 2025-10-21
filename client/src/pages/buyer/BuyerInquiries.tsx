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
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Truck,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  X,
  FileText,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  Plus,
  Users
} from 'lucide-react';

export default function BuyerInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch inquiries from API
  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['/api/inquiries', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const response = await fetch('/api/inquiries', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch inquiries');
        const data = await response.json();
        return data.inquiries || [];
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        // Return mock data if API fails
        return [
          {
            id: "INQ-2024-001",
            productName: "Wireless Earbuds",
            supplierName: "Tech Solutions Ltd",
            supplierEmail: "contact@techsolutions.com",
            quantity: 1000,
            unitPrice: 15.50,
            totalAmount: 15500,
            status: "pending",
            inquiryDate: "2024-01-20",
            responseDate: "2024-01-22",
            notes: "Please provide samples before final order",
            attachments: ["specifications.pdf"],
            shippingAddress: "123 Business St, New York, NY 10001"
          },
          {
            id: "INQ-2024-002",
            productName: "LED Display Panels",
            supplierName: "Display Tech Inc",
            supplierEmail: "sales@displaytech.com",
            quantity: 500,
            unitPrice: 45.00,
            totalAmount: 22500,
            status: "accepted",
            inquiryDate: "2024-01-18",
            responseDate: "2024-01-19",
            notes: "Urgent delivery required",
            attachments: ["contract.pdf"],
            shippingAddress: "456 Commerce Ave, Los Angeles, CA 90210"
          }
        ];
      }
    }
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/accept`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      setIsAcceptDialogOpen(false);
      setShippingAddress('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/reject`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
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
      default: return <MessageSquare className="h-4 w-4" />;
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

  // Ensure inquiries is always an array
  const inquiries = Array.isArray(inquiriesData) ? inquiriesData : [];

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch = inquiry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedInquiries = [...filteredInquiries].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.inquiryDate).getTime() - new Date(a.inquiryDate).getTime();
      case "oldest":
        return new Date(a.inquiryDate).getTime() - new Date(b.inquiryDate).getTime();
      case "price-high":
        return b.totalAmount - a.totalAmount;
      case "price-low":
        return a.totalAmount - b.totalAmount;
      default:
        return 0;
    }
  });

  const pendingInquiries = filteredInquiries.filter((inquiry: any) => inquiry.status === "pending");
  const acceptedInquiries = filteredInquiries.filter((inquiry: any) => inquiry.status === "accepted");
  const rejectedInquiries = filteredInquiries.filter((inquiry: any) => inquiry.status === "rejected");

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
              <MessageSquare className="w-4 h-4" />
              <span>My Inquiries</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              My
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Inquiries
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Manage your product inquiries and quotations from verified admins
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
                <div className="text-2xl font-bold text-gray-900">{pendingInquiries.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{acceptedInquiries.length}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{rejectedInquiries.length}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${inquiries.reduce((sum: number, inquiry: any) => sum + (inquiry.totalAmount ?? 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </CardContent>
            </Card>
          </div>

          {/* Inquiries Grid */}
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
          ) : sortedInquiries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedInquiries.map((inquiry: any) => (
                <Card key={inquiry.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {inquiry.productName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Inquiry #{inquiry.id}</p>
                      </div>
                      <Badge className={`${getStatusColor(inquiry.status)} flex items-center gap-1`}>
                        {getStatusIcon(inquiry.status)}
                        {inquiry.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Admin:</span>
                        <span className="font-medium">{inquiry.supplierName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{(inquiry.quantity ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-medium">${inquiry.unitPrice ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium text-green-600">${(inquiry.totalAmount ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Inquired: {new Date(inquiry.inquiryDate).toLocaleDateString()}</span>
                        <span>Response: {new Date(inquiry.responseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/inquiry/${inquiry.id}`}>
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
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'You haven\'t made any inquiries yet'}
              </p>
              <Link href="/products">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </div>
          )}

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