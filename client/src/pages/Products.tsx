import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Search, X } from "lucide-react";

export default function Products() {
  const { setLoading } = useLoading();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true, "Loading Products...");
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      name: "Classic Analog Wristwatch",
      priceRange: "$15.00-$22.00 /piece",
      moq: "200 pieces",
      supplierName: "TimeKeeper Industries",
      supplierCountry: "Hong Kong",
      responseRate: "95%",
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
    {
      id: "7",
      image: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400&h=400&fit=crop",
      name: "Stainless Steel Water Bottle",
      priceRange: "$5.00-$8.00 /piece",
      moq: "1000 pieces",
      supplierName: "EcoBottle Mfg",
      supplierCountry: "China",
      responseRate: "99%",
      verified: true,
    },
    {
      id: "8",
      image: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop",
      name: "Wireless Gaming Mouse RGB",
      priceRange: "$18.00-$28.00 /piece",
      moq: "200 pieces",
      supplierName: "GameGear Pro",
      supplierCountry: "Taiwan",
      responseRate: "97%",
      verified: true,
      tradeAssurance: true,
    },
  ];

  const FilterSidebar = () => (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Electronics", "Fashion", "Machinery", "Automotive", "Home & Garden"].map((cat) => (
            <div key={cat} className="flex flex-wrap items-center gap-3">
              <Checkbox id={`cat-${cat}`} data-testid={`checkbox-category-${cat.toLowerCase()}`} />
              <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer flex-1">{cat}</Label>
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
              <Checkbox id={`type-${type}`} data-testid={`checkbox-type-${type.toLowerCase()}`} />
              <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer flex-1">{type}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            step={10}
            data-testid="slider-price-range"
          />
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">MOQ Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["1-99", "100-499", "500-999", "1000+"].map((range) => (
            <div key={range} className="flex flex-wrap items-center gap-3">
              <Checkbox id={`moq-${range}`} data-testid={`checkbox-moq-${range}`} />
              <Label htmlFor={`moq-${range}`} className="text-sm cursor-pointer flex-1">{range} pieces</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supplier Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="verified" data-testid="checkbox-verified" />
            <Label htmlFor="verified" className="text-sm cursor-pointer flex-1">Verified Suppliers</Label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="trade-assurance" data-testid="checkbox-trade-assurance" />
            <Label htmlFor="trade-assurance" className="text-sm cursor-pointer flex-1">Trade Assurance</Label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="ready-ship" data-testid="checkbox-ready-ship" />
            <Label htmlFor="ready-ship" className="text-sm cursor-pointer flex-1">Ready to Ship</Label>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" data-testid="button-clear-filters">
        <X className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
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
                        Showing <span className="font-semibold text-foreground">{products.length}</span> products
                      </p>
                    </div>
                    
                    <Select defaultValue="best-match">
                      <SelectTrigger className="w-48" data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best-match">Best Match</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="moq">Minimum Order</SelectItem>
                        <SelectItem value="rating">Supplier Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
