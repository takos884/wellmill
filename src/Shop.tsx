import React, { useEffect } from 'react';
import useWPData from './useWPData';
import './App.css';
import styles from './shop.module.css'

import { useProducts } from './ProductContext';
import Header from './Header';
import ProductTile from './ProductTile';
import Footer from './Footer';

function Shop() {
  const { products, setProducts } = useProducts();

  const internalData = true
  const [data, loading, error] = useWPData(internalData ? 'fake_products_list' : 'products_list');

  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "SHOP", url: "/shop" },
  ];

  useEffect(() => {
    if (data && !loading && !error) {
      setProducts(data);
    }
  }, [data, loading, error, setProducts]);

  return (
    <>
      <div className={styles.shopRoot}>
        <div className={styles.topDots} />
        <Header breadcrumbs={breadcrumbs} />
        <span className={styles.header}>SHOP</span>
        <span className={styles.shoppingDescription} >検査キット到着後、専用アプリにて検査項目を自由に選べます。ご購入の際は、検査する項目数だけ選んでください。</span>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        <div className={styles.productGrid}>
          {products?.map(product => (
            <div key={product.id}>
              <ProductTile Product={{
                id: product.id,
                description: product.description,
                long_description: product.description,
                base_price: product.base_price,
                tax_rate: product.tax_rate,
                images: product.images,
              }} />
            </div>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  );
}

export default Shop;