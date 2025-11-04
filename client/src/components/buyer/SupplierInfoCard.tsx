import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Building2, 
  MapPin, 
  Star, 
  Clock, 
  TrendingUp, 
  Shield, 
  Verified, 
  Crown,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Award,
  ExternalLink
} from "lucide-react";

interface SupplierInfoCardProps {
  supplier: any;
  productId: string;
}

export default function SupplierInfoCard({ supplier, productId }: SupplierInfoCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data if supplier not provided
  const supplierData = supplier || {
    businessName: "Global Trade Supplier",
    storeName: "Premium Electronics Store",
    country: "China",
    city: "Shenzhen",
    verificationLevel: "premium",
    isVerified: true,
    membershipTier: "gold",
    rating: 4.8,
    totalReviews: 156,
    responseRate: 98,
    responseTime: "< 2 hours",
    yearEstablished: 2015,
    employees: "101-200",
    totalProducts: 245,
    followers: 1234,
    phone: "+86 755 1234 5678",
    website: "https://example.com",
    mainProducts: ["Electronics", "Consumer Goods", "Industrial Equipment"]
  };

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to contact suppliers.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to chat or contact form
    window.location.href = `/messages?supplierId=${supplier?.id}&productId=${productId}`;
  };

  const handleCall = () => {
    if (supplierData.phone) {
      window.open(`tel:${supplierData.phone}`);
    } else {
      toast({
        title: "Phone Number Not Available",
        description: "Please contact the supplier through other means.",
        variant: "destructive",
      });
    }
  };

  const handleEmail = () => {
    if (supplier?.email) {
      window.open(`mailto:${supplier.email}`);
    } else {
      toast({
        title: "Email Not Available",
        description: "Please contact the supplier through the messaging system.",
        variant: "destructive",
      });
    }
  };

  const handleVisitStore = () => {
    if (supplier?.storeSlug) {
      window.open(`/store/${supplier.storeSlug}`, '_blank');
    } else {
      toast({
        title: "Store Not Available",
        description: "This supplier doesn't have a public store page.",
        variant: "destructive",
      });
    }
  };

  const handleFollow = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to follow suppliers.",
        variant: "destructive",
      });
      return;
    }

    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: `You are ${isFollowing ? 'no longer following' : 'now following'} ${supplierData.businessName}.`,
    });
  };

  const getVerificationBadge = () => {
    const level = supplierData.verificationLevel;
    const colors = {
      none: "bg-gray-100 text-gray-800",
      basic: "bg-blue-100 text-blue-800",
      business: "bg-green-100 text-green-800", 
      premium: "bg-purple-100 text-purple-800",
      trade_assurance: "bg-yellow-100 text-yellow-800"
    };

    const icons = {
      none: Shield,
      basic: Verified,
      business: Award,
      premium: Crown,
      trade_assurance: Shield
    };

    const Icon = icons[level as keyof typeof icons] || Shield;
    const colorClass = colors[level as keyof typeof colors] || colors.none;

    return (
      <Badge className={colorClass}>
        <Icon className="w-3 h-3 mr-1" />
        {level.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
      </Badge>
    );
  };

  const getMembershipBadge = () => {
    const tier = supplierData.membershipTier;
    const colors = {
      free: "bg-gray-100 text-gray-800",
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-purple-100 text-purple-800"
    };

    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.free}>
        <Crown className="w-3 h-3 mr-1" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Member
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Supplier Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supplier Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">{supplierData.businessName}</h3>
            <p className="text-sm text-gray-600 mb-3">{supplierData.storeName}</p>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              {getVerificationBadge()}
              {getMembershipBadge()}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(supplierData.rating) 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{supplierData.rating}</span>
              <span className="text-sm text-gray-600">({supplierData.totalReviews} reviews)</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">{supplierData.responseRate}%</div>
                <div className="text-gray-600">Response Rate</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">{supplierData.responseTime}</div>
                <div className="text-gray-600">Response Time</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{supplierData.city}, {supplierData.country}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Est. {supplierData.yearEstablished}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{supplierData.employees} employees</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{supplierData.totalProducts} products</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleContact}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Supplier
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCall}
                disabled={!supplierData.phone}
              >
                <Phone className="w-3 h-3 mr-1" />
                Call
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEmail}
                disabled={!supplier?.email}
              >
                <Mail className="w-3 h-3 mr-1" />
                Email
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={handleVisitStore}
              className="w-full"
              size="sm"
            >
              <Globe className="w-4 h-4 mr-2" />
              Visit Store
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Safety */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Trust & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {supplierData.isVerified && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Verified className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Verified Supplier</p>
                  <p className="text-xs text-gray-600">Identity and business verified</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Trade Assurance</p>
                <p className="text-xs text-gray-600">Order protection available</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Quality Guarantee</p>
                <p className="text-xs text-gray-600">High quality products</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Products */}
      {supplierData.mainProducts && supplierData.mainProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Main Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supplierData.mainProducts.map((product: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow Button */}
      <Card>
        <CardContent className="p-4">
          <Button 
            variant={isFollowing ? "secondary" : "outline"}
            onClick={handleFollow}
            className="w-full"
          >
            {isFollowing ? 'Following' : 'Follow Supplier'}
          </Button>
          <p className="text-xs text-gray-600 text-center mt-2">
            {supplierData.followers} followers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}