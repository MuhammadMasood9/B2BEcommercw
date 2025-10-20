import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Search, X, Loader2, Package as PackageIcon } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import type { Product, Category } from "@shared/schema";

export default function SubcategoryProducts() {
  const { setLoading } = useLoading();
  const [, params] = useRoute("/subcategory/:slug");
  const subcategorySlug = params?.slug || "";
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories to get the subcategory by slug
  const { data: categories = [] } = useQuery<Category[]>({
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

  // Find the subcategory by slug
  const currentSubcategory = categories.find(cat => cat.slug === subcategorySlug);
  const subcategoryId = currentSubcategory?.id;
  const subcategoryName = currentSubcategory?.name || subcategorySlug;

  // Find parent category
  const parentCategory = categories.find(cat => cat.id === currentSubcategory?.parentId);

  // Fetch products for this subcategory
  const { data: apiProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", subcategoryId],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter products by subcategory
        const filtered = Array.isArray(data) 
          ? data.filter((p: Product) => p.categoryId === subcategoryId)
          : [];
        console.log("Filtered products for subcategory:", filtered);
        return filtered;
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    enabled: !!subcategoryId, // Only run query if we have a subcategoryId
  });

  useEffect(() => {
    if (isProductsLoading) {
      setLoading(true, `Loading ${subcategoryName} products...`);
    } else {
      setLoading(false);
    }
  }, [isProductsLoading, subcategoryName, setLoading]);

  // Transform API products for display
  const products = apiProducts.map(product => {
    // Parse price ranges from product data
    let priceRanges = [];
    if (product.priceRanges) {
      try {
        priceRanges = typeof product.priceRanges === 'string' 
          ? JSON.parse(product.priceRanges) 
          : product.priceRanges;
      } catch (error) {
        console.error('Error parsing priceRanges:', error);
        priceRanges = [];
      }
    }
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => r.pricePerUnit)) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => r.pricePerUnit)) : 0;
    const priceRange = priceRanges.length > 0 
      ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece`
      : 'Contact for price';

    // Get images
    let images = [];
    if (product.images) {
      try {
        images = Array.isArray(product.images) 
          ? product.images 
          : (typeof product.images === 'string' ? JSON.parse(product.images) : []);
      } catch (error) {
        console.error('Error parsing images:', error);
        images = [];
      }
    }
    const firstImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';

    return {
      id: product.id,
      image: firstImage,
      name: product.name,
      priceRange,
      moq: product.minOrderQuantity || 1,
      supplierName: 'Admin Supplier',
      supplierCountry: 'Unknown',
      responseRate: '95%',
      verified: true,
      tradeAssurance: false,
    };
  });

  const FilterSidebar = () => (
    <div className="space-y-5">
      <Card className="bg-white border-gray-100 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Under $10", "$10 - $50", "$50 - $100", "$100 - $500", "Over $500"].map((range) => (
            <div key={range} className="flex flex-wrap items-center gap-3">
              <Checkbox id={range} data-testid={`checkbox-${range.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={range} className="text-sm cursor-pointer flex-1">{range}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Admin Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Manufacturer", "Trading Company", "Wholesaler"].map((type) => (
            <div key={type} className="flex flex-wrap items-center gap-3">
              <Checkbox id={type} data-testid={`checkbox-${type.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={type} className="text-sm cursor-pointer flex-1">{type}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["ISO 9001", "CE", "RoHS", "FDA"].map((cert) => (
            <div key={cert} className="flex flex-wrap items-center gap-3">
              <Checkbox id={cert} data-testid={`checkbox-${cert.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={cert} className="text-sm cursor-pointer flex-1">{cert}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" data-testid="button-clear-filters">
        <X className="w-4 h-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <main className="flex-1">
        <PageHeader
          title={subcategoryName || "Subcategory Products"}
          subtitle={`Products in ${subcategoryName}`}
          breadcrumbs={[
            { label: "Categories", href: "/categories" },
            { label: parentCategory?.name || "Category", href: `/category/${parentCategory?.slug}` },
            { label: subcategoryName || "Subcategory" }
          ]}
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
              <Card className="mb-6 bg-white border-gray-100 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        type="search"
                        placeholder="Search in this subcategory..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-subcategory"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Select defaultValue="relevant" data-testid="select-sort">
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevant">Most Relevant</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="moq">Minimum Order</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="lg:hidden" data-testid="button-filters">
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            Filters
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                          <div className="py-6">
                            <FilterSidebar />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-5">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{products.length}</span> products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

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
