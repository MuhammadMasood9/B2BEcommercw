import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Search, ShoppingCart, MessageSquare, Building2, Star, Trash2 } from "lucide-react";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");

  const favoriteProducts = [
    {
      id: 1,
      name: "Industrial Metal Parts",
      supplier: "Shanghai Manufacturing Co.",
      price: "$2.50 - $4.00",
      moq: "100 pieces",
      rating: 4.8,
      image: "/placeholder.svg",
      verified: true
    },
    {
      id: 2,
      name: "Electronic Components",
      supplier: "Shenzhen Electronics Ltd.",
      price: "$0.89 - $1.50",
      moq: "500 pieces",
      rating: 4.9,
      image: "/placeholder.svg",
      verified: true
    },
  ];

  const favoriteSuppliers = [
    {
      id: 1,
      name: "Shanghai Manufacturing Co.",
      products: 1250,
      responseRate: "98%",
      location: "Shanghai, China",
      verified: true,
      logo: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Guangzhou Trading Ltd.",
      products: 856,
      responseRate: "95%",
      location: "Guangzhou, China",
      verified: true,
      logo: "/placeholder.svg"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="gradient-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
            <p className="text-gray-200">Products and suppliers you've saved</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-favorites"
              />
            </div>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800">
              <TabsTrigger value="products" data-testid="tab-products">
                <Heart className="h-4 w-4 mr-2" />
                Products ({favoriteProducts.length})
              </TabsTrigger>
              <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                <Building2 className="h-4 w-4 mr-2" />
                Suppliers ({favoriteSuppliers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow glass-card">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Link href={`/supplier/${product.id}`} className="text-gray-600 dark:text-gray-400 hover:text-primary text-sm">
                        {product.supplier}
                      </Link>
                      {product.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-semibold">{product.price}/piece</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">MOQ:</span>
                        <span className="font-semibold">{product.moq}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 gradient-blue text-white" size="sm">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              {favoriteSuppliers.map((supplier) => (
                <Card key={supplier.id} className="p-6 hover:shadow-lg transition-shadow glass-card">
                  <div className="flex items-start gap-6">
                    <img
                      src={supplier.logo}
                      alt={supplier.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/supplier/${supplier.id}`}>
                            <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                              {supplier.name}
                            </h3>
                          </Link>
                          <p className="text-gray-600 dark:text-gray-400">{supplier.location}</p>
                        </div>
                        {supplier.verified && (
                          <Badge className="bg-gray-500 text-white">Verified Supplier</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
                          <p className="font-semibold">{supplier.products}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
                          <p className="font-semibold">{supplier.responseRate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/supplier/${supplier.id}`}>
                            <Button variant="outline" size="sm">
                              <Building2 className="h-4 w-4 mr-2" />
                              View Store
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
