import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  FileText
} from 'lucide-react';

export default function AdminInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    pricePerUnit: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Dynamic data from API
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/admin/inquiries', statusFilter, searchQuery],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/inquiries?status=${statusFilter}&search=${searchQuery}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inquiries');
        }
        const data = await response.json();
        return data.inquiries || [];
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        // Fallback to mock data if API fails
        return [
        {
          id: 1,
          productId: 'prod-1',
          productName: 'Industrial Water Pumps',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
          buyerName: 'John Smith',
          buyerCompany: 'Smith Industries Ltd.',
          buyerCountry: 'USA',
          buyerEmail: 'john@smithindustries.com',
          buyerPhone: '+1-555-0123',
          supplierCompany: 'Global Manufacturing Co.',
          quantity: 50,
          targetPrice: 800,
          message: 'Need pumps for water treatment plant. Must be ISO certified.',
          requirements: 'ISO 9001 certification required',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          quotations: []
        },
        {
          id: 2,
          productId: 'prod-2',
          productName: 'LED Street Lights',
          productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
          buyerName: 'Maria Garcia',
          buyerCompany: 'Garcia Municipal Corp.',
          buyerCountry: 'Spain',
          buyerEmail: 'maria@garcia-municipal.com',
          buyerPhone: '+34-91-123-4567',
          supplierCompany: 'Global Manufacturing Co.',
          quantity: 200,
          targetPrice: 25,
          message: 'Looking for LED street lights for municipal project.',
          requirements: 'Must meet IP65 rating',
          status: 'pending',
          createdAt: '2024-01-14T14:20:00Z',
          quotations: []
        },
        {
          id: 3,
          productId: 'prod-3',
          productName: 'Custom Packaging Boxes',
          productImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop',
          buyerName: 'David Chen',
          buyerCompany: 'Chen Electronics',
          buyerCountry: 'Singapore',
          buyerEmail: 'david@chenelectronics.sg',
          buyerPhone: '+65-6123-4567',
          supplierCompany: 'Global Manufacturing Co.',
          quantity: 1000,
          targetPrice: 2.5,
          message: 'Need custom printed boxes for electronics packaging.',
          requirements: 'Eco-friendly materials preferred',
          status: 'replied',
          createdAt: '2024-01-13T09:15:00Z',
          quotations: [
            {
              id: 1,
              pricePerUnit: 2.8,
              totalPrice: 2800,
              moq: 500,
              leadTime: '15 days',
              paymentTerms: 'T/T 50% advance',
              validUntil: '2024-02-10',
              message: 'Can provide eco-friendly materials. Sample available.',
              sentAt: '2024-01-14T11:30:00Z'
            }
          ]
        }
      ];
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
        message: ''
      });
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

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch = inquiry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.buyerCompany.toLowerCase().includes(searchQuery.toLowerCase());
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
    sendQuotationMutation.mutate({
      inquiryId,
      quotation: quotationForm
    });
  };

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i: any) => i.status === 'pending').length,
    replied: inquiries.filter((i: any) => i.status === 'replied').length,
    negotiating: inquiries.filter((i: any) => i.status === 'negotiating').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Inquiries Received
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and respond to inquiries received from customers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Replied</p>
                    <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Negotiating</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.negotiating}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
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
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inquiries List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading inquiries...</span>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No inquiries found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No customer inquiries at the moment.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredInquiries.map((inquiry: any) => {
                const StatusIcon = getStatusIcon(inquiry.status);
                return (
                  <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={inquiry.productImage}
                            alt={inquiry.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {inquiry.productName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {inquiry.buyerName}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {inquiry.buyerCompany}
                                </div>
                                <span>{inquiry.buyerCountry}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {inquiry.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 lg:mt-0">
                              <Badge className={getStatusColor(inquiry.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Inquiry Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{inquiry.quantity.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Target Price:</span>
                              <span className="font-medium">{formatPrice(inquiry.targetPrice)}/unit</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Received:</span>
                              <span className="font-medium">{formatDate(inquiry.createdAt)}</span>
                            </div>
                          </div>

                          {/* Buyer Contact Info */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Buyer Contact Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{inquiry.buyerEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{inquiry.buyerPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{inquiry.buyerCompany}</span>
                              </div>
                            </div>
                          </div>

                          {/* Requirements */}
                          {inquiry.requirements && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Requirements:
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {inquiry.requirements}
                              </p>
                            </div>
                          )}

                          {/* Supplier Information */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Responding As:
                            </h4>
                            <p className="text-sm text-blue-600 font-medium">
                              {inquiry.supplierCompany || 'Global Manufacturing Co.'}
                            </p>
                          </div>

                          {/* Sent Quotations */}
                          {inquiry.quotations.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Quotations Sent ({inquiry.quotations.length})
                              </h4>
                              <div className="space-y-2">
                                {inquiry.quotations.map((quotation: any) => (
                                  <div key={quotation.id} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <span className="font-medium text-green-600">
                                          {formatPrice(quotation.pricePerUnit)}/unit
                                        </span>
                                        <span className="text-gray-600 ml-2">
                                          (Total: {formatPrice(quotation.totalPrice)})
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        Sent {formatDate(quotation.sentAt)}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                      <span>MOQ: {quotation.moq}</span>
                                      <span>Lead Time: {quotation.leadTime}</span>
                                      <span>Payment: {quotation.paymentTerms}</span>
                                      <span className="truncate" title={quotation.message}>
                                        {quotation.message}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Inquiry Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Product Information</h4>
                                    <p><strong>Product:</strong> {inquiry.productName}</p>
                                    <p><strong>Quantity:</strong> {inquiry.quantity}</p>
                                    <p><strong>Target Price:</strong> {formatPrice(inquiry.targetPrice)}/unit</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Buyer Information</h4>
                                    <p><strong>Name:</strong> {inquiry.buyerName}</p>
                                    <p><strong>Company:</strong> {inquiry.buyerCompany}</p>
                                    <p><strong>Country:</strong> {inquiry.buyerCountry}</p>
                                    <p><strong>Email:</strong> {inquiry.buyerEmail}</p>
                                    <p><strong>Phone:</strong> {inquiry.buyerPhone}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Message</h4>
                                    <p>{inquiry.message}</p>
                                  </div>
                                  {inquiry.requirements && (
                                    <div>
                                      <h4 className="font-medium mb-2">Requirements</h4>
                                      <p>{inquiry.requirements}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {inquiry.status === 'pending' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Quotation
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Send Quotation</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Price per Unit (USD)</label>
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={quotationForm.pricePerUnit}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Minimum Order Quantity</label>
                                      <Input
                                        type="number"
                                        placeholder="1"
                                        value={quotationForm.moq}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, moq: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Lead Time</label>
                                      <Input
                                        placeholder="e.g., 30 days"
                                        value={quotationForm.leadTime}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Payment Terms</label>
                                      <Input
                                        placeholder="e.g., T/T 30% advance"
                                        value={quotationForm.paymentTerms}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Valid Until</label>
                                      <Input
                                        type="date"
                                        value={quotationForm.validUntil}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Message</label>
                                      <Textarea
                                        placeholder="Additional information or terms..."
                                        value={quotationForm.message}
                                        onChange={(e) => setQuotationForm(prev => ({ ...prev, message: e.target.value }))}
                                      />
                                    </div>
                                    <Button 
                                      className="w-full"
                                      onClick={() => handleSendQuotation(inquiry.id)}
                                      disabled={sendQuotationMutation.isPending}
                                    >
                                      {sendQuotationMutation.isPending ? 'Sending...' : 'Send Quotation'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Buyer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredInquiries.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          )}
    </div>
  );
}
