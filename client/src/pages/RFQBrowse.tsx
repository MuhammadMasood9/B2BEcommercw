import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RFQCard from "@/components/RFQCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter,
  TrendingUp,
  Globe,
  Shield,
  Clock,
  FileText,
  Users,
  ArrowRight,
  Eye
} from "lucide-react";
import { Link } from "wouter";

export default function RFQBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedAdminsOnly, setVerifiedAdminsOnly] = useState(false);

  // Fetch RFQs from API
  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['/api/rfqs', 'browse'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/rfqs?status=active');
        if (!response.ok) throw new Error('Failed to fetch RFQs');
        return await response.json();
      } catch (error) {
        console.error('Error fetching RFQs:', error);
        // Return mock data if API fails
        return [
          {
            id: "1",
            title: "Looking for High-Quality Wireless Earbuds - Bulk Order",
            quantity: "5,000 units",
            budget: "$15-20 per unit",
            location: "United States",
            timeRemaining: "3 days left",
            quotations: 12,
            category: "Electronics",
            createdAt: new Date().toISOString(),
            buyerName: "Tech Corp",
            description: "We need high-quality wireless earbuds for our retail business..."
          },
          {
            id: "2",
            title: "Need Custom Branded T-Shirts with Logo Printing",
            quantity: "10,000 pieces",
            budget: "$3-5 per piece",
            location: "United Kingdom",
            timeRemaining: "5 days left",
            quotations: 8,
            category: "Apparel",
            createdAt: new Date().toISOString(),
            buyerName: "Fashion Ltd",
            description: "Looking for custom branded t-shirts with high-quality printing..."
          },
          {
            id: "3",
            title: "Industrial Grade Steel Pipes - Various Sizes Required",
            quantity: "2,000 meters",
            budget: "$50-80 per meter",
            location: "Germany",
            timeRemaining: "1 day left",
            quotations: 15,
            category: "Construction",
            createdAt: new Date().toISOString(),
            buyerName: "Build Co",
            description: "Need industrial grade steel pipes for construction project..."
          }
        ];
      }
    }
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  });

  // Filter and sort RFQs
  const filteredRFQs = rfqs.filter((rfq: any) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || rfq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedRFQs = [...filteredRFQs].sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "most-quotations":
        return b.quotations - a.quotations;
      case "least-quotations":
        return a.quotations - b.quotations;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Browse Opportunities</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Browse
              <span className="bg-gradient-to-r from-primary/80 via-white to-primary/80 bg-clip-text text-transparent block">
                RFQs
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover business opportunities and respond to buyer requests worldwide
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                    <div className="flex items-center px-4">
                      <Search className="w-5 h-5 text-gray-400 mr-3" />
                      <Input
                        placeholder="Search RFQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 border-0 border-l border-gray-200 rounded-none focus:ring-0 text-gray-700 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="lg" className="h-14 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Buyers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>Active Opportunities</span>
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
          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:block lg:w-64">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified-admins" 
                        checked={verifiedAdminsOnly}
                        onCheckedChange={(checked) => setVerifiedAdminsOnly(checked === true)}
                      />
                      <Label htmlFor="verified-admins" className="text-sm">Verified Buyers Only</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RFQs Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sortedRFQs.length} RFQs Found
                  </h2>
                  <p className="text-gray-600">
                    Showing results for "{searchQuery || 'all RFQs'}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="most-quotations">Most Quotations</SelectItem>
                      <SelectItem value="least-quotations">Least Quotations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* RFQs Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedRFQs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedRFQs.map((rfq: any) => (
                    <RFQCard key={rfq.id} rfq={rfq} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No RFQs found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Want to Create Your Own RFQ?
              </h3>
              <p className="text-gray-600 mb-6">
                Post your requirements and get competitive quotes from verified admins
              </p>
              <Link href="/rfq/create">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3">
                  Create RFQ
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