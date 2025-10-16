import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MessageSquare, Loader2, ShoppingCart, Sparkles, Package } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  supplierName: string;
  quantity: number;
  targetPrice: number;
  requirements: string;
  message: string;
}

export default function InquiryCart() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Fetch cart items from localStorage or API
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/inquiry-cart'],
    queryFn: async () => {
      // Check if cart is stored in localStorage
      const stored = localStorage.getItem('inquiryCart');
      if (stored) {
        return JSON.parse(stored) as CartItem[];
      }
      return [];
    }
  });

  // Initialize selected items when cart loads
  useEffect(() => {
    setSelectedItems(cartItems.map((item: CartItem) => item.id));
  }, [cartItems]);

  // Send inquiries mutation
  const sendInquiriesMutation = useMutation({
    mutationFn: async (inquiries: any[]) => {
      const responses = await Promise.all(
        inquiries.map(inquiry =>
          fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inquiry)
          }).then(res => res.json())
        )
      );
      return responses;
    },
    onSuccess: () => {
      toast.success('Inquiries sent successfully!');
      // Clear cart
      localStorage.removeItem('inquiryCart');
      queryClient.invalidateQueries({ queryKey: ['/api/inquiry-cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      navigate('/buyer/inquiries');
    },
    onError: (error: any) => {
      toast.error(`Failed to send inquiries: ${error.message}`);
    }
  });

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter((item: CartItem) => item.id !== id);
    localStorage.setItem('inquiryCart', JSON.stringify(updatedCart));
    queryClient.invalidateQueries({ queryKey: ['/api/inquiry-cart'] });
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    toast.success('Item removed from cart');
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    const updatedCart = cartItems.map((item: CartItem) =>
      item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem('inquiryCart', JSON.stringify(updatedCart));
    queryClient.invalidateQueries({ queryKey: ['/api/inquiry-cart'] });
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item: CartItem) => item.id));
    }
  };

  const handleSendInquiries = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    const selectedCartItems = cartItems.filter((item: CartItem) => selectedItems.includes(item.id));
    
    const inquiries = selectedCartItems.map((item: CartItem) => ({
      productId: item.productId,
      quantity: item.quantity,
      targetPrice: item.targetPrice,
      message: item.message || additionalRequirements || 'Inquiry from cart',
      requirements: item.requirements || additionalRequirements || '',
      expectedDeliveryDate: deliveryDate,
      paymentTermsPreference: paymentTerms
    }));

    sendInquiriesMutation.mutate(inquiries);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your inquiry cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              Inquiry Cart
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review and send your product inquiries to suppliers
            </p>
          </div>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your inquiry cart is empty
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                  Start browsing products and add them to your inquiry cart
                </p>
                <Button onClick={() => navigate('/products')} data-testid="button-browse-products">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems.length === cartItems.length}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                      <CardTitle className="text-base sm:text-lg">Select All ({cartItems.length} items)</CardTitle>
                    </div>
                  </CardHeader>
                </Card>

                {cartItems.map((item: CartItem) => (
                  <Card key={item.id} data-testid={`cart-item-${item.id}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                          data-testid={`checkbox-item-${item.id}`}
                        />
                        
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-semibold mb-1 text-sm sm:text-base text-gray-900 dark:text-white" data-testid={`text-item-name-${item.id}`}>
                                {item.productName}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400" data-testid={`text-supplier-${item.id}`}>
                                Supplier: {item.supplierName}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-10 sm:w-10"
                              onClick={() => removeItem(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div>
                              <label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 block mb-1">
                                Quantity *
                              </label>
                              <Input
                                type="number"
                                value={item.quantity}
                                className="text-sm"
                                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                                data-testid={`input-quantity-${item.id}`}
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 block mb-1">
                                Target Price ($)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.targetPrice}
                                className="text-sm"
                                onChange={(e) => updateItem(item.id, { targetPrice: Number(e.target.value) })}
                                data-testid={`input-price-${item.id}`}
                                placeholder="0.00"
                                min="0"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 block mb-1">
                                Additional Requirements
                              </label>
                              <Textarea
                                placeholder="Any specific requirements..."
                                value={item.requirements || ''}
                                className="text-sm"
                                onChange={(e) => updateItem(item.id, { requirements: e.target.value })}
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Inquiry Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        Selected: {selectedItems.length} of {cartItems.length} items
                      </p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Expected Delivery Date
                      </label>
                      <Input 
                        type="date" 
                        className="text-sm" 
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        data-testid="input-delivery-date" 
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Payment Terms Preference
                      </label>
                      <Input 
                        placeholder="e.g., T/T, L/C" 
                        className="text-sm"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        data-testid="input-payment-terms" 
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Additional Requirements
                      </label>
                      <Textarea 
                        placeholder="Any special requirements or notes for suppliers..."
                        rows={3}
                        className="text-sm"
                        value={additionalRequirements}
                        onChange={(e) => setAdditionalRequirements(e.target.value)}
                        data-testid="textarea-requirements"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Your Contact Email
                      </label>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        className="text-sm"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        data-testid="input-email" 
                      />
                    </div>

                    <div className="pt-3 sm:pt-4 border-t space-y-2">
                      <Button 
                        className="w-full text-xs sm:text-sm" 
                        size="lg"
                        disabled={selectedItems.length === 0 || sendInquiriesMutation.isPending}
                        onClick={handleSendInquiries}
                        data-testid="button-send-all"
                      >
                        {sendInquiriesMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                            Sending Inquiries...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Send All Inquiries ({selectedItems.length})
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                      <p>Selected {selectedItems.length} of {cartItems.length} items</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
