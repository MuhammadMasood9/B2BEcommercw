import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  MapPin,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  Award,
  TrendingUp,
  Package,
  Users,
  Calendar,
  ChevronRight
} from "lucide-react";

interface SupplierInfoCardProps {
  supplierId?: string;
  supplierName: string;
  supplierSlug?: string;
  supplierLogo?: string;
  supplierCountry?: string;
  supplierCity?: string;
  supplierType?: string;
  supplierRating?: number;
  supplierReviews?: number;
  supplierResponseRate?: number;
  supplierResponseTime?: string;
  supplierVerified?: boolean;
  supplierYearEstablished?: number;
  supplierTotalProducts?: number;
  onContact?: () => void;
  onVisitStore?: () => void;
}

export default function SupplierInfoCard({
  supplierId,
  supplierName,
  supplierSlug,
  supplierLogo,
  supplierCountry = "Unknown",
  supplierCity,
  supplierType = "manufacturer",
  supplierRating = 0,
  supplierReviews = 0,
  supplierResponseRate = 0,
  supplierResponseTime = "< 24h",
  supplierVerified = false,
  supplierYearEstablished,
  supplierTotalProducts = 0,
  onContact,
  onVisitStore
}: SupplierInfoCardProps) {
  const getSupplierTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Manufacturer';
      case 'trading_company': return 'Trading Company';
      case 'wholesaler': return 'Wholesaler';
      case 'distributor': return 'Distributor';
      default: return 'Supplier';
    }
  };

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trading_company': return 'bg-green-100 text-green-800 border-green-200';
      case 'wholesaler': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'distributor': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const supplierInitials = supplierName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-blue-200">
              <AvatarImage src={supplierLogo} alt={supplierName} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {supplierInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">{supplierName}</CardTitle>
                {supplierVerified && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSupplierTypeColor(supplierType)}>
                  {getSupplierTypeLabel(supplierType)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{supplierCity ? `${supplierCity}, ` : ''}{supplierCountry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rating and Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-muted-foreground">Supplier Rating</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {supplierRating > 0 ? supplierRating.toFixed(1) : 'N/A'}
              </span>
              {supplierReviews > 0 && (
                <span className="text-sm text-muted-foreground">({supplierReviews} reviews)</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Response Time</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{supplierResponseTime}</span>
            </div>
          </div>
        </div>

        {/* Supplier Stats */}
        <div className="grid grid-cols-3 gap-3">
          {supplierResponseRate > 0 && (
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Response Rate</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{supplierResponseRate}%</div>
            </div>
          )}
          
          {supplierTotalProducts > 0 && (
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Products</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{supplierTotalProducts}</div>
            </div>
          )}
          
          {supplierYearEstablished && (
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-muted-foreground">Established</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{supplierYearEstablished}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <Button 
            onClick={onContact}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Supplier
          </Button>
          
          {supplierId && supplierSlug ? (
            <Button 
              asChild
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50"
              size="lg"
            >
              <Link href={`/store/${supplierSlug}`}>
                <Building2 className="w-4 h-4 mr-2" />
                Visit Supplier Store
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </Button>
          ) : (
            <Button 
              onClick={onVisitStore}
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50"
              size="lg"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Visit Supplier Store
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              Call
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {supplierVerified && (
            <Badge variant="outline" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verified Supplier
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Award className="w-3 h-3 mr-1" />
            Trade Assurance
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Trusted Seller
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
