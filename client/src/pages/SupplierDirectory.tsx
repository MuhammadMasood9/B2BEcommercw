import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Store, 
  MapPin, 
  Star, 
  Users, 
  Eye,
  Search,
  Filter,
  Grid,
  List,
  Building,
  Calendar,
  Package,
  MessageCircle,
  Heart,
  ExternalLink,
  CheckCircle,
  GitCompare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SupplierComparison from "@/components/supplier/SupplierComparison";
import AdvancedSupplierFilters from "@/components/supplier/AdvancedSupplierFilters";
import SupplierRecommendations from "@/components/supplier/SupplierRecommendations";
import { VerificationBadge } from "@/components/ui/VerificationBadge";

interface Supplier {
  id: string;
  businessName: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  businessType: string;
  city: string;
  country: string;
  yearEstablished?: number;
  mainProducts?: string[];
  verificationLevel: string;
  isVerified: boolean;
  membershipTier: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime?: string;
  totalProducts: number;
  storeViews: number;
  followers: number;
}

export default function SupplierDirectory() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem('supplierDirectory.viewMode') as "grid" | "list") || "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    businessType: "",
    verificationLevel: "",
    membershipTier: "",
    minRating: "",
    minProducts: 0,
    maxProducts: 1000,
    responseRate: 0,
    isVerified: false,
    hasTradeAssurance: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [followedSuppliers, setFollowedSuppliers] = useState<Set<string>>(new Set());
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('supplierDirectory.sortBy') || "relevance";
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchSuppliers();
    fetchFollowedSuppliers();
    fetchRecentlyViewed();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchSuppliers();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, sortBy]);

  useEffect(() => {
    if (currentPage === 1) {
      fetchSuppliers();
    } else {
      fetchSuppliers(true); // Append to existing results
    }
  }, [currentPage]);

  const fetchSuppliers = async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (filters.country) params.append('country', filters.country);
      if (filters.businessType) params.append('businessType', filters.businessType);
      if (filters.verificationLevel) params.append('verificationLevel', filters.verificationLevel);
      if (filters.membershipTier) params.append('membershipTier', filters.membershipTier);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.minProducts > 0) params.append('minProducts', filters.minProducts.toString());
      if (filters.maxProducts < 1000) params.append('maxProducts', filters.maxProducts.toString());
      if (filters.responseRate > 0) params.append('minResponseRate', filters.responseRate.toString());
      if (filters.isVerified) params.append('verifiedOnly', 'true');
      if (filters.hasTradeAssurance) params.append('tradeAssurance', 'true');
      if (sortBy) params.append('sortBy', sortBy);
      
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/suppliers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      const data = await response.json();
      
      if (append) {
        setSuppliers(prev => [...prev, ...(data.suppliers || [])]);
      } else {
        setSuppliers(data.suppliers || []);
      }
      setTotalCount(data.total || 0);
      
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreSuppliers = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Save user preferences
  useEffect(() => {
    localStorage.setItem('supplierDirectory.viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('supplierDirectory.sortBy', sortBy);
  }, [sortBy]);

  const fetchFollowedSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers/followed', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const followedIds = new Set<string>(data.suppliers.map((s: any) => s.id as string));
        setFollowedSuppliers(followedIds);
      }
    } catch (error) {
      console.error('Error fetching followed suppliers:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const fetchRecentlyViewed = async () => {
    try {
      const recentViewIds = JSON.parse(localStorage.getItem('recentSupplierViews') || '[]');
      if (recentViewIds.length === 0) return;

      const supplierPromises = recentViewIds.slice(0, 5).map((id: string) => 
        fetch(`/api/suppliers/${id}/profile`).then(res => res.ok ? res.json() : null)
      );
      
      const recentSuppliers = (await Promise.all(supplierPromises)).filter(Boolean);
      setRecentlyViewed(recentSuppliers);
    } catch (error) {
      console.error('Error fetching recently viewed suppliers:', error);
    }
  };

  const handleFollow = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }
      
      const data = await response.json();
      const newFollowed = new Set(followedSuppliers);
      
      if (data.following) {
        newFollowed.add(supplierId);
      } else {
        newFollowed.delete(supplierId);
      }
      
      setFollowedSuppliers(newFollowed);
      
      const supplier = suppliers.find(s => s.id === supplierId);
      toast({
        title: data.following ? "Following" : "Unfollowed",
        description: `You are ${data.following ? 'now following' : 'no longer following'} ${supplier?.storeName}.`,
      });
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComparisonToggle = (supplierId: string) => {
    const newComparison = [...comparisonList];
    const index = newComparison.indexOf(supplierId);
    
    if (index > -1) {
      newComparison.splice(index, 1);
    } else {
      if (newComparison.length >= 3) {
        toast({
          title: "Comparison Limit",
          description: "You can compare up to 3 suppliers at a time.",
          variant: "destructive",
        });
        return;
      }
      newComparison.push(supplierId);
    }
    
    setComparisonList(newComparison);
  };

  const removeFromComparison = (supplierId: string) => {
    setComparisonList(prev => prev.filter(id => id !== supplierId));
  };

  const visitStore = (storeSlug: string) => {
    // Track visited supplier for recommendations
    const supplier = suppliers.find(s => s.storeSlug === storeSlug);
    if (supplier) {
      trackSupplierView(supplier.id);
    }
    setLocation(`/stores/${storeSlug}`);
  };

  const trackSupplierView = (supplierId: string) => {
    try {
      const recentViews = JSON.parse(localStorage.getItem('recentSupplierViews') || '[]');
      const updatedViews = [supplierId, ...recentViews.filter((id: string) => id !== supplierId)].slice(0, 10);
      localStorage.setItem('recentSupplierViews', JSON.stringify(updatedViews));
    } catch (error) {
      console.error('Error tracking supplier view:', error);
    }
  };

  const exportSupplierList = () => {
    try {
      const csvContent = [
        ['Store Name', 'Business Name', 'Location', 'Rating', 'Reviews', 'Products', 'Response Rate', 'Verification', 'Membership'].join(','),
        ...suppliers.map(supplier => [
          `"${supplier.storeName}"`,
          `"${supplier.businessName}"`,
          `"${supplier.city}, ${supplier.country}"`,
          supplier.rating,
          supplier.totalReviews,
          supplier.totalProducts,
          `${supplier.responseRate}%`,
          supplier.isVerified ? supplier.verificationLevel : 'Not Verified',
          supplier.membershipTier
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `suppliers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${suppliers.length} suppliers to CSV file.`,
      });
    } catch (error) {
      console.error('Error exporting supplier list:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export supplier list. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderVerificationBadge = (supplier: Supplier) => {
    return (
      <VerificationBadge 
        level={supplier.verificationLevel} 
        isVerified={supplier.isVerified}
        size="sm"
      />
    );
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchQuery || 
      supplier.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.mainProducts?.some(product => 
        product.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCountry = !filters.country || supplier.country === filters.country;
    const matchesBusinessType = !filters.businessType || supplier.businessType === filters.businessType;
    const matchesVerification = !filters.verificationLevel || supplier.verificationLevel === filters.verificationLevel;
    const matchesMembership = !filters.membershipTier || supplier.membershipTier === filters.membershipTier;
    const matchesRating = !filters.minRating || supplier.rating >= parseFloat(filters.minRating);
    
    return matchesSearch && matchesCountry && matchesBusinessType && 
           matchesVerification && matchesMembership && matchesRating;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading suppliers...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Supplier Directory</h1>
            <p className="text-muted-foreground">Discover verified suppliers and manufacturers from around the world</p>
          </div>

          {/* Recommendations */}
          <SupplierRecommendations
            onVisitStore={visitStore}
            onAddToComparison={handleComparisonToggle}
          />

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Recently Viewed
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Suppliers you've visited recently
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {recentlyViewed.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => visitStore(supplier.storeSlug)}>
                      <CardContent className="p-3">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 bg-muted rounded-lg p-2 mb-2">
                            {supplier.storeLogo ? (
                              <img 
                                src={supplier.storeLogo} 
                                alt="Store Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Store className="w-full h-full text-muted-foreground" />
                            )}
                          </div>
                          <h4 className="font-medium text-sm truncate w-full">{supplier.storeName}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{supplier.rating}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Basic Controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search suppliers, products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <AdvancedSupplierFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    isOpen={showAdvancedFilters}
                    onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  />
                  
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2">Quick filters:</span>
                <Button
                  variant={filters.isVerified ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Only
                </Button>
                <Button
                  variant={filters.hasTradeAssurance ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, hasTradeAssurance: !prev.hasTradeAssurance }))}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Trade Assurance
                </Button>
                <Button
                  variant={filters.minRating === "4.0" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    minRating: prev.minRating === "4.0" ? "" : "4.0" 
                  }))}
                >
                  <Star className="w-3 h-3 mr-1" />
                  4+ Stars
                </Button>
                <Button
                  variant={filters.responseRate >= 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    responseRate: prev.responseRate >= 90 ? 0 : 90 
                  }))}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Fast Response
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mb-6">
              <AdvancedSupplierFilters
                filters={filters}
                onFiltersChange={setFilters}
                isOpen={true}
                onToggle={() => setShowAdvancedFilters(false)}
              />
            </div>
          )}

          {/* Comparison Bar */}
          {comparisonList.length > 0 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GitCompare className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {comparisonList.length} supplier{comparisonList.length !== 1 ? 's' : ''} selected for comparison
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setComparisonList([])}
                    >
                      Clear All
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setShowComparison(true)}
                      disabled={comparisonList.length < 2}
                    >
                      Compare ({comparisonList.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {totalCount} suppliers found
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportSupplierList}
                disabled={suppliers.length === 0}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Export List
              </Button>
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="products">Most Products</SelectItem>
                  <SelectItem value="followers">Most Followed</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="response_rate">Best Response Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suppliers Grid/List */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {viewMode === "grid" ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex flex-col items-center gap-2">
                          <Checkbox
                            checked={comparisonList.includes(supplier.id)}
                            onCheckedChange={() => handleComparisonToggle(supplier.id)}
                            className="mt-1"
                          />
                          <div className="w-16 h-16 bg-muted rounded-lg p-2 flex-shrink-0">
                            {supplier.storeLogo ? (
                              <img 
                                src={supplier.storeLogo} 
                                alt="Store Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Store className="w-full h-full text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">{supplier.storeName}</h3>
                          <p className="text-sm text-muted-foreground mb-2 truncate">{supplier.businessName}</p>
                          <div className="flex items-center gap-2 mb-2">
                            {renderVerificationBadge(supplier)}
                            <Badge variant="outline" className="text-xs">
                              {supplier.membershipTier.charAt(0).toUpperCase() + supplier.membershipTier.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {supplier.storeDescription}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{supplier.city}, {supplier.country}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{supplier.rating}</span>
                            <span className="text-muted-foreground">({supplier.totalReviews})</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Products:</span>
                          <span>{supplier.totalProducts}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Response Rate:</span>
                          <span className="text-green-600">{supplier.responseRate}%</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {supplier.mainProducts?.slice(0, 3).map((product, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                        {supplier.mainProducts && supplier.mainProducts.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{supplier.mainProducts.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => visitStore(supplier.storeSlug)}
                        >
                          <Store className="w-4 h-4 mr-2" />
                          Visit Store
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollow(supplier.id)}
                        >
                          <Heart className={`w-4 h-4 ${followedSuppliers.has(supplier.id) ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <Checkbox
                            checked={comparisonList.includes(supplier.id)}
                            onCheckedChange={() => handleComparisonToggle(supplier.id)}
                          />
                          <div className="w-20 h-20 bg-muted rounded-lg p-2 flex-shrink-0">
                            {supplier.storeLogo ? (
                              <img 
                                src={supplier.storeLogo} 
                                alt="Store Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Store className="w-full h-full text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{supplier.storeName}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{supplier.businessName}</p>
                              <div className="flex items-center gap-2">
                                {renderVerificationBadge(supplier)}
                                <Badge variant="outline" className="text-xs">
                                  {supplier.membershipTier.charAt(0).toUpperCase() + supplier.membershipTier.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => visitStore(supplier.storeSlug)}>
                                <Store className="w-4 h-4 mr-2" />
                                Visit Store
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleFollow(supplier.id)}
                              >
                                <Heart className={`w-4 h-4 mr-2 ${followedSuppliers.has(supplier.id) ? 'fill-current text-red-500' : ''}`} />
                                {followedSuppliers.has(supplier.id) ? 'Following' : 'Follow'}
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {supplier.storeDescription}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <div>{supplier.city}, {supplier.country}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rating:</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{supplier.rating} ({supplier.totalReviews})</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Products:</span>
                              <div>{supplier.totalProducts}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Response Rate:</span>
                              <div className="text-green-600">{supplier.responseRate}%</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {supplier.mainProducts?.slice(0, 5).map((product, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                            {supplier.mainProducts && supplier.mainProducts.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{supplier.mainProducts.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
            </div>
          )}

          {/* Load More */}
          {suppliers.length < totalCount && (
            <div className="text-center mt-8">
              <div className="text-sm text-muted-foreground mb-4">
                Showing {suppliers.length} of {totalCount} suppliers
              </div>
              <Button 
                onClick={loadMoreSuppliers}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Loading more...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Load More Suppliers
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Supplier Comparison Modal */}
      <SupplierComparison
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        supplierIds={comparisonList}
        onRemoveSupplier={removeFromComparison}
        onVisitStore={visitStore}
      />
    </div>
  );
}