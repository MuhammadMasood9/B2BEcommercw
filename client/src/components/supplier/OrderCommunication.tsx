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
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Mail, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
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
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
  shippingAddress: any;
  notes?: string;
}

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: 'buyer' | 'supplier' | 'admin';
  message: string;
  type: 'general' | 'shipping' | 'support' | 'system';
  createdAt: string;
  isRead: boolean;
}

interface OrderCommunicationProps {
  supplierId: string;
}

const OrderCommunication: React.FC<OrderCommunicationProps> = ({ supplierId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'shipping' | 'support'>('general');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchMessages();
  }, [supplierId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}/orders?limit=50`);
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

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedOrder || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${selectedOrder.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          type: messageType
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      setMessageDialogOpen(false);
      fetchMessages();
      
      toast({
        title: "Success",
        description: "Message sent to buyer successfully",
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

  const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber,
          notes: `Status updated to ${status} by supplier`
        })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      fetchOrders();
      toast({
        title: "Success",
        description: `Order status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
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

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'shipping': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerCompanyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const unreadMessages = messages.filter(msg => !msg.isRead).length;
  const recentMessages = messages.slice(0, 10);

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
            <MessageCircle className="h-5 w-5" />
            Order Communication
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadMessages} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Active Orders</TabsTrigger>
              <TabsTrigger value="messages">
                Messages
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="communication">Communication Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders or buyers..."
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
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchOrders}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order.buyerFirstName} {order.buyerLastName}
                            {order.buyerCompanyName && ` • ${order.buyerCompanyName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <span className="font-bold">${parseFloat(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Items:</span>
                          <span className="ml-2">{order.items.length} products</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {order.trackingNumber && (
                          <div>
                            <span className="text-gray-600">Tracking:</span>
                            <span className="ml-2 font-mono">{order.trackingNumber}</span>
                          </div>
                        )}
                        {order.buyerEmail && (
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2">{order.buyerEmail}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setMessageDialogOpen(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message Buyer
                        </Button>
                        
                        {order.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Start Processing
                          </Button>
                        )}
                        
                        {order.status === 'processing' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Truck className="h-4 w-4 mr-2" />
                                Mark as Shipped
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark Order as Shipped</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="tracking">Tracking Number</Label>
                                  <Input
                                    id="tracking"
                                    placeholder="Enter tracking number"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const trackingNumber = (e.target as HTMLInputElement).value;
                                        updateOrderStatus(order.id, 'shipped', trackingNumber);
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    const trackingInput = document.getElementById('tracking') as HTMLInputElement;
                                    updateOrderStatus(order.id, 'shipped', trackingInput.value);
                                  }}
                                  className="w-full"
                                >
                                  Mark as Shipped
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {order.buyerPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.buyerPhone}`)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        )}

                        {order.buyerEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`mailto:${order.buyerEmail}`)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
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
                        : 'No orders to communicate about yet'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="space-y-4">
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <Card key={message.id} className={!message.isRead ? 'border-blue-500 bg-blue-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{message.senderName}</span>
                          <Badge className={getMessageTypeColor(message.type)}>
                            {message.type}
                          </Badge>
                          {!message.isRead && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm mb-2">{message.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Order #{message.orderId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const order = orders.find(o => o.id === message.orderId);
                            if (order) {
                              setSelectedOrder(order);
                              setMessageDialogOpen(true);
                            }
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {recentMessages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                    <p className="text-gray-600">No recent communication with buyers</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="communication" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Bulk Update to All Buyers
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Truck className="h-4 w-4 mr-2" />
                      Update Shipping Information
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Send Delay Notification
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Send Delivery Confirmation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Communication Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unread Messages:</span>
                      <span className="font-medium">{unreadMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Orders:</span>
                      <span className="font-medium">{orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Response:</span>
                      <span className="font-medium">{orders.filter(o => o.status === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-medium">2.5 hours</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send Message to Buyer
              {selectedOrder && (
                <span className="text-sm font-normal text-gray-600 block">
                  Order #{selectedOrder.orderNumber} • {selectedOrder.buyerFirstName} {selectedOrder.buyerLastName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select value={messageType} onValueChange={(value: 'general' | 'shipping' | 'support') => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
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
                placeholder="Type your message to the buyer..."
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
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderCommunication;