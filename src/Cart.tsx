import React from "react";
import { useUserData } from "./useUserData";
import { useProducts } from "./ProductContext";

import './App.css';
import styles from './cart.module.css'
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
];

function Cart() {
  const { user, loading: userLoading, updateCart, removeFromCart } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  if(userLoading) { return(<span className={styles.loading}>Loading profile...</span>) }
  if(productsLoading) { return(<span className={styles.loading}>Loading products...</span>) }
  if(productsError) { return(<span className={styles.loading}>Loading products error</span>) }
  const cart = user?.cart ? user?.cart : {lines: [], id: "", totalQuantity: 0, totalCost: 0}

  async function HandleQuantityClick(cartId: string, merchandiseId: string, quantity: number) {
    if(quantity < 1 || quantity > 10) return;
    const newCartId = await updateCart(cartId, merchandiseId, quantity);
    console.log(newCartId)
  }

  async function HandleRemoveClick(cartId: string, lineId: string) {
    const newCartId = await removeFromCart(cartId, lineId);
    console.log(newCartId)    
  }

  const headings = (cart.totalQuantity > 0) ? (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span style={{textAlign: "center"}}>合計</span>
    </div>
  ) : null;

  const cartLineElements = cart.lines.map((line) => {
    // Extracting the variant ID number from the merchandise string
    const variantId = line.merchandise;
    const variantNumber = variantId.split('/').pop();

    // Find the corresponding product and variant
    const product = products ? products.find((product) => {
      return product.variants.some(variant => variant.id.toString() === variantNumber);
    }) : null;

    const variant = product?.variants.find(variant => variant.id.toString() === variantNumber);
    if(!variant) return null;

    // If product is found, return the div with image and title, otherwise null
    return product ? (
      <div key={line.id} className={styles.lineItem}>
        <div className={styles.lineItemLeft}>
          <img src={product.image.src} alt={product.title} style={{ width: '100px' }} />
          <div className={styles.description}>
            <span className={styles.title}>{variant.title}</span>
            <span className={styles.descriptionPrice}>{variant.price.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}（税込）</span>
          </div>
        </div>
        <div className={styles.quantityWrapper}>
          <div className={styles.quantityChanger}>
            <span className={`${styles.quantityButton} ${line.quantity <= 1 ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="minus.svg" alt="minus" onClick={() => HandleQuantityClick(cart.id, line.id, line.quantity-1)} /></span>
            <span className={styles.quantityValue}>{line.quantity}</span>
            <span className={`${styles.quantityButton} ${line.quantity >= 10 ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="plus.svg"  alt="plus"  onClick={() => HandleQuantityClick(cart.id, line.id, line.quantity+1)} /></span>
          </div>
          <span className={styles.quantityTrash} onClick={() => {HandleRemoveClick(cart.id, line.id)}}>🗑</span>
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