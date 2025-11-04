import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, List, ArrowUpDown } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
  description?: string;
}

interface ProductSortingProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalResults: number;
  isLoading?: boolean;
  className?: string;
}

const sortOptions: SortOption[] = [
  { 
    value: "relevance", 
    label: "Best Match", 
    description: "Most relevant to your search" 
  },
  { 
    value: "price-low", 
    label: "Price: Low to High", 
    description: "Lowest price first" 
  },
  { 
    value: "price-high", 
    label: "Price: High to Low", 
    description: "Highest price first" 
  },
  { 
    value: "newest", 
    label: "Newest First", 
    description: "Recently added products" 
  },
  { 
    value: "rating", 
    label: "Highest Rated", 
    description: "Best customer reviews" 
  },
  { 
    value: "popularity", 
    label: "Most Popular", 
    description: "Most viewed products" 
  },
  { 
    value: "moq-low", 
    label: "MOQ: Low to High", 
    description: "Lowest minimum order quantity" 
  },
  { 
    value: "moq-high", 
    label: "MOQ: High to Low", 
    description: "Highest minimum order quantity" 
  },
  { 
    value: "lead-time", 
    label: "Shortest Lead Time", 
    description: "Fastest delivery" 
  },
];

export default function ProductSorting({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
  isLoading = false,
  className = ""
}: ProductSortingProps) {
  const currentSort = sortOptions.find(option => option.value === sortBy);

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
      {/* Results Count */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isLoading ? "Loading..." : `${totalResults.toLocaleString()} Products`}
          </h2>
          <p className="text-sm text-gray-500">
            {isLoading ? "Searching products..." : "Found matching your criteria"}
          </p>
        </div>
        
        {totalResults > 0 && !isLoading && (
          <Badge variant="secondary" className="hidden sm:flex">
            {totalResults.toLocaleString()} results
          </Badge>
        )}
      </div>
      
      {/* Sorting and View Controls */}
      <div className="flex items-center gap-4">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {currentSort?.label || "Sort by"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-gray-500">{option.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-none border-0 px-3"
            title="Grid View"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="rounded-none border-0 px-3"
            title="List View"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}