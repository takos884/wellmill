import { useState, useEffect } from 'react';

type FetchType = 'customer' | 'product' | 'order' | 'products_list' | 'fake_customer' | 'fake_product' | 'fake_order' | 'fake_products_list';

function useWPData(type: FetchType, id?: number) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);

  const BASE_URL = 'https://www.well-mill.com/wp-json/wp/v2/';

  useEffect(() => {
    const fakeProductData = [
      {
        id: 1,
        description: "選べる1項目モニタリング検査",
        base_price: 6000,
        tax_rate: 0.10,
        images: ["https://cdn.shopify.com/s/files/1/0728/3933/2132/products/illust_1.png?v=1680808650", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/Clippathgroup.png?v=1680808650", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/img_1.jpg?v=1680808650"],
      },{
        id: 2,
        description: "選べる2項目モニタリング検査",
        base_price: 9000,
        tax_rate: 0.10,
        images: ["https://cdn.shopify.com/s/files/1/0728/3933/2132/products/illust_2.png?v=1680808708", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/Clippathgroup.png?v=1680808650", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/img_1.jpg?v=1680808650"],
      },{
        id: 3,
        description: "選べる3項目モニタリング検査",
        base_price: 12000,
        tax_rate: 0.10,
        images: ["https://cdn.shopify.com/s/files/1/0728/3933/2132/products/illust_3.png?v=1680808736", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/Clippathgroup.png?v=1680808650", "https://cdn.shopify.com/s/files/1/0728/3933/2132/products/img_1.jpg?v=1680808650"],
      }
    ]
    
    let endpoint: string;

    switch (type) {
      case 'customer':
        endpoint = `customers/${id}`; // Assuming `customers` is a custom post type
        break;
      case 'product':
        endpoint = id ? `products/${id}` : 'products'; // Assuming `products` is a custom post type
        break;
      case 'order':
        endpoint = `orders/${id}`; // Assuming `orders` is a custom post type
        break;
      case 'products_list':
        endpoint = 'products';
        break;
      //default:
      //  throw new Error('Invalid fetch type');
    }
    
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${BASE_URL}${endpoint}`);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (id || type === 'products_list') {
      fetchData();
    }
    if(type === 'fake_products_list') {
        setData(fakeProductData)
    }
  }, [type, id]);

  return [data, loading, error];
}

export default useWPData;