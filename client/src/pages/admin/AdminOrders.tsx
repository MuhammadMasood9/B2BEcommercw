import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  User,
  Building,
  FileText,
  Send,
  Download,
  Plus
} from 'lucide-react';

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    trackingNumber: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Mock data - in real app, this would come from API
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/orders', statusFilter, searchQuery],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 'ORD-2024-001',
          buyerName: 'John Smith',
          buyerCompany: 'Smith Industries Ltd.',
          buyerCountry: 'USA',
          buyerEmail: 'john@smithindustries.com',
          buyerPhone: '+1-555-0123',
          productName: 'Industrial Water Pumps',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
          quantity: 50,
          unitPrice: 850,
          totalPrice: 42500,
          currency: 'USD',
          status: 'confirmed',
          paymentStatus: 'paid',
          orderDate: '2024-01-15T10:30:00Z',
          expectedDelivery: '2024-02-15T00:00:00Z',
          actualDelivery: null,
          trackingNumber: 'TRK123456789',
          shippingAddress: '123 Industrial Park, Manufacturing District, New York, NY 10001',
          paymentTerms: 'T/T 30% advance, 70% on delivery',
          notes: 'Priority order for water treatment plant project',
          inquiryId: 1,
          quotationId: 1
        },
        {
          id: 'ORD-2024-002',
          buyerName: 'Maria Garcia',
          buyerCompany: 'Garcia Municipal Corp.',
          buyerCountry: 'Spain',
          buyerEmail: 'maria@garcia-municipal.com',
          buyerPhone: '+34-91-123-4567',
          productName: 'LED Street Lights',
          productImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
          quantity: 200,
          unitPrice: 25,
          totalPrice: 5000,
          currency: 'USD',
          status: 'processing',
          paymentStatus: 'partial',
          orderDate: '2024-01-14T14:20:00Z',
          expectedDelivery: '2024-03-01T00:00:00Z',
          actualDelivery: null,
          trackingNumber: null,
          shippingAddress: '456 Municipal Plaza, Madrid, Spain 28001',
          paymentTerms: 'L/C at sight',
          notes: 'Municipal lighting upgrade project',
          inquiryId: 2,
          quotationId: 2
        },
        {
          id: 'ORD-2024-003',
          buyerName: 'David Chen',
          buyerCompany: 'Chen Electronics',
          buyerCountry: 'Singapore',
          buyerEmail: 'david@chenelectronics.sg',
          buyerPhone: '+65-6123-4567',
          productName: 'Custom Packaging Boxes',
          productImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop',
          quantity: 1000,
          unitPrice: 2.8,
          totalPrice: 2800,
          currency: 'USD',
          status: 'shipped',
          paymentStatus: 'paid',
          orderDate: '2024-01-10T09:15:00Z',
          expectedDelivery: '2024-01-25T00:00:00Z',
          actualDelivery: '2024-01-23T00:00:00Z',
          trackingNumber: 'TRK987654321',
          shippingAddress: '789 Electronics Hub, Singapore 018956',
          paymentTerms: 'T/T 50% advance',
          notes: 'Eco-friendly packaging for electronics',
          inquiryId: 3,
          quotationId: 3
        },
        {
          id: 'ORD-2024-004',
          buyerName: 'Robert Johnson',
          buyerCompany: 'Johnson Construction',
          buyerCountry: 'Canada',
          buyerEmail: 'robert@johnsonconstruction.ca',
          buyerPhone: '+1-416-555-7890',
          productName: 'Steel Construction Beams',
          productImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
          quantity: 100,
          unitPrice: 125,
          totalPrice: 12500,
          currency: 'USD',
          status: 'delivered',
          paymentStatus: 'paid',
          orderDate: '2024-01-05T16:45:00Z',
          expectedDelivery: '2024-02-20T00:00:00Z',
          actualDelivery: '2024-02-18T00:00:00Z',
          trackingNumber: 'TRK456789123',
          shippingAddress: '321 Construction Site, Toronto, ON M5H 2N2',
          paymentTerms: 'L/C at sight',
          notes: 'Structural steel for commercial building',
          inquiryId: 4,
          quotationId: 4
        }
      ];
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setSelectedOrder(null);
      setUpdateForm({ status: '', trackingNumber: '', notes: '' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleUpdateOrder = (orderId: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: updateForm
    });
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, order) => sum + order.totalPrice, 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Order Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage customer orders and track fulfillment progress
              </p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shipped</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
                  </div>
                  <Truck className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Value Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(stats.totalValue, 'USD')}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by order ID, buyer name, company, or product..."
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
                      <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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

          {/* Orders List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No orders found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No orders have been placed yet.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Order {order.id}
                                </h3>
                                <Badge className={getStatusColor(order.status)}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                  Payment: {order.paymentStatus}
                                </Badge>
                              </div>
                              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-1">
                                {order.productName}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {order.buyerName}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {order.buyerCompany}
                                </div>
                                <span>{order.buyerCountry}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4 lg:mt-0">
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {formatPrice(order.totalPrice, order.currency)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(order.orderDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{order.quantity.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-medium">{formatPrice(order.unitPrice, order.currency)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Expected:</span>
                              <span className="font-medium">{formatDate(order.expectedDelivery)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Tracking:</span>
                              <span className="font-medium">
                                {order.trackingNumber || 'Not assigned'}
                              </span>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Shipping Address
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.shippingAddress}
                            </p>
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Order Notes:
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.notes}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
                                  <DialogTitle>Order Details - {order.id}</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Product Information</h4>
                                    <p><strong>Product:</strong> {order.productName}</p>
                                    <p><strong>Quantity:</strong> {order.quantity}</p>
                                    <p><strong>Unit Price:</strong> {formatPrice(order.unitPrice, order.currency)}</p>
                                    <p><strong>Total Price:</strong> {formatPrice(order.totalPrice, order.currency)}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Buyer Information</h4>
                                    <p><strong>Name:</strong> {order.buyerName}</p>
                                    <p><strong>Company:</strong> {order.buyerCompany}</p>
                                    <p><strong>Country:</strong> {order.buyerCountry}</p>
                                    <p><strong>Email:</strong> {order.buyerEmail}</p>
                                    <p><strong>Phone:</strong> {order.buyerPhone}</p>
                                  </div>
                <div>
                                    <h4 className="font-medium mb-2">Order Information</h4>
                                    <p><strong>Status:</strong> {order.status}</p>
                                    <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                                    <p><strong>Payment Terms:</strong> {order.paymentTerms}</p>
                                    <p><strong>Order Date:</strong> {formatDate(order.orderDate)}</p>
                                    <p><strong>Expected Delivery:</strong> {formatDate(order.expectedDelivery)}</p>
                                    {order.actualDelivery && (
                                      <p><strong>Actual Delivery:</strong> {formatDate(order.actualDelivery)}</p>
                                    )}
                                    {order.trackingNumber && (
                                      <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>
                                    )}
                </div>
                <div>
                                    <h4 className="font-medium mb-2">Shipping Address</h4>
                                    <p>{order.shippingAddress}</p>
                                  </div>
                                  {order.notes && (
                                    <div>
                                      <h4 className="font-medium mb-2">Notes</h4>
                                      <p>{order.notes}</p>
                </div>
                                  )}
              </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update Order
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Update Order - {order.id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
              <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                <Select 
                                      value={updateForm.status || order.status} 
                                      onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                                    <Input
                                      placeholder="Enter tracking number"
                                      value={updateForm.trackingNumber || order.trackingNumber || ''}
                                      onChange={(e) => setUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                    />
                                  </div>
              <div>
                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                    <Textarea
                                      placeholder="Add update notes..."
                                      value={updateForm.notes || ''}
                                      onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleUpdateOrder(order.id)}
                                    disabled={updateOrderMutation.isPending}
                                  >
                                    {updateOrderMutation.isPending ? 'Updating...' : 'Update Order'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Invoice
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Notify Buyer
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
          {filteredOrders.length > 0 && (
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
      </main>
      <Footer />
    </div>
  );
}