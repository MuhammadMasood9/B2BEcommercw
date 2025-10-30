import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Package, 
  CheckCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendedSupplier {
  id: string;
  businessName: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  businessType: string;
  city: string;
  country: string;
  verificationLevel: string;
  isVerified: boolean;
  membershipTier: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  totalProducts: number;
  relevanceScore?: number;
}

interface SupplierRecommendationsProps {
  onVisitStore: (storeSlug: string) => void;
  onAddToComparison: (supplierId: string) => void;
}

export default function SupplierRecommendations({ 
  onVisitStore, 
  onAddToComparison 
}: SupplierRecommendationsProps) {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<RecommendedSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [basedOnHistory, setBasedOnHistory] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/suppliers/recommendations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.suppliers || []);
        setBasedOnHistory(data.basedOnHistory || false);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationBadge = (supplier: RecommendedSupplier) => {
    if (!supplier.isVerified) return null;
    
    const badgeConfig = {
      basic: { label: "Verified", color: "bg-blue-100 text-blue-800" },
      business: { label: "Business Verified", color: "bg-green-100 text-green-800" },
      premium: { label: "Premium Verified", color: "bg-purple-100 text-purple-800" },
      trade_assurance: { label: "Trade Assurance", color: "bg-yellow-100 text-yellow-800" }
    };
    
    const config = badgeConfig[supplier.verificationLevel as keyof typeof badgeConfig] || badgeConfig.basic;
    
    return (
      <Badge className={`${config.color} border-0 text-xs`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatMembershipTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recommended for You
          {basedOnHistory && (
            <Badge variant="secondary" className="text-xs">
              Based on your activity
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {basedOnHistory 
            ? "Suppliers matching your inquiry and order history"
            : "Top-rated suppliers you might be interested in"
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-muted rounded-lg p-2 flex-shrink-0">
                    {supplier.storeLogo ? (
                      <img 
                        src={supplier.storeLogo} 
                        alt="Store Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-full h-full text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{supplier.storeName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{supplier.businessName}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    {renderVerificationBadge(supplier)}
                    <Badge variant="outline" className="text-xs">
                      {formatMembershipTier(supplier.membershipTier)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{supplier.city}, {supplier.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{supplier.rating} ({supplier.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span>{supplier.totalProducts} products</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => onVisitStore(supplier.storeSlug)}
                  >
                    Visit Store
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onAddToComparison(supplier.id)}
                  >
                    Compare
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}