import { Search, ArrowRight, Globe, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HeroSection() {
  return (
    <div className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-gray-500/20 to-gray-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-gray-600/10 to-gray-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/90">
                <Globe className="w-4 h-4" />
                <span>Connecting 190+ Countries</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">Leading B2B</span>
                <br />
                <span className="bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Marketplace
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl">
                Connect with verified suppliers worldwide. Get competitive quotes and scale your business globally with confidence.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                    <div className="flex items-center px-4">
                      <Search className="w-5 h-5 text-gray-400 mr-3" />
                      <Input
                        placeholder="What are you looking for?"
                        className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
                        data-testid="input-hero-search"
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48 border-0 border-l border-gray-200 rounded-none focus:ring-0 text-gray-700 bg-gray-50" data-testid="select-hero-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="machinery">Machinery</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="home">Home & Garden</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="lg" className="h-14 px-8 shadow-lg hover:shadow-xl transition-all duration-200" data-testid="button-hero-search">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 group no-default-hover-elevate" data-testid="button-start-sourcing">
                  Start Sourcing
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 no-default-hover-elevate" data-testid="button-become-supplier">
                  Become a Supplier
                </Button>
              </div>
            </div>
          </div>

          {/* Right Content - Stats Cards */}
          <div className="hidden lg:block space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 no-default-hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">200K+</div>
                      <div className="text-sm text-white/80">Active Suppliers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 no-default-hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">50M+</div>
                      <div className="text-sm text-white/80">Products</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 no-default-hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">190+</div>
                      <div className="text-sm text-white/80">Countries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 no-default-hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">10M+</div>
                      <div className="text-sm text-white/80">Buyers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
