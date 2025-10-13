import { Search, ShoppingCart, User, Globe, Menu, ChevronDown, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, isAuthenticated, logout } = useAuth();

  const isActivePath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-card border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-4 lg:gap-6 text-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 lg:gap-2 text-muted-foreground hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded-md text-xs lg:text-sm" data-testid="button-language">
                    <Globe className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">English - USD</span>
                    <span className="lg:hidden">EN-USD</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 lg:ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>English - USD</DropdownMenuItem>
                  <DropdownMenuItem>中文 - CNY</DropdownMenuItem>
                  <DropdownMenuItem>Español - EUR</DropdownMenuItem>
                  <DropdownMenuItem>Français - EUR</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3 lg:gap-6 text-xs lg:text-sm">
              <Link href="/dashboard/buyer" className="text-muted-foreground hover:text-primary transition-colors hover-elevate px-2 py-1 rounded-md" data-testid="link-buyer-center">
                Buyer Center
              </Link>
              <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors hover-elevate px-2 py-1 rounded-md" data-testid="link-help">
                Help
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors hover-elevate px-2 py-1 rounded-md" data-testid="link-signin">
                Sign In
              </Link>
              <Button size="sm" className="h-7 text-xs" data-testid="link-join" asChild>
                <Link href="/signup">Join Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group" data-testid="link-home">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Global Trade Hub</div>
              <div className="text-xs text-muted-foreground">B2B Marketplace</div>
            </div>
          </Link>

          {/* Enhanced Search Bar */}
          <div className="flex-1 max-w-3xl mx-2 sm:mx-4 hidden sm:block">
            <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 hover-elevate">
                <div className="flex items-center pl-3 sm:pl-4 pr-1 sm:pr-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  placeholder="Search products..."
                  className="flex-1 border-0 focus-visible:ring-0 h-10 sm:h-12 bg-transparent text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 px-1 sm:px-2"
                  data-testid="input-search"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                <div className="hidden md:block">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 lg:w-40 border-0 rounded-none focus:ring-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors h-10 sm:h-12 text-sm" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="machinery">Machinery</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="lighting">Lighting</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="h-10 sm:h-12 px-4 sm:px-8 rounded-none rounded-r-xl m-0 shadow-none" 
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="font-semibold hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className="sm:hidden h-10 w-10">
              <Search className="w-5 h-5" />
            </Button>
            
            {/* Cart */}
            <Link href="/inquiry-cart" data-testid="link-inquiry-cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium" data-testid="text-cart-count">
                  3
                </span>
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link href="/login" className="text-lg font-medium hover:text-primary transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-lg font-medium hover:text-primary transition-colors">
                    Join Free
                  </Link>
                  <div className="border-t pt-4">
                    <Link href="/categories" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Categories
                    </Link>
                    <Link href="/products" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Products
                    </Link>
                    <Link href="/find-suppliers" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Suppliers
                    </Link>
                    <Link href="/rfq/browse" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      RFQ
                    </Link>
                    <Link href="/ready-to-ship" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Ready to Ship
                    </Link>
                    <Link href="/trade-shows" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Trade Shows
                    </Link>
                    <Link href="/buyer-protection" className="block py-3 text-lg font-medium hover:text-primary transition-colors">
                      Buyer Protection
                    </Link>
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
                      <Link href="/dashboard/buyer">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          Buyer Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-orders">
                        <DropdownMenuItem>My Orders</DropdownMenuItem>
                      </Link>
                      <Link href="/my-rfqs">
                        <DropdownMenuItem>My RFQs</DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'supplier' && (
                    <>
                      <Link href="/dashboard/supplier">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          Supplier Dashboard
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  <Link href="/favorites">
                    <DropdownMenuItem>
                      <Bell className="w-4 h-4 mr-2" />
                      Favorites
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/messages">
                    <DropdownMenuItem>
                      <Bell className="w-4 h-4 mr-2" />
                      Messages
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
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
      <div className="border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden lg:flex items-center gap-8 h-12">
            <Link 
              href="/categories" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/categories") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-categories"
            >
              Categories
              {isActivePath("/categories") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/products" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/products") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-products"
            >
              Products
              {isActivePath("/products") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/find-suppliers" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/find-suppliers") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-suppliers"
            >
              Suppliers
              {isActivePath("/find-suppliers") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/rfq/browse" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/rfq") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-rfq"
            >
              RFQ
              {isActivePath("/rfq") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/ready-to-ship" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/ready-to-ship") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-ready-ship"
            >
              Ready to Ship
              {isActivePath("/ready-to-ship") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/trade-shows" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/trade-shows") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-trade-shows"
            >
              Trade Shows
              {isActivePath("/trade-shows") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              href="/buyer-protection" 
              className={`text-sm font-medium transition-colors hover:text-primary relative py-3 ${
                isActivePath("/buyer-protection") 
                  ? "text-primary" 
                  : "text-foreground"
              }`}
              data-testid="link-buyer-protection"
            >
              Buyer Protection
              {isActivePath("/buyer-protection") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
