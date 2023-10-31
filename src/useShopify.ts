import { useState, useEffect } from 'react';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

type ShopifyIntent = 'products' | 'product' | 'user' | 'cart';

function useShopify<T>(intent: ShopifyIntent, id?: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  let endpoint: string;
  switch (intent) {
    case 'products': endpoint = `products.json`;               break;
    case 'product':  endpoint = `products/${id}.json`;         break;
    case 'user':     endpoint = `customers/${id}.json`;        break;
    case 'cart':     endpoint = `customers/${id}/orders.json`; break;
    default:
      throw new Error(`Invalid intent: ${intent}`);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        if (intent !== 'products' && (!id || id.trim() === '')) {
          setError(new Error(`ID is required for pulling ${intent} data`));
          setLoading(false);
          return;
        }

        const response = await fetch(`https://well-mill.myshopify.com/admin/api/2023-10/${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.REACT_APP_SHOPIFY_ADMIN_API_TOKEN!
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: T = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          // This is some unexpected error, so we create a new Error object with a default message.
          setError(new Error('A very unexpected error occurred.'));
        }
        setLoading(false);
      }
    }

    fetchData();
  }, [intent, endpoint, id]);

  return { data, loading, error };
}

export default useShopify;