import React, { useContext, useState } from "react";

import { UserContext } from "../Hooks/UserContext";
import { useUserData } from "../Hooks/useUserData";
import { useProducts } from "../ProductContext";

import './App.css';
import styles from "./purchaseDetails.module.css"
import Header from "./Header";
import Footer from "./Footer";
import { useNavigate, useParams } from "react-router-dom";
import { Address, PurchaseAndAddress } from "../types";
import { Helmet } from "react-helmet";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "購入履歴", url: "/order-list" },
];

export default function PurchaseDetails() {
  const { user, userLoading } = useContext(UserContext);
  const { cancelPurchase } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const purchaseKey = (parseInt(useParams().purchaseKey || ""));
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const navigate = useNavigate();

  const lineItems = user ? user.purchases as PurchaseAndAddress[]: undefined;
  const purchaseLineItems = lineItems?.filter(lineItem => {return lineItem.purchaseKey === purchaseKey});
  const hasShipped = purchaseLineItems?.some(item => item.shippingStatus === "shipped");

  console.log("purchaseLineItems");
  console.log(purchaseLineItems);
  console.log("user");
  console.dir(user, { depth: null, colors: true });


  const purchaseHeader = (
    <div className={styles.detailsHeader}>
      <span>商品</span>
      <span className={styles.alignCenter}>価格</span>
      <span className={styles.alignCenter}>数量</span>
      <span className={styles.alignCenter}>合計</span>
    </div>
  )

  const lineItemRows = purchaseLineItems?.map(line => {
    const product = products?.find(product => {return (line.productKey === product.productKey)});
    if(product === undefined) return null;
    const quantity = line.quantity;
    const unitCost = Math.round(line.unitPrice * (1+line.taxRate));
    const lineCost = unitCost * line.quantity;

    return(
      <div className={styles.lineItem}>
        <span>{product.title}</span>
        <span className={styles.alignCenter}>{unitCost}</span>
        <span className={styles.alignCenter}>{quantity}</span>
        <span className={styles.alignEnd}>{lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
      </div>
    )
  });

  const subtotal = purchaseLineItems?.reduce((total, item) => {
    const itemTotal = item.unitPrice * (1 + item.taxRate) * item.quantity;
    return total + itemTotal;
  }, 0);

  const shipping = 0;

  const totalCost = (subtotal || 0) + shipping;

  const purchaseFooter = (
    <div className={styles.detailsFooter}>
      <div className={styles.detailsFooters}><span className={`${styles.thirdColumn} ${styles.alignEnd}`}>小計</span><span className={styles.alignEnd}>{subtotal?.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span></div>
      <div className={styles.detailsFooters}><span className={`${styles.thirdColumn} ${styles.alignEnd}`}>配送</span><span className={styles.alignEnd}>{shipping?.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span></div>
      <div className={styles.detailsFooters}><span className={`${styles.thirdColumn} ${styles.alignEnd}`}>合計</span><span className={styles.alignEnd}>{totalCost?.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span></div>
      {!hasShipped   && <div className={styles.cancelFooter}><span className={styles.cancelOrder} onClick={HandleCancelOrder}>(注文キャンセルする)</span></div>}
      {userLoading   && <div className={styles.cancelFooter}><span className={styles.cancelSpinner}><img src="spinner.svg" className={styles.cancelSpinner} alt="Spinner" /></span></div>}
      {cancelMessage && <div className={styles.cancelFooter}><span className={styles.cancelMessage}>{cancelMessage}</span></div>}
      {cancelError   && <div className={styles.cancelFooter}><span className={styles.cancelError}>{cancelError}</span></div>}
    </div>
  )

  const lineItemsGrid = (
    <div className={styles.lineItemsGrid}>
        {purchaseHeader}
        {lineItemRows}
        {purchaseFooter}
    </div>
  )


  async function HandleCancelOrder() {
    if(!user?.customerKey) { return null; }
    if(!user?.token) { return null; }
    if(userLoading) { return null; }

    const returnedCustomer = await cancelPurchase(user.customerKey, user.token, purchaseKey);
    console.log("Customer returned after canceling order:");
    console.log(returnedCustomer);
    if(returnedCustomer.error) {
      //console.log("Customer returned after canceling order:");
      //console.log(returnedCustomer);
      setCancelMessage("");
      setCancelError(returnedCustomer.error);
      return;
    }

    setCancelError("");
    setCancelMessage("注文が削除されました - お待ちください");

    setTimeout(() => {
      navigate('/order-list');
    }, 1500);

  }

  const uniqueAddresses:Address[] = [];
  const seen = new Set();
  purchaseLineItems?.forEach(line => {
    const addressKey = [ line.firstName, line.lastName, line.postalCode, line.prefCode, line.pref, line.city, line.ward, line.address2, line.phoneNumber].join('|');
    if (!seen.has(addressKey)) {
      seen.add(addressKey);
      uniqueAddresses.push({ firstName: line.firstName, lastName: line.lastName, postalCode: line.postalCode, prefCode: line.prefCode, pref: line.pref, city: line.city, ward: line.ward, address2: line.address2, phoneNumber: line.phoneNumber});
    }
  });

  const addressBoxes = uniqueAddresses?.map(address => {
    return(
      <div className={styles.addressBox}>
        <span>{address.lastName} {address.firstName}</span>
        <span>{address.postalCode}</span>
        <span>{address.pref}{address.city}{address.ward}{address.address2}</span>
        <span>{address.phoneNumber}</span>
      </div>
    );
  });

  const addressesBox = (
   <div className={styles.addressesBox}>
    {addressBoxes}
   </div>
  )


  return(
    <>
      <Helmet>
        <link rel="preload" href="spinner.svg" as="image" />
      </Helmet>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">購入履歴</span>
      <div className={styles.contentWrapper}>
        <span className={styles.purchaseKey}>#{purchaseKey}</span>
        <span>{hasShipped ? "発送済み" : "発送前"}</span>
        {lineItemsGrid}
        <span className={styles.shippingAddress}>配送先住所</span>
        {addressesBox}
      </div>
      <Footer />
    </>
  )
}