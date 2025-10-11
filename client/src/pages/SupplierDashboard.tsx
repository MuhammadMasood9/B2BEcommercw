import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Package,
  Plus,
  FileText
} from "lucide-react";

export default function SupplierDashboard() {
  //todo: remove mock functionality
  const stats = [
    { label: "Product Views", value: "12.5K", icon: Eye, change: "+15%", color: "text-gray-600" },
    { label: "Inquiries Received", value: "48", icon: MessageSquare, change: "+8%", color: "text-green-600" },
    { label: "Response Rate", value: "95%", icon: TrendingUp, change: "+2%", color: "text-primary" },
    { label: "Active Products", value: "124", icon: Package, change: "+5", color: "text-amber-600" },
  ];

  const recentInquiries = [
    { id: 1, buyer: "ABC Trading Co.", product: "Wireless Headphones", quantity: "5,000 units", status: "Pending", time: "2h ago" },
    { id: 2, buyer: "Global Imports Ltd", product: "Bluetooth Speakers", quantity: "2,000 units", status: "Replied", time: "5h ago" },
    { id: 3, buyer: "Tech Solutions Inc", product: "Smart Watches", quantity: "1,000 units", status: "Quoted", time: "1d ago" },
  ];

  const rfqMatches = [
    { id: 1, title: "Looking for Wireless Earbuds - 10K units", category: "Electronics", location: "USA", timeLeft: "2 days" },
    { id: 2, title: "Need Bluetooth Speakers for Retail", category: "Electronics", location: "UK", timeLeft: "5 days" },
  ];

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
              <TabsTrigger value="rfq" data-testid="tab-rfq">Matching RFQs</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">My Products</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="inquiries">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`inquiry-${inquiry.id}`}>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{inquiry.buyer}</h4>
                          <p className="text-sm text-muted-foreground mb-1">{inquiry.product} • {inquiry.quantity}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.time}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={inquiry.status === "Replied" ? "default" : inquiry.status === "Quoted" ? "secondary" : "outline"}>
                            {inquiry.status}
                          </Badge>
                          <Button variant="outline" size="sm" data-testid={`button-view-inquiry-${inquiry.id}`}>View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline" data-testid="button-view-all-inquiries">View All Inquiries</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rfq">
              <Card>
                <CardHeader>
                  <CardTitle>Matching RFQs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rfqMatches.map((rfq) => (
                      <div key={rfq.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`rfq-${rfq.id}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">{rfq.title}</h4>
                          <Badge variant="outline">{rfq.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {rfq.location} • {rfq.timeLeft} remaining
                          </div>
                          <Button size="sm" data-testid={`button-send-quote-${rfq.id}`}>Send Quotation</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline" data-testid="button-browse-rfqs">Browse All RFQs</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Product Management</CardTitle>
                    <Button data-testid="button-bulk-upload">
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Manage Your Products</h3>
                    <p className="text-muted-foreground mb-4">Add, edit, or remove products from your catalog</p>
                    <Button data-testid="button-add-first-product">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Track Your Performance</h3>
                    <p className="text-muted-foreground">View detailed analytics and insights about your store</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
