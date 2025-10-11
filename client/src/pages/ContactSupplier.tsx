import { useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Phone, Mail, Globe, Send, CheckCircle } from "lucide-react";

export default function ContactSupplier() {
  const [, params] = useRoute("/contact-supplier/:id");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    quantity: "",
    targetPrice: ""
  });

  const supplier = {
    id: params?.id || "1",
    name: "Shanghai Manufacturing Co., Ltd.",
    verified: true,
    responseRate: "98%",
    responseTime: "< 2 hours",
    location: "Shanghai, China",
    phone: "+86 21 1234 5678",
    email: "contact@shanghai-mfg.com",
    website: "www.shanghai-mfg.com",
    logo: "/placeholder.svg",
    yearsInBusiness: 15,
    mainProducts: "Industrial Parts, Metal Components, Hardware",
    employees: "500-1000"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="gradient-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">Contact Supplier</h1>
            <p className="text-gray-200">Get in touch with verified suppliers</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="p-6 glass-card sticky top-24">
                <div className="text-center mb-6">
                  <img
                    src={supplier.logo}
                    alt={supplier.name}
                    className="w-24 h-24 mx-auto rounded-lg mb-4"
                  />
                  <h2 className="text-xl font-bold mb-2">{supplier.name}</h2>
                  {supplier.verified && (
                    <Badge className="bg-gray-500 text-white mb-4">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Supplier
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-medium">{supplier.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                      <p className="font-medium text-gray-600 dark:text-gray-400">{supplier.website}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                    <span className="font-semibold text-green-600">{supplier.responseRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="font-semibold">{supplier.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Years in Business</span>
                    <span className="font-semibold">{supplier.yearsInBusiness} years</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="p-6 glass-card">
                <h2 className="text-2xl font-bold mb-6">Send Inquiry</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity Needed</Label>
                      <Input
                        id="quantity"
                        placeholder="e.g., 1000 pieces"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetPrice">Target Price (Optional)</Label>
                      <Input
                        id="targetPrice"
                        placeholder="e.g., $5.00 per piece"
                        value={formData.targetPrice}
                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Your Message *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Please provide details about your requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full gradient-blue text-white" data-testid="button-send-inquiry">
                    <Send className="h-5 w-5 mr-2" />
                    Send Inquiry
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
