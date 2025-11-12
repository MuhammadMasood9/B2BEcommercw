import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  AlertCircle,
  Edit,
  RefreshCw
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  items: any;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: any;
  billingAddress: any;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  buyerName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerCompany?: string;
  buyerPhone?: string;
  productName: string;
  productImage: string[];
  productDescription?: string;
}

export default function SupplierOrders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNotes, setTrackingNotes] = useState("");

  // Fetch orders with filters
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/suppliers/orders', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/suppliers/orders?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const orders = ordersData?.orders || [];

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/suppliers/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/orders'] });
      toast({ title: "Success", description: "Order status updated successfully" });
      setIsStatusDialogOpen(false);
      setIsDetailDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      setStatusNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Add tracking mutation
  const addTrackingMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier, notes }: { orderId: string; trackingNumber: string; carrier?: string; notes?: string }) => {
      const response = await fetch(`/api/suppliers/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ trackingNumber, carrier, notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add tracking information');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers/orders'] });
      toast({ title: "Success", description: "Tracking information added successfully" });
      setIsTrackingDialogOpen(false);
      setIsDetailDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setCarrier("");
      setTrackingNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-brand-orange-100 text-brand-orange-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-orange-600 text-orange-600';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  const handleAddTracking = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setIsTrackingDialogOpen(true);
  };

  const handleStatusSubmit = () => {
    if (!selectedOrder || !newStatus) return;

    if (newStatus === selectedOrder.status) {
      toast({
        title: "No Change",
        description: "Please select a different status",
        variant: "destructive"
      });
      return;
    }

    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
      notes: statusNotes || undefined
    });
  };

  const handleTrackingSubmit = () => {
    if (!selectedOrder || !trackingNumber) {
      toast({
        title: "Validation Error",
        description: "Please enter a tracking number",
        variant: "destructive"
      });
      return;
    }

    addTrackingMutation.mutate({
      orderId: selectedOrder.id,
      trackingNumber,
      carrier: carrier || undefined,
      notes: trackingNotes || undefined
    });
  };

  const getValidStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'completed'],
      'delivered': ['completed'],
      'completed': [],
      'cancelled': []
    };
    return transitions[currentStatus] || [];
  };

  // Filter orders based on date range
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= cutoffDate;
      });
    }

    return filtered;
  }, [orders, dateRange]);

  // Calculate stats
  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter((o: Order) => o.status === 'pending').length,
    processing: filteredOrders.filter((o: Order) => o.status === 'processing' || o.status === 'confirmed').length,
    shipped: filteredOrders.filter((o: Order) => o.status === 'shipped').length,
    delivered: filteredOrders.filter((o: Order) => o.status === 'delivered' || o.status === 'completed').length,
    totalRevenue: filteredOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount || '0'), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and fulfill customer orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-brand-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by order number, buyer name, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: Order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {order.productImage && order.productImage.length > 0 ? (
                              <img
                                src={order.productImage[0]}
                                alt={order.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{order.productName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.buyerName} {order.buyerLastName || ''}
                            </p>
                            {order.buyerCompany && (
                              <p className="text-sm text-muted-foreground">{order.buyerCompany}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{order.quantity}</span> units
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">${parseFloat(order.totalAmount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              ${parseFloat(order.unitPrice).toFixed(2)}/unit
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateStatus(order)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Update
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="font-mono font-medium">#{selectedOrder.orderNumber}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>

              <div>
                <Label htmlFor="newStatus">New Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="newStatus">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getValidStatusTransitions(selectedOrder.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only valid status transitions are shown
                </p>
              </div>

              <div>
                <Label htmlFor="statusNotes">Notes (Optional)</Label>
                <Textarea
                  id="statusNotes"
                  placeholder="Add any notes about this status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatusDialogOpen(false);
                    setNewStatus("");
                    setStatusNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusSubmit}
                  disabled={updateStatusMutation.isPending || !newStatus}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.trackingNumber ? 'Update' : 'Add'} Tracking Information
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="font-mono font-medium">#{selectedOrder.orderNumber}</p>
              </div>

              <div>
                <Label htmlFor="trackingNumber">Tracking Number *</Label>
                <Input
                  id="trackingNumber"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="carrier">Carrier (Optional)</Label>
                <Input
                  id="carrier"
                  placeholder="e.g., FedEx, UPS, DHL"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="trackingNotes">Notes (Optional)</Label>
                <Textarea
                  id="trackingNotes"
                  placeholder="Add any shipping notes..."
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTrackingDialogOpen(false);
                    setTrackingNumber("");
                    setCarrier("");
                    setTrackingNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTrackingSubmit}
                  disabled={addTrackingMutation.isPending || !trackingNumber}
                >
                  {addTrackingMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 mr-2" />
                      Save Tracking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-xl font-bold">#{selectedOrder.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Status and Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Order Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                  <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Product Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Information
                </h3>
                <div className="flex gap-4">
                  {selectedOrder.productImage && selectedOrder.productImage.length > 0 && (
                    <img
                      src={selectedOrder.productImage[0]}
                      alt={selectedOrder.productName}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-lg">{selectedOrder.productName}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        <span className="font-medium">{selectedOrder.quantity} units</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Unit Price:</span>{' '}
                        <span className="font-medium">${parseFloat(selectedOrder.unitPrice).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Buyer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedOrder.buyerName} {selectedOrder.buyerLastName || ''}
                    </span>
                  </div>
                  {selectedOrder.buyerCompany && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.buyerCompany}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedOrder.buyerEmail}</span>
                  </div>
                  {selectedOrder.buyerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.buyerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </h3>
                  <div className="text-sm space-y-1">
                    {typeof selectedOrder.shippingAddress === 'object' ? (
                      <>
                        <p>{selectedOrder.shippingAddress.address}</p>
                        <p>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                          {selectedOrder.shippingAddress.postalCode}
                        </p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </>
                    ) : (
                      <p>{selectedOrder.shippingAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {selectedOrder.trackingNumber && (
                <div className="border rounded-lg p-4 bg-brand-orange-50">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Tracking Information
                  </h3>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tracking Number:</span>{' '}
                    <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span>
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ${(parseFloat(selectedOrder.totalAmount) - parseFloat(selectedOrder.shippingAmount || '0') - parseFloat(selectedOrder.taxAmount || '0')).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(selectedOrder.shippingAmount || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">${parseFloat(selectedOrder.shippingAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(selectedOrder.taxAmount || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">${parseFloat(selectedOrder.taxAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-green-600">
                      ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-4 border-t">
                <div className="flex gap-2">
                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDetailDialogOpen(false);
                          handleUpdateStatus(selectedOrder);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                      {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDetailDialogOpen(false);
                            handleAddTracking(selectedOrder);
                          }}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          {selectedOrder.trackingNumber ? 'Update' : 'Add'} Tracking
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
