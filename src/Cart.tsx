import React from "react";
import { useUserData } from "./useUserData";

import './App.css';
import styles from './cart.module.css'
import Header from "./Header";
import { useProducts } from "./ProductContext";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
];

function Cart() {
  const { user, loading: userLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  if(userLoading) { return(<span className={styles.loading}>Loading profile...</span>) }
  if(productsLoading) { return(<span className={styles.loading}>Loading products...</span>) }
  if(productsError) { return(<span className={styles.loading}>Loading products error</span>) }
  const cart = user?.cart ? user?.cart : {lines: [], totalQuantity: 0, totalCost: 0}

  const headings = (cart.totalQuantity > 0) ? (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span>合計</span>
    </div>
  ) : null;

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
      <div key={line.id} className={styles.lineItem}>
        <div className={styles.lineItemLeft}>
          <img src={product.image.src} alt={product.title} style={{ width: '100px' }} />
          <div className={styles.description}>
            <span className={styles.title}>{variant ? variant.title : product.title}</span>
            <span className={styles.descriptionPrice}>{variant ? variant.price.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) : null}（税込）</span>
          </div>
        </div>
        <div className={styles.quantityWrapper}>
          <div className={styles.quantityChanger}>
            <span className={styles.quantityButton}><img className={styles.quantityImg} src="minus.svg" /></span>
            <span className={styles.quantityValue}>{line.quantity}</span>
            <span className={styles.quantityButton}><img className={styles.quantityImg} src="plus.svg" /></span>
          </div>
          <span className={styles.quantityTrash}>🗑</span>
        </div>
        <span className={styles.lineCost}>{line.cost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
      </div>
    ) : null;
  })

  const checkoutButton = (
    <button className={styles.checkout}>ご購入手続きへ</button>
  )

  const subTotal = (
    <span className={styles.subTotal}>小計<span className={styles.subTotalValue}>{cart.totalCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>（税込）</span>
  )

return(<>
    <div className="topDots" />
    <Header breadcrumbs={breadcrumbs} />
    <span className="topHeader">カートを見る</span>
    <div className={styles.cartWrapper}>
      {headings}
      {cartLineElements}
      {subTotal}
      {checkoutButton}
    </div>
    <Footer />
  </>
  )
}

export default Cart