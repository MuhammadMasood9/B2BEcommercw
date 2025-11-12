import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import SupplierCard from "@/components/SupplierCard";
import {
  Store,
  Search,
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
  MessageSquare
} from "lucide-react";

export default function BuyerSupplierDemo() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const handleViewStore = (storeSlug: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Supplier Store Experience
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover how buyers can explore detailed supplier stores, browse product catalogs, 
            and connect with verified suppliers from around the world.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button onClick={handleCreateTestData} size="lg" className="shadow-lg">
              <Package className="w-5 h-5 mr-2" />
              Create Sample Data
            </Button>
            <Button variant="outline" size="lg" onClick={() => setLocation('/suppliers')}>
              <Search className="w-5 h-5 mr-2" />
              Browse All Suppliers
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Store className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Detailed Store Pages</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive supplier profiles with company info, certifications, and metrics
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Product Catalogs</h3>
              <p className="text-sm text-muted-foreground">
                Browse products with advanced filtering, search, and category organization
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Shield className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Trust & Verification</h3>
              <p className="text-sm text-muted-foreground">
                Verification badges, trust scores, and customer reviews for confidence
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Direct Communication</h3>
              <p className="text-sm text-muted-foreground">
                Instant messaging, quote requests, and contact information access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Supplier Cards */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Featured Suppliers</h2>
              <p className="text-muted-foreground">
                Click on any supplier card to explore their detailed store page
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
              Interactive Demo
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </div>

        {/* Store Page Features */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              What Buyers See in Supplier Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Company Profile
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Business information & history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Verification status & badges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Performance metrics & ratings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Main products & export markets
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
                    Advanced search & filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Category-based organization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Featured & in-stock filters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Product details & specifications
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Communication Tools
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Direct supplier messaging
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Quote request system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Contact information access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Floating chat widget
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Buyer Journey to Supplier Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-3">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">1. Discover</h4>
                <p className="text-sm text-muted-foreground">
                  Find suppliers through search, categories, or recommendations
                </p>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">2. Explore</h4>
                <p className="text-sm text-muted-foreground">
                  Browse detailed store pages with products and company info
                </p>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">3. Connect</h4>
                <p className="text-sm text-muted-foreground">
                  Contact suppliers directly for quotes and negotiations
                </p>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">4. Trade</h4>
                <p className="text-sm text-muted-foreground">
                  Complete transactions with trusted, verified suppliers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}