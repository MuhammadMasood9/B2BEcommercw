import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Filter, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Shield, 
  Award, 
  Truck, 
  Package,
  Star,
  RefreshCw,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import type { Category } from "@shared/schema";

export interface ProductFilters {
  search: string;
  categoryId: string;
  priceRange: [number, number];
  moqRange: [number, number];
  supplierCountries: string[];
  supplierTypes: string[];
  verifiedOnly: boolean;
  tradeAssuranceOnly: boolean;
  readyToShipOnly: boolean;
  sampleAvailableOnly: boolean;
  customizationAvailableOnly: boolean;
  certifications: string[];
  paymentTerms: string[];
  leadTimeRange: string;
  minRating: number;
  inStockOnly: boolean;
}

interface AdvancedProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onSaveSearch?: (name: string, filters: ProductFilters) => void;
  savedSearches?: Array<{ id: string; name: string; filters: ProductFilters }>;
  onLoadSavedSearch?: (filters: ProductFilters) => void;
  className?: string;
}

const defaultFilters: ProductFilters = {
  search: "",
  categoryId: "all",
  priceRange: [0, 10000],
  moqRange: [1, 50000],
  supplierCountries: [],
  supplierTypes: [],
  verifiedOnly: false,
  tradeAssuranceOnly: false,
  readyToShipOnly: false,
  sampleAvailableOnly: false,
  customizationAvailableOnly: false,
  certifications: [],
  paymentTerms: [],
  leadTimeRange: "all",
  minRating: 0,
  inStockOnly: false,
};

