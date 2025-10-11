import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  Heart, 
  Package,
  TrendingUp,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  //todo: remove mock functionality
  const stats = [
    { label: "Active RFQs", value: "5", icon: FileText, color: "text-primary" },
    { label: "Pending Inquiries", value: "12", icon: MessageSquare, color: "text-amber-600" },
    { label: "Unread Messages", value: "8", icon: MessageSquare, color: "text-gray-600" },
    { label: "Favorite Suppliers", value: "23", icon: Heart, color: "text-red-600" },
  ];

  const recentRFQs = [
    { id: 1, title: "Wireless Earbuds Bulk Order", quotations: 12, status: "Active" },
    { id: 2, title: "Custom T-Shirts with Logo", quotations: 8, status: "Active" },
    { id: 3, title: "LED Strip Lights", quotations: 5, status: "Closed" },
  ];

  const recentInquiries = [
    { id: 1, product: "Bluetooth Headphones", supplier: "AudioTech Pro", status: "Replied" },
    { id: 2, product: "Smart Watch", supplier: "TechGear Ltd", status: "Pending" },
    { id: 3, product: "Laptop Bag", supplier: "Leather Crafts", status: "Negotiating" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Buyer Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's what's happening with your business.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} data-testid={`card-stat-${index}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
                      <div className="w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold" data-testid={`text-stat-value-${index}`}>{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center ${stat.color} self-end sm:self-auto`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="rfqs" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="rfqs" className="text-xs sm:text-sm" data-testid="tab-rfqs">My RFQs</TabsTrigger>
              <TabsTrigger value="inquiries" className="text-xs sm:text-sm" data-testid="tab-inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs sm:text-sm" data-testid="tab-favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="rfqs">
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Recent RFQs</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    {recentRFQs.map((rfq) => (
                      <div key={rfq.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-0" data-testid={`rfq-item-${rfq.id}`}>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1 text-sm sm:text-base">{rfq.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{rfq.quotations} quotations received</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <Badge variant={rfq.status === "Active" ? "default" : "secondary"} className="text-xs">
                            {rfq.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8" data-testid={`button-view-rfq-${rfq.id}`}>View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-3 sm:mt-4" variant="outline" size="sm" data-testid="button-view-all-rfqs">View All RFQs</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inquiries">
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Recent Inquiries</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3 sm:space-y-4">
                    {recentInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-0" data-testid={`inquiry-item-${inquiry.id}`}>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1 text-sm sm:text-base">{inquiry.product}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{inquiry.supplier}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <Badge 
                            variant={inquiry.status === "Replied" ? "default" : inquiry.status === "Negotiating" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {inquiry.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8" data-testid={`button-view-inquiry-${inquiry.id}`}>View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-3 sm:mt-4" variant="outline" size="sm" data-testid="button-view-all-inquiries">View All Inquiries</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Favorite Suppliers & Products</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="text-center py-8 sm:py-12">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">No favorites yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Start adding suppliers and products to your favorites</p>
                    <Button data-testid="button-browse-products">Browse Products</Button>
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
