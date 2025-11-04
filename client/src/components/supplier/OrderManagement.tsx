import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Package, Eye, Truck, CheckCircle, Clock, AlertCircle, MessageCircle, Send, Phone, Mail, BarChart3, TrendingUp, Users, DollarSign, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  orderNumber: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerCompanyName: string;
  buyerPhone?: string;
  totalAmount: string;
  supplierAmount: string;
  commissionAmount: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
  shippingAddress: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDelivery?: string;
  fulfillmentStage?: 'pending' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'delivered';
}

interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  trends: {
    daily: Array<{ date: string; orders: number; revenue: number }>;
    monthly: Array<{ month: string; orders: number; revenue: number }>;
  };
}

interface FulfillmentWorkflow {
  orderId: string;
  currentStage: string;
  stages: Array<{
    name: string;
    status: 'completed' | 'current' | 'pending';
    completedAt?: string;
    estimatedCompletion?: string;
    notes?: string;
  }>;
}

interface OrderManagementProps {
  supplierId: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ supplierId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [fulfillmentWorkflows, setFulfillmentWorkflows] = useState<FulfillmentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'shipping' | 'support'>('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [supplierId, statusFilter, priorityFilter, dateFilter, searchTerm, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/suppliers/${supplierId}/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.append('period', dateFilter);
      
      const response = await fetch(`/api/suppliers/${supplierId}/orders/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order analytics",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchFulfillmentWorkflow = async (orderId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${orderId}/fulfillment`);
      if (!response.ok) throw new Error('Failed to fetch fulfillment workflow');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fulfillment workflow:', error);
      return null;
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      setUpdateDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setTrackingNumber('');
      setNotes('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updateFulfillmentStage = async (orderId: string, stage: string, notes?: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update fulfillment stage');

      toast({
        title: "Success",
        description: "Fulfillment stage updated successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating fulfillment stage:', error);
      toast({
        title: "Error",
        description: "Failed to update fulfillment stage",
        variant: "destructive",
      });
    }
  };

  const exportOrderData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);
      
