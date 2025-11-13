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
  const fallbackBanner = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop&auto=format';
  const fallbackLogo = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop&auto=format';
  const businessTypeStyles: Record<string, string> = {
    manufacturer: 'border border-brand-orange-500/20 bg-brand-orange-500/10 text-brand-orange-700',
    trading_company: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
    wholesaler: 'border border-violet-500/20 bg-violet-500/10 text-violet-700',
  };
  const getBusinessTypeColor = (type: string) => businessTypeStyles[type] || 'border border-brand-grey-200 bg-brand-grey-50 text-brand-grey-700';
  const getBusinessTypeLabel = (type: string) =>
    ({ manufacturer: 'Manufacturer', trading_company: 'Trading Co.', wholesaler: 'Wholesaler' }[type] || 'Supplier');
  const formatRating = (value: string, reviews: number) => {
    const parsed = Number.parseFloat(value || '0');
    return `${Number.isFinite(parsed) ? parsed.toFixed(1) : '0.0'} (${reviews})`;
  };
  const formatResponseRate = (value: string) => {
    const parsed = Number.parseFloat(value || '0');
    return `${Number.isFinite(parsed) ? parsed.toFixed(0) : 0}% response rate`;
  };
  const formatCityCountry = (city: string | undefined, country: string | undefined) =>
    [city, country].filter(Boolean).join(', ') || 'Global';
  const sanitizeProducts = (list?: (string | null)[] | null) =>
    (Array.isArray(list) ? list : []).filter((product): product is string => Boolean(product)).slice(0, 3);
  const mainProducts = sanitizeProducts(supplier.mainProducts);

  const bannerImage = supplier.storeBanner || fallbackBanner;
  const logoImage = supplier.storeLogo || fallbackLogo;

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-brand-grey-100">
      <Link href={`/store/${supplier.storeSlug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-brand-grey-100">
          <img
            src={bannerImage}
            alt={supplier.storeName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-grey-900/70 to-transparent" />

          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {supplier.isFeatured && (
              <Badge className="flex items-center gap-1 border border-white/30 bg-white/10 text-white text-xs font-medium backdrop-blur-sm">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
            <VerificationBadge
              level={supplier.verificationLevel as any}
              isVerified={supplier.isVerified}
              size="sm"
            />
          </div>

          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden ring-1 ring-black/5">
              <img
                src={logoImage}
                alt={`${supplier.storeName} logo`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="flex-1 space-y-4 p-5 pt-10">
        <div className="space-y-2">
          <Link href={`/store/${supplier.storeSlug}`}>
            <h3 className="text-lg font-semibold text-brand-grey-900 leading-tight line-clamp-1 hover:text-brand-orange-600 transition-colors">
              {supplier.storeName}
            </h3>
          </Link>
          <Badge className={`${getBusinessTypeColor(supplier.businessType)} text-xs font-medium px-3 py-1 inline-flex items-center gap-1`}> 
            <Building2 className="w-3 h-3" />
            {getBusinessTypeLabel(supplier.businessType)}
          </Badge>
        </div>

        {supplier.storeDescription && (
          <p className="text-sm text-brand-grey-600 leading-relaxed line-clamp-2">
            {supplier.storeDescription}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-brand-grey-600">
          <MapPin className="w-4 h-4 text-brand-orange-500" />
          <span>{formatCityCountry(supplier.city, supplier.country)}</span>
        </div>

        {mainProducts.length > 0 && (
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-brand-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {mainProducts.map((product, index) => (
                <Badge key={product + index} variant="outline" className="text-xs font-medium border-brand-orange-200 text-brand-orange-700">
                  {product}
                </Badge>
              ))}
              {Array.isArray(supplier.mainProducts) && supplier.mainProducts.length > 3 && (
                <Badge variant="outline" className="text-xs font-medium border-brand-grey-200 text-brand-grey-600">
                  +{supplier.mainProducts.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-brand-grey-100 bg-white/90 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm text-brand-grey-700">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-brand-orange-500" />
              <span className="font-semibold text-brand-grey-900">{formatRating(supplier.rating, supplier.totalReviews)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-brand-grey-400" />
              <span>{supplier.totalOrders} orders</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-brand-grey-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-orange-500" />
              <span>{supplier.responseTime || '< 24h'}</span>
            </div>
            <span>{formatResponseRate(supplier.responseRate)}</span>
          </div>
        </div>

        {supplier.yearEstablished && (
          <div className="text-xs text-brand-grey-500">
            Est. {supplier.yearEstablished}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/store/${supplier.storeSlug}`} className="w-full">
          <Button className="w-full border-brand-orange-500 text-brand-orange-600 hover:bg-brand-orange-500/10" variant="outline">
            <Building2 className="w-4 h-4 mr-2" />
            View Store
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
