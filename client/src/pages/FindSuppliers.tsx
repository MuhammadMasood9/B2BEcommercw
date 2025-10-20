import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupplierCard from "@/components/SupplierCard";
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
  SlidersHorizontal, 
  X, 
  Globe,
  Shield,
  TrendingUp,
  Filter,
  Users,
  Award,
  Clock,
  CheckCircle,
  Building2,
  MapPin,
  Loader2
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function FindSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [tradeAssuranceOnly, setTradeAssuranceOnly] = useState(false);
  const [goldAdminsOnly, setGoldAdminsOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Fetch admins from API
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['/api/users', 'admin'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users?role=admin');
        if (!response.ok) throw new Error('Failed to fetch admins');
        return await response.json();
      } catch (error) {
        console.error('Error fetching admins:', error);
        // Return mock data if API fails
        return [
          {
            id: "s1",
            name: "Global Electronics Manufacturing Co.",
            logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
            location: "China",
            type: "Manufacturer",
            verified: true,
            goldSupplier: true,
            tradeAssurance: true,
            mainProducts: ["Headphones", "Speakers", "Smart Devices"],
            yearsInBusiness: 12,
            rating: 4.8,
            responseRate: "95%",
            responseTime: "< 2h",
          },
          {
            id: "s2",
            name: "Fashion Textile Industries Ltd.",
            logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
            location: "Bangladesh",
            type: "Manufacturer",
            verified: true,
            goldSupplier: false,
            tradeAssurance: true,
            mainProducts: ["Apparel", "Textiles", "Garments"],
            yearsInBusiness: 8,
            rating: 4.6,
            responseRate: "88%",
            responseTime: "< 4h",
          },
          {
            id: "s3",
            name: "Premium Machinery Exports",
            logo: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop",
            location: "Germany",
            type: "Trading Company",
            verified: true,
            goldSupplier: true,
            tradeAssurance: true,
            mainProducts: ["Industrial Machinery", "Tools", "Equipment"],
            yearsInBusiness: 15,
            rating: 4.9,
            responseRate: "98%",
            responseTime: "< 1h",
          },
        ];
      }
    }
  });

  // Filter and sort admins
  const filteredAdmins = admins.filter((admin: any) => {
    const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         admin.mainProducts?.some((product: string) => 
                           product.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesVerified = !verifiedOnly || admin.verified;
    const matchesTradeAssurance = !tradeAssuranceOnly || admin.tradeAssurance;
    const matchesGold = !goldAdminsOnly || admin.goldSupplier;
    const matchesLocation = selectedLocation === "all" || admin.location === selectedLocation;
    const matchesType = selectedType === "all" || admin.type === selectedType;

    return matchesSearch && matchesVerified && matchesTradeAssurance && 
           matchesGold && matchesLocation && matchesType;
  });

  const sortedAdmins = [...filteredAdmins].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'response-time':
        return parseInt(a.responseTime) - parseInt(b.responseTime);
      case 'years':
        return b.yearsInBusiness - a.yearsInBusiness;
      case 'relevance':
      default:
        return 0;
    }
  });

  const locations = ["China", "Bangladesh", "Germany", "USA", "India", "Vietnam"];
  const types = ["Manufacturer", "Trading Company", "Distributor"];

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
              <Users className="w-4 h-4" />
              <span>Find Trusted Admins</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Admins
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Connect with verified admins worldwide for your business needs
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
                <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                  <Search className="w-5 h-5 text-gray-400 ml-4 mr-3" />
                  <Input
                    placeholder="Search by admin name or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
                  />
                  <Button size="lg" className="m-1 h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700">
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-300" />
                <span>Gold Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <Card className="sticky top-8 bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Admin Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {types.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Feature Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="verified" 
                          checked={verifiedOnly}
                          onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                        />
                        <Label htmlFor="verified" className="text-sm">Verified Admin</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="trade-assurance"
                          checked={tradeAssuranceOnly}
                          onCheckedChange={(checked) => setTradeAssuranceOnly(checked === true)}
                        />
                        <Label htmlFor="trade-assurance" className="text-sm">Trade Assurance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="gold"
                          checked={goldAdminsOnly}
                          onCheckedChange={(checked) => setGoldAdminsOnly(checked === true)}
                        />
                        <Label htmlFor="gold" className="text-sm">Gold Admin</Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setVerifiedOnly(false);
                      setTradeAssuranceOnly(false);
                      setGoldAdminsOnly(false);
                      setSelectedLocation("all");
                      setSelectedType("all");
                      setSearchQuery("");
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Admins Section */}
            <div className="flex-1">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sortedAdmins.length} Admins Found
                  </h2>
                  <p className="text-gray-600">
                    Connect with trusted business partners
                  </p>
                </div>
                
                <div className="flex gap-4 items-center">
                  {/* Mobile Filter Button */}
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild className="lg:hidden">
                      <Button variant="outline">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <div className="space-y-6 mt-6">
                        <h3 className="font-semibold text-lg">Filters</h3>
                        
                        {/* Mobile filters content (same as desktop) */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Location</Label>
                          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {locations.map(location => (
                                <SelectItem key={location} value={location}>{location}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Admin Type</Label>
                          <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {types.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Features</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="verified-mobile" 
                                checked={verifiedOnly}
                                onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                              />
                              <Label htmlFor="verified-mobile" className="text-sm">Verified Admin</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="trade-assurance-mobile"
                                checked={tradeAssuranceOnly}
                                onCheckedChange={(checked) => setTradeAssuranceOnly(checked === true)}
                              />
                              <Label htmlFor="trade-assurance-mobile" className="text-sm">Trade Assurance</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="gold-mobile"
                                checked={goldAdminsOnly}
                                onCheckedChange={(checked) => setGoldAdminsOnly(checked === true)}
                              />
                              <Label htmlFor="gold-mobile" className="text-sm">Gold Admin</Label>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setVerifiedOnly(false);
                            setTradeAssuranceOnly(false);
                            setGoldAdminsOnly(false);
                            setSelectedLocation("all");
                            setSelectedType("all");
                            setSearchQuery("");
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                      <SelectItem value="response-time">Fastest Response</SelectItem>
                      <SelectItem value="years">Most Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admins Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex gap-4 mb-4">
                          <div className="w-16 h-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedAdmins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedAdmins.map((admin: any) => (
                    <SupplierCard key={admin.id} supplier={admin} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No admins found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search criteria or filters' 
                      : 'No admins match your current filters'
                    }
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setVerifiedOnly(false);
                      setTradeAssuranceOnly(false);
                      setGoldAdminsOnly(false);
                      setSelectedLocation("all");
                      setSelectedType("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Why Work with Our Admins?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Verified & Trusted</h3>
                  <p className="text-sm text-gray-600">All admins undergo strict verification</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Quality Assured</h3>
                  <p className="text-sm text-gray-600">Trade assurance for your protection</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Fast Response</h3>
                  <p className="text-sm text-gray-600">Quick replies to your inquiries</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-7 h-7 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Global Reach</h3>
                  <p className="text-sm text-gray-600">Admins from around the world</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}