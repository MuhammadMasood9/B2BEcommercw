import { useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, FileText, DollarSign, Calendar, Truck, Plus, X } from "lucide-react";

export default function SendQuotation() {
  const [, params] = useRoute("/send-quotation/:rfqId");
  const [priceBreaks, setPriceBreaks] = useState([
    { quantity: "100-499", price: "" },
    { quantity: "500-999", price: "" },
    { quantity: "1000+", price: "" }
  ]);

  const rfq = {
    id: params?.rfqId || "RFQ-2024-001",
    title: "Custom Metal Brackets - 10,000 units",
    buyer: "ABC Manufacturing Inc.",
    quantity: 10000,
    targetPrice: "$2.50/piece",
    category: "Hardware & Machinery",
    requirements: "Need custom metal brackets for industrial equipment. Must be corrosion-resistant and meet ISO 9001 standards.",
    deliveryLocation: "Los Angeles, USA",
    expectedDate: "2024-03-15"
  };

  const addPriceBreak = () => {
    setPriceBreaks([...priceBreaks, { quantity: "", price: "" }]);
  };

  const removePriceBreak = (index: number) => {
    setPriceBreaks(priceBreaks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quotation submitted");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <Send className="w-4 h-4" />
              <span>Send Quotation</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Send Quotation
            </h1>
            
            <p className="text-xl text-white/90">
              Respond to buyer request for quotation
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white border-gray-100 shadow-lg mb-6">
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold mb-4">RFQ Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">RFQ ID</p>
                      <p className="font-semibold">{rfq.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Buyer</p>
                      <p className="font-semibold">{rfq.buyer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quantity Needed</p>
                      <p className="font-semibold">{rfq.quantity.toLocaleString()} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Target Price</p>
                      <p className="font-semibold">{rfq.targetPrice}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requirements</p>
                    <p className="text-gray-800 dark:text-gray-200">{rfq.requirements}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Your Quotation</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">Price Breakdown</Label>
                    <div className="space-y-3">
                      {priceBreaks.map((priceBreak, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label htmlFor={`quantity-${index}`}>Quantity Range</Label>
                            <Input
                              id={`quantity-${index}`}
                              value={priceBreak.quantity}
                              onChange={(e) => {
                                const newBreaks = [...priceBreaks];
                                newBreaks[index].quantity = e.target.value;
                                setPriceBreaks(newBreaks);
                              }}
                              placeholder="e.g., 1000-4999"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`price-${index}`}>Price per Unit ($)</Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              step="0.01"
                              value={priceBreak.price}
                              onChange={(e) => {
                                const newBreaks = [...priceBreaks];
                                newBreaks[index].price = e.target.value;
                                setPriceBreaks(newBreaks);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          {priceBreaks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removePriceBreak(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPriceBreak}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Price Break
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
                      <Input
                        id="moq"
                        type="number"
                        placeholder="e.g., 500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadTime">Lead Time</Label>
                      <Input
                        id="leadTime"
                        placeholder="e.g., 15-20 days"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30-deposit">30% Deposit, 70% Before Shipment</SelectItem>
                          <SelectItem value="50-deposit">50% Deposit, 50% Before Shipment</SelectItem>
                          <SelectItem value="lc">Letter of Credit (L/C)</SelectItem>
                          <SelectItem value="tt">Telegraphic Transfer (T/T)</SelectItem>
                          <SelectItem value="trade-assurance">Trade Assurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shippingTerms">Shipping Terms</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipping terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fob">FOB (Free On Board)</SelectItem>
                          <SelectItem value="cif">CIF (Cost, Insurance, Freight)</SelectItem>
                          <SelectItem value="exw">EXW (Ex Works)</SelectItem>
                          <SelectItem value="ddp">DDP (Delivered Duty Paid)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="port">Port of Loading</Label>
                    <Input
                      id="port"
                      placeholder="e.g., Shanghai, Ningbo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="packaging">Packaging Details</Label>
                    <Textarea
                      id="packaging"
                      rows={3}
                      placeholder="Describe packaging specifications..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="certifications">Certifications & Quality Standards</Label>
                    <Textarea
                      id="certifications"
                      rows={2}
                      placeholder="e.g., ISO 9001, CE, RoHS..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      rows={4}
                      placeholder="Any additional details, special offers, or terms..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="validityPeriod">Quotation Validity Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select validity period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="15">15 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-xl sticky top-24">
                <h3 className="text-xl font-bold mb-4">Quotation Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">RFQ Title</p>
                      <p className="font-semibold">{rfq.title}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Target Price</p>
                      <p className="font-semibold">{rfq.targetPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Location</p>
                      <p className="font-semibold">{rfq.deliveryLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expected Date</p>
                      <p className="font-semibold">{rfq.expectedDate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                    size="lg"
                    data-testid="button-send-quotation"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Quotation
                  </Button>

                  <Button variant="outline" className="w-full" data-testid="button-save-draft">
                    Save as Draft
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Buyer will be notified of your quotation
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