export default function AdvancedProductFilters({
  filters,
  onFiltersChange,
  onSaveSearch,
  savedSearches = [],
  onLoadSavedSearch,
  className = ""
}: AdvancedProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch categories");
        return response.json();
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  // Fetch search suggestions based on current search term
  useEffect(() => {
    if (filters.search.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await fetch(`/api/products/search-suggestions?q=${encodeURIComponent(filters.search)}`, {
            credentials: "include"
          });
          if (response.ok) {
            const suggestions = await response.json();
            setSearchSuggestions(suggestions.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Error fetching search suggestions:", error);
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setShowSuggestions(false);
    }
  }, [filters.search]);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof ProductFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray as any);
  };

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName("");
      setShowSaveDialog(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categoryId !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.moqRange[0] > 1 || filters.moqRange[1] < 50000) count++;
    if (filters.supplierCountries.length > 0) count++;
    if (filters.supplierTypes.length > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.tradeAssuranceOnly) count++;
    if (filters.readyToShipOnly) count++;
    if (filters.sampleAvailableOnly) count++;
    if (filters.customizationAvailableOnly) count++;
    if (filters.certifications.length > 0) count++;
    if (filters.paymentTerms.length > 0) count++;
    if (filters.leadTimeRange !== "all") count++;
    if (filters.minRating > 0) count++;
    if (filters.inStockOnly) count++;
    return count;
  };

  const supplierCountries = [
    "China", "United States", "Germany", "India", "United Kingdom", 
    "Japan", "South Korea", "Italy", "France", "Turkey", "Vietnam", "Thailand"
  ];

  const supplierTypes = [
    "manufacturer", "trading-company", "wholesaler", "distributor"
  ];

  const certificationOptions = [
    "ISO 9001", "ISO 14001", "CE Mark", "RoHS", "FCC", "FDA", "HACCP", "GMP", "BSCI", "Sedex"
  ];

  const paymentTermOptions = [
    "T/T", "L/C", "PayPal", "Western Union", "MoneyGram", "Escrow", "Cash", "Credit Card"
  ];

  const leadTimeOptions = [
    { value: "all", label: "Any Lead Time" },
    { value: "1-7", label: "1-7 days" },
    { value: "8-15", label: "8-15 days" },
    { value: "16-30", label: "16-30 days" },
    { value: "31-60", label: "31-60 days" },
    { value: "60+", label: "60+ days" }
  ];

  return (
    <Card className={`sticky top-4 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search with Autocomplete */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Products</Label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by product name, description, or keywords..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => updateFilter("search", "")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      updateFilter("search", suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={filters.categoryId} onValueChange={(value) => updateFilter("categoryId", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range (USD)</Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
            max={10000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>

        {/* MOQ Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Minimum Order Quantity</Label>
          <Slider
            value={filters.moqRange}
            onValueChange={(value) => updateFilter("moqRange", value as [number, number])}
            max={50000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{filters.moqRange[0]} pcs</span>
            <span>{filters.moqRange[1]} pcs</span>
          </div>
        </div>

        <Separator />

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => updateFilter("verifiedOnly", checked === true)}
              />
              <Label htmlFor="verified" className="text-sm flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-600" />
                Verified Suppliers Only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trade-assurance"
                checked={filters.tradeAssuranceOnly}
                onCheckedChange={(checked) => updateFilter("tradeAssuranceOnly", checked === true)}
              />
              <Label htmlFor="trade-assurance" className="text-sm flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-600" />
                Trade Assurance
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ready-ship"
                checked={filters.readyToShipOnly}
                onCheckedChange={(checked) => updateFilter("readyToShipOnly", checked === true)}
              />
              <Label htmlFor="ready-ship" className="text-sm flex items-center gap-1">
                <Truck className="w-3 h-3 text-orange-600" />
                Ready to Ship
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sample-available"
                checked={filters.sampleAvailableOnly}
                onCheckedChange={(checked) => updateFilter("sampleAvailableOnly", checked === true)}
              />
              <Label htmlFor="sample-available" className="text-sm flex items-center gap-1">
                <Package className="w-3 h-3 text-purple-600" />
                Sample Available
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStockOnly}
                onCheckedChange={(checked) => updateFilter("inStockOnly", checked === true)}
              />
              <Label htmlFor="in-stock" className="text-sm">
                In Stock Only
              </Label>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            <Separator />

            {/* Supplier Countries */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Supplier Countries
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {supplierCountries.map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country}`}
                      checked={filters.supplierCountries.includes(country)}
                      onCheckedChange={() => toggleArrayFilter("supplierCountries", country)}
                    />
                    <Label htmlFor={`country-${country}`} className="text-xs">
                      {country}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Supplier Type</Label>
              <div className="space-y-2">
                {supplierTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.supplierTypes.includes(type)}
                      onCheckedChange={() => toggleArrayFilter("supplierTypes", type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm capitalize">
                      {type.replace("-", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                Minimum Rating
              </Label>
              <Select 
                value={filters.minRating.toString()} 
                onValueChange={(value) => updateFilter("minRating", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Time */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Lead Time</Label>
              <Select 
                value={filters.leadTimeRange} 
                onValueChange={(value) => updateFilter("leadTimeRange", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Certifications */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Certifications</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {certificationOptions.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cert-${cert}`}
                      checked={filters.certifications.includes(cert)}
                      onCheckedChange={() => toggleArrayFilter("certifications", cert)}
                    />
                    <Label htmlFor={`cert-${cert}`} className="text-xs">
                      {cert}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Terms</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentTermOptions.map((term) => (
                  <div key={term} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${term}`}
                      checked={filters.paymentTerms.includes(term)}
                      onCheckedChange={() => toggleArrayFilter("paymentTerms", term)}
                    />
                    <Label htmlFor={`payment-${term}`} className="text-xs">
                      {term}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                Saved Searches
              </Label>
              <div className="space-y-2">
                {savedSearches.map((savedSearch) => (
                  <Button
                    key={savedSearch.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => onLoadSavedSearch?.(savedSearch.filters)}
                  >
                    <BookmarkCheck className="w-3 h-3 mr-2" />
                    {savedSearch.name}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Save Search */}
        {onSaveSearch && (
          <>
            <Separator />
            <div className="space-y-3">
              {!showSaveDialog ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Current Search
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter search name..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSaveDialog(false);
                        setSaveSearchName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}