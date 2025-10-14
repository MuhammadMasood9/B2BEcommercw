import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  priceRange: string;
  moq: number;
  quantity: number;
  supplierName: string;
  supplierCountry: string;
  verified: boolean;
  tradeAssurance: boolean;
  readyToShip?: boolean;
  sampleAvailable?: boolean;
  customizationAvailable?: boolean;
  certifications?: string[];
  leadTime?: string;
  port?: string;
  paymentTerms?: string[];
  inStock?: boolean;
  stockQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  addToCart: (product: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('b2b-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('b2b-cart', JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (product: Omit<CartItem, 'id' | 'quantity'>) => {
    const existingItem = items.find(item => item.productId === product.productId);
    
    if (existingItem) {
      // Update quantity if item already exists
      setItems(prevItems =>
        prevItems.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      toast({
        title: "Quantity Updated",
        description: `${product.name} quantity increased in cart.`,
      });
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        ...product,
        id: `${product.productId}-${Date.now()}`,
        quantity: 1,
      };
      setItems(prevItems => [...prevItems, newItem]);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart.",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.productId === productId);
  };

  const getCartItem = (productId: string) => {
    return items.find(item => item.productId === productId);
  };

  const value: CartContextType = {
    items,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
