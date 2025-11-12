import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Globe,
  Shield,
  ArrowRight,
  Plus,
  DollarSign,
  Package,
  Calendar,
  MapPin,
  Users,
  Filter,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";

export default function MyRFQs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch user's RFQs from API
  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['/api/rfqs', 'my'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/rfqs/my');
        if (!response.ok) throw new Error('Failed to fetch my RFQs');
        return await response.json();
      } catch (error) {
        console.error('Error fetching my RFQs:', error);
        // Return mock data if API fails
        return [
          {
            id: "RFQ-2024-001",
            title: "masood",
            category: "Electronics",
            quantity: 500,
            targetPrice: 14.99,
            quotationsReceived: 2,
            status: "Closed",
            createdDate: "2024-10-17",
            expiryDate: "2024-10-17",
            description: "adasdasd",
            attachments: ["Doc 1"],
            location: "karachi",
            budget: 14.99
          }
        ];
      }
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <Clock className="h-4 w-4" />;
      case "Under Review": return <Eye className="h-4 w-4" />;
      case "Closed": return <CheckCircle className="h-4 w-4" />;
      case "Expired": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-200";
      case "Under Review": return "bg-primary/10 text-primary border-primary/20";
      case "Closed": return "bg-gray-100 text-gray-800 border-gray-200";
      case "Expired": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfq.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfq.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const sortedRFQs = [...filteredRFQs].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      case "oldest":
        return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "quotations":
        return b.quotationsReceived - a.quotationsReceived;
      default:
        return 0;
    }
  });

  const stats = {
    total: rfqs.length,
    active: rfqs.filter((rfq: any) => rfq.status === "Active").length,
    closed: rfqs.filter((rfq: any) => rfq.status === "Closed").length,
    totalBudget: rfqs.reduce((sum: number, rfq: any) => sum + (rfq.budget || 0), 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                My RFQs
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Manage your Request for Quotations and compare supplier responses
              </p>
            </div>
            <div className="lg:ml-8">
              <Link href="/rfq/create">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New RFQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-primary bg-white h-12"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="expired">Expired</option>
                </select>
                
                <Button variant="outline" className="h-12 px-6 border-gray-200 hover:bg-gray-50 rounded-lg">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Total RFQs</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Open</p>
                    <p className="text-3xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Closed</p>
                    <p className="text-3xl font-bold text-foreground">{stats.closed}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Total Budget</p>
                    <p className="text-3xl font-bold text-foreground">${stats.totalBudget.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RFQs List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedRFQs.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No RFQs Found</h3>
                  <p className="text-muted-foreground mb-6">Create your first RFQ to start getting quotes from suppliers.</p>
                  <Link href="/rfq/create">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New RFQ
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedRFQs.map((rfq: any) => (
                  <Card key={rfq.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {rfq.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getStatusColor(rfq.status)} border text-xs px-2 py-1`}>
                              {getStatusIcon(rfq.status)}
                              <span className="ml-1">{rfq.status}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              Premium
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{rfq.description}</p>
                      
                      {rfq.attachments && rfq.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Attachments:</p>
                          <div className="flex gap-2">
                            {rfq.attachments.map((attachment: string, index: number) => (
                              <Link key={index} href="#" className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {attachment}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>Quantity: {rfq.quantity} units</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>Target Price: ${rfq.targetPrice}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Expected: {new Date(rfq.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Location: {rfq.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {new Date(rfq.createdDate).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Quotations: {rfq.quotationsReceived}</span>
                          </div>
                        </div>
                        <Link href={`/rfq/${rfq.id}`}>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                      
                      {rfq.quotationsReceived > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-700 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>{rfq.quotationsReceived} quotations received from suppliers</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Need to Create an RFQ?
              </h3>
              <p className="text-muted-foreground mb-6">
                Get competitive quotes from verified suppliers worldwide
              </p>
              <Link href="/rfq/create">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New RFQ
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}