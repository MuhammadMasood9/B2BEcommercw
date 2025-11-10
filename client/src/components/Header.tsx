import { Search, ShoppingCart, User, Globe, Menu, ChevronDown, LogOut, Settings, Bell, Heart, Package, FileText, MessageSquare, Truck, FileSearch, Star, ArrowRight, Plus, Store } from "lucide-react";
import CartWidget from "@/components/CartWidget";
import SearchSuggestions from "@/components/SearchSuggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useSearch } from "@/contexts/SearchContext";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { favoriteCount } = useFavorites();
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedCategory,
    setSelectedCategory,
    showSuggestions, 
    setShowSuggestions,
    performSearch 
  } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch categories for dynamic dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.slice(0, 10); // Show first 10 categories
    }
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg shadow-black/5">
      {/* Top Utility Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-8 text-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 px-4 py-2 rounded-lg text-sm font-medium" data-testid="button-language">
                    <Globe className="w-4 h-4" />
                    <span>English - USD</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem className="font-medium">English - USD</DropdownMenuItem>
                  <DropdownMenuItem>中文 - CNY</DropdownMenuItem>
                  <DropdownMenuItem>Español - EUR</DropdownMenuItem>
                  <DropdownMenuItem>Français - EUR</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-8 text-sm">
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 px-4 py-2 rounded-lg font-medium" data-testid="button-buyer-center">
                    <span>Buyer Center</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/dashboard" className="font-medium">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/inquiries">My Inquiries</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/quotations">My Quotations</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/buyer/rfqs">My RFQs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages">Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites">Favorites</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 px-4 py-2 rounded-lg text-sm font-medium" data-testid="button-sell-on-platform">
                    <span>Sell on Platform</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/supplier/register" className="font-medium">Become a Supplier</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/supplier/login">Supplier Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/suppliers">Browse Suppliers</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 px-4 py-2 rounded-lg font-medium" data-testid="link-help">
                Help
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50 px-4 py-2 rounded-lg font-medium" data-testid="link-signin">
                Sign In
              </Link>
              <Button size="sm" className="h-8 px-4 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" data-testid="link-join" asChild>
                <Link href="/signup">Join Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 flex-shrink-0 group" data-testid="link-home">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">Global Trade Hub</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">B2B Marketplace</div>
            </div>
          </Link>

          {/* Enhanced Search Bar (visible on large screens and above) */}
          <div className="flex-1 max-w-4xl mx-6 hidden lg:block">
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`} ref={searchRef}>
              <div className="relative flex items-center bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden hover:border-blue-300/80 dark:hover:border-blue-500/60 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center pl-4 pr-2 text-gray-500">
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  placeholder="Search products, suppliers, categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  className="flex-1 border-0 focus-visible:ring-0 h-12 bg-transparent text-[15px] placeholder:text-gray-500 dark:placeholder:text-gray-400 px-2 font-medium"
                  data-testid="input-search"
                  onFocus={() => {
                    setIsSearchFocused(true);
                    if (searchQuery.length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      performSearch(searchQuery, selectedCategory);
                    }
                  }}
                />
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                <div className="hidden md:block pl-1">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-35 lg:w-40 border-0 rounded-full focus:ring-0 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors h-12 text-sm font-medium px-3" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => performSearch(searchQuery, selectedCategory)}
                  className="h-12 px-6 rounded-full m-1 ml-2 shadow-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold" 
                  data-testid="button-search"
                >
                  <Search className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
              
              {/* Search Suggestions */}
              <SearchSuggestions />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile Search Button */}
            <Sheet open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
              <SheetTrigger asChild>
                {/* Show search trigger on < lg screens (small + medium) */}
                <Button variant="ghost" size="icon" className="lg:hidden h-11 w-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Search className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="w-full max-w-full mx-0 px-4 sm:px-6">
                <div ref={searchRef} className="mt-6">
                  <div className="relative flex items-center bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden hover:border-blue-300/80 dark:hover:border-blue-500/60 transition-all duration-300 shadow-sm">
                    <div className="flex items-center pl-3 pr-2">
                      <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input
                      placeholder="Search products, suppliers, categories..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(e.target.value.length >= 2);
                      }}
                      className="flex-1 border-0 focus-visible:ring-0 h-11 bg-transparent text-[15px] placeholder:text-gray-500 dark:placeholder:text-gray-400 px-2 font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          performSearch(searchQuery, selectedCategory);
                          setIsMobileSearchOpen(false);
                        }
                      }}
                    />
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40 border-0 rounded-full focus:ring-0 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors h-11 text-sm font-medium px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => { performSearch(searchQuery, selectedCategory); setIsMobileSearchOpen(false); }}
                      className="h-11 px-6 rounded-full m-1 ml-2 shadow-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                  {/* Suggestions in mobile search */}
                  <div className="mt-3">
                    <SearchSuggestions />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Favorites */}
            <Link href="/favorites" data-testid="link-favorites">
              <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                <Heart className="w-5 h-5" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg" data-testid="text-favorites-count">
                    {favoriteCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <CartWidget />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 h-full overflow-y-auto">
                <div className="flex flex-col space-y-4 mt-8 pb-8">
                  {isAuthenticated ? (
                    <>
                      <div className="px-1">
                        <div className="text-base font-semibold">{user?.firstName} {user?.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                      <div className="border-t pt-4">
                        {user?.role === 'admin' && (
                          <Link href="/admin" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Admin Panel</Link>
                        )}
                        {user?.role === 'buyer' && (
                          <>
                            <Link href="/buyer/dashboard" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Buyer Dashboard</Link>
                            <Link href="/my-orders" className="block py-3 text-lg font-medium hover:text-primary transition-colors">My Orders</Link>
                            <Link href="/buyer/inquiries" className="block py-3 text-lg font-medium hover:text-primary transition-colors">My Inquiries</Link>
                            <Link href="/buyer/quotations" className="block py-3 text-lg font-medium hover:text-primary transition-colors">My Quotations</Link>
                            <Link href="/track-order" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Track Order</Link>
                            <Link href="/buyer/rfqs" className="block py-3 text-lg font-medium hover:text-primary transition-colors">My RFQs</Link>
                            <Link href="/rfq/create" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Create RFQ</Link>
                          </>
                        )}
                        {user?.role === 'supplier' && (
                          <>
                            <Link href="/supplier/dashboard" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Supplier Dashboard</Link>
                            <Link href="/supplier/products" className="block py-3 text-lg font-medium hover:text-primary transition-colors">My Products</Link>
                            <Link href="/supplier/inquiries" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Inquiries</Link>
                            <Link href="/supplier/orders" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Orders</Link>
                            <Link href="/supplier/store" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Store Settings</Link>
                          </>
                        )}
                        <Link href="/favorites" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Favorites</Link>
                        <Link href="/messages" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Messages</Link>
                        <button onClick={() => logout()} className="text-left w-full py-3 text-lg font-medium text-red-600">Sign Out</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-lg font-medium hover:text-primary transition-colors">Sign In</Link>
                      <Link href="/signup" className="text-lg font-medium hover:text-primary transition-colors">Join Free</Link>
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-semibold text-gray-500 mb-2">For Suppliers</div>
                        <Link href="/supplier/register" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Become a Supplier</Link>
                        <Link href="/supplier/login" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Supplier Login</Link>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-4">
                    <Link href="/categories" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Categories</Link>
                    <Link href="/products" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Products</Link>
                    <Link href="/suppliers" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Suppliers</Link>
                    {/* <Link href="/ready-to-ship" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Ready to Ship</Link> */}
                    <Link href="/buyer-protection" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Buyer Protection</Link>
                    <Link href="/chat" className="block py-3 text-lg font-medium hover:text-primary transition-colors">Chat Support</Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex h-10 px-3" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="" alt={user?.firstName} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block">{user?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {user?.role === 'admin' && (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {user?.role === 'buyer' && (
                    <>
                      <Link href="/buyer/dashboard">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          Buyer Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-orders">
                        <DropdownMenuItem>
                          <Package className="w-4 h-4 mr-2" />
                          My Orders
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/buyer/inquiries">
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          My Inquiries
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/buyer/quotations">
                        <DropdownMenuItem>
                          <FileSearch className="w-4 h-4 mr-2" />
                          My Quotations
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/track-order">
                        <DropdownMenuItem>
                          <Truck className="w-4 h-4 mr-2" />
                          Track Order
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/buyer/rfqs">
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          My RFQs
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/rfq/create">
                        <DropdownMenuItem>
                          <Plus className="w-4 h-4 mr-2" />
                          Create RFQ
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'supplier' && (
                    <>
                      <Link href="/supplier/dashboard">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          Supplier Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/supplier/products">
                        <DropdownMenuItem>
                          <Package className="w-4 h-4 mr-2" />
                          My Products
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/supplier/inquiries">
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Inquiries
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/supplier/orders">
                        <DropdownMenuItem>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Orders
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/supplier/store">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Store Settings
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  
                  <Link href="/favorites">
                    <DropdownMenuItem>
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/messages">
                    <DropdownMenuItem>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-red-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Join Free
                  </Button>
                </Link>
                <Link href="/admin/login">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden lg:flex items-center gap-2 h-14">
            <Link 
              href="/categories" 
              className={`text-sm font-semibold transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 relative py-4 px-6 rounded-xl ${
                isActivePath("/categories") 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
              data-testid="link-categories"
            >
              Categories
            </Link>
            <Link 
              href="/products" 
              className={`text-sm font-semibold transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 relative py-4 px-6 rounded-xl ${
                isActivePath("/products") 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
              data-testid="link-products"
            >
              Products
            </Link>
            <Link 
              href="/suppliers" 
              className={`text-sm font-semibold transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 relative py-4 px-6 rounded-xl ${
                isActivePath("/suppliers") 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
              data-testid="link-suppliers"
            >
              Suppliers
            </Link>
            {/* <Link 
              href="/ready-to-ship" 
              className={`text-sm font-semibold transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 relative py-4 px-6 rounded-xl ${
                isActivePath("/ready-to-ship") 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
              data-testid="link-ready-ship"
            >
              Ready to Ship
            </Link> */}
            <Link 
              href="/buyer-protection" 
              className={`text-sm font-semibold transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 relative py-4 px-6 rounded-xl ${
                isActivePath("/buyer-protection") 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
              data-testid="link-buyer-protection"
            >
              Buyer Protection
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
