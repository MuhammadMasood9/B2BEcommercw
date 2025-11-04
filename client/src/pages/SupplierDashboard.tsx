import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

import {
  Eye,
  MessageSquare,
  TrendingUp,
  Package,
  Plus
} from "lucide-react";
import StoreManagement from "@/components/supplier/StoreManagement";
import ProductManagement from "@/components/supplier/ProductManagement";
import InquiryManagement from "@/components/supplier/InquiryManagement";
import EarningsOverview from "@/components/supplier/EarningsOverview";
import EnhancedAnalyticsDashboard from "@/components/supplier/EnhancedAnalyticsDashboard";
import StaffManagement from "@/components/supplier/StaffManagement";
import { VerificationDashboard } from "@/components/supplier/VerificationDashboard";
import SupplierRFQManager from "@/components/supplier/SupplierRFQManager";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

export default function SupplierDashboard() {
  // Fetch real supplier stats
  const { data: supplierStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/suppliers/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch supplier stats');
      return response.json();
    }
  });

  const stats = supplierStats ? [
    { label: "Product Views", value: supplierStats.productViews || "0", icon: Eye, change: supplierStats.viewsChange || "0%", color: "text-gray-600" },
    { label: "Inquiries Received", value: supplierStats.inquiriesReceived || "0", icon: MessageSquare, change: supplierStats.inquiriesChange || "0%", color: "text-green-600" },
    { label: "Response Rate", value: `${supplierStats.responseRate || 0}%`, icon: TrendingUp, change: supplierStats.responseRateChange || "0%", color: "text-primary" },
    { label: "Active Products", value: supplierStats.activeProducts || "0", icon: Package, change: supplierStats.productsChange || "0", color: "text-amber-600" },
  ] : [
    { label: "Product Views", value: "0", icon: Eye, change: "0%", color: "text-gray-600" },
    { label: "Inquiries Received", value: "0", icon: MessageSquare, change: "0%", color: "text-green-600" },
    { label: "Response Rate", value: "0%", icon: TrendingUp, change: "0%", color: "text-primary" },
    { label: "Active Products", value: "0", icon: Package, change: "0", color: "text-amber-600" },
  ];

  // Fetch recent inquiries
  const { data: recentInquiries = [] } = useQuery({
    queryKey: ['/api/suppliers/inquiries', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/inquiries?limit=5&sort=recent');
      if (!response.ok) throw new Error('Failed to fetch recent inquiries');
      return response.json();
    }
  });

  // Fetch matching RFQs
  const { data: rfqMatches = [] } = useQuery({
    queryKey: ['/api/suppliers/rfqs/matching'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/rfqs/matching?limit=5');
      if (!response.ok) throw new Error('Failed to fetch matching RFQs');
      return response.json();
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Supplier Dashboard</h1>
              <p className="text-muted-foreground">Manage your products and track performance</p>
            </div>
            <Button size="lg" data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} data-testid={`card-stat-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="inquiries" className="space-y-6">
            <TabsList>
              <TabsTrigger value="inquiries" data-testid="tab-inquiries">Recent Inquiries</TabsTrigger>
              <TabsTrigger value="rfq" data-testid="tab-rfq">RFQ Management</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">My Products</TabsTrigger>
              <TabsTrigger value="store" data-testid="tab-store">Store Management</TabsTrigger>
              <TabsTrigger value="verification" data-testid="tab-verification">Verification</TabsTrigger>
              <TabsTrigger value="staff" data-testid="tab-staff">Staff Management</TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="inquiries">
              <InquiryManagement />
            </TabsContent>

            <TabsContent value="rfq">
              <SupplierRFQManager />
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="store">
              <StoreManagement />
            </TabsContent>

            <TabsContent value="verification">
              <VerificationDashboard />
            </TabsContent>

            <TabsContent value="staff">
              <StaffManagement />
            </TabsContent>

            <TabsContent value="earnings">
              <EarningsOverview />
            </TabsContent>

            <TabsContent value="analytics">
              <EnhancedAnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
