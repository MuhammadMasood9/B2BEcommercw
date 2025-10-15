import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Download,
  MoreHorizontal,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Star,
  Target,
  Zap
} from 'lucide-react';

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    trackingNumber: '',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('overview');

  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/orders', statusFilter, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        const response = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        return data.orders || [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    }
  });

  // Fetch inquiries for analytics
  const { data: inquiries = [] } = useQuery({
    queryKey: ['/api/admin/inquiries'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/inquiries');
        if (!response.ok) throw new Error('Failed to fetch inquiries');
        const data = await response.json();
        return data.inquiries || [];
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        return [];
      }
    }
  });

  // Fetch quotations for analytics
  const { data: quotations = [] } = useQuery({
    queryKey: ['/api/admin/quotations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/quotations');
        if (!response.ok) throw new Error('Failed to fetch quotations');
        const data = await response.json();
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    }
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setIsUpdateDialogOpen(false);
      setSelectedOrder(null);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = !searchQuery || 
      order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
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

  const handleUpdateOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      notes: order.notes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateOrderSubmit = () => {
    if (selectedOrder) {
      updateOrderMutation.mutate({
        id: selectedOrder.id,
        data: updateForm
      });
    }
  };

  // Comprehensive analytics
  const stats = {
    orders: {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === 'pending').length,
      confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
      processing: orders.filter((o: any) => o.status === 'processing').length,
      shipped: orders.filter((o: any) => o.status === 'shipped').length,
      delivered: orders.filter((o: any) => o.status === 'delivered').length,
      cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
      totalValue: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
    },
    inquiries: {
      total: inquiries.length,
      pending: inquiries.filter((i: any) => i.status === 'pending').length,
      replied: inquiries.filter((i: any) => i.status === 'replied').length,
      negotiating: inquiries.filter((i: any) => i.status === 'negotiating').length,
      closed: inquiries.filter((i: any) => i.status === 'closed').length
    },
    quotations: {
      total: quotations.length,
      pending: quotations.filter((q: any) => q.status === 'pending').length,
      accepted: quotations.filter((q: any) => q.status === 'accepted').length,
      rejected: quotations.filter((q: any) => q.status === 'rejected').length,
      totalValue: quotations.reduce((sum: number, q: any) => sum + (q.totalPrice || 0), 0)
    }
  };

  // Calculate conversion rates
  const conversionRates = {
    inquiryToQuotation: inquiries.length > 0 ? (quotations.length / inquiries.length * 100).toFixed(1) : '0',
    quotationToOrder: quotations.length > 0 ? (orders.length / quotations.length * 100).toFixed(1) : '0',
    inquiryToOrder: inquiries.length > 0 ? (orders.length / inquiries.length * 100).toFixed(1) : '0'
  };

  return (
    <div className=" mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Orders Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive management dashboard for inquiries, quotations, and orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">{formatPrice(stats.orders.totalValue)}</p>
                <p className="text-blue-100 text-sm">From {stats.orders.total} orders</p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Inquiries</p>
                <p className="text-3xl font-bold">{stats.inquiries.total}</p>
                <p className="text-green-100 text-sm">{stats.inquiries.pending} pending</p>
              </div>
              <MessageSquare className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Quotations Sent</p>
                <p className="text-3xl font-bold">{stats.quotations.total}</p>
                <p className="text-purple-100 text-sm">{stats.quotations.pending} pending</p>
              </div>
              <FileSpreadsheet className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold">{conversionRates.inquiryToOrder}%</p>
                <p className="text-orange-100 text-sm">Inquiry to Order</p>
              </div>
              <Target className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {stats.orders.pending}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Processing</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {stats.orders.processing}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shipped</span>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                  {stats.orders.shipped}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivered</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {stats.orders.delivered}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Inquiries</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.inquiries.total}</span>
                  <ArrowDownRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Quotations</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.quotations.total}</span>
                  <span className="text-xs text-gray-500">({conversionRates.inquiryToQuotation}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Orders</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.orders.total}</span>
                  <span className="text-xs text-gray-500">({conversionRates.quotationToOrder}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Inquiries ({stats.inquiries.pending} pending)
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Manage Quotations ({stats.quotations.pending} pending)
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Process Orders ({stats.orders.pending} pending)
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Inquiries ({stats.inquiries.pending})
          </TabsTrigger>
          <TabsTrigger value="quotations" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Quotations ({stats.quotations.pending})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders ({stats.orders.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New inquiry received</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Quotation sent</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order confirmed</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Response Time</span>
                    <span className="font-semibold">2.3 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quote Acceptance Rate</span>
                    <span className="font-semibold text-green-600">{conversionRates.quotationToOrder}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-semibold">4.8/5</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="font-semibold">+12.5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inquiries" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Inquiries</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Inquiry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inquiries.slice(0, 5).map((inquiry: any) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{inquiry.productName || 'Product Inquiry'}</p>
                        <p className="text-sm text-gray-500">From: {inquiry.buyerName || 'Unknown Buyer'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {inquiry.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quotations Management</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Send Quotation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotations.slice(0, 5).map((quotation: any) => (
                  <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <FileSpreadsheet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Quotation #{quotation.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">Value: {formatPrice(quotation.totalPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(quotation.status)}>
                        {quotation.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Orders Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{order.productName || 'Product Order'}</p>
                        <p className="text-sm text-gray-500">Order: {order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateOrder(order)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Update Order Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tracking Number
              </label>
              <Input
                value={updateForm.trackingNumber}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <Textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrderSubmit}
                disabled={updateOrderMutation.isPending}
              >
                {updateOrderMutation.isPending ? 'Updating...' : 'Update Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}