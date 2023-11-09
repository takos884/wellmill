import React from "react";
import { useUserData } from "./useUserData";

import './App.css';
import styles from './cart.module.css'
import Header from "./Header";
import { useProducts } from "./ProductContext";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
];

function Cart() {
  //const { user, setUser, loading: userLoading } = useUserData();
  const { user, loading: userLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  if(userLoading) { return(<span className={styles.loading}>Loading profile...</span>) }
  if(productsLoading) { return(<span className={styles.loading}>Loading products...</span>) }
  if(productsError) { return(<span className={styles.loading}>Loading products error</span>) }
  const cart = user?.cart ? user?.cart : {lines: [], totalQuantity: 0}

  const cartLineElements = cart.lines.map((line) => {
    // Extracting the variant ID number from the merchandise string
    const variantId = line.merchandise.split('/').pop();

    // Find the corresponding product and variant
    const product = products ? products.find((product) => {
      return product.variants.some(variant => variant.id.toString() === variantId);
    }) : null;

    const variant = product?.variants.find(variant => variant.id.toString() === variantId);

    // If product is found, return the div with image and title, otherwise null
    return product ? (
      <div key={line.id}>
        <img src={product.image.src} alt={product.title} style={{ width: '100px' }} />
        <p>{variant ? variant.title : product.title}</p>
      </div>
    ) : null;
  })

  const headings = (cart.totalQuantity > 0) ? (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span>合計</span>
    </div>
  ) : null;

  return(<>
    <div className="topDots" />
    <Header breadcrumbs={breadcrumbs} />
    <span className="topHeader">カートを見る</span>
    <span>It's a cart, item count: {cart.totalQuantity}</span>
    {headings}
    {cartLineElements}
  </>
  )
}

export default Cart