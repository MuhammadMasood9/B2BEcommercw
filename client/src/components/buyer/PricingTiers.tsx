import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Minus, 
  Plus, 
  Info, 
  TrendingDown, 
  Package,
  Calculator
} from "lucide-react";

interface PriceRange {
  minQty: number;
  maxQty?: number;
  pricePerUnit: number;
}

interface PricingTiersProps {
  priceRanges: any;
  minOrderQuantity: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export default function PricingTiers({ 
  priceRanges, 
  minOrderQuantity, 
  quantity, 
  onQuantityChange 
}: PricingTiersProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  // Parse price ranges
  const parsedRanges: PriceRange[] = priceRanges ? 
    (typeof priceRanges === 'string' ? JSON.parse(priceRanges) : priceRanges) : [];

  // Ensure we have valid price ranges
  const validRanges = Array.isArray(parsedRanges) ? parsedRanges : [];

  // Calculate current price based on quantity
  const getCurrentPrice = (qty: number): number => {
    if (validRanges.length === 0) return 0;
    
    for (const range of validRanges) {
      if (qty >= range.minQty && (!range.maxQty || qty <= range.maxQty)) {
        return Number(range.pricePerUnit);
      }
    }
    
    // If no exact match, use the last range (highest quantity tier)
    return Number(validRanges[validRanges.length - 1].pricePerUnit);
  };

  const currentPrice = getCurrentPrice(quantity);
  const totalPrice = currentPrice * quantity;

  // Calculate savings compared to lowest tier
  const lowestTierPrice = validRanges.length > 0 ? Number(validRanges[0].pricePerUnit) : 0;
  const savings = lowestTierPrice > currentPrice ? 
    ((lowestTierPrice - currentPrice) / lowestTierPrice * 100) : 0;

  // Update selected tier when quantity changes
  useEffect(() => {
    const tierIndex = validRanges.findIndex(range => 
      quantity >= range.minQty && (!range.maxQty || quantity <= range.maxQty)
    );
    setSelectedTier(tierIndex >= 0 ? tierIndex : validRanges.length - 1);
  }, [quantity, validRanges]);

  const handleQuantityChange = (newQuantity: number) => {
    const adjustedQuantity = Math.max(newQuantity, minOrderQuantity);
    onQuantityChange(adjustedQuantity);
  };

  const handleTierSelect = (range: PriceRange) => {
    onQuantityChange(range.minQty);
  };

  const incrementQuantity = (amount: number) => {
    handleQuantityChange(quantity + amount);
  };

  const decrementQuantity = (amount: number) => {
    handleQuantityChange(quantity - amount);
  };

  if (validRanges.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center">
            <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Contact supplier for pricing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Price Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${currentPrice.toFixed(2)}
              <span className="text-lg text-gray-600 ml-2">per piece</span>
            </div>
            
            {savings > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <Badge className="bg-green-100 text-green-800">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {savings.toFixed(1)}% savings
                </Badge>
              </div>
            )}

            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">${totalPrice.toLocaleString()}</span>
              {quantity > 1 && (
                <span className="ml-2">({quantity.toLocaleString()} pieces)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quantity Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Order Quantity:</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => decrementQuantity(10)}
              disabled={quantity <= minOrderQuantity}
              className="h-10 w-10 p-0 hover:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              className="w-24 h-10 text-center border-0 font-medium"
              min={minOrderQuantity}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => incrementQuantity(10)}
              className="h-10 w-10 p-0 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick quantity buttons */}
        <div className="flex gap-2 flex-wrap">
          {validRanges.map((range, idx) => (
            <Button
              key={idx}
              variant={selectedTier === idx ? "default" : "outline"}
              size="sm"
              onClick={() => handleTierSelect(range)}
              className="text-xs"
            >
              {range.minQty}+ pcs
            </Button>
          ))}
        </div>

        {/* MOQ Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <Info className="w-4 h-4" />
            <span className="font-medium">
              Minimum Order Quantity: {minOrderQuantity.toLocaleString()} pieces
            </span>
          </div>
        </div>
      </div>

      {/* Price Tiers Table */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Volume Pricing Tiers
        </h4>
        
        <div className="space-y-2">
          {validRanges.map((range, idx) => {
            const isSelected = selectedTier === idx;
            const tierSavings = lowestTierPrice > range.pricePerUnit ? 
              ((lowestTierPrice - range.pricePerUnit) / lowestTierPrice * 100) : 0;

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleTierSelect(range)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {range.minQty.toLocaleString()}
                      {range.maxQty ? `-${range.maxQty.toLocaleString()}` : '+'} pieces
                    </div>
                    {tierSavings > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        Save {tierSavings.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      ${Number(range.pricePerUnit).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">per piece</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Breakdown */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Unit Price:</span>
              <span className="font-medium">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{quantity.toLocaleString()} pieces</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span className="text-blue-600">${totalPrice.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * Shipping and taxes not included
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}