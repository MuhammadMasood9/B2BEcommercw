import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SearchSuggestion {
  id: string;
  name: string;
  image: string;
  price: string;
  category: string;
  type: 'product' | 'category';
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  performSearch: (query: string, category?: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch search suggestions
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery<SearchSuggestion[]>({
    queryKey: ['/api/search/suggestions', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      }
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  const performSearch = useCallback((query: string, category?: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    const categoryParam = category || selectedCategory;
    // Navigate to products page with search query and category
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('search', query);
    if (categoryParam && categoryParam !== 'all') searchParams.set('category', categoryParam);
    window.location.href = `/products?${searchParams.toString()}`;
  }, [selectedCategory]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowSuggestions(false);
  }, []);

  const value: SearchContextType = {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    setShowSuggestions,
    performSearch,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
