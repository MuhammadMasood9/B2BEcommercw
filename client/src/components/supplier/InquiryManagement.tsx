import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Eye, Clock, CheckCircle, XCircle, Send, Package, User, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Inquiry {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  targetPrice?: string;
  message?: string;
  requirements?: string;
  status: 'pending' | 'replied' | 'negotiating' | 'closed';
  createdAt: string;
  productName: string;
  productImage?: string;
  productSlug: string;
  buyerName: string;
  buyerLastName?: string;
  buyerEmail: string;
  buyerCompany?: string;
  buyerCountry?: string;
  buyerPhone?: string;
  quotations: Quotation[];
}

interface Quotation {
  id: string;
  pricePerUnit: string;
  totalPrice: string;
  moq: number;
  leadTime?: string;
  paymentTerms?: string;
  validUntil?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface InquiryStats {
  pending: number;
  replied: number;
  negotiating: number;
  closed: number;
  total: number;
}

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({ pending: 0, replied: 0, negotiating: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [quotationForm, setQuotationForm] = useState({
    pricePerUnit: '',
    totalPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [selectedStatus, searchTerm]);

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '20');

      const response = await fetch(`/api/suppliers/inquiries?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast({
        title: "Error",
        description: "Failed to load inquiries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/suppliers/inquiries/stats', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateQuotation = async () => {
    if (!selectedInquiry) return;

    try {
      const response = await fetch(`/api/suppliers/inquiries/${selectedInquiry.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(quotationForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create quotation');
      }

      toast({
        title: "Success",
        description: "Quotation sent successfully"
      });

      setShowQuotationDialog(false);
      setQuotationForm({
        pricePerUnit: '',
        totalPrice: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: ''
      });
      fetchInquiries();
      fetchStats();
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        title: "Error",
        description: "Failed to send quotation",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      replied: { label: 'Replied', variant: 'default' as const, icon: MessageSquare },
      negotiating: { label: 'Negotiating', variant: 'outline' as const, icon: MessageSquare },
      closed: { label: 'Closed', variant: 'destructive' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-blue-600">{stats.replied}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Negotiating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.negotiating}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-600">
                {selectedStatus !== 'all' || searchTerm
                  ? 'Try adjusting your filters to see more inquiries.'
                  : 'You haven\'t received any inquiries yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {inquiry.productImage && (
                          <img
                            src={inquiry.productImage}
                            alt={inquiry.productName}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{inquiry.productName}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {inquiry.quantity.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(inquiry.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>
                          {inquiry.buyerName} {inquiry.buyerLastName}
                          {inquiry.buyerCompany && ` (${inquiry.buyerCompany})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(inquiry.createdAt)}</span>
                      </div>
                      {inquiry.targetPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>Target: {formatCurrency(inquiry.targetPrice)}</span>
                        </div>
                      )}
                      {inquiry.quotations.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span>{inquiry.quotations.length} quotation(s)</span>
                        </div>
                      )}
                    </div>

                    {inquiry.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{inquiry.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Inquiry Details</DialogTitle>
                        </DialogHeader>
                        <InquiryDetails inquiry={inquiry} />
                      </DialogContent>
                    </Dialog>

                    {inquiry.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setShowQuotationDialog(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Quote
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quotation Dialog */}
      <Dialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerUnit">Price per Unit ($)</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  value={quotationForm.pricePerUnit}
                  onChange={(e) => setQuotationForm({ ...quotationForm, pricePerUnit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalPrice">Total Price ($)</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  value={quotationForm.totalPrice}
                  onChange={(e) => setQuotationForm({ ...quotationForm, totalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moq">Minimum Order Quantity</Label>
                <Input
                  id="moq"
                  type="number"
                  value={quotationForm.moq}
                  onChange={(e) => setQuotationForm({ ...quotationForm, moq: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={quotationForm.leadTime}
                  onChange={(e) => setQuotationForm({ ...quotationForm, leadTime: e.target.value })}
                  placeholder="e.g., 15-30 days"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={quotationForm.paymentTerms}
                  onChange={(e) => setQuotationForm({ ...quotationForm, paymentTerms: e.target.value })}
                  placeholder="e.g., T/T, L/C"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quotationForm.validUntil}
                  onChange={(e) => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={quotationForm.message}
                onChange={(e) => setQuotationForm({ ...quotationForm, message: e.target.value })}
                placeholder="Additional information or terms..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQuotationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuotation}>
                Send Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inquiry Details Component
function InquiryDetails({ inquiry }: { inquiry: Inquiry }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="buyer">Buyer Info</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product</Label>
              <p className="font-medium">{inquiry.productName}</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <p className="font-medium">{inquiry.quantity.toLocaleString()} units</p>
            </div>
            <div>
              <Label>Target Price</Label>
              <p className="font-medium">
                {inquiry.targetPrice ? `$${inquiry.targetPrice}` : 'Not specified'}
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                {/* Status badge would go here */}
              </div>
            </div>
          </div>

          {inquiry.message && (
            <div>
              <Label>Message</Label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                <p className="text-sm">{inquiry.message}</p>
              </div>
            </div>
          )}

          {inquiry.requirements && (
            <div>
              <Label>Requirements</Label>
              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                <p className="text-sm">{inquiry.requirements}</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="buyer" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p className="font-medium">{inquiry.buyerName} {inquiry.buyerLastName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="font-medium">{inquiry.buyerEmail}</p>
            </div>
            {inquiry.buyerCompany && (
              <div>
                <Label>Company</Label>
                <p className="font-medium">{inquiry.buyerCompany}</p>
              </div>
            )}
            {inquiry.buyerCountry && (
              <div>
                <Label>Country</Label>
                <p className="font-medium">{inquiry.buyerCountry}</p>
              </div>
            )}
            {inquiry.buyerPhone && (
              <div>
                <Label>Phone</Label>
                <p className="font-medium">{inquiry.buyerPhone}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          {inquiry.quotations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No quotations sent yet</p>
          ) : (
            <div className="space-y-4">
              {inquiry.quotations.map((quotation) => (
                <Card key={quotation.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Price per Unit</Label>
                        <p className="font-medium">${quotation.pricePerUnit}</p>
                      </div>
                      <div>
                        <Label>Total Price</Label>
                        <p className="font-medium">${quotation.totalPrice}</p>
                      </div>
                      <div>
                        <Label>MOQ</Label>
                        <p className="font-medium">{quotation.moq} units</p>
                      </div>
                      <div>
                        <Label>Lead Time</Label>
                        <p className="font-medium">{quotation.leadTime || 'Not specified'}</p>
                      </div>
                    </div>
                    {quotation.message && (
                      <div className="mt-3">
                        <Label>Message</Label>
                        <div className="bg-gray-50 p-2 rounded mt-1">
                          <p className="text-sm">{quotation.message}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}