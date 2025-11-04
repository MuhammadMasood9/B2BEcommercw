import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  Eye, 
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  parentOrderId?: string;
  parentOrderNumber?: string;
  supplierId?: string;
  supplierName?: string;
  supplierLocation?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  items: OrderItem[];
  shippingAddress: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: 'buyer' | 'supplier' | 'admin';
  message: string;
  type: 'general' | 'shipping' | 'support' | 'system';
  createdAt: string;
}

interface OrderTrackingProps {
  buyerId: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ buyerId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderMessages, setOrderMessages] = useState<OrderMessage[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'support'>('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [buyerId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/buyers/${buyerId}/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const fetchOrderMessages = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setOrderMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load order messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedOrder || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          type: messageType,
          recipientType: 'supplier',
          recipientId: selectedOrder.supplierId
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      fetchOrderMessages(selectedOrder.id);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'processing': return 60;
      case 'shipped': return 80;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
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

  // Group orders by parent order for multivendor display
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const key = order.parentOrderNumber || order.orderNumber;
    if (!groups[key]) {
      groups[key] = {
        parentOrder: order.parentOrderNumber ? 
          orders.find(o => o.orderNumber === order.parentOrderNumber) : order,
        splitOrders: []
      };
    }
    
    if (order.parentOrderNumber) {
      groups[key].splitOrders.push(order);
    }
    
    return groups;
  }, {} as Record<string, { parentOrder?: Order; splitOrders: Order[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders, suppliers, or products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedOrders).map(([key, group]) => (
              <Card key={key} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {group.splitOrders.length > 0 ? 'Multi-Vendor Order' : 'Single Order'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Order #{key} • {new Date(group.parentOrder?.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${(group.parentOrder?.totalAmount || 
                           group.splitOrders.reduce((sum, o) => sum + o.totalAmount, 0)).toFixed(2)}
                      </p>
                      {group.splitOrders.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Split into {group.splitOrders.length} orders
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.splitOrders.length > 0 ? (
                    <div className="space-y-3">
                      {group.splitOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{order.supplierName}</h4>
                              {order.supplierLocation && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  {order.supplierLocation}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress:</span>
                              <span>{getStatusProgress(order.status)}%</span>
                            </div>
                            <Progress value={getStatusProgress(order.status)} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-600">Order #:</span>
                              <span className="ml-2 font-mono">{order.orderNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <span className="ml-2 font-medium">${order.totalAmount.toFixed(2)}</span>
                            </div>
                            {order.trackingNumber && (
                              <div>
                                <span className="text-gray-600">Tracking:</span>
                                <span className="ml-2 font-mono">{order.trackingNumber}</span>
                              </div>
                            )}
                            {order.estimatedDelivery && (
                              <div>
                                <span className="text-gray-600">Est. Delivery:</span>
                                <span className="ml-2">{order.estimatedDelivery}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchOrderMessages(order.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setMessageDialogOpen(true);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contact Supplier
                            </Button>
                            {order.trackingNumber && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`https://track.example.com/${order.trackingNumber}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Track Package
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single order display
                    group.parentOrder && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{group.parentOrder.supplierName || 'Platform Store'}</h4>
                            {group.parentOrder.supplierLocation && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {group.parentOrder.supplierLocation}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(group.parentOrder.status)}>
                              {group.parentOrder.status.charAt(0).toUpperCase() + group.parentOrder.status.slice(1)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(group.parentOrder.paymentStatus)}>
                              {group.parentOrder.paymentStatus.charAt(0).toUpperCase() + group.parentOrder.paymentStatus.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress:</span>
                            <span>{getStatusProgress(group.parentOrder.status)}%</span>
                          </div>
                          <Progress value={getStatusProgress(group.parentOrder.status)} className="h-2" />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(group.parentOrder!);
                              fetchOrderMessages(group.parentOrder!.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {group.parentOrder.supplierId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(group.parentOrder!);
                                setMessageDialogOpen(true);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contact Supplier
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'You haven\'t placed any orders yet'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-mono">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                          {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold">${selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tracking:</span>
                          <span className="font-mono">{selectedOrder.trackingNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedOrder.supplierId && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Supplier Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span className="font-medium">{selectedOrder.supplierName}</span>
                        </div>
                        {selectedOrder.supplierLocation && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span>{selectedOrder.supplierLocation}</span>
                          </div>
                        )}
                        {selectedOrder.supplierPhone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span>{selectedOrder.supplierPhone}</span>
                          </div>
                        )}
                        {selectedOrder.supplierEmail && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span>{selectedOrder.supplierEmail}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrder.shippingAddress && (
                      <div className="text-sm">
                        <p>{selectedOrder.shippingAddress.street}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="items" className="space-y-4">
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-gray-600">
                              ${item.unitPrice.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${item.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="messages" className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orderMessages.map((message) => (
                    <Card key={message.id} className={message.senderType === 'buyer' ? 'ml-8' : 'mr-8'}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <Badge variant="outline" className="mt-2">
                          {message.type}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Supplier</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select value={messageType} onValueChange={(value: 'general' | 'support') => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="support">Support Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;