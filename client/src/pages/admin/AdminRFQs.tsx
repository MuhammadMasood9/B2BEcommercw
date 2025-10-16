import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle,
  Eye,
  Send,
  DollarSign,
  Calendar,
  Package,
  MapPin,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';

export default function AdminRFQs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    pricePerUnit: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Fetch all RFQs
  const { data: rfqsData, isLoading } = useQuery({
    queryKey: ['/api/rfqs', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      const response = await fetch(`/api/rfqs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    }
  });

  // Fetch categories for display
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const rfqs = rfqsData || [];

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

  // Send quotation mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] });
      setIsQuoteDialogOpen(false);
      setQuoteForm({
        pricePerUnit: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: ''
      });
      toast.success('Quotation sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send quotation');
    }
  });

  const handleSendQuotation = (rfq: any) => {
    setSelectedRFQ(rfq);
    setQuoteForm({
      pricePerUnit: rfq.targetPrice || '',
      moq: rfq.quantity?.toString() || '',
      leadTime: '',
      paymentTerms: 'T/T',
      validUntil: '',
      message: ''
    });
    setIsQuoteDialogOpen(true);
  };

  const submitQuotation = () => {
    if (!quoteForm.pricePerUnit || !quoteForm.moq) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalPrice = parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq);

    sendQuotationMutation.mutate({
      rfqId: selectedRFQ.id,
      pricePerUnit: quoteForm.pricePerUnit, // Send as string
      totalPrice: totalPrice.toString(), // Send as string
      moq: parseInt(quoteForm.moq),
      leadTime: quoteForm.leadTime,
      paymentTerms: quoteForm.paymentTerms,
      validUntil: quoteForm.validUntil ? new Date(quoteForm.validUntil) : null, // Convert to Date object
      message: quoteForm.message,
      status: 'pending'
    });
  };

  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (!numPrice) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
  };

  const stats = {
    total: rfqs.length,
    open: rfqs.filter((r: any) => r.status === 'open').length,
    closed: rfqs.filter((r: any) => r.status === 'closed').length,
    totalValue: rfqs.reduce((sum: number, r: any) => sum + (parseFloat(r.targetPrice) || 0) * (r.quantity || 0), 0)
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RFQ Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and respond to Request for Quotations from buyers
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/rfqs'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total RFQs</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-white">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Open RFQs</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-white">{stats.open}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.closed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Value</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-white">{formatPrice(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search RFQs by title..."
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
                    <SelectItem value="open">Open</SelectItem>
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

        {/* RFQs List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading RFQs...</span>
            </div>
          ) : filteredRFQs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No RFQs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No RFQs have been submitted yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRFQs.map((rfq: any) => {
              const quotationCount = rfq.quotationsCount || 0;
              const hasQuoted = quotationCount > 0;
              
              return (
                <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {rfq.title}
                              </h3>
                              <div className="flex gap-2 mb-2">
                                <Badge className={rfq.status === 'open' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                                  {rfq.status?.toUpperCase()}
                                </Badge>
                                {rfq.categoryId && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    {getCategoryName(rfq.categoryId)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                          {rfq.description}
                        </p>
                        {rfq.attachments && rfq.attachments.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-600 mb-2">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {rfq.attachments.map((attachment: string, index: number) => (
                                <a 
                                  key={index}
                                  href={attachment} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                                >
                                  <FileText className="w-3 h-3" />
                                  Doc {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RFQ Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{rfq.quantity?.toLocaleString() || 'N/A'} units</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Target Price:</span>
                        <span className="font-medium">{formatPrice(rfq.targetPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Expected:</span>
                        <span className="font-medium">{formatDate(rfq.expectedDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{rfq.deliveryLocation || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <span>Created: {formatDate(rfq.createdAt)}</span>
                      <span>Quotations Sent: {quotationCount}</span>
                    </div>

                    {/* Status Badge */}
                    {hasQuoted && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          ✓ You have sent {quotationCount} quotation{quotationCount > 1 ? 's' : ''} for this RFQ
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/rfq/${rfq.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleSendQuotation(rfq)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {hasQuoted ? 'Send Another Quote' : 'Send Quotation'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Send Quotation Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Quotation for: {selectedRFQ?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerUnit">Price Per Unit (USD) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  value={quoteForm.pricePerUnit}
                  onChange={(e) => setQuoteForm({...quoteForm, pricePerUnit: e.target.value})}
                  placeholder="e.g., 18.50"
                  step="0.01"
                  min="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="moq">Minimum Order Quantity *</Label>
                <Input
                  id="moq"
                  type="number"
                  value={quoteForm.moq}
                  onChange={(e) => setQuoteForm({...quoteForm, moq: e.target.value})}
                  placeholder="e.g., 5000"
                  min="1"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={quoteForm.leadTime}
                  onChange={(e) => setQuoteForm({...quoteForm, leadTime: e.target.value})}
                  placeholder="e.g., 20-25 days"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={quoteForm.paymentTerms} onValueChange={(value) => setQuoteForm({...quoteForm, paymentTerms: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T/T">T/T (Telegraphic Transfer)</SelectItem>
                    <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                    <SelectItem value="D/P">D/P (Documents against Payment)</SelectItem>
                    <SelectItem value="D/A">D/A (Documents against Acceptance)</SelectItem>
                    <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({...quoteForm, validUntil: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message / Additional Details</Label>
              <Textarea
                id="message"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                placeholder="Provide detailed information about your quotation, customization options, certifications, etc."
                rows={4}
                className="mt-2"
              />
            </div>

            {quoteForm.pricePerUnit && quoteForm.moq && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Quotation Value:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitQuotation}
              disabled={sendQuotationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Quotation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

