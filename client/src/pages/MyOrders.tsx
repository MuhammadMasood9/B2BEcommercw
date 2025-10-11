import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Search, Eye, MessageSquare, Download, Truck } from "lucide-react";

export default function MyOrders() {
  const [searchQuery, setSearchQuery] = useState("");

  const orders = [
    {
      id: "ORD-2024-001",
      productName: "Industrial Metal Parts",
      supplier: "Shanghai Manufacturing Co.",
      quantity: 5000,
      totalPrice: "$12,500",
      status: "In Production",
      orderDate: "2024-01-15",
      expectedDelivery: "2024-02-20",
      image: "/placeholder.svg"
    },
    {
      id: "ORD-2024-002",
      productName: "Electronic Components",
      supplier: "Shenzhen Electronics Ltd.",
      quantity: 10000,
      totalPrice: "$8,900",
      status: "Shipped",
      orderDate: "2024-01-10",
      expectedDelivery: "2024-02-05",
      image: "/placeholder.svg"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "Shipped": return "bg-gray-500";
      case "In Production": return "bg-yellow-500";
      case "Pending": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="gradient-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-200">Track and manage your purchase orders</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800">
              <TabsTrigger value="all" data-testid="tab-all-orders">All Orders</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
              <TabsTrigger value="in-production" data-testid="tab-in-production">In Production</TabsTrigger>
              <TabsTrigger value="shipped" data-testid="tab-shipped">Shipped</TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow glass-card">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={order.image}
                      alt={order.productName}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{order.productName}</h3>
                          <p className="text-gray-600 dark:text-gray-400">Order ID: {order.id}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white w-fit`}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
                          <p className="font-medium">{order.supplier}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                          <p className="font-medium">{order.quantity.toLocaleString()} pcs</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Price</p>
                          <p className="font-medium text-lg">{order.totalPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Expected Delivery</p>
                          <p className="font-medium">{order.expectedDelivery}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" data-testid="button-view-details">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-track-shipment">
                          <Truck className="h-4 w-4 mr-2" />
                          Track Shipment
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-contact-supplier">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact Supplier
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-download-invoice">
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
