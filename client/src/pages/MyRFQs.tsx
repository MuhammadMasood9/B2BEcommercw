import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Eye, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";

export default function MyRFQs() {
  const [searchQuery, setSearchQuery] = useState("");

  const rfqs = [
    {
      id: "RFQ-2024-001",
      title: "Custom Metal Brackets - 10,000 units",
      category: "Hardware & Machinery",
      quantity: 10000,
      targetPrice: "$2.50/piece",
      quotationsReceived: 12,
      status: "Active",
      createdDate: "2024-01-20",
      expiryDate: "2024-02-20",
      description: "Need custom metal brackets for industrial equipment"
    },
    {
      id: "RFQ-2024-002",
      title: "LED Display Modules",
      category: "Electronics",
      quantity: 5000,
      targetPrice: "$15.00/piece",
      quotationsReceived: 8,
      status: "Under Review",
      createdDate: "2024-01-18",
      expiryDate: "2024-02-18",
      description: "High-quality LED display modules for outdoor signage"
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <Clock className="h-4 w-4" />;
      case "Under Review": return <Eye className="h-4 w-4" />;
      case "Closed": return <CheckCircle className="h-4 w-4" />;
      case "Expired": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500";
      case "Under Review": return "bg-gray-500";
      case "Closed": return "bg-gray-500";
      case "Expired": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="gradient-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">My RFQs</h1>
                <p className="text-gray-200">Manage your requests for quotations</p>
              </div>
              <Link href="/rfq/create">
                <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100 no-default-hover-elevate" data-testid="button-post-new-rfq">
                  <FileText className="h-5 w-5 mr-2" />
                  Post New RFQ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-rfqs"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800">
              <TabsTrigger value="all" data-testid="tab-all-rfqs">All RFQs</TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
              <TabsTrigger value="review" data-testid="tab-review">Under Review</TabsTrigger>
              <TabsTrigger value="closed" data-testid="tab-closed">Closed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {rfqs.map((rfq) => (
                <Card key={rfq.id} className="p-6 hover:shadow-lg transition-shadow glass-card">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{rfq.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">RFQ ID: {rfq.id}</p>
                        </div>
                        <Badge className={`${getStatusColor(rfq.status)} text-white w-fit flex items-center gap-1`}>
                          {getStatusIcon(rfq.status)}
                          {rfq.status}
                        </Badge>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">{rfq.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                          <p className="font-medium">{rfq.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                          <p className="font-medium">{rfq.quantity.toLocaleString()} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Target Price</p>
                          <p className="font-medium">{rfq.targetPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Quotations</p>
                          <p className="font-medium text-lg text-gray-600">{rfq.quotationsReceived}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Expires: {rfq.expiryDate}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/rfq/${rfq.id}`}>
                            <Button variant="outline" size="sm" data-testid="button-view-quotations">
                              <Eye className="h-4 w-4 mr-2" />
                              View Quotations ({rfq.quotationsReceived})
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" data-testid="button-messages">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                          </Button>
                        </div>
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
