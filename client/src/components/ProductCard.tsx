import { 
  MapPin, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Eye, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  Zap,
  Award,
  Globe,
  Phone,
  Mail,
  Heart,
  Share2,
  MoreHorizontal,
  ShoppingCart,
  Building2
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useState } from "react";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "./VerificationBadge";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  priceRange: string;
  moq: number | string;
  supplierName: string;
  supplierCountry: string;
  supplierType?: string;
  responseRate: string;
  responseTime?: string;
  verified?: boolean;
  verificationLevel?: string;
  tradeAssurance?: boolean;
  readyToShip?: boolean;
  sampleAvailable?: boolean;
  customizationAvailable?: boolean;
  certifications?: string[];
  leadTime?: string;
  port?: string;
  paymentTerms?: string[];
  inStock?: boolean;
  stockQuantity?: number;
  views?: number;
  inquiries?: number;
  rating?: number;
  reviews?: number;
  isFavorited?: boolean;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onContact?: () => void;
  onQuote?: () => void;
  onSample?: () => void;
  onAddToCart?: () => void;
  viewMode?: 'grid' | 'list';
  supplierId?: string;
  supplierSlug?: string;
  supplierRating?: number;
}

export default function ProductCard({
  id,
  image,
  name,
  priceRange,
  moq,
  supplierName,
  supplierCountry,
  supplierType,
  responseRate,
  responseTime,
  verified = false,
  verificationLevel = 'none',
  tradeAssurance = false,
  readyToShip = false,
  sampleAvailable = false,
  customizationAvailable = false,
  certifications = [],
  leadTime,
  port,
  paymentTerms = [],
  inStock = true,
  stockQuantity,
  views = 0,
  inquiries = 0,
  rating = 0,
  reviews = 0,
  isFavorited = false,
  onFavorite,
  onShare,
  onContact,
  onQuote,
  onSample,
  onAddToCart,
  viewMode = 'grid',
  supplierId,
  supplierSlug,
  supplierRating = 0
}: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const [isFav, setIsFav] = useState(isFavorited);

  const handleFavorite = () => {
    const wasFavorite = isFavorite(id);
    toggleFavorite(id);
    setIsFav(!wasFavorite);
    
    toast({
      title: wasFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: wasFavorite 
        ? `${name} has been removed from your favorites.`
        : `${name} has been added to your favorites.`,
    });
    
    onFavorite?.(id);
  };

  const handleShare = () => {
    onShare?.(id);
  };

  const handleContact = () => {
    onContact?.();
  };

  const handleQuote = () => {
    onQuote?.();
  };

  const handleSample = () => {
    onSample?.();
  };

  const handleAddToCart = () => {
    onAddToCart?.();
  };

  const getSupplierTypeColor = (type?: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800';
      case 'trading-company': return 'bg-green-100 text-green-800';
      case 'wholesaler': return 'bg-purple-100 text-purple-800';
      case 'distributor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSupplierTypeLabel = (type?: string) => {
    switch (type) {
      case 'manufacturer': return 'Manufacturer';
      case 'trading-company': return 'Trading Co.';
      case 'wholesaler': return 'Wholesaler';
      case 'distributor': return 'Distributor';
      default: return 'Supplier';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300" data-testid={`card-product-${id}`}>
        <div className="flex">
          <Link href={`/product/${id}`} className="flex-shrink-0">
            <div className="relative w-32 h-32 overflow-hidden bg-muted">
              <img 
                src={image} 
                alt={name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-2 right-2">
                <VerificationBadge 
                  level={verificationLevel as any}
                  isVerified={verified}
                  size="sm"
                  showLabel={false}
                />
              </div>
            </div>
          </Link>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <Link href={`/product/${id}`}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2" data-testid={`text-product-name-${id}`}>
                    {name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getSupplierTypeColor(supplierType)}>
                    {getSupplierTypeLabel(supplierType)}
                  </Badge>
                  {tradeAssurance && (
                    <Badge variant="outline" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Trade Assurance
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleFavorite}
                  className={`h-8 w-8 p-0 ${isFavorite(id) ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite(id) ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddToCart}
                  className="h-8 w-8 p-0 text-gray-400"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleContact}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Supplier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSample}>
                      <Package className="h-4 w-4 mr-2" />
                      Request Sample
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Supplier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary" data-testid={`text-price-${id}`}>{priceRange}</p>
                <p className="text-sm text-muted-foreground font-medium" data-testid={`text-moq-${id}`}>MOQ: {typeof moq === 'number' ? moq : moq}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-sm">{rating}</span>
                  <span className="text-xs text-muted-foreground">({reviews})</span>
                </div>
                <p className="text-xs text-muted-foreground">{views} views • {inquiries} inquiries</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {supplierId && supplierSlug ? (
                    <Link href={`/supplier/${supplierSlug}`} className="hover:text-primary hover:underline font-medium">
                      {supplierName}
                    </Link>
                  ) : (
                    <span>{supplierName}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{supplierCountry}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{responseTime}</span>
                </div>
                {leadTime && (
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>{leadTime}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleContact} className="h-9 font-medium">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button size="sm" onClick={handleQuote} className="h-9 font-medium">
                  Get Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col min-h-[400px] p-0" data-testid={`card-product-${id}`}>
      <Link href={`/product/${id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted h-48 w-full">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <VerificationBadge 
              level={verificationLevel as any}
              isVerified={verified}
              size="sm"
              showLabel={false}
            />
            {tradeAssurance && (
              <Badge className="bg-blue-600 text-white border-0 text-xs px-2 py-1">
                <Award className="w-3 h-3 mr-1" />
                Trade Assurance
              </Badge>
            )}
          </div>
          
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {readyToShip && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                <Truck className="w-3 h-3 mr-1" />
                Ready to Ship
              </Badge>
            )}
            {sampleAvailable && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                <Package className="w-3 h-3 mr-1" />
                Sample Available
              </Badge>
            )}
          </div>
          
          {/* Action buttons overlay */}
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleFavorite();
              }}
              className={`h-7 w-7 p-0 ${isFavorite(id) ? 'text-red-500' : 'text-gray-600'}`}
            >
              <Heart className={`h-3 w-3 ${isFavorite(id) ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              className="h-7 w-7 p-0 text-gray-600"
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleShare();
              }}
              className="h-7 w-7 p-0"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4 space-y-3 flex-1">
        {/* Product Title and Actions */}
        <div className="flex justify-between items-start gap-2">
          <Link href={`/product/${id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 line-clamp-2 hover:text-primary transition-colors leading-tight" data-testid={`text-product-name-${id}`}>
              {name}
            </h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleContact}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Supplier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSample}>
                <Package className="h-4 w-4 mr-2" />
                Request Sample
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="h-4 w-4 mr-2" />
                Call Supplier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Price and MOQ */}
        <div className="space-y-1">
          <p className="text-xl font-bold text-primary" data-testid={`text-price-${id}`}>{priceRange}</p>
          <p className="text-sm text-muted-foreground font-medium" data-testid={`text-moq-${id}`}>MOQ: {typeof moq === 'number' ? moq : moq}</p>
        </div>
        
        {/* Supplier Info */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-1">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {supplierId && supplierSlug ? (
                <Link href={`/supplier/${supplierSlug}`} className="truncate text-xs hover:text-primary hover:underline font-medium" data-testid={`text-supplier-${id}`}>
                  {supplierName}
                </Link>
              ) : (
                <span className="truncate text-xs" data-testid={`text-supplier-${id}`}>{supplierName}</span>
              )}
            </div>
            <Badge className={`${getSupplierTypeColor(supplierType)} text-xs flex-shrink-0 ml-2 px-2 py-1`}>
              {getSupplierTypeLabel(supplierType)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid={`text-location-${id}`} className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {supplierCountry}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{responseTime}</span>
            </div>
          </div>
          
          {/* Supplier Rating and Product Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold">{supplierRating > 0 ? supplierRating.toFixed(1) : rating}</span>
              <span className="text-xs text-muted-foreground">({reviews})</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{views}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{inquiries}</span>
              </div>
            </div>
          </div>
          
          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {certifications.slice(0, 2).map((cert, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                  {cert}
                </Badge>
              ))}
              {certifications.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{certifications.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto flex-shrink-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-sm h-9 font-medium" 
            onClick={handleContact}
            data-testid={`button-contact-${id}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button 
            size="sm" 
            className="flex-1 text-sm h-9 font-medium" 
            onClick={handleQuote}
            data-testid={`button-quote-${id}`}
          >
            Get Quote
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
