import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  ShoppingCart, 
  MessageSquare, 
  Heart, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Users,
  Star,
  ArrowRight,
  Plus,
  Eye,
  Filter,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Activity,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  MoreHorizontal,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface DashboardStats {
  activeRfqs: number;
  pendingInquiries: number;
  unreadMessages: number;
  favoriteProducts: number;
  totalQuotations: number;
  totalOrders: number;
  totalSpent: number;
}

interface RecentActivity {
  id: string;
  type: 'inquiry' | 'rfq' | 'quotation' | 'order' | 'message';
  title: string;
  status: string;
  date: string;
  amount?: number;
  description?: string;
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['buyer-dashboard-comprehensive'],
    queryFn: () => apiRequest('GET', '/api/buyer/dashboard/stats'),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch unseen counts
  const { data: unseenCounts } = useQuery({
    queryKey: ['unseen-counts'],
    queryFn: async () => {
      const [chatCount, notificationCount] = await Promise.all([
        apiRequest('GET', '/api/chat/unseen-count'),
        apiRequest('GET', '/api/notifications/unseen-count')
      ]);
      return {
        chat: chatCount.count || 0,
        notifications: notificationCount.count || 0
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Refresh all data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buyer-dashboard-comprehensive'] }),
        queryClient.invalidateQueries({ queryKey: ['unseen-counts'] }),
      ]);
    },
  });

  // Process data for display from comprehensive API
  const recentInquiries = dashboardData?.recentInquiries || [];
  const recentRFQs = dashboardData?.recentRFQs || [];
  const recentQuotations = dashboardData?.recentQuotations || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const recentConversations = dashboardData?.recentConversations || [];
  const recentNotifications = dashboardData?.recentNotifications || [];

  // Calculate comprehensive stats
  const stats: DashboardStats = {
    activeRfqs: dashboardData?.activeRfqs || 0,
    pendingInquiries: dashboardData?.pendingInquiries || 0,
    unreadMessages: dashboardData?.unreadMessages || 0,
    favoriteProducts: dashboardData?.favoriteProducts || 0,
    totalQuotations: dashboardData?.totalQuotations || 0,
    totalOrders: dashboardData?.totalOrders || 0,
    totalSpent: dashboardData?.totalSpent || 0
  };

  // Create recent activity feed
  const recentActivity: RecentActivity[] = [
    ...recentInquiries.map((inquiry: any) => ({
      id: inquiry.id,
      type: 'inquiry' as const,
      title: inquiry.productName || 'Product Inquiry',
      status: inquiry.status,
      date: inquiry.createdAt,
      amount: inquiry.estimatedValue,
      description: `Quantity: ${inquiry.quantity}`
    })),
    ...recentRFQs.map((rfq: any) => ({
      id: rfq.id,
      type: 'rfq' as const,
      title: rfq.title,
      status: rfq.status,
      date: rfq.createdAt,
      amount: rfq.budget,
      description: `Category: ${rfq.category}`
    })),
    ...recentQuotations.map((quotation: any) => ({
      id: quotation.id,
      type: 'quotation' as const,
      title: quotation.productName || 'Product Quotation',
      status: quotation.status,
      date: quotation.createdAt,
      amount: quotation.totalPrice,
      description: `From: ${quotation.supplierName || 'Supplier'}`
    })),
    ...recentOrders.map((order: any) => ({
      id: order.id,
      type: 'order' as const,
      title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
      status: order.status,
      date: order.createdAt,
      amount: order.totalAmount,
      description: `Items: ${order.items?.length || 0}`
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'replied':
      case 'accepted':
      case 'completed':
      case 'shipped':
      case 'delivered':
      case 'open': return 'bg-green-100 text-green-800';
      case 'pending':
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'negotiating':
      case 'in_progress':
      case 'processing': return 'bg-primary/10 text-primary';
      case 'rejected':
      case 'cancelled':
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'replied':
      case 'accepted':
      case 'completed':
      case 'shipped':
      case 'delivered':
      case 'open': return CheckCircle;
      case 'pending':
      case 'waiting': return Clock;
      case 'negotiating':
      case 'in_progress':
      case 'processing': return MessageSquare;
      case 'rejected':
      case 'cancelled':
      case 'closed': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inquiry': return Package;
      case 'rfq': return FileText;
      case 'quotation': return DollarSign;
      case 'order': return ShoppingBag;
      case 'message': return MessageSquare;
      default: return Activity;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isLoading = dashboardLoading;
  const hasError = dashboardError;

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 theme-transition">
                  Welcome back, {user?.email || 'Buyer'}
                </h1>
                <p className="text-muted-foreground theme-transition">
                  Here's your complete business overview and activity summary
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Link href="/products">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    New Inquiry
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {hasError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Some data couldn't be loaded. Please refresh the page or try again later.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active RFQs</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRfqs}</p>
                    )}
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4">
                  <Link href="/buyer/rfqs">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Inquiries</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingInquiries}</p>
                    )}
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-4">
                  <Link href="/buyer/inquiries">
                    <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread Messages</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
                    )}
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <Link href="/messages">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                    )}
                  </div>
                  <ShoppingBag className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <Link href="/buyer/orders">
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotations</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuotations}</p>
                    )}
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <Link href="/buyer/quotations">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSpent)}</p>
                    )}
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4">
                  <Link href="/buyer/orders">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      View Orders <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorite Products</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.favoriteProducts}</p>
                    )}
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                <div className="mt-4">
                  <Link href="/favorites">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      View Favorites <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="rfqs">RFQs</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Feed */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))
                    ) : recentActivity.length > 0 ? (
                      recentActivity.map((activity) => {
                        const ActivityIcon = getActivityIcon(activity.type);
                        const StatusIcon = getStatusIcon(activity.status);
                        return (
                          <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <ActivityIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                                {activity.amount && (
                                  <>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-500">{formatCurrency(activity.amount)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(activity.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {activity.status}
                            </Badge>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No recent activity</p>
                        <Link href="/products">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="h-4 w-4 mr-2" />
                            Start Your First Inquiry
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <Link href="/rfq/create">
                        <Button className="w-full h-16 flex flex-col gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                          <FileText className="h-6 w-6" />
                          Create New RFQ
                        </Button>
                      </Link>
                      <Link href="/products">
                        <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-primary/20 text-primary hover:bg-primary/5">
                          <Eye className="h-6 w-6" />
                          Browse Products
                        </Button>
                      </Link>
                      <Link href="/messages">
                        <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-primary/20 text-primary hover:bg-primary/5">
                          <MessageSquare className="h-6 w-6" />
                          View Messages
                        </Button>
                      </Link>
                      <Link href="/buyer/quotations">
                        <Button variant="outline" className="w-full h-16 flex flex-col gap-2 border-primary/20 text-primary hover:bg-primary/5">
                          <DollarSign className="h-6 w-6" />
                          View Quotations
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Inquiries</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Link href="/products">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        New Inquiry
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24 mb-1" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      ))
                    ) : recentInquiries.length > 0 ? (
                      recentInquiries.map((inquiry: any) => {
                        const StatusIcon = getStatusIcon(inquiry.status);
                        return (
                          <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-4">
                              <Package className="h-8 w-8 text-gray-400" />
                              <div>
                                <h4 className="font-medium">{inquiry.productName || inquiry.product?.name || 'Product Inquiry'}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {inquiry.quantity}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">Status: {inquiry.status}</span>
                                  <span className="text-xs text-gray-500">Date: {formatDate(inquiry.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(inquiry.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {inquiry.status}
                              </Badge>
                              <Link href={`/buyer/inquiries/${inquiry.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No inquiries yet</p>
                        <Link href="/products">
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Inquiry
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RFQs Tab */}
            <TabsContent value="rfqs" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My RFQs</CardTitle>
                  <Link href="/rfq/create">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Create RFQ
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24 mb-1" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      ))
                    ) : recentRFQs.length > 0 ? (
                      recentRFQs.map((rfq: any) => (
                        <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                            <div>
                              <h4 className="font-medium">{rfq.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Category: {rfq.category}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">Budget: {formatCurrency(rfq.budget || 0)}</span>
                                <span className="text-xs text-gray-500">Status: {rfq.status}</span>
                                <span className="text-xs text-gray-500">Date: {formatDate(rfq.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(rfq.status)}>
                              {rfq.status}
                            </Badge>
                            <Link href={`/buyer/rfqs/${rfq.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No RFQs yet</p>
                        <Link href="/rfq/create">
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First RFQ
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quotations Tab */}
            <TabsContent value="quotations" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Quotations</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24 mb-1" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      ))
                    ) : recentQuotations.length > 0 ? (
                      recentQuotations.map((quotation: any) => {
                        const StatusIcon = getStatusIcon(quotation.status);
                        return (
                          <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-4">
                              <DollarSign className="h-8 w-8 text-gray-400" />
                              <div>
                                <h4 className="font-medium">{quotation.productName || 'Product Quotation'}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Price: {formatCurrency(quotation.totalPrice || 0)}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">Status: {quotation.status}</span>
                                  <span className="text-xs text-gray-500">Date: {formatDate(quotation.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(quotation.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {quotation.status}
                              </Badge>
                              <Link href={`/buyer/quotations/${quotation.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No quotations yet</p>
                        <p className="text-sm text-gray-400">Quotations will appear here when suppliers respond to your inquiries</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Orders</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24 mb-1" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      ))
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order: any) => {
                        const StatusIcon = getStatusIcon(order.status);
                        return (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-4">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                              <div>
                                <h4 className="font-medium">Order #{order.orderNumber || order.id.slice(0, 8)}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total: {formatCurrency(order.totalAmount || 0)}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">Status: {order.status}</span>
                                  <span className="text-xs text-gray-500">Date: {formatDate(order.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(order.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {order.status}
                              </Badge>
                              <Link href={`/buyer/orders/${order.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No orders yet</p>
                        <p className="text-sm text-gray-400">Orders will appear here when you accept quotations</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      ))
                    ) : recentConversations.length > 0 ? (
                      recentConversations.map((conversation: any) => (
                        <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Users className="h-8 w-8 text-gray-400" />
                              {conversation.unreadCountBuyer > 0 && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">{conversation.unreadCountBuyer}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{conversation.subject || 'General Chat'}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {conversation.lastMessage || 'No messages yet'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {conversation.chatType === 'product' ? 'Product Chat' : 'General Chat'}
                                </span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{formatDate(conversation.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {conversation.unreadCountBuyer > 0 ? `${conversation.unreadCountBuyer} unread` : 'Read'}
                            </span>
                            <Link href={`/messages?conversation=${conversation.id}`}>
                              <Button variant="outline" size="sm">
                                Open Chat
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No conversations yet</p>
                        <p className="text-sm text-gray-400">Start a conversation with suppliers or admins</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}