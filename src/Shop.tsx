import React, { useEffect, useState } from 'react';
import useWPData from './useWPData';
import './App.css';
import styles from './shop.module.css'

import Header from './Header';
import ProductTile from './ProductTile';

function Shop() {
  const internalData = true
  const [productList, setProductList] = useState<any[]>([]);
  const [data, loading, error] = useWPData(internalData ? 'fake_products_list' : 'products_list');

  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "SHOP", url: "/shop" },
  ];

  useEffect(() => {
    if (data && !loading && !error) {
      setProductList(data);
    }
  }, [data, loading, error]);

  return (
    <div className={styles.shopRoot}>
      <div className={styles.topDots} />
      <Header breadcrumbs={breadcrumbs} />
      <span className={styles.header}>SHOP</span>
      <span className={styles.shoppingDescription} >検査キット到着後、専用アプリにて検査項目を自由に選べます。ご購入の際は、検査する項目数だけ選んでください。</span>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <div className={styles.productGrid}>
        {productList.map(product => (
          <div key={product.id}>
            <ProductTile productData={{
              id: product.id,
              description: product.description,
              base_price: product.base_price,
              tax_rate: product.tax_rate,
              images: product.images,
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shop;