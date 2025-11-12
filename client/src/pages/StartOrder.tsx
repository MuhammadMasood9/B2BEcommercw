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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package, Truck, DollarSign, Calendar, FileText } from "lucide-react";

export default function StartOrder() {
  const [, params] = useRoute("/start-order/:productId");
  const [quantity, setQuantity] = useState("1000");
  const [customization, setCustomization] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const product = {
    id: params?.productId || "1",
    name: "Industrial Metal Parts",
    supplier: "Shanghai Manufacturing Co.",
    image: "/placeholder.svg",
    priceRanges: [
      { min: 100, max: 499, price: 5.00 },
      { min: 500, max: 999, price: 4.50 },
      { min: 1000, max: 4999, price: 4.00 },
      { min: 5000, max: null, price: 3.50 }
    ],
    moq: 100,
    leadTime: "15-30 days",
    port: "Shanghai/Ningbo"
  };

  const getPrice = (qty: number) => {
    const range = product.priceRanges.find(r => 
      qty >= r.min && (r.max === null || qty <= r.max)
    );
    return range ? range.price : product.priceRanges[0].price;
  };

  const unitPrice = getPrice(parseInt(quantity) || 0);
  const totalPrice = unitPrice * (parseInt(quantity) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Order submitted");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <ShoppingCart className="w-4 h-4" />
              <span>Bulk Order</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Start Bulk Order
            </h1>
            
            <p className="text-xl text-white/90">
              Configure your bulk purchase
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white border-gray-100 shadow-lg mb-6">
                <h2 className="text-2xl font-bold mb-6">Order Details</h2>
                
                <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{product.supplier}</p>
                    <Badge className="mt-2">MOQ: {product.moq} pieces</Badge>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="quantity">Order Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={product.moq}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      data-testid="input-quantity"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Minimum order quantity: {product.moq} pieces
                    </p>
                  </div>

                  <div>
                    <Label>Price Tier</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {product.priceRanges.map((range, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {range.min} - {range.max ? range.max : '∞'} pieces
                          </p>
                          <p className="font-semibold text-lg">${range.price}/piece</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customization">Customization Requirements</Label>
                    <Textarea
                      id="customization"
                      rows={4}
                      placeholder="Describe any customization needs (color, size, logo, packaging, etc.)"
                      value={customization}
                      onChange={(e) => setCustomization(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">Expected Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Standard lead time: {product.leadTime}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="paymentTerms">Preferred Payment Terms</Label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tt">T/T (Telegraphic Transfer)</SelectItem>
                          <SelectItem value="lc">L/C (Letter of Credit)</SelectItem>
                          <SelectItem value="western-union">Western Union</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="escrow">Trade Assurance/Escrow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Any additional requirements or questions..."
                    />
                  </div>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-xl sticky top-24">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                      <p className="font-semibold">{parseInt(quantity).toLocaleString()} pieces</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Unit Price</p>
                      <p className="font-semibold">${unitPrice.toFixed(2)}/piece</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                      <p className="font-semibold text-lg">${totalPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Shipping Port</p>
                      <p className="font-semibold">{product.port}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Lead Time</p>
                      <p className="font-semibold">{product.leadTime}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Estimated Total</span>
                      <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        ${totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      *Shipping costs calculated separately
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg" 
                    size="lg"
                    data-testid="button-submit-order"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Submit Order Request
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Admin will confirm pricing and availability
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
