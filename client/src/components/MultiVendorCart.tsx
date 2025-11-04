import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, Store, Package, Truck, MapPin, CreditCard, Clock, CheckCircle, AlertCircle, MessageCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  productId: string;
  productName: string;
  supplierId?: string;
  supplierName?: string;
  supplierLocation?: string;
  supplierVerified?: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadTime?: string;
  moq?: number;
  inStock?: boolean;
  shippingCost?: number;
}

interface OrderTracking {
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress?: any;
  createdAt: string;
  updatedAt: string;
}

interface SplitOrderSummary {
  parentOrderId: string;
  parentOrderNumber: string;
  totalAmount: number;
  splitOrders: OrderTracking[];
  createdAt: string;
}

interface MultiVendorCartProps {
  items: CartItem[];
  onCheckout: (orderData: any) => Promise<SplitOrderSummary>;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onTrackOrder?: (orderId: string) => void;
  onContactSupplier?: (supplierId: string, orderId?: string) => void;
}

const MultiVendorCart: React.FC<MultiVendorCartProps> = ({
  items,
  onCheckout,
  onRemoveItem,
  onUpdateQuantity,
  onTrackOrder,
  onContactSupplier
}) => {
  const [loading, setLoading] = useState(false);
  const [orderSummary, setOrderSummary] = useState<SplitOrderSummary | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const { toast } = useToast();

  // Group items by supplier with enhanced information
  const groupedItems = items.reduce((groups, item) => {
    const supplierId = item.supplierId || 'admin';
    const supplierName = item.supplierName || 'Platform Store';
    
    if (!groups[supplierId]) {
      groups[supplierId] = {
        supplierId,
        supplierName,
        supplierLocation: item.supplierLocation,
        supplierVerified: item.supplierVerified || false,
        items: [],
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        estimatedDelivery: '',
        hasStockIssues: false
      };
    }
    
    groups[supplierId].items.push(item);
    groups[supplierId].subtotal += item.totalPrice;
    groups[supplierId].shippingCost += item.shippingCost || 0;
    groups[supplierId].total = groups[supplierId].subtotal + groups[supplierId].shippingCost;
    
    // Check for stock issues
    if (!item.inStock || (item.moq && item.quantity < item.moq)) {
      groups[supplierId].hasStockIssues = true;
    }
    
    // Calculate estimated delivery (use longest lead time)
    if (item.leadTime) {
      const currentEstimate = groups[supplierId].estimatedDelivery;
      if (!currentEstimate || item.leadTime > currentEstimate) {
        groups[supplierId].estimatedDelivery = item.leadTime;
      }
    }
    
    return groups;
  }, {} as Record<string, { 
    supplierId: string; 
    supplierName: string; 
    supplierLocation?: string;
    supplierVerified: boolean;
    items: CartItem[]; 
    subtotal: number;
    shippingCost: number;
    total: number;
    estimatedDelivery: string;
    hasStockIssues: boolean;
  }>);

  const supplierGroups = Object.values(groupedItems);
  const grandTotal = supplierGroups.reduce((sum, group) => sum + group.total, 0);
  const totalShipping = supplierGroups.reduce((sum, group) => sum + group.shippingCost, 0);
  const hasAnyStockIssues = supplierGroups.some(group => group.hasStockIssues);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    if (hasAnyStockIssues) {
      toast({
        title: "Stock Issues",
        description: "Some items have stock or MOQ issues. Please review your cart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          supplierId: item.supplierId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          shippingCost: item.shippingCost || 0
        })),
        shippingAddress: {
          // This would come from a form in a real implementation
          street: "123 Main St",
          city: "Anytown",
          state: "ST",
          zipCode: "12345",
          country: "US"
        },
        paymentMethod: "T/T",
        totalAmount: grandTotal,
        supplierCount: supplierGroups.length
      };

      const result = await onCheckout(orderData);
      setOrderSummary(result);
      setShowOrderSummary(true);
      
      toast({
        title: "Success",
        description: `Order split into ${result.splitOrders.length} separate orders for different suppliers!`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'processing': return 60;
      case 'shipped': return 80;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <h3 className="font-medium">{group.supplierName}</h3>
                    {group.supplierVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {group.supplierLocation && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {group.supplierLocation}
                      </div>
                    )}
                    {onContactSupplier && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onContactSupplier(group.supplierId)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {group.hasStockIssues && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Stock Issues Detected</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Some items may be out of stock or below minimum order quantity.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>${item.unitPrice.toFixed(2)} each</span>
                            {item.leadTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.leadTime}
                              </div>
                            )}
                            {item.moq && item.quantity < item.moq && (
                              <span className="text-red-600">MOQ: {item.moq}</span>
                            )}
                            {!item.inStock && (
                              <span className="text-red-600">Out of Stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, Math.max(item.moq || 1, item.quantity - 1))}
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
                          {item.shippingCost && item.shippingCost > 0 && (
                            <p className="text-xs text-gray-500">+${item.shippingCost.toFixed(2)} shipping</p>
                          )}
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Subtotal:</span>
                    <span>${group.subtotal.toFixed(2)}</span>
                  </div>
                  {group.shippingCost > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Shipping:</span>
                      <span>${group.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-medium">
                    <span>Total for {group.supplierName}:</span>
                    <span>${group.total.toFixed(2)}</span>
                  </div>
                  {group.estimatedDelivery && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Truck className="h-3 w-3" />
                      Estimated delivery: {group.estimatedDelivery}
                    </div>
                  )}
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
              disabled={loading || hasAnyStockIssues}
            >
              {loading ? 'Processing...' : `Checkout - $${grandTotal.toFixed(2)}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary Dialog */}
      <Dialog open={showOrderSummary} onOpenChange={setShowOrderSummary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Order Placed Successfully
            </DialogTitle>
          </DialogHeader>
          
          {orderSummary && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Multi-Vendor Order Created</h3>
                <p className="text-green-700 text-sm">
                  Your order has been split into {orderSummary.splitOrders.length} separate orders for different suppliers.
                  Each supplier will process their portion independently.
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span>Parent Order: <strong>{orderSummary.parentOrderNumber}</strong></span>
                  <span>Total: <strong>${orderSummary.totalAmount.toFixed(2)}</strong></span>
                </div>
              </div>

              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="orders">Split Orders</TabsTrigger>
                  <TabsTrigger value="tracking">Order Tracking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders" className="space-y-4">
                  {orderSummary.splitOrders.map((order, index) => (
                    <Card key={order.orderId} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{order.supplierName}</CardTitle>
                            <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${order.totalAmount.toFixed(2)}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Status Progress:</span>
                            <span>{getStatusProgress(order.status)}%</span>
                          </div>
                          <Progress value={getStatusProgress(order.status)} className="h-2" />
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Items:</span>
                              <span className="ml-2">{order.items.length} products</span>
                            </div>
                            {order.estimatedDelivery && (
                              <div>
                                <span className="text-gray-600">Est. Delivery:</span>
                                <span className="ml-2">{order.estimatedDelivery}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            {onTrackOrder && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onTrackOrder(order.orderId)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Track Order
                              </Button>
                            )}
                            {onContactSupplier && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onContactSupplier(order.supplierId, order.orderId)}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Contact Supplier
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="tracking" className="space-y-4">
                  <div className="grid gap-4">
                    {orderSummary.splitOrders.map((order) => (
                      <Card key={order.orderId}>
                        <CardHeader>
                          <CardTitle className="text-base">{order.supplierName} - {order.orderNumber}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Order Status</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            
                            <Progress value={getStatusProgress(order.status)} className="h-3" />
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Created:</span>
                                <span className="ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Last Updated:</span>
                                <span className="ml-2">{new Date(order.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {order.trackingNumber && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Tracking Number:</span>
                                  <span className="text-sm text-blue-700">{order.trackingNumber}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOrderSummary(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowOrderSummary(false);
                  // Clear cart or redirect to orders page
                }}>
                  View All Orders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiVendorCart;