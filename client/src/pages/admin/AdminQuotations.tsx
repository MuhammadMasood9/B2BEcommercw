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
  FileText,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

function AdminQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    message: ''
  });

  const queryClient = useQueryClient();

  // Fetch quotations
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
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  const handleEditQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setEditForm({
      status: quotation.status,
      message: quotation.message || ''
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

  const handleAcceptQuotation = async (quotation: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          inquiryId: quotation.inquiryId,
          productId: quotation.productId || 'unknown',
          quantity: quotation.moq || 1,
          unitPrice: quotation.pricePerUnit,
          totalPrice: quotation.totalPrice,
          paymentMethod: 'T/T',
          shippingAddress: null
        }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/quotations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        alert('Order created successfully!');
      } else {
        alert('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  const stats = {
    total: quotations.length,
    pending: quotations.filter((q: any) => q.status === 'pending').length,
    accepted: quotations.filter((q: any) => q.status === 'accepted').length,
    rejected: quotations.filter((q: any) => q.status === 'rejected').length
  };

  return (
    <div className=" mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quotations Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track all quotations sent to customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <User className="h-4 w-4" />
                                <span>{quotation.buyerName || 'Unknown Buyer'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <Building className="h-4 w-4" />
                                <span>{quotation.buyerCompany || 'Unknown Company'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4" />
                                <span>{quotation.buyerEmail || 'No email'}</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span>Price: {formatPrice(quotation.pricePerUnit)}/unit</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <Package className="h-4 w-4" />
                                <span>MOQ: {quotation.moq} units</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>Created: {formatDate(quotation.createdAt)}</span>
                              </div>
                            </div>
                          </div>

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

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuotation(quotation)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {quotation.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptQuotation(quotation)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept & Create Order
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to conversation
                              window.location.href = '/messages';
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
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

      {/* Edit Quotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <Textarea
                value={editForm.message}
                onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a message..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuotation}
                disabled={updateQuotationMutation.isPending}
              >
                {updateQuotationMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminQuotations;
