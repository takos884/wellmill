import React from "react";
import { useUserData } from "./useUserData";
import { useProducts } from "./ProductContext";
import { Link } from "react-router-dom";

import './App.css';
import styles from './cart.module.css'
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
];

function Cart() {
  const { user, updateCartQuantity, deleteFromCart, userLoading, cartLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  if(userLoading) { return(<span className={styles.loading}>Loading profile...</span>) }
  if(productsLoading) { return(<span className={styles.loading}>Loading products...</span>) }
  if(productsError) { return(<span className={styles.loading}>Loading products error</span>) }
  //const cart = user?.cart ? user?.cart : {lines: [], id: "", totalQuantity: 0, totalCost: 0}
  const cart = user ? user.cart : undefined;
  const cartQuantity = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.quantity; }, 0) : 0;
  const cartCost = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.unitPrice * (1+lineItem.taxRate) * lineItem.quantity; }, 0) : 0;

  async function HandleQuantityClick(lineItemKey: number, quantity: number) {
    if(!user?.customerKey) return;
    if(!user?.token) return;
    if(quantity < 1 || quantity > 10) return;

    const returnedCart = await updateCartQuantity(user.customerKey, user.token, lineItemKey, quantity);
    //console.log(returnedCart);
  }

  async function HandleRemoveClick(lineItemKey: number) {
    if(!user?.customerKey) { return null; }
    if(!user?.token) { return null; }

    const returnedCart = await deleteFromCart(user.customerKey, user.token, lineItemKey);
    //console.log("Cart returned after deleting from cart:");
    //console.log(returnedCart);
  }

  function HandlePurchaseClick() {
    if(cartLoading) { return; }
    alert(`Sending payment request for [${cartQuantity}] items at ${cartCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })} to Stripe. - ${cartQuantity}つのアイテムに対して ${cartCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })} での支払いリクエストを Stripe に送信します。`)
  }

  const headings = (cart && cartQuantity > 0) ? (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span style={{textAlign: "center"}}>合計</span>
    </div>
  ) : null;

  const cartLineElements = cart?.lines ? cart.lines.map((line) => {
    if(!user) { return null; }
    if(!user.customerKey) { return null; }
    const unitCost = Math.round(line.unitPrice * (1+line.taxRate));
    const lineCost = Math.round(unitCost * line.quantity);
    const product = products?.find(product => {return product.productKey === line.productKey});
    const topImage = product?.images.sort((a, b) => a.displayOrder - b.displayOrder)[0];


    // If product is found, return the div with image and title, otherwise null
    return product ? (
      <div key={line.lineItemKey} className={styles.lineItem}>
        <div className={styles.lineItemLeft}>
          <img src={topImage?.url} alt={product.title} style={{ width: '100px' }} />
          <div className={styles.description}>
            <span className={styles.title}>{product.title}</span>
            <span className={styles.descriptionPrice}>{unitCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}（税込）</span>
          </div>
        </div>
        <div className={styles.quantityWrapper}>
          <div className={styles.quantityChanger}>
            <span className={`${styles.quantityButton} ${line.quantity <= 1 ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="minus.svg" alt="minus" onClick={() => HandleQuantityClick(line.lineItemKey, line.quantity-1)} /></span>
            <span className={styles.quantityValue}>{line.quantity}</span>
            <span className={`${styles.quantityButton} ${line.quantity >= 10 ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="plus.svg"  alt="plus"  onClick={() => HandleQuantityClick(line.lineItemKey, line.quantity+1)} /></span>
          </div>
          <span className={styles.quantityTrash} onClick={() => {HandleRemoveClick(line.lineItemKey)}}>🗑</span>
        </div>
        <span className={styles.lineCost}>{lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
      </div>
    ) : null;
  }) : null;

  const spinner = <img className={styles.spinner} src="spinner.svg" alt="Spinner"/>;
  const checkoutButtonContent = cartLoading ? spinner : "ご購入手続きへ";
  const subTotal = (cart && cartQuantity > 0) ? (
    <>
      <span className={styles.subTotal}>小計<span className={styles.subTotalValue}>{cartCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>（税込）</span>
      <button className={styles.checkout} onClick={HandlePurchaseClick}>{checkoutButtonContent}</button>
    </>
  ) : null;

  const loggedOutMessage = (
    <div className={styles.requestMessage}>
      <span className={styles.requestMessage}>カートを表示するには、ログインしてください。</span>
      <Link to="/login"><button className={styles.requestMessage}>ログイン</button></Link>
    </div>
  );

  const emptyCartMessage = (
    <div className={styles.requestMessage}>
      <span className={styles.requestMessage}>カートは空です</span>
      <Link to="/shop"><button className={styles.requestMessage}>Shop</button></Link>
    </div>
  );

  const requestMessage = (!user) ? loggedOutMessage : (cartQuantity === 0) ? emptyCartMessage : null;

return(<>
    <div className="topDots" />
    <Header breadcrumbs={breadcrumbs} />
    <span className="topHeader">カートを見る</span>
    <div className={styles.cartWrapper}>
      {headings}
      {cartLineElements}
      {subTotal}
      {requestMessage}
    </div>
    <Footer />
  </>
  )
}

export default Cart