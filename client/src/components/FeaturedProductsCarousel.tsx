import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  ArrowRight,
  TrendingUp,
  Eye
} from "lucide-react";
import { Link } from "wouter";

export default function FeaturedProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch featured products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/products?featured=true&limit=12');
      if (!response.ok) throw new Error('Failed to fetch featured products');
      const data = await response.json();
      // Handle both array and object with products property
      const products = Array.isArray(data) ? data : (data.products || []);
      // Filter to ensure only featured products are returned
      return products.filter((p: any) => p.isFeatured === true);
    }
  });

  // Ensure we always work with an array
  const productsArray = Array.isArray(products) ? products : [];

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || productsArray.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === Math.ceil(productsArray.length / 4) - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, productsArray.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === Math.ceil(productsArray.length / 4) - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.ceil(productsArray.length / 4) - 1 : prevIndex - 1
    );
  };

  const getCurrentProducts = () => {
    const startIndex = currentIndex * 4;
    return productsArray.slice(startIndex, startIndex + 4);
  };

  // Helper function to transform product data for ProductCard
  const transformProductForCard = (product: any) => {
    // Get first image from images array or use placeholder
    const image = Array.isArray(product.images) && product.images.length > 0 
      ? product.images[0] 
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
    
    // Get price range from priceRanges
    const priceRange = Array.isArray(product.priceRanges) && product.priceRanges.length > 0
      ? `$${product.priceRanges[0].pricePerUnit} - $${product.priceRanges[product.priceRanges.length - 1].pricePerUnit}`
      : '$0.00';
    
    return {
      ...product,
      image,
      priceRange,
      moq: product.minOrderQuantity || 1,
      supplierName: 'Admin Supplier', // Admin is the supplier
      supplierCountry: 'USA',
      supplierType: 'manufacturer',
      responseRate: '100%',
      responseTime: '< 2h',
      verified: true,
      tradeAssurance: true,
      readyToShip: product.readyToShip || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || ['ISO 9001', 'CE Mark'],
      rating: product.rating || 4.8,
      reviews: product.reviews || Math.floor(Math.random() * 100) + 50,
      views: product.views || Math.floor(Math.random() * 1000) + 100,
      inquiries: product.inquiries || Math.floor(Math.random() * 50) + 10,
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Los Angeles, USA',
      paymentTerms: ['T/T', 'L/C', 'PayPal'],
      inStock: true,
      stockQuantity: product.stockQuantity || Math.floor(Math.random() * 1000) + 100
    };
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover trending products from verified suppliers worldwide
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-100/30 to-blue-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Trending Now</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover trending products from verified suppliers worldwide
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg hover:shadow-xl border-gray-200"
            onClick={prevSlide}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg hover:shadow-xl border-gray-200"
            onClick={nextSlide}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Products Grid using ProductCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getCurrentProducts().map((product: any) => (
              <ProductCard
                key={product.id}
                {...transformProductForCard(product)}
                onContact={() => {
                  // Handle contact supplier
                  console.log('Contact supplier for product:', product.id);
                }}
                onQuote={() => {
                  // Handle request quote
                  console.log('Request quote for product:', product.id);
                }}
                onSample={() => {
                  // Handle request sample
                  console.log('Request sample for product:', product.id);
                }}
              />
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-2">
            {[...Array(Math.ceil(productsArray.length / 4))].map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/products">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              View All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
