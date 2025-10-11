import { MapPin, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface SupplierCardProps {
  id: string;
  logo: string;
  name: string;
  location: string;
  yearsInBusiness: number;
  rating: number;
  responseRate: string;
  mainProducts: string[];
  verified?: boolean;
  goldSupplier?: boolean;
}

export default function SupplierCard({
  id,
  logo,
  name,
  location,
  yearsInBusiness,
  rating,
  responseRate,
  mainProducts,
  verified = false,
  goldSupplier = false,
}: SupplierCardProps) {
  return (
    <Card className="group hover-elevate transition-all duration-300 hover:shadow-xl" data-testid={`card-supplier-${id}`}>
      <CardContent className="p-6">
        <div className="flex gap-4 mb-4">
          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border group-hover:border-primary transition-colors">
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <Link href={`/supplier/${id}`}>
              <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-1" data-testid={`text-supplier-name-${id}`}>
                {name}
              </h3>
            </Link>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {verified && (
                <Badge className="bg-green-600 text-white text-xs border-0" data-testid={`badge-verified-${id}`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {goldSupplier && (
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs border-0" data-testid={`badge-gold-${id}`}>
                  <Star className="w-3 h-3 mr-1 fill-white" />
                  Gold
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate" data-testid={`text-location-${id}`}>{location}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4 py-3 px-2 bg-muted/30 rounded-lg text-center text-sm">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 font-bold text-base" data-testid={`text-years-${id}`}>
              <TrendingUp className="w-4 h-4 text-primary" />
              {yearsInBusiness}Y
            </div>
            <div className="text-muted-foreground text-xs">Experience</div>
          </div>
          <div className="flex flex-col items-center border-x border-border">
            <div className="font-bold text-base flex items-center justify-center gap-1" data-testid={`text-rating-${id}`}>
              {rating} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-muted-foreground text-xs">Rating</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-bold text-base text-primary" data-testid={`text-response-${id}`}>{responseRate}</div>
            <div className="text-muted-foreground text-xs">Response</div>
          </div>
        </div>
        
        <div className="mb-4 pb-4 border-b border-border">
          <p className="text-sm font-medium text-muted-foreground mb-2">Main Products:</p>
          <div className="flex flex-wrap gap-1.5">
            {mainProducts.slice(0, 3).map((product, index) => (
              <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-product-${id}-${index}`}>
                {product}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-${id}`}>
            View Profile
          </Button>
          <Button size="sm" className="flex-1" data-testid={`button-contact-${id}`}>
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
