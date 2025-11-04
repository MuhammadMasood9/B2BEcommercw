import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  Star
} from "lucide-react";
import type { ProductFilters } from "./AdvancedProductFilters";

interface SavedSearch {
  id: string;
  name: string;
  filters: ProductFilters;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  searchCount?: number;
  lastUsed?: string;
}

interface SavedSearchesProps {
  currentFilters: ProductFilters;
  onLoadSearch: (filters: ProductFilters) => void;
  onSaveSearch: (name: string, filters: ProductFilters) => void;
  className?: string;
}

export default function SavedSearches({
  currentFilters,
  onLoadSearch,
  onSaveSearch,
  className = ""
}: SavedSearchesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved searches
  const { data: savedSearches = [], isLoading } = useQuery<SavedSearch[]>({
    queryKey: ["/api/saved-searches"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/saved-searches", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch saved searches");
        return response.json();
      } catch (error) {
        console.error("Error fetching saved searches:", error);
        return [];
      }
    },
  });

  // Save search mutation
  const saveSearchMutation = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: ProductFilters }) => {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, filters }),
      });
      if (!response.ok) throw new Error("Failed to save search");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: "Search Saved",
        description: "Your search has been saved successfully.",
      });
      setIsDialogOpen(false);
      setSearchName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save search",
        variant: "destructive",
      });
    },
  });

  // Update search mutation
  const updateSearchMutation = useMutation({
    mutationFn: async ({ id, name, filters }: { id: string; name: string; filters: ProductFilters }) => {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, filters }),
      });
      if (!response.ok) throw new Error("Failed to update search");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: "Search Updated",
        description: "Your search has been updated successfully.",
      });
      setEditingSearch(null);
      setSearchName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update search",
        variant: "destructive",
      });
    },
  });

  // Delete search mutation
  const deleteSearchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete search");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: "Search Deleted",
        description: "Your saved search has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete search",
        variant: "destructive",
      });
    },
  });

  // Track search usage mutation
  const trackUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/saved-searches/${id}/use`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to track usage");
    },
  });

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;

    if (editingSearch) {
      updateSearchMutation.mutate({
        id: editingSearch.id,
        name: searchName.trim(),
        filters: currentFilters,
      });
    } else {
      saveSearchMutation.mutate({
        name: searchName.trim(),
        filters: currentFilters,
      });
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters);
    trackUsageMutation.mutate(search.id);
    toast({
      title: "Search Loaded",
      description: `Applied filters from "${search.name}"`,
    });
  };

  const handleEditSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    setSearchName(search.name);
    setIsDialogOpen(true);
  };

  const handleDeleteSearch = (search: SavedSearch) => {
    if (window.confirm(`Are you sure you want to delete "${search.name}"?`)) {
      deleteSearchMutation.mutate(search.id);
    }
  };

  const getFilterSummary = (filters: ProductFilters) => {
    const summary = [];
    if (filters.search) summary.push(`"${filters.search}"`);
    if (filters.categoryId !== "all") summary.push("Category");
    if (filters.verifiedOnly) summary.push("Verified");
    if (filters.tradeAssuranceOnly) summary.push("Trade Assurance");
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) summary.push("Price Range");
    if (filters.supplierCountries.length > 0) summary.push(`${filters.supplierCountries.length} Countries`);
    
    return summary.length > 0 ? summary.slice(0, 3).join(", ") : "No filters";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bookmark className="w-5 h-5" />
            Saved Searches
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                setEditingSearch(null);
                setSearchName("");
              }}>
                <Plus className="w-4 h-4 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSearch ? "Edit Saved Search" : "Save Current Search"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Search Name</label>
                  <Input
                    placeholder="Enter a name for this search..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Current Filters</label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {getFilterSummary(currentFilters)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSaveSearch}
                    disabled={!searchName.trim() || saveSearchMutation.isPending || updateSearchMutation.isPending}
                    className="flex-1"
                  >
                    {editingSearch ? "Update Search" : "Save Search"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSearch(null);
                      setSearchName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : savedSearches.length > 0 ? (
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="group p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => handleLoadSearch(search)}
                        className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {search.name}
                      </button>
                      {search.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {getFilterSummary(search.filters)}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(search.createdAt)}
                      </span>
                      {search.searchCount && (
                        <span className="flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          Used {search.searchCount} times
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleLoadSearch(search)}>
                        <Search className="w-4 h-4 mr-2" />
                        Apply Search
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditSearch(search)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSearch(search)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">No saved searches yet</p>
            <p className="text-xs text-gray-400">
              Save your current filters to quickly access them later
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}