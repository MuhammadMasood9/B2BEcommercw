import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Package, 
  CheckCircle,
  X,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  businessName: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  businessType: string;
  city: string;
  country: string;
  yearEstablished?: number;
  mainProducts?: string[];
  verificationLevel: string;
  isVerified: boolean;
  membershipTier: string;
  rating: number;
  totalReviews: number;
  responseRate: number;
  responseTime?: string;
  totalProducts: number;
  storeViews: number;
  followers: number;
  totalSales?: number;
  totalOrders?: number;
}

interface SupplierComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  supplierIds: string[];
  onRemoveSupplier: (supplierId: string) => void;
  onVisitStore: (storeSlug: string) => void;
}

export default function SupplierComparison({ 
  isOpen, 
  onClose, 
  supplierIds, 
  onRemoveSupplier,
  onVisitStore 
}: SupplierComparisonProps) {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && supplierIds.length > 0) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierIds]);

  const fetchSupplierDetails = async () => {
    setIsLoading(true);
    try {
      const supplierPromises = supplierIds.map(id => 
        fetch(`/api/suppliers/${id}/profile`).then(res => res.json())
      );
      
      const supplierData = await Promise.all(supplierPromises);
      setSuppliers(supplierData.filter(supplier => !supplier.error));
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier details for comparison.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationBadge = (supplier: Supplier) => {
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

  const formatBusinessType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatMembershipTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Suppliers</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading supplier details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Suppliers ({suppliers.length})</DialogTitle>
        </DialogHeader>
        
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No suppliers to compare</h3>
            <p className="text-muted-foreground">Add suppliers to your comparison list to see them here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => onRemoveSupplier(supplier.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
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

                    <div className="space-y-2 mb-4">
                      {renderVerificationBadge(supplier)}
                      <Badge variant="outline" className="text-xs">
                        {formatMembershipTier(supplier.membershipTier)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span>{supplier.city}, {supplier.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{supplier.rating} ({supplier.totalReviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span>{supplier.totalProducts} products</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3 h-3 text-muted-foreground" />
                        <span>{supplier.responseRate}% response rate</span>
                      </div>
                      {supplier.yearEstablished && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>Est. {supplier.yearEstablished}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => onVisitStore(supplier.storeSlug)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Detailed Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Attribute</th>
                    {suppliers.map((supplier) => (
                      <th key={supplier.id} className="text-left py-2 font-medium min-w-[200px]">
                        {supplier.storeName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-2 font-medium">Business Type</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {formatBusinessType(supplier.businessType)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Location</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.city}, {supplier.country}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Rating</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {supplier.rating} ({supplier.totalReviews})
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Response Rate</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        <span className="text-green-600">{supplier.responseRate}%</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Response Time</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.responseTime || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Total Products</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.totalProducts}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Year Established</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.yearEstablished || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Main Products</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {supplier.mainProducts?.slice(0, 3).map((product, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                          {supplier.mainProducts && supplier.mainProducts.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{supplier.mainProducts.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Store Views</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.storeViews?.toLocaleString() || '0'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Followers</td>
                    {suppliers.map((supplier) => (
                      <td key={supplier.id} className="py-2">
                        {supplier.followers?.toLocaleString() || '0'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}