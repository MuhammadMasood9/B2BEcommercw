import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Calendar, 
  Package, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

export default function RFQDetail() {
  const [quotationText, setQuotationText] = useState("");

  //todo: remove mock functionality
  const rfqDetails = {
    id: "RFQ-2024-001",
    title: "Looking for High-Quality Wireless Earbuds - 10,000 Units",
    category: "Consumer Electronics",
    quantity: "10,000 pieces",
    budget: "$15-20 per unit",
    location: "Los Angeles, USA",
    deliveryDate: "March 15, 2024",
    postedDate: "Jan 10, 2024",
    timeRemaining: "15 days",
    description: `We are looking for a reliable supplier for high-quality wireless earbuds with the following specifications:

    - Bluetooth 5.0 or higher
    - Active Noise Cancellation (ANC)
    - Battery life: minimum 6 hours per charge
    - Charging case with USB-C
    - IPX4 water resistance or better
    - Custom packaging with our branding
    
    Quality certifications required: CE, FCC, RoHS
    
    Please include the following in your quotation:
    1. Unit price for different quantity tiers
    2. Sample availability and cost
    3. Production lead time
    4. Customization options and costs
    5. Shipping terms (FOB/CIF)`,
    requirements: [
      "Bluetooth 5.0 or higher",
      "Active Noise Cancellation",
      "6+ hours battery life",
      "Custom packaging available",
      "CE, FCC, RoHS certified"
    ],
    buyer: {
      name: "TechWorld Distribution",
      type: "Trading Company",
      country: "USA",
      responseRate: "92%"
    }
  };

  const quotations = [
    {
      id: 1,
      supplier: "AudioTech Pro",
      country: "China",
      verified: true,
      price: "$16.50-18.00",
      moq: "5,000 units",
      leadTime: "25-30 days",
      rating: 4.8,
      responseTime: "2 hours",
      message: "We can provide high-quality wireless earbuds meeting all your specifications. We have CE, FCC, and RoHS certifications. Custom packaging is available with MOQ 5,000 units.",
      submittedDate: "2 days ago"
    },
    {
      id: 2,
      supplier: "Global Electronics Mfg",
      country: "China",
      verified: true,
      price: "$15.80-17.50",
      moq: "10,000 units",
      leadTime: "20-25 days",
      rating: 4.9,
      responseTime: "1 hour",
      message: "We are a professional manufacturer with 12 years of experience. All certifications available. Free samples for bulk orders. Can customize packaging with your logo.",
      submittedDate: "1 day ago"
    },
    {
      id: 3,
      supplier: "SoundWave Industries",
      country: "Vietnam",
      verified: false,
      price: "$17.00-19.00",
      moq: "3,000 units",
      leadTime: "30-35 days",
      rating: 4.6,
      responseTime: "4 hours",
      message: "Quality wireless earbuds with ANC. We can provide samples at $25 each. All required certifications in place.",
      submittedDate: "3 days ago"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>RFQ</span>
              <span>/</span>
              <span>{rfqDetails.category}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3">{rfqDetails.title}</h1>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="w-3 h-3" />
                    {rfqDetails.id}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Posted {rfqDetails.postedDate}
                  </Badge>
                  <Badge className="bg-primary gap-1">
                    <Clock className="w-3 h-3" />
                    {rfqDetails.timeRemaining} remaining
                  </Badge>
                </div>
              </div>
              <Button size="lg" data-testid="button-send-quotation">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Quotation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {rfqDetails.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Budget</p>
                      <p className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {rfqDetails.budget}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Location</p>
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {rfqDetails.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expected Delivery</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {rfqDetails.deliveryDate}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    <div className="whitespace-pre-line text-muted-foreground bg-muted p-4 rounded-lg">
                      {rfqDetails.description}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Key Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rfqDetails.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="quotations">
                <TabsList>
                  <TabsTrigger value="quotations" data-testid="tab-quotations">
                    Quotations ({quotations.length})
                  </TabsTrigger>
                  <TabsTrigger value="send" data-testid="tab-send">
                    Send Quotation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quotations" className="mt-6">
                  <div className="space-y-4">
                    {quotations.map((quote) => (
                      <Card key={quote.id} data-testid={`quotation-${quote.id}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {quote.supplier.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{quote.supplier}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{quote.country}</span>
                                    {quote.verified && (
                                      <Badge className="bg-success text-xs">Verified</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">{quote.price}</div>
                                  <div className="text-xs text-muted-foreground">{quote.submittedDate}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded-lg">
                                <div>
                                  <div className="text-xs text-muted-foreground">MOQ</div>
                                  <div className="font-medium">{quote.moq}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Lead Time</div>
                                  <div className="font-medium">{quote.leadTime}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Response Time</div>
                                  <div className="font-medium">{quote.responseTime}</div>
                                </div>
                              </div>

                              <p className="text-muted-foreground mb-4">{quote.message}</p>

                              <div className="flex gap-2">
                                <Button data-testid={`button-contact-${quote.id}`}>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contact Supplier
                                </Button>
                                <Button variant="outline" data-testid={`button-compare-${quote.id}`}>
                                  Compare
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="send" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit Your Quotation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="unit-price">Unit Price (USD)</Label>
                          <Input id="unit-price" placeholder="e.g., 18.50" className="mt-2" data-testid="input-unit-price" />
                        </div>
                        <div>
                          <Label htmlFor="moq">Minimum Order Quantity</Label>
                          <Input id="moq" placeholder="e.g., 5000 units" className="mt-2" data-testid="input-moq" />
                        </div>
                        <div>
                          <Label htmlFor="lead-time">Lead Time</Label>
                          <Input id="lead-time" placeholder="e.g., 20-25 days" className="mt-2" data-testid="input-lead-time" />
                        </div>
                        <div>
                          <Label htmlFor="sample-price">Sample Price (Optional)</Label>
                          <Input id="sample-price" placeholder="e.g., 25.00" className="mt-2" data-testid="input-sample-price" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quotation-details">Quotation Details</Label>
                        <Textarea
                          id="quotation-details"
                          placeholder="Provide detailed information about your product, pricing tiers, certifications, customization options, etc."
                          rows={6}
                          className="mt-2"
                          value={quotationText}
                          onChange={(e) => setQuotationText(e.target.value)}
                          data-testid="textarea-quotation"
                        />
                      </div>

                      <Button className="w-full" size="lg" data-testid="button-submit-quotation">
                        Submit Quotation
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">TW</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{rfqDetails.buyer.name}</h4>
                      <p className="text-sm text-muted-foreground">{rfqDetails.buyer.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="text-sm font-medium">{rfqDetails.buyer.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Response Rate</span>
                      <span className="text-sm font-medium">{rfqDetails.buyer.responseRate}</span>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline" data-testid="button-contact-buyer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Buyer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