      const response = await fetch(`/api/suppliers/${supplierId}/orders/export?${params}`);
      if (!response.ok) throw new Error('Failed to export order data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Order data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting order data:', error);
      toast({
        title: "Error",
        description: "Failed to export order data",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFulfillmentProgress = (stage?: string) => {
    const stages = ['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered'];
    const currentIndex = stages.indexOf(stage || 'pending');
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setNotes('');
    setUpdateDialogOpen(true);
  };

  const openCommunicationDialog = (order: Order) => {
    setSelectedOrder(order);
    setMessageText('');
    setMessageType('general');
    setCommunicationDialogOpen(true);
  };

  const openFulfillmentDialog = async (order: Order) => {
    setSelectedOrder(order);
    const workflow = await fetchFulfillmentWorkflow(order.id);
    if (workflow) {
      setFulfillmentWorkflows([workflow]);
    }
    setFulfillmentDialogOpen(true);
  };

  const sendMessage = async () => {
    if (!selectedOrder || !messageText.trim()) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${selectedOrder.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          type: messageType,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      toast({
        title: "Success",
        description: "Message sent to customer successfully",
      });

      setCommunicationDialogOpen(false);
      setSelectedOrder(null);
      setMessageText('');
      setMessageType('general');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const initiateCall = (order: Order) => {
    if (order.buyerPhone) {
      window.open(`tel:${order.buyerPhone}`, '_self');
    } else {
      toast({
        title: "No Phone Number",
        description: "Customer phone number not available",
        variant: "destructive",
      });
    }
  };

  const sendEmail = (order: Order) => {
    const subject = `Regarding Order #${order.orderNumber}`;
    const body = `Dear ${order.buyerFirstName} ${order.buyerLastName},\n\nI hope this message finds you well. I am writing regarding your order #${order.orderNumber}.\n\nBest regards,\nYour Supplier`;
    window.open(`mailto:${order.buyerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportOrderData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search orders by number, buyer name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber}
                        </CardTitle>
                        {order.priority && (
                          <Badge variant="outline" className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                        </Badge>
                      </div>
                    </div>
                    {order.fulfillmentStage && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Fulfillment Progress</span>
                          <span>{Math.round(getFulfillmentProgress(order.fulfillmentStage))}%</span>
                        </div>
                        <Progress value={getFulfillmentProgress(order.fulfillmentStage)} className="h-2" />
                      </div>
                    )}
                  </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Buyer Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Name:</strong> {order.buyerFirstName} {order.buyerLastName}</p>
                      <p><strong>Email:</strong> {order.buyerEmail}</p>
                      {order.buyerCompanyName && (
                        <p><strong>Company:</strong> {order.buyerCompanyName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Total Amount:</strong> ${parseFloat(order.totalAmount).toFixed(2)}</p>
                      <p><strong>Your Amount:</strong> ${parseFloat(order.supplierAmount).toFixed(2)}</p>
                      <p><strong>Commission:</strong> ${parseFloat(order.commissionAmount).toFixed(2)}</p>
                      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.trackingNumber && (
                        <p><strong>Tracking:</strong> {order.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{item.productName}</span>
                          <span className="text-sm font-medium">
                            {item.quantity} × ${item.unitPrice} = ${item.totalPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Order #{order.orderNumber} Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Buyer Information</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Name:</strong> {order.buyerFirstName} {order.buyerLastName}</p>
                                <p><strong>Email:</strong> {order.buyerEmail}</p>
                                {order.buyerCompanyName && (
                                  <p><strong>Company:</strong> {order.buyerCompanyName}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Financial Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Total:</strong> ${parseFloat(order.totalAmount).toFixed(2)}</p>
                                <p><strong>Your Amount:</strong> ${parseFloat(order.supplierAmount).toFixed(2)}</p>
                                <p><strong>Commission:</strong> ${parseFloat(order.commissionAmount).toFixed(2)}</p>
                                <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                              </div>
                            </div>
                          </div>
                          {order.shippingAddress && (
                            <div>
                              <h4 className="font-medium mb-2">Shipping Address</h4>
                              <div className="text-sm bg-gray-50 p-3 rounded">
                                {typeof order.shippingAddress === 'string' 
                                  ? order.shippingAddress 
                                  : JSON.stringify(order.shippingAddress, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      onClick={() => openUpdateDialog(order)}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                    >
                      Update Status
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openFulfillmentDialog(order)}
                      disabled={order.status === 'delivered' || order.status === 'cancelled'}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Fulfillment
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openCommunicationDialog(order)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => sendEmail(order)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>

                    {order.buyerPhone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => initiateCall(order)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                        <p className="text-2xl font-bold text-gray-900">${analytics.averageOrderValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Fulfillment Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.fulfillmentRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completed</span>
                        <span className="text-sm text-gray-600">{analytics.completedOrders}</span>
                      </div>
                      <Progress value={(analytics.completedOrders / analytics.totalOrders) * 100} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending</span>
                        <span className="text-sm text-gray-600">{analytics.pendingOrders}</span>
                      </div>
                      <Progress value={(analytics.pendingOrders / analytics.totalOrders) * 100} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cancelled</span>
                        <span className="text-sm text-gray-600">{analytics.cancelledOrders}</span>
                      </div>
                      <Progress value={(analytics.cancelledOrders / analytics.totalOrders) * 100} className="h-2" />
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
                        <span className="text-sm font-medium">On-Time Delivery Rate</span>
                        <span className="text-sm font-bold text-green-600">{analytics.onTimeDeliveryRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={analytics.onTimeDeliveryRate} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Customer Satisfaction</span>
                        <span className="text-sm font-bold text-blue-600">{analytics.customerSatisfactionScore.toFixed(1)}/5.0</span>
                      </div>
                      <Progress value={(analytics.customerSatisfactionScore / 5) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">No analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Workflow Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage order fulfillment stages and track progress for all active orders.
              </p>
              <div className="space-y-4">
                {orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Order #{order.orderNumber}</h4>
                        <p className="text-sm text-gray-600">{order.buyerFirstName} {order.buyerLastName}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Fulfillment Progress</span>
                        <span>{Math.round(getFulfillmentProgress(order.fulfillmentStage))}%</span>
                      </div>
                      <Progress value={getFulfillmentProgress(order.fulfillmentStage)} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openFulfillmentDialog(order)}
                      >
                        Manage Fulfillment
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openCommunicationDialog(order)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contact Buyer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
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
            
            {(newStatus === 'shipped' || newStatus === 'delivered') && (
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status update"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateOrderStatus}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fulfillment Workflow</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">Order: #{selectedOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedOrder.buyerFirstName} {selectedOrder.buyerLastName}
                </p>
                <p className="text-sm text-gray-600">
                  Total: ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Fulfillment Stages</h4>
                {['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered'].map((stage, index) => {
                  const isCompleted = getFulfillmentProgress(selectedOrder.fulfillmentStage) > (index / 6) * 100;
                  const isCurrent = selectedOrder.fulfillmentStage === stage;
                  
                  return (
                    <div key={stage} className={`flex items-center gap-3 p-3 rounded border ${
                      isCurrent ? 'border-blue-200 bg-blue-50' : 
                      isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-300'
                      }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{stage.replace('_', ' ')}</p>
                        {isCurrent && (
                          <p className="text-sm text-gray-600">Current stage</p>
                        )}
                      </div>
                      {!isCompleted && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFulfillmentStage(selectedOrder.id, stage)}
                          disabled={!isCurrent && index > 0}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setFulfillmentDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Customer</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">Order: #{selectedOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedOrder.buyerFirstName} {selectedOrder.buyerLastName}
                </p>
                {selectedOrder.buyerCompanyName && (
                  <p className="text-sm text-gray-600">Company: {selectedOrder.buyerCompanyName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="messageType">Message Type</Label>
                <Select value={messageType} onValueChange={(value: 'general' | 'shipping' | 'support') => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Update</SelectItem>
                    <SelectItem value="shipping">Shipping Information</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message to the customer..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCommunicationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendMessage} disabled={!messageText.trim()}>
                  <Send className="h-4 w-4 mr-1" />
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;