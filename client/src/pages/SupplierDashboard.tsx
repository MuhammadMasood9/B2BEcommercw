import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

import {
  Eye,
  MessageSquare,
  TrendingUp,
  Package,
  Plus,
  Store,
  Users,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  Zap
} from "lucide-react";
import StoreManagement from "@/components/supplier/StoreManagement";
import ProductManagement from "@/components/supplier/ProductManagement";
import InquiryManagement from "@/components/supplier/InquiryManagement";
import EarningsOverview from "@/components/supplier/EarningsOverview";
import EnhancedAnalyticsDashboard from "@/components/supplier/EnhancedAnalyticsDashboard";
import StaffManagement from "@/components/supplier/StaffManagement";
import { VerificationDashboard } from "@/components/supplier/VerificationDashboard";
import SupplierRFQManager from "@/components/supplier/SupplierRFQManager";
import { SupplierDashboardMetrics } from "@/components/supplier/SupplierDashboardMetrics";
import { SupplierNotificationCenter } from "@/components/supplier/SupplierNotificationCenter";

export default function SupplierDashboard() {
  const { user, hasRole, hasPermission, isSupplierApproved } = useAuth();

  // Fetch real supplier stats
  const { data: supplierStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/suppliers/dashboard/stats'],
    queryFn: () => apiRequest('GET', '/api/suppliers/dashboard/stats')
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Store className="h-3 w-3 mr-1" />
                    {user?.role || 'Supplier'}
                  </Badge>
                  {isSupplierApproved ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                  {user?.membershipTier && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                      <Star className="h-3 w-3 mr-1" />
                      {user.membershipTier}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">
                Manage your store, products, and track business performance
              </p>
            </div>
            <div className="flex gap-2">
              {hasPermission('products', 'write') && (
                <Button size="lg" data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
              <Link href="/supplier/store-settings">
                <Button variant="outline" size="lg">
                  <Settings className="w-4 h-4 mr-2" />
                  Store Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced Supplier Dashboard Metrics */}
          <SupplierDashboardMetrics
            metrics={{
              productViews: supplierStats?.productViews || 0,
              inquiriesReceived: supplierStats?.inquiriesReceived || 0,
              responseRate: supplierStats?.responseRate || 0,
              activeProducts: supplierStats?.activeProducts || 0,
              totalOrders: supplierStats?.totalOrders || 0,
              monthlyRevenue: supplierStats?.monthlyRevenue || 0,
              averageRating: supplierStats?.averageRating || 0,
              profileViews: supplierStats?.profileViews || 0,
              quotationsSent: supplierStats?.quotationsSent || 0,
              conversionRate: supplierStats?.conversionRate || 0,
              pendingOrders: supplierStats?.pendingOrders || 0,
              completedOrders: supplierStats?.completedOrders || 0,
            }}
            comparisons={{
              productViews: { changePercent: supplierStats?.viewsChangePercent || 0 },
              inquiries: { changePercent: supplierStats?.inquiriesChangePercent || 0 },
              revenue: { changePercent: supplierStats?.revenueChangePercent || 0 },
              orders: { changePercent: supplierStats?.ordersChangePercent || 0 },
            }}
            onMetricClick={(metricId) => {
              console.log(`Metric clicked: ${metricId}`);
            }}
            className="mb-8"
          />

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

          {/* Supplier Notification Center */}
          <div className="mt-8">
            <SupplierNotificationCenter />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
