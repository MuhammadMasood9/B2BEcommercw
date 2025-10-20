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
  Download
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
        <main className="flex-1">
          <PageHeader
            title="Shopping Cart"
            subtitle="Review your selected products"
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-20">
              <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">
                Add some products to get started with your B2B purchase
              </p>
              <Link href="/products">
                <Button size="lg">
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
      <main className="flex-1">
        <PageHeader
          title="Shopping Cart"
          subtitle={`${totalItems} items in your cart`}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Cart Items</h2>
                <Button variant="outline" onClick={clearCart} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-6 bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex gap-4">
                      <Avatar className="h-20 w-20 rounded-lg">
                        <AvatarImage src={item.image} alt={item.name} />
                        <AvatarFallback className="rounded-lg">
                          {item.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-muted-foreground mb-2">
                          {item.supplierName} • {item.supplierCountry}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          {item.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {item.tradeAssurance && (
                            <Badge variant="secondary" className="text-xs">
                              Trade Assurance
                            </Badge>
                          )}
                          {item.readyToShip && (
                            <Badge variant="secondary" className="text-xs">
                              <Truck className="w-3 h-3 mr-1" />
                              Ready to Ship
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Quantity:</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium px-3 py-1 border rounded min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price Range:</p>
                            <p className="font-semibold">{item.priceRange}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inquiry Summary */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                      size="lg"
                      onClick={handleSendInquiries}
                      disabled={submitInquiriesMutation.isPending}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send to All Admins
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
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
              <Card className="bg-white border-gray-100 shadow-lg">
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
                    className="w-full"
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
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-100 shadow-lg">
                <CardHeader>
                  <CardTitle>Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Trade Assurance</h4>
                      <p className="text-sm text-muted-foreground">
                        Your payments are protected until delivery is confirmed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Fast Shipping</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect with admins offering quick delivery
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Direct Communication</h4>
                      <p className="text-sm text-muted-foreground">
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
