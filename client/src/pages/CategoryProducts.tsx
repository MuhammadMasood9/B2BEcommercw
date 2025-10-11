import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";

export default function CategoryProducts() {
  const { setLoading } = useLoading();
  const [, params] = useRoute("/category/:slug");
  const categorySlug = params?.slug || "electronics";
  const [searchQuery, setSearchQuery] = useState("");

  const categoryNames: Record<string, string> = {
    electronics: "Electronics & Electrical",
    apparel: "Fashion & Apparel", 
    machinery: "Machinery & Equipment",
    automotive: "Automotive & Transportation",
    home: "Home & Garden",
    lighting: "Lights & Lighting",
    packaging: "Packaging & Printing",
    construction: "Construction & Real Estate",
    health: "Health & Medical",
    food: "Food & Beverage",
    baby: "Toys & Baby Products",
    sports: "Sports & Entertainment",
    office: "Office & School Supplies",
    beauty: "Beauty & Personal Care",
    energy: "Energy & Minerals",
    industrial: "Industrial Supplies"
  };

  useEffect(() => {
    setLoading(true, `Loading ${categoryNames[categorySlug] || categorySlug} products...`);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [categorySlug]);

  const products = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      name: "Premium Wireless Headphones",
      priceRange: "$25.00-$35.00 /piece",
      moq: "100 pieces",
      supplierName: "AudioTech Pro",
      supplierCountry: "China",
      responseRate: "98%",
      verified: true,
      tradeAssurance: true,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
      name: "Smart Fitness Tracker Watch",
      priceRange: "$30.00-$45.00 /piece",
      moq: "150 pieces",
      supplierName: "TechHealth Ltd",
      supplierCountry: "China",
      responseRate: "96%",
      verified: true,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      name: "Designer Sunglasses UV Protection",
      priceRange: "$8.00-$12.00 /piece",
      moq: "500 pieces",
      supplierName: "Vision Plus",
      supplierCountry: "Taiwan",
      responseRate: "92%",
      tradeAssurance: true,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
      name: "Casual Canvas Sneakers",
      priceRange: "$12.00-$18.00 /pair",
      moq: "300 pairs",
      supplierName: "FootWear Global",
      supplierCountry: "Vietnam",
      responseRate: "97%",
      verified: true,
      tradeAssurance: true,
    },
    {
      id: "5",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
      name: "Smart Fitness Tracker Watch",
      priceRange: "$30.00-$45.00 /piece",
      moq: "150 pieces",
      supplierName: "TechHealth Ltd",
      supplierCountry: "China",
      responseRate: "96%",
      verified: true,
    },
    {
      id: "6",
      image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
      name: "Leather Laptop Bag Professional",
      priceRange: "$35.00-$50.00 /piece",
      moq: "100 pieces",
      supplierName: "Leather Crafts Co",
      supplierCountry: "India",
      responseRate: "94%",
      verified: true,
      tradeAssurance: true,
    },
  ];

  const FilterSidebar = () => (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Subcategories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Mobile Phones", "Laptops", "Tablets", "Accessories", "Smart Devices"].map((sub) => (
            <div key={sub} className="flex flex-wrap items-center gap-3">
              <Checkbox id={sub} data-testid={`checkbox-${sub.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={sub} className="text-sm cursor-pointer flex-1">{sub}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supplier Type</CardTitle>
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

      <Card>
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <PageHeader
          title={categoryNames[categorySlug] || "Products"}
          subtitle="Discover quality products from verified suppliers"
          breadcrumbs={[
            { label: "Categories", href: "/categories" },
            { label: categoryNames[categorySlug] || "Products" }
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
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        type="search"
                        placeholder="Search in this category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-category"
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
