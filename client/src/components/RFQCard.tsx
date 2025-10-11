import { Clock, MapPin, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface RFQCardProps {
  id: string;
  title: string;
  quantity: string;
  budget?: string;
  location: string;
  timeRemaining: string;
  quotations: number;
  category: string;
}

export default function RFQCard({
  id,
  title,
  quantity,
  budget,
  location,
  timeRemaining,
  quotations,
  category,
}: RFQCardProps) {
  return (
    <Card className="group hover-elevate transition-all duration-300 hover:shadow-xl" data-testid={`card-rfq-${id}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
          <Link href={`/rfq/${id}`} className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2 hover:text-primary transition-colors" data-testid={`text-rfq-title-${id}`}>
              {title}
            </h3>
          </Link>
          <Badge className="flex-shrink-0 self-start text-xs" data-testid={`badge-category-${id}`}>{category}</Badge>
        </div>
        
        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium" data-testid={`text-quantity-${id}`}>{quantity}</span>
          </div>
          {budget && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Target Price:</span>
              <span className="font-medium text-primary" data-testid={`text-budget-${id}`}>{budget}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span data-testid={`text-location-${id}`}>{location}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-border gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span data-testid={`text-time-${id}`}>{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              <span data-testid={`text-quotations-${id}`}>{quotations} quotes</span>
            </div>
          </div>
          <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9" data-testid={`button-send-quote-${id}`}>Send Quote</Button>
        </div>
      </CardContent>
    </Card>
  );
}
