import React, { ReactNode, useEffect, useState } from 'react';
//import useWPData from './useWPData';
//import useShopify from './useShopify';
import './App.css';
import styles from './shop.module.css'

import { useProducts } from './ProductContext';
import Header from './Header';
import ProductTile from './ProductTile';
import Footer from './Footer';

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "SHOP", url: "/shop" },
];

function Shop() {
  const { products, setProducts } = useProducts();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | string | ReactNode | null>(null);

  // const internalData = true
  // const [data, loading, error] = useWPData(internalData ? 'fake_products_list' : 'products_list');
  // const { data, loading, error } = useShopify<any>('products');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/wellmill/products.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch products. HTTP Status: ${response.status}`);
        }
        const fetchedProducts = await response.json();
        setProducts(fetchedProducts);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching products.');
      }
    }
    fetchProducts();
  }, [setProducts]);

  let errorNode: ReactNode = null;
  if(error instanceof Error)  { errorNode = <span>{error.message}</span>; }
  if(typeof error === "string") { errorNode = <span>{error}</span>; }
  if(React.isValidElement(error)) { errorNode = error; }
  
  return (
    <>
      <div className={styles.shopRoot}>
        <div className="topDots" />
        <Header breadcrumbs={breadcrumbs} />
        <span className="topHeader">SHOP</span>
        <span className={styles.shoppingDescription} >検査キット到着後、専用アプリにて検査項目を自由に選べます。ご購入の際は、検査する項目数だけ選んでください。</span>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {errorNode}</p>}
        <div className={styles.productGrid}>
          {products?.map(product => (
            <div key={product.id}>
              <ProductTile Product={product} />
            </div>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  );
}

export default Shop;