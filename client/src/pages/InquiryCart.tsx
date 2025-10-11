import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MessageSquare } from "lucide-react";

export default function InquiryCart() {
  //todo: remove mock functionality
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      name: "Premium Wireless Headphones",
      supplier: "AudioTech Pro",
      quantity: 500,
      targetPrice: "$25",
      customization: "Custom packaging required",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
      name: "Classic Analog Wristwatch",
      supplier: "TimeKeeper Industries",
      quantity: 1000,
      targetPrice: "$18",
      customization: "Logo engraving",
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop",
      name: "Designer Sunglasses UV Protection",
      supplier: "Vision Plus Co.",
      quantity: 2000,
      targetPrice: "$10",
      customization: "",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<string[]>(cartItems.map(item => item.id));

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Inquiry Cart</h1>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="text-sm sm:text-base text-muted-foreground mb-4">Your inquiry cart is empty</div>
                <Button data-testid="button-browse-products">Browse Products</Button>
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

                {cartItems.map((item) => (
                  <Card key={item.id} data-testid={`cart-item-${item.id}`}>
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
                        
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-semibold mb-1 text-sm sm:text-base truncate" data-testid={`text-item-name-${item.id}`}>{item.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-supplier-${item.id}`}>Supplier: {item.supplier}</p>
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

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground block mb-1">Quantity</label>
                              <Input
                                type="number"
                                value={item.quantity}
                                className="text-sm"
                                onChange={(e) => {
                                  const newItems = cartItems.map(i => 
                                    i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i
                                  );
                                  setCartItems(newItems);
                                }}
                                data-testid={`input-quantity-${item.id}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground block mb-1">Target Price</label>
                              <Input
                                value={item.targetPrice}
                                className="text-sm"
                                onChange={(e) => {
                                  const newItems = cartItems.map(i => 
                                    i.id === item.id ? { ...i, targetPrice: e.target.value } : i
                                  );
                                  setCartItems(newItems);
                                }}
                                data-testid={`input-price-${item.id}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground block mb-1">Customization</label>
                              <Input
                                placeholder="Optional"
                                value={item.customization}
                                className="text-sm"
                                onChange={(e) => {
                                  const newItems = cartItems.map(i => 
                                    i.id === item.id ? { ...i, customization: e.target.value } : i
                                  );
                                  setCartItems(newItems);
                                }}
                                data-testid={`input-custom-${item.id}`}
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
                      <label className="text-xs sm:text-sm font-medium block mb-2">Expected Delivery Date</label>
                      <Input type="date" className="text-sm" data-testid="input-delivery-date" />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium block mb-2">Payment Terms Preference</label>
                      <Input placeholder="e.g., T/T, L/C" className="text-sm" data-testid="input-payment-terms" />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium block mb-2">Additional Requirements</label>
                      <Textarea 
                        placeholder="Any special requirements or notes for suppliers..."
                        rows={3}
                        className="text-sm"
                        data-testid="textarea-requirements"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium block mb-2">Your Contact Email</label>
                      <Input type="email" placeholder="your@email.com" className="text-sm" data-testid="input-email" />
                    </div>

                    <div className="pt-3 sm:pt-4 border-t space-y-2">
                      <Button 
                        className="w-full text-xs sm:text-sm" 
                        size="lg"
                        disabled={selectedItems.length === 0}
                        data-testid="button-send-all"
                      >
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Send to All Suppliers
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-xs sm:text-sm"
                        disabled={selectedItems.length === 0}
                        data-testid="button-send-individual"
                      >
                        Send Individual Inquiries
                      </Button>
                    </div>

                    <Button 
                      variant="ghost" 
                      className="w-full text-xs sm:text-sm"
                      data-testid="button-save-later"
                    >
                      Save for Later
                    </Button>
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
