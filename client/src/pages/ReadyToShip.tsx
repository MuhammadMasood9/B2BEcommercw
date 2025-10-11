import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Truck, Clock, Shield, Package, TrendingUp } from "lucide-react";

export default function ReadyToShip() {
  const [sortBy, setSortBy] = useState("best-match");

  const products = [
    {
      id: "rts1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      name: "Premium Wireless Headphones",
      priceRange: "$25.00-$35.00 /piece",
      moq: "50 pieces",
      supplierName: "AudioTech Pro",
      supplierCountry: "China",
      responseRate: "98%",
      verified: true,
      tradeAssurance: true,
      readyToShip: true,
      shippingTime: "3-7 days"
    },
    {
      id: "rts2",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      name: "Classic Analog Wristwatch",
      priceRange: "$12.00-$18.00 /piece",
      moq: "100 pieces",
      supplierName: "TimeKeeper Co.",
      supplierCountry: "Hong Kong",
      responseRate: "95%",
      verified: true,
      readyToShip: true,
      shippingTime: "5-10 days"
    },
    {
      id: "rts3",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      name: "Designer Sunglasses UV Protection",
      priceRange: "$8.00-$12.00 /piece",
      moq: "200 pieces",
      supplierName: "Vision Plus",
      supplierCountry: "China",
      responseRate: "92%",
      verified: true,
      readyToShip: true,
      shippingTime: "4-8 days"
    },
    {
      id: "rts4",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
      name: "Casual Sneakers Comfortable",
      priceRange: "$15.00-$22.00 /piece",
      moq: "100 pieces",
      supplierName: "Global Footwear",
      supplierCountry: "Vietnam",
      responseRate: "96%",
      verified: true,
      readyToShip: true,
      shippingTime: "6-12 days"
    },
    {
      id: "rts5",
      image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
      name: "Stainless Steel Water Bottle",
      priceRange: "$5.00-$8.00 /piece",
      moq: "500 pieces",
      supplierName: "EcoWare Industries",
      supplierCountry: "China",
      responseRate: "99%",
      verified: true,
      tradeAssurance: true,
      readyToShip: true,
      shippingTime: "3-5 days"
    },
    {
      id: "rts6",
      image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
      name: "Portable Bluetooth Speaker",
      priceRange: "$18.00-$28.00 /piece",
      moq: "100 pieces",
      supplierName: "Sound Systems Ltd",
      supplierCountry: "China",
      responseRate: "97%",
      verified: true,
      readyToShip: true,
      shippingTime: "4-9 days"
    },
  ];

  const features = [
    {
      icon: Clock,
      title: "Quick Delivery",
      description: "Ships in 3-15 days",
      color: "from-gray-500 to-gray-600"
    },
    {
      icon: Package,
      title: "Lower MOQ",
      description: "Smaller minimum orders",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Trade Assurance",
      description: "Secure transactions",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "In-Stock Items",
      description: "Ready for immediate dispatch",
      color: "from-red-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <PageHeader
          title="Ready to Ship"
          subtitle="Fast delivery on in-stock products with lower MOQ"
          variant="gradient"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const featureId = feature.title.toLowerCase().replace(/\s+/g, '-');
              return (
                <Card key={index} className="overflow-hidden hover-elevate transition-all duration-300" data-testid={`card-feature-${featureId}`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1" data-testid={`text-feature-title-${featureId}`}>{feature.title}</h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-feature-desc-${featureId}`}>{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search and Sort */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Search ready to ship products..."
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-64" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-match">Best Match</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="moq-low">MOQ: Low to High</SelectItem>
                    <SelectItem value="shipping-fast">Fastest Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Category Badges */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover-elevate px-4 py-1.5" data-testid="badge-category-electronics">Electronics</Badge>
              <Badge variant="outline" className="cursor-pointer hover-elevate px-4 py-1.5" data-testid="badge-category-fashion">Fashion</Badge>
              <Badge variant="outline" className="cursor-pointer hover-elevate px-4 py-1.5" data-testid="badge-category-home">Home & Garden</Badge>
              <Badge variant="outline" className="cursor-pointer hover-elevate px-4 py-1.5" data-testid="badge-category-sports">Sports</Badge>
              <Badge variant="outline" className="cursor-pointer hover-elevate px-4 py-1.5" data-testid="badge-category-beauty">Beauty</Badge>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{products.length.toLocaleString()}</span> products ready to ship
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <Badge className="absolute top-2 left-2 z-10 bg-green-500 hover:bg-green-600 gap-1.5 shadow-md">
                  <Truck className="w-3 h-3" />
                  {product.shippingTime}
                </Badge>
                <ProductCard {...product} />
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" data-testid="button-load-more">
              Load More Products
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
