import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  Calendar,
  FileText,
  Send,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
  Target,
  Zap,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  RefreshCw,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Flag,
  CreditCard,
  Receipt,
  Box,
  Ship,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  Printer,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OrderManagementProps {
  userRole: 'admin' | 'buyer';
}

export default function OrderManagement({ userRole }: OrderManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    trackingNumber: '',
    notes: ''
  });
  
  const [cancelReason, setCancelReason] = useState('');

  // Fetch orders with filters
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: [`/api/${userRole}/orders`, statusFilter, searchQuery, dateRange],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (dateRange && dateRange !== 'all') params.append('dateRange', dateRange);
        
        const response = await fetch(`/api/${userRole}/orders?${params.toString()}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.orders || [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    }
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber, notes }: { 
      orderId: string, 
      status: string, 
      trackingNumber?: string, 
      notes?: string 
    }) => {
      const response = await fetch(`/api/${userRole}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, trackingNumber, notes })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order status updated successfully",
        description: "The order status has been updated."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${userRole}/orders`] });
      setIsUpdateStatusDialogOpen(false);
      setStatusUpdate({ status: '', trackingNumber: '', notes: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update order status",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string, reason: string }) => {
      const response = await fetch(`/api/${userRole}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order cancelled successfully",
        description: "The order has been cancelled."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/${userRole}/orders`] });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel order",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
    processing: orders.filter((o: any) => o.status === 'processing').length,
    shipped: orders.filter((o: any) => o.status === 'shipped').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
    cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
    totalValue: orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0) / orders.length : 0,
    completionRate: orders.length > 0 ? (orders.filter((o: any) => o.status === 'delivered').length / orders.length * 100) : 0
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckSquare className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-primary text-primary border-primary';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setStatusUpdate({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      notes: ''
    });
    setIsUpdateStatusDialogOpen(true);
  };

  const handleCancelOrder = (order: any) => {
    setSelectedOrder(order);
    setIsCancelDialogOpen(true);
  };

  const handleStatusUpdateSubmit = () => {
    if (!selectedOrder) return;
    
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: statusUpdate.status,
      trackingNumber: statusUpdate.trackingNumber,
      notes: statusUpdate.notes
    });
  };

  const handleCancelSubmit = () => {
    if (!selectedOrder) return;
    
    cancelOrderMutation.mutate({
      orderId: selectedOrder.id,
      reason: cancelReason
    });
  };

  const canUpdateStatus = (order: any) => {
    if (userRole === 'admin') {
      return ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status);
    } else {
      return order.status === 'pending';
    }
  };

  const canCancelOrder = (order: any) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Order Management' : 'My Orders'}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' ? 'Manage and track all orders' : 'Track your order status and history'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-primary rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders by order number, product, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
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
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order: any) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {userRole === 'admin' ? 'Customer:' : 'Supplier:'}
                  </span>
                  <span className="font-medium">
                    {userRole === 'admin' ? order.buyerName : order.supplierName || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{order.items?.length || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${parseFloat(order.totalAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{format(new Date(order.createdAt), 'MMM dd')}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-primary p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Tracking:</span>
                    <span className="text-sm text-primary">{order.trackingNumber}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="flex-1"
                >
                  <Link href={`/order/${order.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
                
                {canUpdateStatus(order) && (
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateStatus(order)}
                    className="flex-1 bg-primary hover:bg-primary"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                )}
                
                {canCancelOrder(order) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancelOrder(order)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Order Number</Label>
                      <p className="font-medium">{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">{selectedOrder.status}</span>
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Payment Status</Label>
                      <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Total Amount</Label>
                      <p className="font-medium">${parseFloat(selectedOrder.totalAmount || '0').toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer/Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {userRole === 'admin' ? 'Customer Information' : 'Supplier Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="font-medium">
                        {userRole === 'admin' ? selectedOrder.buyerName : selectedOrder.supplierName || 'Admin'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Email</Label>
                      <p className="font-medium">
                        {userRole === 'admin' ? selectedOrder.buyerEmail : selectedOrder.supplierEmail || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Phone</Label>
                      <p className="font-medium">
                        {userRole === 'admin' ? selectedOrder.buyerPhone : selectedOrder.supplierPhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Company</Label>
                      <p className="font-medium">
                        {userRole === 'admin' ? selectedOrder.buyerCompany : selectedOrder.supplierCompany || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName || 'Product'}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${parseFloat(item.totalPrice || '0').toLocaleString()}</p>
                          <p className="text-sm text-gray-600">${parseFloat(item.unitPrice || '0')} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {selectedOrder.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {typeof selectedOrder.shippingAddress === 'string' 
                          ? selectedOrder.shippingAddress 
                          : JSON.stringify(selectedOrder.shippingAddress, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tracking Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <span className="font-medium">Tracking Number:</span>
                      <span className="text-primary">{selectedOrder.trackingNumber}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Created</p>
                        <p className="text-sm text-gray-600">{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                    {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.createdAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-sm text-gray-600">{format(new Date(selectedOrder.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Update the status and tracking information for this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({...statusUpdate, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {statusUpdate.status === 'shipped' && (
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={statusUpdate.trackingNumber}
                  onChange={(e) => setStatusUpdate({...statusUpdate, trackingNumber: e.target.value})}
                  placeholder="Enter tracking number"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdateSubmit}
              disabled={updateStatusMutation.isPending || !statusUpdate.status}
              className="bg-primary hover:bg-primary"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain why this order is being cancelled..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCancelSubmit}
              disabled={cancelOrderMutation.isPending || !cancelReason}
              variant="destructive"
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
