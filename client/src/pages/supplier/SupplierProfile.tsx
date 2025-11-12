import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  MapPin, 
  Phone, 
  Globe,
  Mail,
  Calendar,
  Users,
  DollarSign,
  Award,
  Shield,
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  Package,
  Edit
} from "lucide-react";
import { useState } from "react";
import SupplierProfileEdit from "@/components/supplier/SupplierProfileEdit";

interface SupplierProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  contactPerson: string;
  position?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  yearEstablished?: number;
  employeesCount?: string;
  annualRevenue?: string;
  mainProducts: string[];
  exportMarkets: string[];
  verificationLevel: string;
  isVerified: boolean;
  verifiedAt?: string;
  rating: string;
  totalReviews: number;
  responseRate: string;
  responseTime: string;
  totalSales: string;
  totalOrders: number;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function SupplierProfile() {
  const [isEditing, setIsEditing] = useState(false);

  // Fetch supplier profile
  const { data: profileData, isLoading } = useQuery<{ profile: SupplierProfile }>({
    queryKey: ['/api/suppliers/profile'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/profile', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const profile = profileData?.profile;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  if (isEditing) {
    return <SupplierProfileEdit profile={profile} onCancel={() => setIsEditing(false)} />;
  }

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'premium': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'business': return 'bg-brand-orange-100 text-brand-orange-700 border-brand-orange-300';
      case 'basic': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Supplier Profile</h1>
          <p className="text-muted-foreground">View and manage your business profile</p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Banner and Logo */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {/* Banner */}
            <div className="h-48 bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 rounded-t-lg overflow-hidden">
              {profile.storeBanner && (
                <img 
                  src={profile.storeBanner} 
                  alt="Store Banner" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Logo and Basic Info */}
            <div className="px-6 pb-6">
              <div className="flex items-end gap-6 -mt-16">
                <div className="w-32 h-32 bg-white rounded-lg border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {profile.storeLogo ? (
                    <img src={profile.storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 mt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile.storeName}</h2>
                    {profile.isVerified && (
                      <Badge className={`${getVerificationColor(profile.verificationLevel)} border`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {profile.verificationLevel.charAt(0).toUpperCase() + profile.verificationLevel.slice(1)} Verified
                      </Badge>
                    )}
                    <Badge className={getStatusColor(profile.status)}>
                      {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                    </Badge>
                    {profile.isActive && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    )}
                    {profile.isFeatured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{profile.businessName}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(profile.rating).toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">{profile.totalReviews} Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(profile.responseRate).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-brand-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.responseTime || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.storeDescription && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">About</p>
                  <p className="text-sm">{profile.storeDescription}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Business Type</p>
                  <p className="text-sm capitalize">{profile.businessType.replace('_', ' ')}</p>
                </div>
                {profile.yearEstablished && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Year Established</p>
                    <p className="text-sm">{profile.yearEstablished}</p>
                  </div>
                )}
                {profile.employeesCount && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Employees</p>
                    <p className="text-sm">{profile.employeesCount}</p>
                  </div>
                )}
                {profile.annualRevenue && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Annual Revenue</p>
                    <p className="text-sm">{profile.annualRevenue}</p>
                  </div>
                )}
              </div>

              {profile.mainProducts && profile.mainProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Main Products</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.mainProducts.map((product, index) => (
                      <Badge key={index} variant="secondary">{product}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.exportMarkets && profile.exportMarkets.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Export Markets</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.exportMarkets.map((market, index) => (
                      <Badge key={index} variant="outline">{market}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{profile.contactPerson}</p>
                  {profile.position && <p className="text-xs text-muted-foreground">{profile.position}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{profile.phone}</p>
              </div>

              {profile.whatsapp && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">WhatsApp: {profile.whatsapp}</p>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-orange-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{profile.address}</p>
              <p className="text-sm">{profile.city}, {profile.country}</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification & Certifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Verification Level</span>
                <Badge className={getVerificationColor(profile.verificationLevel)}>
                  {profile.verificationLevel.charAt(0).toUpperCase() + profile.verificationLevel.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Verified</span>
                {profile.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <span className="text-sm text-muted-foreground">Not verified</span>
                )}
              </div>

              {profile.verifiedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Verified on</p>
                  <p className="text-sm">{new Date(profile.verifiedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications & Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.isVerified && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Verified Supplier</span>
                </div>
              )}
              
              {profile.isFeatured && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Featured Supplier</span>
                </div>
              )}

              {parseFloat(profile.rating) >= 4.5 && (
                <div className="flex items-center gap-2 p-3 bg-brand-orange-50 rounded-lg">
                  <Award className="h-5 w-5 text-brand-orange-600" />
                  <span className="text-sm font-medium">Top Rated</span>
                </div>
              )}

              {parseFloat(profile.responseRate) >= 90 && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Quick Responder</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Store URL</p>
                <a 
                  href={`/suppliers/${profile.storeSlug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-brand-orange-600 hover:underline break-all"
                >
                  /suppliers/{profile.storeSlug}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
