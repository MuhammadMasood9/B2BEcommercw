import { useState } from 'react';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Filter
} from 'lucide-react';

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app, this would come from API
  const dashboardStats = {
    activeRFQs: 3,
    pendingInquiries: 5,
    unreadMessages: 12,
    favoriteSuppliers: 8,
    totalOrders: 15,
    totalSpent: 125000
  };

  const recentInquiries = [
    {
      id: 1,
      product: 'Industrial Pumps',
      supplier: 'Shanghai Manufacturing Co.',
      quantity: 50,
      price: '$800/unit',
      status: 'replied',
      date: '2 hours ago'
    },
    {
      id: 2,
      product: 'LED Lighting Systems',
      supplier: 'Guangzhou Electronics',
      quantity: 200,
      price: '$25/unit',
      status: 'pending',
      date: '1 day ago'
    },
    {
      id: 3,
      product: 'Packaging Materials',
      supplier: 'Dongguan Packaging',
      quantity: 1000,
      price: '$2.50/unit',
      status: 'negotiating',
      date: '2 days ago'
    }
  ];

  const recentRFQs = [
    {
      id: 1,
      title: 'Need 10,000 LED Bulbs',
      category: 'Electronics',
      budget: '$25,000',
      responses: 5,
      status: 'active',
      date: '1 day ago'
    },
    {
      id: 2,
      title: 'Industrial Machinery Parts',
      category: 'Machinery',
      budget: '$50,000',
      responses: 3,
      status: 'active',
      date: '3 days ago'
    }
  ];

  const recentMessages = [
    {
      id: 1,
      supplier: 'Shanghai Manufacturing Co.',
      lastMessage: 'We can provide samples by next week',
      unread: true,
      time: '30 min ago'
    },
    {
      id: 2,
      supplier: 'Guangzhou Electronics',
      lastMessage: 'Please check our latest quotation',
      unread: false,
      time: '2 hours ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied': return CheckCircle;
      case 'pending': return Clock;
      case 'negotiating': return MessageSquare;
      case 'active': return TrendingUp;
      default: return AlertCircle;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, John Smith
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your business inquiries and orders
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active RFQs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.activeRFQs}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.pendingInquiries}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread Messages</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.unreadMessages}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorite Suppliers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.favoriteSuppliers}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inquiries">My Inquiries</TabsTrigger>
              <TabsTrigger value="rfqs">My RFQs</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Inquiries */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Inquiries</CardTitle>
                    <Link href="/buyer/inquiries">
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentInquiries.map((inquiry) => {
                      const StatusIcon = getStatusIcon(inquiry.status);
                      return (
                        <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{inquiry.product}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{inquiry.supplier}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Qty: {inquiry.quantity}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{inquiry.price}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(inquiry.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {inquiry.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{inquiry.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Recent RFQs */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent RFQs</CardTitle>
                    <Link href="/buyer/rfqs">
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentRFQs.map((rfq) => (
                      <div key={rfq.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{rfq.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{rfq.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Budget: {rfq.budget}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{rfq.responses} responses</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(rfq.status)}>
                            {rfq.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{rfq.date}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/rfq/create">
                      <Button className="w-full h-20 flex flex-col gap-2">
                        <Plus className="h-6 w-6" />
                        Create New RFQ
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <Eye className="h-6 w-6" />
                        Browse Products
                      </Button>
                    </Link>
                    <Link href="/messages">
                      <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                        <MessageSquare className="h-6 w-6" />
                        View Messages
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Inquiries Tab */}
            <TabsContent value="inquiries" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Inquiries</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Link href="/products">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Inquiry
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentInquiries.map((inquiry) => {
                      const StatusIcon = getStatusIcon(inquiry.status);
                      return (
                        <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-4">
                            <Package className="h-8 w-8 text-gray-400" />
                            <div>
                              <h4 className="font-medium">{inquiry.product}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{inquiry.supplier}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">Quantity: {inquiry.quantity}</span>
                                <span className="text-xs text-gray-500">Price: {inquiry.price}</span>
                                <span className="text-xs text-gray-500">Date: {inquiry.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(inquiry.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {inquiry.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My RFQs Tab */}
            <TabsContent value="rfqs" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My RFQs</CardTitle>
                  <Link href="/rfq/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create RFQ
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRFQs.map((rfq) => (
                      <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <div>
                            <h4 className="font-medium">{rfq.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Category: {rfq.category}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">Budget: {rfq.budget}</span>
                              <span className="text-xs text-gray-500">Responses: {rfq.responses}</span>
                              <span className="text-xs text-gray-500">Date: {rfq.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(rfq.status)}>
                            {rfq.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMessages.map((message) => (
                      <div key={message.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Users className="h-8 w-8 text-gray-400" />
                            {message.unread && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{message.supplier}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{message.lastMessage}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{message.time}</span>
                          <Button variant="outline" size="sm">
                            Reply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 dark:text-gray-400">No favorite products yet</p>
                    <Link href="/products">
                      <Button variant="outline" className="mt-4">
                        Browse Products
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Suppliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 dark:text-gray-400">No favorite suppliers yet</p>
                    <Link href="/suppliers">
                      <Button variant="outline" className="mt-4">
                        Find Suppliers
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
