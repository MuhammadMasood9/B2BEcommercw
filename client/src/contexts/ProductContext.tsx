import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProductContextType {
  currentProduct: {
    id?: string;
    name?: string;
  } | null;
  setCurrentProduct: (product: { id?: string; name?: string } | null) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [currentProduct, setCurrentProduct] = useState<{ id?: string; name?: string } | null>(null);

  return (
    <ProductContext.Provider value={{ currentProduct, setCurrentProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}
