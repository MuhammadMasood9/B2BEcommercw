import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight,
  CreditCard,
  Truck,
  Shield,
  MessageSquare,
  Download,
  FileText
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { setLoading } = useLoading();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inquiryData, setInquiryData] = useState({
    deliveryDate: '',
    paymentTerms: '',
    contactEmail: '',
    requirements: '',
  });

  // Mutation for submitting inquiries
  const submitInquiriesMutation = useMutation({
    mutationFn: async (inquiries: any[]) => {
      const promises = inquiries.map(inquiry => 
        fetch('/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(inquiry),
        })
      );
      
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));
      return results;
    },
    onSuccess: () => {
      setLoading(false);
      toast({
        title: "Inquiries Sent Successfully!",
        description: "Your inquiries have been sent to suppliers. They will review and respond soon.",
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error) => {
      setLoading(false);
      toast({
        title: "Error Sending Inquiries",
        description: "There was an error sending your inquiries. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (priceRange: string) => {
    // Extract the first price from range like "$10.00-$100.00 /piece"
    const match = priceRange.match(/\$([\d.]+)/);
    return match ? `$${match[1]}` : priceRange;
  };

  const handleSendInquiries = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send inquiries.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Please add items to your cart before sending inquiries.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true, "Sending inquiries to suppliers...");

    // Create inquiries for each cart item
    const inquiries = items.map(item => ({
      productId: item.productId,
      buyerId: user.id,
      quantity: item.quantity,
      targetPrice: null, // Cart doesn't have individual target prices
      message: inquiryData.requirements || '',
      requirements: inquiryData.requirements || '',
    }));

    submitInquiriesMutation.mutate(inquiries);
  };

  const handleSendIndividualInquiries = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send inquiries.",
        variant: "destructive",
      });
      return;
    }

    // For individual inquiries, we could implement a different flow
    // For now, we'll use the same as bulk inquiries
    handleSendInquiries();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        
        {/* Hero Section with Gradient */}
        <section className="relative py-16 bg-gradient-to-br from-primary via-primary to-orange-600 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
                <ShoppingCart className="w-4 h-4" />
                <span>Shopping Cart</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Your Cart is
                <span className="bg-gradient-to-r from-primary via-white to-orange-600 bg-clip-text text-transparent block">
                  Empty
                </span>
              </h1>
              
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                Add some products to get started with your B2B purchase
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-300" />
                  <span>Verified Suppliers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-yellow-300" />
                  <span>Fast Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-300" />
                  <span>Direct Communication</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Add some products to get started with your B2B purchase
              </p>
              <Link href="/products">
                <Button size="lg" className="bg-primary hover:bg-primary text-white px-8 py-3">
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-primary via-primary to-orange-600 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <ShoppingCart className="w-4 h-4" />
              <span>Shopping Cart</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Shopping
              <span className="bg-gradient-to-r from-primary via-white to-orange-600 bg-clip-text text-transparent block">
                Cart
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {totalItems} items in your cart • Review your selected products
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Suppliers</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-yellow-300" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-300" />
                <span>Direct Communication</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Cart Items</h2>
                <Button variant="outline" onClick={clearCart} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <div className="space-y-6">
                {items.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <Avatar className="h-24 w-24 rounded-xl">
                          <AvatarImage src={item.image} alt={item.name} />
                          <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-orange-600 text-primary font-bold text-lg">
                            {item.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">{item.name}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        
                          <p className="text-gray-600 mb-3 text-sm">
                            {item.supplierName} • {item.supplierCountry}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            {item.verified && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-1">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {item.tradeAssurance && (
                              <Badge className="bg-primary text-primary border-primary text-xs px-2 py-1">
                                Trade Assurance
                              </Badge>
                            )}
                            {item.readyToShip && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-2 py-1">
                                <Truck className="w-3 h-3 mr-1" />
                                Ready to Ship
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600">Quantity:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-gray-200 hover:bg-gray-50"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-lg font-bold px-4 py-2 border border-gray-200 rounded-lg min-w-[4rem] text-center bg-gray-50">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-gray-200 hover:bg-gray-50"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-1">Price Range:</p>
                              <p className="text-lg font-bold text-gray-900">{item.priceRange}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inquiry Summary */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Inquiry Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Selected:</span>
                    <span className="font-semibold">{totalItems} of {totalItems} items</span>
                  </div>
                  
                  <Separator />
                  
                  {/* Cart Items in Sidebar */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                        <Avatar className="h-10 w-10 rounded">
                          <AvatarImage src={item.image} alt={item.name} />
                          <AvatarFallback className="text-xs">
                            {item.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} • {formatPrice(item.priceRange)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.supplierName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-primary text-white shadow-lg" 
                      size="lg"
                      onClick={handleSendInquiries}
                      disabled={submitInquiriesMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send to All Admins
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-200 hover:bg-gray-50"
                      onClick={handleSendIndividualInquiries}
                      disabled={submitInquiriesMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Individual Inquiries
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Details */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Inquiry Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      value={inquiryData.deliveryDate}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-terms">Payment Terms Preference</Label>
                    <Select value={inquiryData.paymentTerms} onValueChange={(value) => setInquiryData(prev => ({ ...prev, paymentTerms: value }))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lc">Letter of Credit</SelectItem>
                        <SelectItem value="tt">T/T in Advance</SelectItem>
                        <SelectItem value="dp">D/P at Sight</SelectItem>
                        <SelectItem value="da">D/A</SelectItem>
                        <SelectItem value="open-account">Open Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-email">Your Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={inquiryData.contactEmail}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="requirements">Additional Requirements</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Specify any special requirements, delivery preferences, or questions for admins..."
                      value={inquiryData.requirements}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, requirements: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-200 hover:bg-gray-50"
                    onClick={() => {
                      const data = {
                        items: items.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          priceRange: item.priceRange,
                          supplier: item.supplierName,
                          moq: item.moq,
                        })),
                        inquiryDetails: {
                          deliveryDate: inquiryData.deliveryDate,
                          paymentTerms: inquiryData.paymentTerms,
                          contactEmail: inquiryData.contactEmail,
                          requirements: inquiryData.requirements,
                        },
                        timestamp: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `inquiry-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Inquiry
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card className="bg-gradient-to-r from-green-50 to-orange-600 border-green-100 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Trade Assurance</h4>
                      <p className="text-sm text-gray-600">
                        Your payments are protected until delivery is confirmed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Fast Shipping</h4>
                      <p className="text-sm text-gray-600">
                        Connect with admins offering quick delivery
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Direct Communication</h4>
                      <p className="text-sm text-gray-600">
                        Chat directly with verified admins
                      </p>
                    </div>
                  </div>
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
