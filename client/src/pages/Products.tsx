import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoading } from "@/contexts/LoadingContext";
import type { Product, Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Search, X, Loader2 } from "lucide-react";

export default function Products() {
  const { setLoading } = useLoading();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [moqRange, setMoqRange] = useState([0, 10000]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [supplierType, setSupplierType] = useState("all");
  const [supplierLocation, setSupplierLocation] = useState("all");
  const [sortBy, setSortBy] = useState("best-match");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  // B2B specific filters
  const [verifiedSuppliersOnly, setVerifiedSuppliersOnly] = useState(false);
  const [tradeAssuranceOnly, setTradeAssuranceOnly] = useState(false);
  const [readyToShipOnly, setReadyToShipOnly] = useState(false);
  const [sampleAvailable, setSampleAvailable] = useState(false);
  const [customizationAvailable, setCustomizationAvailable] = useState(false);
  const [certifications, setCertifications] = useState<string[]>([]);

  // Fetch products from API
  const { data: apiProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched products from API:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  // Fetch categories from API
  const { data: apiCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (isProductsLoading) {
      setLoading(true, "Loading Products...");
    } else {
      setLoading(false);
    }
  }, [isProductsLoading, setLoading]);

  // Transform API categories into the format needed for filters
  const parentCategories = apiCategories.filter(cat => !cat.parentId && cat.isActive);
  
  const categories = parentCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    subcategories: apiCategories
      .filter(sub => sub.parentId === cat.id && sub.isActive)
      .map(sub => ({ id: sub.id, name: sub.name }))
  }));

  const supplierTypes = [
    { id: "manufacturer", name: "Manufacturer" },
    { id: "trading-company", name: "Trading Company" },
    { id: "wholesaler", name: "Wholesaler" },
    { id: "distributor", name: "Distributor" }
  ];

  const supplierLocations = [
    { id: "china", name: "China" },
    { id: "india", name: "India" },
    { id: "vietnam", name: "Vietnam" },
    { id: "thailand", name: "Thailand" },
    { id: "indonesia", name: "Indonesia" },
    { id: "philippines", name: "Philippines" },
    { id: "malaysia", name: "Malaysia" },
    { id: "taiwan", name: "Taiwan" },
    { id: "hong-kong", name: "Hong Kong" },
    { id: "south-korea", name: "South Korea" }
  ];

  const certificationOptions = [
    { id: "iso9001", name: "ISO 9001" },
    { id: "iso14001", name: "ISO 14001" },
    { id: "ce", name: "CE" },
    { id: "fda", name: "FDA" },
    { id: "rohs", name: "RoHS" },
    { id: "ul", name: "UL" },
    { id: "fcc", name: "FCC" },
    { id: "gs", name: "GS" }
  ];

  // Get subcategories for selected category
  const currentSubcategories = selectedCategory !== "all" 
    ? categories.find(c => c.id === selectedCategory)?.subcategories || []
    : [];

  // Clear subcategory when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setSelectedSubcategory("all");
    }
  }, [selectedCategory]);

  // Transform API products for display
  const products = apiProducts.map(product => {
    // Parse price ranges from product data
    const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const priceRange = priceRanges.length > 0 
      ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece`
      : 'Contact for price';

    // Get images
    const images = product.images && product.images.length > 0 ? product.images : [];
    const firstImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';

    // Get certifications
    const certs = product.certifications || [];

    return {
      id: product.id,
      image: firstImage,
      name: product.name,
      priceRange,
      moq: product.minOrderQuantity || 1,
      supplierName: 'Admin Supplier', // Admin is the supplier
      supplierCountry: 'Global',
      supplierType: 'manufacturer',
      responseRate: '95%',
      responseTime: '24 hours',
      verified: true,
      tradeAssurance: product.hasTradeAssurance || false,
      readyToShip: product.isPublished || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: certs,
      category: product.categoryId || '',
      subcategory: product.categoryId || '',
      leadTime: product.leadTime || '15-30 days',
      port: product.port || 'N/A',
      paymentTerms: product.paymentTerms || [],
      inStock: product.inStock || false,
      stockQuantity: product.stockQuantity || 0,
      views: product.views || 0,
      inquiries: product.inquiries || 0,
      rating: 4.5,
      reviews: 0
    };
  });

  // Filter products based on current filters
  const filteredProducts = products.filter(product => {
    // Search query filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategory !== "all" && product.category !== selectedCategory) {
      return false;
    }

    // Subcategory filter
    if (selectedSubcategory !== "all" && product.subcategory !== selectedSubcategory) {
      return false;
    }

    // Supplier type filter
    if (supplierType !== "all" && product.supplierType !== supplierType) {
      return false;
    }

    // Supplier location filter
    if (supplierLocation !== "all" && product.supplierCountry.toLowerCase() !== supplierLocation) {
      return false;
    }

    // Price range filter
    const minPrice = priceRange[0];
    const maxPrice = priceRange[1];
    const productMinPrice = parseFloat(product.priceRange.split('-')[0].replace('$', ''));
    const productMaxPrice = parseFloat(product.priceRange.split('-')[1].split(' ')[0].replace('$', ''));
    
    if (productMinPrice < minPrice || productMaxPrice > maxPrice) {
      return false;
    }

    // MOQ range filter
    if (product.moq < moqRange[0] || product.moq > moqRange[1]) {
      return false;
    }

    // B2B specific filters
    if (verifiedSuppliersOnly && !product.verified) {
      return false;
    }

    if (tradeAssuranceOnly && !product.tradeAssurance) {
      return false;
    }

    if (readyToShipOnly && !product.readyToShip) {
      return false;
    }

    if (sampleAvailable && !product.sampleAvailable) {
      return false;
    }

    if (customizationAvailable && !product.customizationAvailable) {
      return false;
    }

    // Certifications filter
    if (certifications.length > 0) {
      const hasRequiredCert = certifications.some(cert => 
        product.certifications.includes(cert)
      );
      if (!hasRequiredCert) {
        return false;
      }
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low-high":
        const aMinPrice = parseFloat(a.priceRange.split('-')[0].replace('$', ''));
        const bMinPrice = parseFloat(b.priceRange.split('-')[0].replace('$', ''));
        return aMinPrice - bMinPrice;
      case "price-high-low":
        const aMaxPrice = parseFloat(a.priceRange.split('-')[1].split(' ')[0].replace('$', ''));
        const bMaxPrice = parseFloat(b.priceRange.split('-')[1].split(' ')[0].replace('$', ''));
        return bMaxPrice - aMaxPrice;
      case "moq-low-high":
        return a.moq - b.moq;
      case "rating-high-low":
        return b.rating - a.rating;
      case "views-high-low":
        return b.views - a.views;
      case "inquiries-high-low":
        return b.inquiries - a.inquiries;
      default: // best-match
        return 0;
    }
  });

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSupplierType("all");
    setSupplierLocation("all");
    setPriceRange([0, 1000]);
    setMoqRange([0, 10000]);
    setVerifiedSuppliersOnly(false);
    setTradeAssuranceOnly(false);
    setReadyToShipOnly(false);
    setSampleAvailable(false);
    setCustomizationAvailable(false);
    setCertifications([]);
  };

  // Get active filter count
  const activeFilterCount = [
    searchQuery,
    selectedCategory !== "all",
    selectedSubcategory !== "all",
    supplierType !== "all",
    supplierLocation !== "all",
    priceRange[0] > 0 || priceRange[1] < 1000,
    moqRange[0] > 0 || moqRange[1] < 10000,
    verifiedSuppliersOnly,
    tradeAssuranceOnly,
    readyToShipOnly,
    sampleAvailable,
    customizationAvailable,
    certifications.length > 0
  ].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-5">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Search Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {currentSubcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {currentSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Supplier Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supplier Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={supplierType} onValueChange={setSupplierType}>
            <SelectTrigger>
              <SelectValue placeholder="All Supplier Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Supplier Types</SelectItem>
              {supplierTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Supplier Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supplier Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={supplierLocation} onValueChange={setSupplierLocation}>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {supplierLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Price Range (USD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">${priceRange[0]} - ${priceRange[1]}</Label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            step={10}
              className="w-full"
          />
          </div>
        </CardContent>
      </Card>

      {/* MOQ Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Minimum Order Quantity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">{moqRange[0]} - {moqRange[1]} pieces</Label>
            <Slider
              value={moqRange}
              onValueChange={setMoqRange}
              max={10000}
              step={100}
              className="w-full"
            />
            </div>
        </CardContent>
      </Card>

      {/* B2B Specific Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">B2B Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="verified-suppliers" 
              checked={verifiedSuppliersOnly}
              onCheckedChange={(checked) => setVerifiedSuppliersOnly(checked === true)}
            />
            <Label htmlFor="verified-suppliers" className="text-sm cursor-pointer">
              Verified Suppliers Only
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="trade-assurance" 
              checked={tradeAssuranceOnly}
              onCheckedChange={(checked) => setTradeAssuranceOnly(checked === true)}
            />
            <Label htmlFor="trade-assurance" className="text-sm cursor-pointer">
              Trade Assurance
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ready-to-ship" 
              checked={readyToShipOnly}
              onCheckedChange={(checked) => setReadyToShipOnly(checked === true)}
            />
            <Label htmlFor="ready-to-ship" className="text-sm cursor-pointer">
              Ready to Ship
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sample-available" 
              checked={sampleAvailable}
              onCheckedChange={(checked) => setSampleAvailable(checked === true)}
            />
            <Label htmlFor="sample-available" className="text-sm cursor-pointer">
              Sample Available
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="customization" 
              checked={customizationAvailable}
              onCheckedChange={(checked) => setCustomizationAvailable(checked === true)}
            />
            <Label htmlFor="customization" className="text-sm cursor-pointer">
              Customization Available
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {certificationOptions.map((cert) => (
            <div key={cert.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`cert-${cert.id}`}
                checked={certifications.includes(cert.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setCertifications([...certifications, cert.id]);
                  } else {
                    setCertifications(certifications.filter(c => c !== cert.id));
                  }
                }}
              />
              <Label htmlFor={`cert-${cert.id}`} className="text-sm cursor-pointer">
                {cert.name}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearAllFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFilterCount})
      </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <PageHeader
          title="All Products"
          subtitle="Discover quality products from verified global suppliers"
          variant="gradient"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-filters">
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                          <div className="py-6">
                            <FilterSidebar />
                          </div>
                        </SheetContent>
                      </Sheet>
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> of <span className="font-semibold text-foreground">{products.length}</span> products
                        {activeFilterCount > 0 && (
                          <span className="ml-2 text-blue-600">
                            ({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied)
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48" data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best-match">Best Match</SelectItem>
                          <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                          <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                          <SelectItem value="moq-low-high">MOQ: Low to High</SelectItem>
                          <SelectItem value="rating-high-low">Rating: High to Low</SelectItem>
                          <SelectItem value="views-high-low">Most Viewed</SelectItem>
                          <SelectItem value="inquiries-high-low">Most Inquired</SelectItem>
                      </SelectContent>
                    </Select>
                      
                      <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="h-8 w-8 p-0"
                        >
                          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                            <div className="bg-current rounded-sm"></div>
                          </div>
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                          className="h-8 w-8 p-0"
                        >
                          <div className="w-4 h-4 flex flex-col gap-0.5">
                            <div className="bg-current rounded-sm h-1"></div>
                            <div className="bg-current rounded-sm h-1"></div>
                            <div className="bg-current rounded-sm h-1"></div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isProductsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-lg text-muted-foreground">Loading products...</span>
                </div>
              ) : sortedProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      {products.length === 0 ? "No Products Available" : "No products found"}
                    </h3>
                    <p className="text-muted-foreground">
                      {products.length === 0 
                        ? "Products will appear here once they are added by the administrator."
                        : "Try adjusting your search criteria or filters to find what you're looking for."}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button variant="outline" onClick={clearAllFilters}>
                        <X className="w-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className={`grid gap-5 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-1"
                }`}>
                  {sortedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
              )}

              {/* Pagination */}
              <div className="mt-10 flex justify-center">
                <div className="inline-flex gap-1 p-1 bg-card rounded-lg border">
                  <Button variant="ghost" size="sm" data-testid="button-prev-page">Previous</Button>
                  <Button variant="default" size="sm" data-testid="button-page-1">1</Button>
                  <Button variant="ghost" size="sm" data-testid="button-page-2">2</Button>
                  <Button variant="ghost" size="sm" data-testid="button-page-3">3</Button>
                  <Button variant="ghost" size="sm" data-testid="button-next-page">Next</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
