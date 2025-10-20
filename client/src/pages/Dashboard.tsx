import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  Heart, 
  Package,
  TrendingUp,
  Clock,
  Users,
  Globe,
  Shield,
  Star,
  ArrowRight,
  Eye,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  // Fetch dynamic data from API
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return await response.json();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          activeRFQs: 5,
          pendingInquiries: 12,
          unreadMessages: 8,
          favoriteAdmins: 23
        };
      }
    }
  });

  const { data: recentRFQsData } = useQuery({
    queryKey: ['/api/rfqs', 'recent'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/rfqs?limit=3');
        if (!response.ok) throw new Error('Failed to fetch recent RFQs');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent RFQs:', error);
        return [
          { id: 1, title: "Wireless Earbuds Bulk Order", quotations: 12, status: "Active" },
          { id: 2, title: "Custom T-Shirts with Logo", quotations: 8, status: "Active" },
          { id: 3, title: "LED Strip Lights", quotations: 5, status: "Closed" },
        ];
      }
    }
  });

  // Ensure recentRFQs is always an array
  const recentRFQs = Array.isArray(recentRFQsData) ? recentRFQsData : [];

  const { data: recentInquiriesData } = useQuery({
    queryKey: ['/api/inquiries', 'recent'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/inquiries?limit=3');
        if (!response.ok) throw new Error('Failed to fetch recent inquiries');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent inquiries:', error);
        return [
          { id: 1, product: "Bluetooth Headphones", admin: "AudioTech Pro", status: "Replied" },
          { id: 2, product: "Smart Watch", admin: "TechGear Ltd", status: "Pending" },
          { id: 3, product: "Laptop Bag", admin: "Leather Crafts", status: "Negotiating" },
        ];
      }
    }
  });

  // Ensure recentInquiries is always an array
  const recentInquiries = Array.isArray(recentInquiriesData) ? recentInquiriesData : [];

  const stats = [
    { 
      label: "Active RFQs", 
      value: dashboardStats?.activeRFQs?.toString() || "5", 
      icon: FileText, 
      color: "text-blue-600",
      bgColor: "from-blue-100 to-blue-200"
    },
    { 
      label: "Pending Inquiries", 
      value: dashboardStats?.pendingInquiries?.toString() || "12", 
      icon: MessageSquare, 
      color: "text-amber-600",
      bgColor: "from-amber-100 to-amber-200"
    },
    { 
      label: "Unread Messages", 
      value: dashboardStats?.unreadMessages?.toString() || "8", 
      icon: MessageSquare, 
      color: "text-purple-600",
      bgColor: "from-purple-100 to-purple-200"
    },
    { 
      label: "Favorite Admins", 
      value: dashboardStats?.favoriteAdmins?.toString() || "23", 
      icon: Heart, 
      color: "text-red-600",
      bgColor: "from-red-100 to-red-200"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Business Overview</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Buyer
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Dashboard
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Welcome back! Here's what's happening with your business.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24h Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rfqs">RFQs</TabsTrigger>
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent RFQs */}
                <Card className="bg-white border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Recent RFQs
                      </span>
                      <Link href="/my-rfqs">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View All
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentRFQs.map((rfq: any) => (
                      <div key={rfq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{rfq.title}</h4>
                          <p className="text-sm text-gray-600">{rfq.quotations} quotations received</p>
                        </div>
                        <Badge variant={rfq.status === 'Active' ? 'default' : 'secondary'}>
                          {rfq.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Inquiries */}
                <Card className="bg-white border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Recent Inquiries
                      </span>
                      <Link href="/buyer/inquiries">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          View All
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentInquiries.map((inquiry: any) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{inquiry.product}</h4>
                          <p className="text-sm text-gray-600">Admin: {inquiry.admin || inquiry.supplier}</p>
                        </div>
                        <Badge variant={inquiry.status === 'Replied' ? 'default' : 'secondary'}>
                          {inquiry.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rfqs" className="space-y-6">
              <Card className="bg-white border-gray-100">
                <CardHeader>
                  <CardTitle>Your RFQs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Your RFQs</h3>
                    <p className="text-gray-600 mb-4">Create and track your Request for Quotations</p>
                    <Link href="/rfq/create">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create New RFQ
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inquiries" className="space-y-6">
              <Card className="bg-white border-gray-100">
                <CardHeader>
                  <CardTitle>Your Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Your Inquiries</h3>
                    <p className="text-gray-600 mb-4">Monitor responses from admins</p>
                    <Link href="/buyer/inquiries">
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        View All Inquiries
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card className="bg-white border-gray-100">
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Communicate with Admins</h3>
                    <p className="text-gray-600 mb-4">Chat with verified admins about products and orders</p>
                    <Link href="/messages">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Open Messages
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
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