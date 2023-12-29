import React, { useContext } from "react";

import { UserContext } from "./UserContext";
import { useProducts } from "./ProductContext";

import './App.css';
import styles from "./orderList.module.css"
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "購入履歴", url: "/order-list" },
];

function OrderList() {
  const { user, userLoading } = useContext(UserContext);
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  // This is actually better described as a "Line item", since they aren't grouped into purchase. I'll group later.
  const lineItems = user ? user.purchases : undefined;
  const nolineItemsMessage = (lineItems?.length === 0) ? (<span className={styles.listMessage}>購入履歴はありません</span>) : null;
  const quantityMessage = <span className={styles.listMessage}>Line Items Quantity: {lineItems?.length}</span>;

  console.log("lineItems");
  console.log(lineItems);

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

  function UtcTimeToDotTime(dateString: string) {
    const date = new Date(dateString);

    // Add 9 hours for Japan time (UTC+9)
    date.setUTCHours(date.getUTCHours() + 9);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const day = date.getUTCDate().toString().padStart(2, '0');

    // Format the date into "YYYY-MM-DD HH:MM:SS"
    //return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return `${year}.${month}.${day}`;
  }


  // The header is created if there's a list if lineItems
  const purchaseLinesHeader = (lineItems?.length) && (lineItems?.length > 0) && (
    <div className={styles.lineItem}>
      <span>注文番号</span>
      <span>注文日</span>
      <span>決済ステータス</span>
      <span>発送ステータス</span>
      <span>合計金額</span>
    </div>
  )

  const purchaseKeys = Array.from(new Set(lineItems?.map(item => item.purchaseKey)));
  const purchaseLines = purchaseKeys?.map(purchaseKey => {
    const purchaseLineItems = lineItems?.filter(lineItem => {return lineItem.purchaseKey === purchaseKey});
    if(!purchaseLineItems) return null;

    // Like a switch, but allows strict equality and const
    const line = purchaseLineItems[0];
    const orderStatus =
      line.status === "created" ? "作成した" :
      line.status === "succeeded" ? "支払い済み" :
      (line.status) ? line.status : "不明";

    const purchaseShippingStatuses = Array.from(new Set(purchaseLineItems?.map(item => item.shippingStatus)));
    const shippingStatus =
      (purchaseShippingStatuses.length === 0) ? "不明" :
      (purchaseShippingStatuses.length > 1) ? "一部発送済み" :
      (purchaseShippingStatuses[0] === null) ? "発送前" :
      (purchaseShippingStatuses[0] === "shipped") ? "発送済み" :
      (purchaseShippingStatuses[0]) ? purchaseShippingStatuses[0] : "不明";

    const totalCost = purchaseLineItems?.reduce((total, item) => {
      const itemTotal = item.unitPrice * (1 + item.taxRate) * item.quantity;
      return total + itemTotal;
    }, 0);
    
    return(
      <div key={purchaseKey} className={styles.lineItem}>
        <span className={styles.lineItemKeyLink}><Link to={`/purchaseDetails/${purchaseKey}`}>#{purchaseKey}</Link></span>
        <span className={styles.orderTime}>{UtcTimeToDotTime(line.purchaseTime)}</span>
        <span className={styles.orderStatus}>{orderStatus}</span>
        <span className={styles.orderStatus}>{shippingStatus}</span>
        <span className={styles.totalCost}>{totalCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
      </div>
    )
  });

  const lineItemLines = lineItems?.map(line => {
    const product = products?.find(product => {return (line.productKey === product.productKey)});
    if(product === undefined) return null;
    const topImage = product.images.sort((a, b) => a.displayOrder - b.displayOrder)[0];
    const unitCost = line.unitPrice * (1+line.taxRate);
    const lineCost = unitCost * line.quantity;

    // Like a switch, but allows strict equality and const
    const orderStatus =
      line.status === "created" ? "作成した" :
      line.status === "succeeded" ? "支払い済み" :
      (line.status) ? line.status : "不明";

    const shippingStatus =
      (!line.shippingStatus) ? "発送前" :
      line.shippingStatus === "shipped" ? "発送済み" : line.shippingStatus;
      //一部発送済み

    return(
      <div key={line.lineItemKey} className={styles.lineItem}>
        <span className={styles.lineItemKeyLink}><Link to={`/purchaseDetails/${line.lineItemKey}`}>#{line.lineItemKey}</Link></span>
        <span className={styles.orderTime}>{UtcTimeToDotTime(line.purchaseTime)}</span>
        <span className={styles.orderStatus}>{orderStatus}</span>
        <span className={styles.orderStatus}>{shippingStatus}</span>
        <span className={styles.lineCost}>{lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
      </div>
    )

    return(
      <div key={line.lineItemKey} className={styles.lineItem}>
        <img className={styles.lineItem} src={topImage.url} alt={topImage.altText}/>
        <div className={styles.lineItemText}>
          <span className={styles.title}>{product?.title}</span>
          <span>{unitCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })} x {line.quantity}</span>
        </div>
        <div className={styles.lineItemText}>
          <span>注文の状況: {line.shippingStatus || line.status}</span>
          <span>{UtcTimeToJapanTime(line.purchaseTime)}</span>
        </div>
        <div className={styles.lineItemText} style={{flexGrow: "0"}}>
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
        {nolineItemsMessage}
        {purchaseLinesHeader}
        {false && lineItemLines}
        {purchaseLines}
      </div>
      <Footer />
    </>
  )
}

export default OrderList;