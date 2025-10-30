import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  productId: string;
  productName: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface MultiVendorCartProps {
  items: CartItem[];
  onCheckout: (orderData: any) => Promise<void>;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const MultiVendorCart: React.FC<MultiVendorCartProps> = ({
  items,
  onCheckout,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Group items by supplier
  const groupedItems = items.reduce((groups, item) => {
    const supplierId = item.supplierId || 'admin';
    const supplierName = item.supplierName || 'Platform Store';
    
    if (!groups[supplierId]) {
      groups[supplierId] = {
        supplierId,
        supplierName,
        items: [],
        total: 0
      };
    }
    
    groups[supplierId].items.push(item);
    groups[supplierId].total += item.totalPrice;
    
    return groups;
  }, {} as Record<string, { supplierId: string; supplierName: string; items: CartItem[]; total: number }>);

  const supplierGroups = Object.values(groupedItems);
  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        shippingAddress: {
          // This would come from a form in a real implementation
          street: "123 Main St",
          city: "Anytown",
          state: "ST",
          zipCode: "12345",
          country: "US"
        },
        paymentMethod: "T/T"
      };

      await onCheckout(orderData);
      
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <p className="text-gray-400 text-sm">Add some products to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Multi-Vendor Cart ({items.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {supplierGroups.map((group) => (
              <div key={group.supplierId} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="h-4 w-4" />
                  <h3 className="font-medium">{group.supplierName}</h3>
                  <Badge variant="outline">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            ${item.unitPrice.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        
                        <div className="text-right min-w-[80px]">
                          <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal for {group.supplierName}:</span>
                  <span className="font-bold">${group.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            
            {supplierGroups.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Multi-Vendor Order:</strong> This order contains items from {supplierGroups.length} different suppliers. 
                  Your order will be split into separate orders for each supplier, and you may receive multiple shipments.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Checkout - $${grandTotal.toFixed(2)}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiVendorCart;