import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Building2,
  Package,
  TrendingUp,
  Clock,
  Award
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import VerificationBadge from "./VerificationBadge";

interface SupplierCardProps {
  supplier: {
    id: string;
    storeName: string;
    storeSlug: string;
    storeDescription?: string;
    storeLogo?: string;
    storeBanner?: string;
    businessName: string;
    businessType: string;
    country: string;
    city: string;
    mainProducts: string[];
    verificationLevel: string;
    isVerified: boolean;
    isFeatured: boolean;
    rating: string;
    totalReviews: number;
    responseRate: string;
    responseTime?: string;
    totalOrders: number;
    yearEstablished?: number;
  };
}

export default function SupplierCard({ supplier }: SupplierCardProps) {
  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800';
      case 'trading_company': return 'bg-green-100 text-green-800';
      case 'wholesaler': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Manufacturer';
      case 'trading_company': return 'Trading Co.';
      case 'wholesaler': return 'Wholesaler';
      default: return 'Supplier';
    }
  };



  const bannerImage = supplier.storeBanner || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop';
  const logoImage = supplier.storeLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <Link href={`/suppliers/${supplier.storeSlug}`} className="block">
        {/* Banner */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <img 
            src={bannerImage} 
            alt={supplier.storeName} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {supplier.isFeatured && (
              <Badge className="bg-yellow-500 text-white border-0 text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            <VerificationBadge 
              level={supplier.verificationLevel as any}
              isVerified={supplier.isVerified}
              size="sm"
            />
          </div>

          {/* Logo */}
          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-lg border-4 border-white bg-white shadow-lg overflow-hidden">
              <img 
                src={logoImage} 
                alt={supplier.storeName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 pt-10 space-y-3 flex-1">
        {/* Store Name and Business Type */}
        <div>
          <Link href={`/suppliers/${supplier.storeSlug}`}>
            <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors line-clamp-1">
              {supplier.storeName}
            </h3>
          </Link>
          <Badge className={`${getBusinessTypeColor(supplier.businessType)} text-xs`}>
            {getBusinessTypeLabel(supplier.businessType)}
          </Badge>
        </div>

        {/* Description */}
        {supplier.storeDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplier.storeDescription}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{supplier.city}, {supplier.country}</span>
        </div>

        {/* Main Products */}
        {supplier.mainProducts && supplier.mainProducts.length > 0 && (
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {supplier.mainProducts.slice(0, 3).map((product, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {product}
                </Badge>
              ))}
              {supplier.mainProducts.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{supplier.mainProducts.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-semibold">{parseFloat(supplier.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">({supplier.totalReviews})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{supplier.totalOrders} orders</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{supplier.responseTime || '< 24h'}</span>
            </div>
            <span>{parseFloat(supplier.responseRate).toFixed(0)}% response rate</span>
          </div>
        </div>

        {/* Year Established */}
        {supplier.yearEstablished && (
          <div className="text-xs text-muted-foreground">
            Est. {supplier.yearEstablished}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/suppliers/${supplier.storeSlug}`} className="w-full">
          <Button className="w-full" variant="outline">
            <Building2 className="w-4 h-4 mr-2" />
            View Store
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
