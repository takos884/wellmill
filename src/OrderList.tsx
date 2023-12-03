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

  const purchases = user ? user.purchases : undefined;
  const noPurchasesMessage = (purchases?.length === 0) ? (<span className={styles.listMessage}>購入履歴はありません</span>) : null;
  const purchasesQuantity = <span className={styles.listMessage}>purchasesQuantity: {purchases?.length}</span>;

  console.log("purchases");
  console.log(purchases);

  const purchaseLines = purchases?.map(purchase => {
    const product = products?.find(product => {})
  });

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">購入履歴</span>
      <div className={styles.contentWrapper}>
        <span className={styles.header}>履歴の一覧</span>
        {noPurchasesMessage}
        {purchasesQuantity}
      </div>
      <Footer />
    </>
  )
}

export default OrderList;