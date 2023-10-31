import React from 'react';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from './types';

type ProductContextType = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
};

const ProductContext: React.Context<ProductContextType | undefined> = createContext<ProductContextType | undefined>(undefined);

export function useProducts(): ProductContextType {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}

type ProductProviderProps = {
  children: ReactNode;
};

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

