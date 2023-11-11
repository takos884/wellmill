import React, { useEffect } from 'react';
import { createContext, useContext, useState, ReactNode } from 'react';
import { ShopifyProduct, Variant } from './types';

type ProductContextType = {
  products: ShopifyProduct[] | undefined;
  setProducts: React.Dispatch<React.SetStateAction<ShopifyProduct[] | undefined>>;
  isLoading: boolean;
  error: string | null;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

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
  const [products, setProducts] = useState<ShopifyProduct[] | undefined>(undefined);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      if (products !== undefined) { return } // Fetch only if products are not already fetched
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/wellmill/products.json');
        if (!response.ok) {
          throw new Error(`HTTP Status: ${response.status}`);
        }
        const fetchedProducts = await response.json();

        // Shopify returns price as a string! This seems like an error on their side
        fetchedProducts.products.forEach((product: ShopifyProduct) => {
          if(product.variants) {
            product.variants.forEach((variant: Variant) => {
              if(variant.price) {
                variant.price = parseInt(variant.price.toString())
              }
            });
          }
        });

        //console.log(fetchedProducts)

        if (isMounted) {
          if (Array.isArray(fetchedProducts)) {
            setProducts(fetchedProducts);
          } else if (fetchedProducts.products && Array.isArray(fetchedProducts.products)) {
            setProducts(fetchedProducts.products);
          } else {
            setProducts([]);
            throw new Error("Unrecognized data structure received");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching products.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    // Cleanup function to set isMounted to false when component unmounts
    return () => { isMounted = false; };
  }, [products]); // Empty dependency array means this effect runs once on mount

  return (
    <ProductContext.Provider value={{ products, setProducts, isLoading, error }}>
      {children}
    </ProductContext.Provider>
  );
}

