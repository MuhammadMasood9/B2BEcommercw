import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
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
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function FindSuppliers() {
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(true);

  const suppliers = [
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
      responseRate: "92%",
      responseTime: "< 4h",
    },
    {
      id: "s3",
      name: "Precision Machinery Corp.",
      logo: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=200&fit=crop",
      location: "Germany",
      type: "Manufacturer",
      verified: true,
      goldSupplier: true,
      tradeAssurance: true,
      mainProducts: ["Industrial Machinery", "CNC Machines", "Tools"],
      yearsInBusiness: 25,
      rating: 4.9,
      responseRate: "98%",
      responseTime: "< 1h",
    },
    {
      id: "s4",
      name: "EcoPackaging Solutions",
      logo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop",
      location: "Vietnam",
      type: "Manufacturer",
      verified: true,
      goldSupplier: false,
      tradeAssurance: false,
      mainProducts: ["Packaging", "Paper Products", "Eco Materials"],
      yearsInBusiness: 6,
      rating: 4.5,
      responseRate: "89%",
      responseTime: "< 6h",
    },
  ];

  const FilterSidebar = () => (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Supplier Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Manufacturer", "Trading Company", "Wholesaler", "Distributor"].map((type) => (
            <div key={type} className="flex flex-wrap items-center gap-3">
              <Checkbox id={`type-${type}`} data-testid={`checkbox-${type.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer flex-1">{type}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <Select>
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="china">China</SelectItem>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="usa">United States</SelectItem>
              <SelectItem value="germany">Germany</SelectItem>
              <SelectItem value="vietnam">Vietnam</SelectItem>
              <SelectItem value="bangladesh">Bangladesh</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="verified" data-testid="checkbox-verified" />
            <Label htmlFor="verified" className="text-sm cursor-pointer flex-1">Verified Suppliers</Label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="gold" data-testid="checkbox-gold" />
            <Label htmlFor="gold" className="text-sm cursor-pointer flex-1">Gold Suppliers</Label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox id="trade-assurance" data-testid="checkbox-trade-assurance" />
            <Label htmlFor="trade-assurance" className="text-sm cursor-pointer flex-1">Trade Assurance</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Years in Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["1-3 years", "3-5 years", "5-10 years", "10+ years"].map((range) => (
            <div key={range} className="flex flex-wrap items-center gap-3">
              <Checkbox id={`years-${range}`} data-testid={`checkbox-years-${range.split(' ')[0]}`} />
              <Label htmlFor={`years-${range}`} className="text-sm cursor-pointer flex-1">{range}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Response Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["90%+", "80%+", "70%+"].map((rate) => (
            <div key={rate} className="flex flex-wrap items-center gap-3">
              <Checkbox id={`rate-${rate}`} data-testid={`checkbox-rate-${rate}`} />
              <Label htmlFor={`rate-${rate}`} className="text-sm cursor-pointer flex-1">{rate}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" data-testid="button-reset-filters">
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
          title="Find Suppliers"
          subtitle="Discover verified manufacturers and trading companies worldwide"
          variant="gradient"
          children={
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-4xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search suppliers..."
                  className="pl-9 sm:pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/30 h-10 sm:h-12 text-sm sm:text-base"
                  data-testid="input-search-suppliers"
                />
              </div>
              <Button size="lg" variant="secondary" className="h-10 sm:h-12 text-sm sm:text-base" data-testid="button-search">Search</Button>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex gap-4 sm:gap-6">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <Card className="mb-4 sm:mb-6">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="lg:hidden h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-toggle-filters">
                            <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Filters
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                          <div className="py-6">
                            <FilterSidebar />
                          </div>
                        </SheetContent>
                      </Sheet>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{suppliers.length.toLocaleString()}</span> suppliers found
                      </p>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36 sm:w-48 text-xs sm:text-sm h-8 sm:h-10" data-testid="select-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="response">Best Response Rate</SelectItem>
                        <SelectItem value="years">Years in Business</SelectItem>
                        <SelectItem value="products">Most Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {suppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} {...supplier} />
                ))}
              </div>

              <div className="mt-8 sm:mt-12 text-center">
                <Button size="lg" variant="outline" className="text-xs sm:text-sm" data-testid="button-load-more">
                  Load More Suppliers
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
