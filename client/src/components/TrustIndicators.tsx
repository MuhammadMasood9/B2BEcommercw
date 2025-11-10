import { Star, Clock, TrendingUp, CheckCircle, Award, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VerificationBadge from "./VerificationBadge";

interface TrustIndicatorsProps {
  supplier: {
    isVerified: boolean;
    verificationLevel: string;
    rating: string | number;
    totalReviews: number;
    responseRate: string | number;
    responseTime?: string;
    totalOrders: number;
    yearEstablished?: number;
  };
  variant?: 'compact' | 'detailed';
  className?: string;
}

export default function TrustIndicators({ supplier, variant = 'compact', className = '' }: TrustIndicatorsProps) {
  const rating = typeof supplier.rating === 'string' ? parseFloat(supplier.rating) : supplier.rating;
  const responseRate = typeof supplier.responseRate === 'string' ? parseFloat(supplier.responseRate) : supplier.responseRate;

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        {/* Verification Badge */}
        {supplier.isVerified && (
          <VerificationBadge 
            level={supplier.verificationLevel as any}
            isVerified={supplier.isVerified}
            size="sm"
          />
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({supplier.totalReviews})</span>
        </div>

        {/* Response Rate */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{responseRate.toFixed(0)}%</span>
        </div>

        {/* Response Time */}
        {supplier.responseTime && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{supplier.responseTime}</span>
          </div>
        )}

        {/* Total Orders */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span>{supplier.totalOrders} orders</span>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Trust & Verification
        </h3>

        <div className="space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Verification Status</span>
            <VerificationBadge 
              level={supplier.verificationLevel as any}
              isVerified={supplier.isVerified}
              size="md"
            />
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Supplier Rating</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">({supplier.totalReviews} reviews)</span>
            </div>
          </div>

          {/* Response Rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Response Rate</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-semibold">{responseRate.toFixed(0)}%</span>
            </div>
          </div>

          {/* Response Time */}
          {supplier.responseTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">{supplier.responseTime}</span>
              </div>
            </div>
          )}

          {/* Total Orders */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Orders</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">{supplier.totalOrders}</span>
            </div>
          </div>

          {/* Years in Business */}
          {supplier.yearEstablished && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Years in Business</span>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">{new Date().getFullYear() - supplier.yearEstablished} years</span>
              </div>
            </div>
          )}
        </div>

        {/* Trust Score Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Trust Score</span>
            <span className="text-sm font-bold text-primary">{calculateTrustScore(supplier)}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateTrustScore(supplier)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calculate trust score based on various factors
function calculateTrustScore(supplier: any): number {
  let score = 0;

  // Verification level (0-30 points)
  if (supplier.verificationLevel === 'premium') score += 30;
  else if (supplier.verificationLevel === 'business') score += 20;
  else if (supplier.verificationLevel === 'basic') score += 10;

  // Rating (0-25 points)
  const rating = typeof supplier.rating === 'string' ? parseFloat(supplier.rating) : supplier.rating;
  score += (rating / 5) * 25;

  // Response rate (0-20 points)
  const responseRate = typeof supplier.responseRate === 'string' ? parseFloat(supplier.responseRate) : supplier.responseRate;
  score += (responseRate / 100) * 20;

  // Total orders (0-15 points)
  if (supplier.totalOrders >= 100) score += 15;
  else if (supplier.totalOrders >= 50) score += 10;
  else if (supplier.totalOrders >= 10) score += 5;

  // Years in business (0-10 points)
  if (supplier.yearEstablished) {
    const years = new Date().getFullYear() - supplier.yearEstablished;
    if (years >= 10) score += 10;
    else if (years >= 5) score += 7;
    else if (years >= 2) score += 4;
  }

  return Math.min(Math.round(score), 100);
}
