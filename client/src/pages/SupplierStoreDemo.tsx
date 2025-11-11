import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupplierCard from "@/components/SupplierCard";
import {
  Store,
  ExternalLink,
  Package,
  Star,
  MapPin,
  Building2,
  Globe,
  Award,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  ArrowRight,
  Eye,
  Heart,
  MessageSquare,
  Zap
} from "lucide-react";

export default function SupplierStoreDemo() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [storeSlug, setStoreSlug] = useState("tech-innovations-ltd");

  // Sample supplier data for demonstration
  const sampleSuppliers = [
    {
      id: "1",
      storeName: "Tech Innovations Ltd",
      storeSlug: "tech-innovations-ltd",
      storeDescription: "Leading manufacturer of electronic components and IoT devices with over 15 years of experience in the industry.",
      storeLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
      storeBanner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop",
      businessName: "Tech Innovations Ltd",
      businessType: "manufacturer",
      country: "USA",
      city: "San Francisco",
      mainProducts: ["Electronic Components", "IoT Devices", "Sensors", "Microcontrollers"],
      verificationLevel: "premium",
      isVerified: true,
      isFeatured: true,
      rating: "4.8",
      totalReviews: 127,
      responseRate: "98",
      responseTime: "< 2h",
      totalOrders: 1250,
      yearEstablished: 2008
    },
    {
      id: "2",
      storeName: "Global Textiles Co",
      storeSlug: "global-textiles-co",
      storeDescription: "Premium textile manufacturer specializing in sustainable fabrics and custom textile solutions.",
      storeLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
      storeBanner: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
      businessName: "Global Textiles Co",
      businessType: "manufacturer",
      country: "China",
      city: "Guangzhou",
      mainProducts: ["Cotton Fabrics", "Synthetic Textiles", "Eco-friendly Materials"],
      verificationLevel: "business",
      isVerified: true,
      isFeatured: false,
      rating: "4.6",
      totalReviews: 89,
      responseRate: "95",
      responseTime: "< 4h",
      totalOrders: 890,
      yearEstablished: 2003
    },
    {
      id: "3",
      storeName: "Precision Machinery",
      storeSlug: "precision-machinery",
      storeDescription: "Industrial machinery and automation solutions for manufacturing industries worldwide.",
      storeLogo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop",
      storeBanner: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=400&fit=crop",
      businessName: "Precision Machinery Corp",
      businessType: "manufacturer",
      country: "Germany",
      city: "Munich",
      mainProducts: ["CNC Machines", "Automation Equipment", "Industrial Robots"],
      verificationLevel: "business",
      isVerified: true,
      isFeatured: true,
      rating: "4.9",
      totalReviews: 45,
      responseRate: "100",
      responseTime: "< 1h",
      totalOrders: 156,
      yearEstablished: 1995
    }
  ];

  const handleVisitStore = (storeSlug: string) => {
    setLocation(`/store/${storeSlug}`);
  };

  const handleCreateTestData = async () => {
    try {
      const response = await fetch('/api/suppliers/test/create-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Test Data Created",
          description: "Sample supplier stores have been created successfully!",
        });
      } else {
        throw new Error('Failed to create test data');
      }
    } catch (error) {
      toast({
        title: "Note",
        description: "Test data creation is only available in development mode.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dedicated Buyer Store Experience
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Experience the new dedicated buyer-facing supplier store pages. 
              These pages are completely separate from supplier management interfaces.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button onClick={handleCreateTestData} size="lg" className="shadow-lg">
                <Package className="w-5 h-5 mr-2" />
                Create Sample Data
              </Button>
              <Button variant="outline" size="lg" onClick={() => setLocation('/suppliers')}>
                <Building2 className="w-5 h-5 mr-2" />
                Browse Suppliers Directory
              </Button>
            </div>

            {/* Route Comparison */}
            <div className="bg-white rounded-lg p-6 shadow-sm border max-w-4xl mx-auto mb-8">
              <h3 className="text-lg font-semibold mb-4">Route Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-2">👥 Buyer-Facing Store</div>
                  <div className="font-mono text-blue-600">/store/{"{slug}"}</div>
                  <div className="text-blue-700 mt-2">Public store page for buyers to browse products and contact suppliers</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800 mb-2">🏪 Supplier Management</div>
                  <div className="font-mono text-green-600">/suppliers/{"{slug}"}</div>
                  <div className="text-green-700 mt-2">Internal supplier management interface (for suppliers only)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Store className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Dedicated Route</h3>
                <p className="text-sm text-muted-foreground">
                  Separate /store/{"{slug}"} route for buyer-facing store pages
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Eye className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Buyer-Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  Designed specifically for buyers to browse and evaluate suppliers
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Package className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Product Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Enhanced product catalog with advanced filtering and search
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Easy Contact</h3>
                <p className="text-sm text-muted-foreground">
                  Streamlined communication tools for buyer-supplier interaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Store Access */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Store Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Enter store slug (e.g., tech-innovations-ltd)"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => handleVisitStore(storeSlug)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Store
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This will take you to the dedicated buyer-facing store page at /store/{storeSlug}
              </p>
            </CardContent>
          </Card>

          {/* Sample Supplier Cards */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Sample Supplier Stores</h2>
                <p className="text-muted-foreground">
                  Click on any supplier card to visit their dedicated buyer-facing store page
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                New Route: /store/{"{slug}"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleSuppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          </div>

          {/* Features Comparison */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Buyer Store Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-500" />
                    Store Presentation
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Hero banner with store branding
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Company stats and metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Trust indicators and badges
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Professional layout design
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-500" />
                    Product Catalog
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Advanced search and filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Category-based organization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Sort by multiple criteria
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Featured and stock filters
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Buyer Experience
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      One-click contact supplier
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Save favorite suppliers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Share store with colleagues
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Mobile-optimized interface
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Flow */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Browse Suppliers</h4>
                  <p className="text-sm text-muted-foreground">
                    Find suppliers in the directory or through search
                  </p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Store className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">2. Visit Store</h4>
                  <p className="text-sm text-muted-foreground">
                    Click to visit dedicated buyer-facing store page
                  </p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <Package className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">3. Browse Products</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore products with advanced filtering
                  </p>
                </div>

                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">4. Contact Supplier</h4>
                  <p className="text-sm text-muted-foreground">
                    Send messages and request quotes directly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}