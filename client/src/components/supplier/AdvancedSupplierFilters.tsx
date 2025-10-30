import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Filter,
  X,
  MapPin,
  Building,
  Shield,
  Crown,
  Star
} from "lucide-react";

interface FilterOptions {
  countries: Array<{ value: string; label: string; count: number }>;
  businessTypes: Array<{ value: string; label: string; count: number }>;
  verificationLevels: Array<{ value: string; label: string; count: number }>;
  membershipTiers: Array<{ value: string; label: string; count: number }>;
}

interface Filters {
  country: string;
  businessType: string;
  verificationLevel: string;
  membershipTier: string;
  minRating: string;
  minProducts: number;
  maxProducts: number;
  responseRate: number;
  isVerified: boolean;
  hasTradeAssurance: boolean;
}

interface AdvancedSupplierFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdvancedSupplierFilters({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}: AdvancedSupplierFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    businessTypes: [],
    verificationLevels: [],
    membershipTiers: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/suppliers/filters/options');
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      country: "",
      businessType: "",
      verificationLevel: "",
      membershipTier: "",
      minRating: "",
      minProducts: 0,
      maxProducts: 1000,
      responseRate: 0,
      isVerified: false,
      hasTradeAssurance: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.country) count++;
    if (filters.businessType) count++;
    if (filters.verificationLevel) count++;
    if (filters.membershipTier) count++;
    if (filters.minRating) count++;
    if (filters.minProducts > 0) count++;
    if (filters.maxProducts < 1000) count++;
    if (filters.responseRate > 0) count++;
    if (filters.isVerified) count++;
    if (filters.hasTradeAssurance) count++;
    return count;
  };

  const formatBusinessType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatVerificationLevel = (level: string) => {
    return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatMembershipTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Advanced Filters
        {getActiveFilterCount() > 0 && (
          <Badge className="ml-2 h-5 w-5 p-0 text-xs">
            {getActiveFilterCount()}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Location Filters */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Select value={filters.country} onValueChange={(value) => updateFilter('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Countries</SelectItem>
              {filterOptions.countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label} ({country.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Business Type */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Building className="w-4 h-4" />
            Business Type
          </Label>
          <Select value={filters.businessType} onValueChange={(value) => updateFilter('businessType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {filterOptions.businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {formatBusinessType(type.label)} ({type.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Verification & Trust */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4" />
            Verification & Trust
          </Label>
          <div className="space-y-3">
            <Select value={filters.verificationLevel} onValueChange={(value) => updateFilter('verificationLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Verification level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Level</SelectItem>
                {filterOptions.verificationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {formatVerificationLevel(level.label)} ({level.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.isVerified}
                onCheckedChange={(checked) => updateFilter('isVerified', checked)}
              />
              <Label htmlFor="verified" className="text-sm">
                Verified suppliers only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tradeAssurance"
                checked={filters.hasTradeAssurance}
                onCheckedChange={(checked) => updateFilter('hasTradeAssurance', checked)}
              />
              <Label htmlFor="tradeAssurance" className="text-sm">
                Trade Assurance available
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Membership Tier */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4" />
            Membership Tier
          </Label>
          <Select value={filters.membershipTier} onValueChange={(value) => updateFilter('membershipTier', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select membership tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tiers</SelectItem>
              {filterOptions.membershipTiers.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {formatMembershipTier(tier.label)} ({tier.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" />
            Minimum Rating
          </Label>
          <Select value={filters.minRating} onValueChange={(value) => updateFilter('minRating', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Rating</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
              <SelectItem value="4.0">4.0+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
              <SelectItem value="3.0">3.0+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Product Count Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Number of Products: {filters.minProducts} - {filters.maxProducts === 1000 ? '1000+' : filters.maxProducts}
          </Label>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Minimum Products</Label>
              <Slider
                value={[filters.minProducts]}
                onValueChange={([value]) => updateFilter('minProducts', value)}
                max={500}
                step={10}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Maximum Products</Label>
              <Slider
                value={[filters.maxProducts === 1000 ? 500 : filters.maxProducts]}
                onValueChange={([value]) => updateFilter('maxProducts', value === 500 ? 1000 : value)}
                max={500}
                step={10}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Response Rate */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Minimum Response Rate: {filters.responseRate}%
          </Label>
          <Slider
            value={[filters.responseRate]}
            onValueChange={([value]) => updateFilter('responseRate', value)}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>

        {/* Active Filters Summary */}
        {getActiveFilterCount() > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Active Filters ({getActiveFilterCount()})
              </Label>
              <div className="flex flex-wrap gap-2">
                {filters.country && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.country}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('country', '')}
                    />
                  </Badge>
                )}
                {filters.businessType && (
                  <Badge variant="secondary" className="text-xs">
                    {formatBusinessType(filters.businessType)}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('businessType', '')}
                    />
                  </Badge>
                )}
                {filters.verificationLevel && (
                  <Badge variant="secondary" className="text-xs">
                    {formatVerificationLevel(filters.verificationLevel)}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('verificationLevel', '')}
                    />
                  </Badge>
                )}
                {filters.membershipTier && (
                  <Badge variant="secondary" className="text-xs">
                    {formatMembershipTier(filters.membershipTier)}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('membershipTier', '')}
                    />
                  </Badge>
                )}
                {filters.minRating && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.minRating}+ Stars
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('minRating', '')}
                    />
                  </Badge>
                )}
                {filters.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified Only
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('isVerified', false)}
                    />
                  </Badge>
                )}
                {filters.hasTradeAssurance && (
                  <Badge variant="secondary" className="text-xs">
                    Trade Assurance
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => updateFilter('hasTradeAssurance', false)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}