import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Package, Eye, Truck, CheckCircle, Clock, AlertCircle, MessageCircle, Send, Phone, Mail } from 'lucide-react';
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
  shippingAddress: any;
}

interface OrderManagementProps {
  supplierId: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ supplierId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'shipping' | 'support'>('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [supplierId, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search orders by number, buyer name, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
                  <CardTitle className="text-lg">
                    Order #{order.orderNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </Badge>
                </div>
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