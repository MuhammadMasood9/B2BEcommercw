import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  ShieldCheck, 
  MapPin,
  ArrowRight,
  Building2,
  Award
} from "lucide-react";

interface Supplier {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  businessType: string;
  country: string;
  city: string;
  mainProducts: string[];
  verificationLevel: string;
  isVerified: boolean;
  rating: string;
  totalReviews: number;
  responseRate: string;
  responseTime?: string;
  totalOrders: number;
}

export default function FeaturedSuppliers() {
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["/api/suppliers/featured"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers/featured?limit=6", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  const suppliers = suppliersData?.suppliers || [];

  if (isLoading || suppliers.length === 0) {
    return null;
  }

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Manufacturer';
      case 'trading_company': return 'Trading Co.';
      case 'wholesaler': return 'Wholesaler';
      default: return 'Supplier';
    }
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'premium':
        return <Award className="w-4 h-4 text-yellow-600" />;
      case 'business':
      case 'basic':
        return <ShieldCheck className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span>Featured Suppliers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted Verified Suppliers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with our top-rated, verified suppliers from around the world
          </p>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {suppliers.map((supplier: Supplier) => {
            const logoImage = supplier.storeLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop';
            
            return (
              <Link key={supplier.id} href={`/suppliers/${supplier.storeSlug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 h-full cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Logo */}
                      <div className="w-16 h-16 rounded-lg border-2 border-gray-200 bg-white shadow-sm overflow-hidden flex-shrink-0">
                        <img 
                          src={logoImage} 
                          alt={supplier.storeName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {supplier.storeName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {getBusinessTypeLabel(supplier.businessType)}
                          </Badge>
                          {supplier.isVerified && (
                            <div className="flex items-center gap-1">
                              {getVerificationIcon(supplier.verificationLevel)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{supplier.city}, {supplier.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {supplier.storeDescription && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {supplier.storeDescription}
                      </p>
                    )}

                    {/* Main Products */}
                    {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {supplier.mainProducts.slice(0, 2).map((product, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                          {supplier.mainProducts.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplier.mainProducts.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-sm">{parseFloat(supplier.rating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({supplier.totalReviews})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supplier.totalOrders} orders
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/suppliers">
            <Button size="lg" variant="outline" className="group">
              <Building2 className="w-5 h-5 mr-2" />
              View All Suppliers
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
