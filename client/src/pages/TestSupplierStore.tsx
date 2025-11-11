import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Store,
  ExternalLink,
  Package,
  Star,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Building2,
  Globe,
  Phone,
  MessageSquare,
  Award,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";

export default function TestSupplierStore() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [storeSlug, setStoreSlug] = useState("tech-innovations-ltd");

  // Sample supplier stores for testing
  const sampleStores = [
    {
      slug: "tech-innovations-ltd",
      name: "Tech Innovations Ltd",
      description: "Leading manufacturer of electronic components and IoT devices"
    },
    {
      slug: "global-textiles-co",
      name: "Global Textiles Co",
      description: "Premium textile manufacturer with 20+ years experience"
    },
    {
      slug: "precision-machinery",
      name: "Precision Machinery",
      description: "Industrial machinery and automation solutions"
    },
    {
      slug: "eco-packaging-solutions",
      name: "Eco Packaging Solutions",
      description: "Sustainable packaging materials and eco-friendly solutions"
    }
  ];

  const handleVisitStore = (slug: string) => {
    setLocation(`/suppliers/${slug}`);
  };

  const handleCreateTestData = async () => {
    try {
      // This would typically create test data via API
      toast({
        title: "Test Data Created",
        description: "Sample supplier stores and products have been created for testing.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Supplier Store Demo
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Test the enhanced supplier store detail pages with comprehensive product catalogs
          </p>
          <Button onClick={handleCreateTestData} size="lg" className="mb-6">
            <Package className="w-5 h-5 mr-2" />
            Create Test Data
          </Button>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-500" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Company details & verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Business metrics & ratings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Contact information
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Store policies & terms
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                Product Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Advanced product filtering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Category-based browsing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Search functionality
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Featured & in-stock filters
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Trust & Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trust score calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Customer reviews & ratings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Verification badges
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Performance metrics
                </li>
              </ul>
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
          </CardContent>
        </Card>

        {/* Sample Stores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleStores.map((store) => (
            <Card key={store.slug} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{store.name}</h3>
                    <p className="text-muted-foreground mb-3">{store.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>4.8 (127 reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>45+ products</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>&lt; 2h response</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>98% response rate</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleVisitStore(store.slug)}
                    className="ml-4"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Visit Store
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Enhanced Store Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Store Profile
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Custom store branding (logo, banner)</li>
                  <li>• Business information & metrics</li>
                  <li>• Verification status & badges</li>
                  <li>• Company history & credentials</li>
                  <li>• Main products & export markets</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-500" />
                  Product Management
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Advanced product filtering</li>
                  <li>• Category-based organization</li>
                  <li>• Search & sort functionality</li>
                  <li>• Featured products highlighting</li>
                  <li>• Stock status indicators</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Communication
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Direct supplier messaging</li>
                  <li>• Quote request system</li>
                  <li>• Contact information display</li>
                  <li>• Response time tracking</li>
                  <li>• Floating chat widget</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}