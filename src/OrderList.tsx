import React from "react";

import { useUserData } from "./useUserData";
import { useProducts } from "./ProductContext";

import './App.css';
import styles from "./orderList.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "購入履歴", url: "/order-list" },
];

function OrderList() {
  const { user, updateCartQuantity, deleteFromCart, userLoading, cartLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  // This is actually better described as a "Line item", since they aren't grouped into purchase. I'll group later.
  const purchases = user ? user.purchases : undefined;
  const noPurchasesMessage = (purchases?.length === 0) ? (<span className={styles.listMessage}>購入履歴はありません</span>) : null;
  const quantityMessage = <span className={styles.listMessage}>purchasesQuantity: {purchases?.length}</span>;

  console.log("purchases");
  console.log(purchases);

  function UtcTimeToJapanTime(dateString: string) {
    const date = new Date(dateString);

    // Add 9 hours for Japan time (UTC+9)
    date.setUTCHours(date.getUTCHours() + 9);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    // Format the date into "YYYY-MM-DD HH:MM:SS"
    //return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }

  const purchaseLines = purchases?.map(purchase => {
    const product = products?.find(product => {return (purchase.productKey === product.productKey)});
    if(product === undefined) return null;
    const topImage = product.images.sort((a, b) => a.displayOrder - b.displayOrder)[0];
    const unitCost = purchase.unitPrice * (1+purchase.taxRate);
    const lineCost = unitCost * purchase.quantity;

    return(
      <div key={purchase.lineItemKey} className={styles.lineItem}>
        <img className={styles.lineItem} src={topImage.url} alt={topImage.altText}/>
        <div className={styles.lineItemText}>
          <span className={styles.title}>{product.title}</span>
          <span>{unitCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })} x {purchase.quantity}</span>
        </div>
        <div className={styles.lineItemText}>
          <span>注文の状況: {purchase.status}</span>
          <span>{UtcTimeToJapanTime(purchase.purchaseTime)}</span>
        </div>
        <div className={styles.lineItemText}>
          <span>Total: {lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
        </div>
      </div>
    );
  });

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">購入履歴</span>
      <div className={styles.contentWrapper}>
        <span className={styles.header}>履歴の一覧</span>
        {noPurchasesMessage}
        {purchaseLines}
      </div>
      <Footer />
    </>
  )
}

export default OrderList;