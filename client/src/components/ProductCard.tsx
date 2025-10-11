import { MapPin, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  priceRange: string;
  moq: string;
  supplierName: string;
  supplierCountry: string;
  responseRate: string;
  verified?: boolean;
  tradeAssurance?: boolean;
}

export default function ProductCard({
  id,
  image,
  name,
  priceRange,
  moq,
  supplierName,
  supplierCountry,
  responseRate,
  verified = false,
  tradeAssurance = false,
}: ProductCardProps) {
  return (
    <Card className="group overflow-hidden hover-elevate transition-all duration-300 hover:shadow-xl" data-testid={`card-product-${id}`}>
      <Link href={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {verified && (
            <Badge className="absolute top-3 right-3 bg-green-600 text-white border-0" data-testid={`badge-verified-${id}`}>
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {tradeAssurance && (
            <Badge className="absolute bottom-3 left-3 bg-primary border-0" data-testid={`badge-trade-assurance-${id}`}>
              Trade Assurance
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <Link href={`/product/${id}`}>
          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2 hover:text-primary transition-colors leading-snug" data-testid={`text-product-name-${id}`}>
            {name}
          </h3>
        </Link>
        <div className="space-y-1">
          <p className="text-lg sm:text-2xl font-bold text-primary" data-testid={`text-price-${id}`}>{priceRange}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium" data-testid={`text-moq-${id}`}>MOQ: {moq}</p>
        </div>
        <div className="pt-2 border-t border-border space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate" data-testid={`text-supplier-${id}`}>{supplierName}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground" data-testid={`text-location-${id}`}>
            {supplierCountry} • {responseRate} response
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9" data-testid={`button-contact-${id}`}>
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Contact</span>
        </Button>
        <Button size="sm" className="flex-1 text-xs sm:text-sm h-8 sm:h-9" data-testid={`button-quote-${id}`}>
          Get Quote
        </Button>
      </CardFooter>
    </Card>
  );
}
